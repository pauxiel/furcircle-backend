import { GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb } from '../dogservices/lib/dynamodb.mjs'
import { success, badRequest, notFound, forbidden, serverError } from '../dogservices/lib/response.mjs'

const BOOKING_TABLE = process.env.BOOKING_TABLE
const BUSINESS_TABLE = process.env.DOG_BUSINESS_TABLE

const VALID_STATUSES = ['confirmed', 'rejected', 'completed']

export const handler = async (event) => {
  try {
    const ownerId = event.requestContext.authorizer.claims.sub
    const { bookingId } = event.pathParameters || {}
    const { status } = JSON.parse(event.body || '{}')

    if (!status) {
      return badRequest('Missing required field: status')
    }

    if (!VALID_STATUSES.includes(status)) {
      return badRequest(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`)
    }

    // Get caller's business
    const businessResult = await dynamodb.send(new QueryCommand({
      TableName: BUSINESS_TABLE,
      IndexName: 'ownerId-index',
      KeyConditionExpression: 'ownerId = :ownerId',
      ExpressionAttributeValues: { ':ownerId': ownerId }
    }))

    if (!businessResult.Items || businessResult.Items.length === 0) {
      return forbidden('You do not have a business profile')
    }

    const { businessId } = businessResult.Items[0]

    // Get the booking
    const bookingResult = await dynamodb.send(new GetCommand({
      TableName: BOOKING_TABLE,
      Key: { bookingId }
    }))

    if (!bookingResult.Item) {
      return notFound('Booking not found')
    }

    // Verify booking belongs to this business
    if (bookingResult.Item.businessId !== businessId) {
      return forbidden('You do not have permission to update this booking')
    }

    const updatedAt = new Date().toISOString()

    await dynamodb.send(new UpdateCommand({
      TableName: BOOKING_TABLE,
      Key: { bookingId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status, ':updatedAt': updatedAt }
    }))

    return success({ bookingId, status, updatedAt })
  } catch (error) {
    console.error('Error updating booking status:', error)
    return serverError('Failed to update booking status')
  }
}
