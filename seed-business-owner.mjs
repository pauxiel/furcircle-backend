import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand
} from '@aws-sdk/client-cognito-identity-provider'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { PutCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { config } from 'dotenv'

config()

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' })
const dynamodb = DynamoDBDocumentClient.from(new DynamoDB({ region: 'us-east-1' }))

const USER_POOL_ID   = process.env.COGNITO_USER_POOL_ID
const CLIENT_ID      = process.env.COGNITO_SERVER_CLIENT_ID
const BUSINESS_TABLE = process.env.DOG_BUSINESS_TABLE

const OWNER_EMAIL    = 'owner@furcircle-test.com'
const OWNER_PASSWORD = 'FurCircle123!'
const TEMP_PASSWORD  = 'TempPass123!'

async function seed () {
  console.log('Creating Cognito user...')

  // 1. Create Cognito user
  await cognito.send(new AdminCreateUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: OWNER_EMAIL,
    MessageAction: 'SUPPRESS',
    TemporaryPassword: TEMP_PASSWORD,
    UserAttributes: [
      { Name: 'email',          Value: OWNER_EMAIL },
      { Name: 'email_verified', Value: 'true'      },
      { Name: 'given_name',     Value: 'Test'       },
      { Name: 'family_name',    Value: 'Owner'      }
    ]
  }))

  // 2. Initiate auth to get the NEW_PASSWORD_REQUIRED challenge
  const authResp = await cognito.send(new AdminInitiateAuthCommand({
    AuthFlow: 'ADMIN_NO_SRP_AUTH',
    UserPoolId: USER_POOL_ID,
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: OWNER_EMAIL,
      PASSWORD: TEMP_PASSWORD
    }
  }))

  // 3. Respond to challenge with permanent password
  const challengeResp = await cognito.send(new AdminRespondToAuthChallengeCommand({
    UserPoolId: USER_POOL_ID,
    ClientId: CLIENT_ID,
    ChallengeName: authResp.ChallengeName,
    Session: authResp.Session,
    ChallengeResponses: {
      USERNAME: OWNER_EMAIL,
      NEW_PASSWORD: OWNER_PASSWORD
    }
  }))

  // 4. Decode JWT to get Cognito sub
  const idToken = challengeResp.AuthenticationResult.IdToken
  const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString())
  const ownerId = payload.sub

  console.log(`Cognito user created — sub: ${ownerId}`)

  // 5. Write business record to DynamoDB
  const now = new Date().toISOString()
  const business = {
    businessId: randomUUID(),
    ownerId,
    name: 'Test Owner',
    businessName: 'FurCircle Test Business',
    email: OWNER_EMAIL,
    phone: '+1 416 000 0000',
    location: 'Toronto, ON',
    serviceArea: 'Toronto',
    format: ['in-person'],
    bookingRequirement: 'requires-acceptance',
    certifications: [],
    description: 'Seed test business for dashboard testing.',
    verified: false,
    status: 'active',
    createdAt: now,
    updatedAt: now
  }

  await dynamodb.send(new PutCommand({
    TableName: BUSINESS_TABLE,
    Item: business
  }))

  console.log(`Business record created — businessId: ${business.businessId}`)
  console.log('\nDone! Use these credentials to log into the dashboard:')
  console.log(`  Email:    ${OWNER_EMAIL}`)
  console.log(`  Password: ${OWNER_PASSWORD}`)
}

seed().catch(err => {
  if (err.name === 'UsernameExistsException') {
    console.log('User already exists — no changes made. Use these credentials:')
    console.log(`  Email:    ${OWNER_EMAIL}`)
    console.log(`  Password: ${OWNER_PASSWORD}`)
  } else {
    console.error('Seed failed:', err)
    process.exit(1)
  }
})
