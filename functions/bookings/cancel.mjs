import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb } from '../dogservices/lib/dynamodb.mjs'
import { success, notFound, forbidden, badRequest, serverError } from '../dogservices/lib/response.mjs'

const BOOKING_TABLE = process.env.BOOKING_TABLE

const CANCELLABLE_STATUSES = ['pending', 'confirmed']

export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub
    const { bookingId } = event.pathParameters || {}

    const result = await dynamodb.send(new GetCommand({
      TableName: BOOKING_TABLE,
      Key: { bookingId }
    }))

    if (!result.Item) {
      return notFound('Booking not found')
    }

    const booking = result.Item

    if (booking.userId !== userId) {
      return forbidden('You do not have permission to cancel this booking')
    }

    if (!CANCELLABLE_STATUSES.includes(booking.status)) {
      return badRequest(`Cannot cancel a booking with status: ${booking.status}`)
    }

    const updatedAt = new Date().toISOString()

    await dynamodb.send(new UpdateCommand({
      TableName: BOOKING_TABLE,
      Key: { bookingId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': 'cancelled', ':updatedAt': updatedAt }
    }))

    return success({ bookingId, status: 'cancelled', updatedAt })
  } catch (error) {
    console.error('Error cancelling booking:', error)
    return serverError('Failed to cancel booking')
  }
}
