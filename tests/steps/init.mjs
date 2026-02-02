import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { config } from 'dotenv'

// Load environment variables from .env file
config()

// Initialize DynamoDB client with region
const dynamoDBClient = new DynamoDB({ region: 'us-east-1' })
const dynamodb = DynamoDBDocumentClient.from(dynamoDBClient)

// Initialize function context
const init = async () => {
  // Ensure required environment variables are set
  if (!process.env.DOGS_SERVICES_TABLE) {
    throw new Error('DOGS_SERVICES_TABLE environment variable is not set')
  }
  
  if (!process.env.API_ENDPOINT) {
    throw new Error('API_ENDPOINT environment variable is not set')
  }

  return {
    tableName: process.env.DOGS_SERVICES_TABLE,
    apiEndpoint: process.env.API_ENDPOINT,
    dynamodb
  }
}

export { init, dynamodb }
