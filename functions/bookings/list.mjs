import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb } from '../dogservices/lib/dynamodb.mjs'
import { success, serverError } from '../dogservices/lib/response.mjs'

const BOOKING_TABLE = process.env.BOOKING_TABLE

export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub

    const result = await dynamodb.send(new QueryCommand({
      TableName: BOOKING_TABLE,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    }))

    return success(result.Items || [])
  } catch (error) {
    console.error('Error listing bookings:', error)
    return serverError('Failed to list bookings')
  }
}
