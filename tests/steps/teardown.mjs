import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand
} from '@aws-sdk/client-cognito-identity-provider'

export const an_authenticated_user = async (user) => {
  const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' })

  const req = new AdminDeleteUserCommand({
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: user.username
  })
  await cognito.send(req)

  console.log(`[${user.username}] - user deleted`)
}
