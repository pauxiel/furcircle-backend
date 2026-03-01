import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb } from '../dogservices/lib/dynamodb.mjs'
import { success, notFound, serverError } from '../dogservices/lib/response.mjs'

const BUSINESS_TABLE = process.env.DOG_BUSINESS_TABLE
const BOOKING_TABLE = process.env.BOOKING_TABLE

export const handler = async (event) => {
  try {
    const ownerId = event.requestContext.authorizer.claims.sub

    const businessResult = await dynamodb.send(new QueryCommand({
      TableName: BUSINESS_TABLE,
      IndexName: 'ownerId-index',
      KeyConditionExpression: 'ownerId = :ownerId',
      ExpressionAttributeValues: { ':ownerId': ownerId }
    }))

    if (!businessResult.Items || businessResult.Items.length === 0) {
      return notFound('Business not found for this user')
    }

    const { businessId } = businessResult.Items[0]

    const bookingsResult = await dynamodb.send(new QueryCommand({
      TableName: BOOKING_TABLE,
      IndexName: 'businessId-index',
      KeyConditionExpression: 'businessId = :businessId',
      ExpressionAttributeValues: { ':businessId': businessId }
    }))

    return success(bookingsResult.Items || [])
  } catch (error) {
    console.error('Error listing business bookings:', error)
    return serverError('Failed to list business bookings')
  }
}
