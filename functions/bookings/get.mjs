import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb } from '../dogservices/lib/dynamodb.mjs'
import { success, notFound, forbidden, serverError } from '../dogservices/lib/response.mjs'

const BOOKING_TABLE = process.env.BOOKING_TABLE
const BUSINESS_TABLE = process.env.DOG_BUSINESS_TABLE

export const handler = async (event) => {
  try {
    const callerId = event.requestContext.authorizer.claims.sub
    const { bookingId } = event.pathParameters || {}

    const result = await dynamodb.send(new GetCommand({
      TableName: BOOKING_TABLE,
      Key: { bookingId }
    }))

    if (!result.Item) {
      return notFound('Booking not found')
    }

    const booking = result.Item

    // Pet owner can access their own booking
    if (booking.userId === callerId) {
      return success(booking)
    }

    // Business owner can access bookings for their business
    const businessResult = await dynamodb.send(new QueryCommand({
      TableName: BUSINESS_TABLE,
      IndexName: 'ownerId-index',
      KeyConditionExpression: 'ownerId = :ownerId',
      ExpressionAttributeValues: { ':ownerId': callerId }
    }))

    const business = businessResult.Items?.[0]
    if (business && booking.businessId === business.businessId) {
      return success(booking)
    }

    return forbidden('You do not have permission to view this booking')
  } catch (error) {
    console.error('Error getting booking:', error)
    return serverError('Failed to get booking')
  }
}
