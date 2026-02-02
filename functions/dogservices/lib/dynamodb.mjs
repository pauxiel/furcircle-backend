import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDB()

export const dynamodb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true
  }
})

export const TABLE_NAME = process.env.DOGS_SERVICES_TABLE
