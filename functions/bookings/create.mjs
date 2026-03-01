import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { dynamodb } from '../dogservices/lib/dynamodb.mjs'
import { created, badRequest, serverError } from '../dogservices/lib/response.mjs'

const BOOKING_TABLE = process.env.BOOKING_TABLE

export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub
    const body = JSON.parse(event.body || '{}')
    const { serviceId, businessId, scheduledAt, notes } = body

    if (!serviceId || !businessId || !scheduledAt) {
      return badRequest('Missing required fields: serviceId, businessId, and scheduledAt are required')
    }

    const item = {
      bookingId: randomUUID(),
      userId,
      serviceId,
      businessId,
      scheduledAt,
      notes: notes || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await dynamodb.send(new PutCommand({
      TableName: BOOKING_TABLE,
      Item: item
    }))

    return created(item)
  } catch (error) {
    console.error('Error creating booking:', error)
    return serverError('Failed to create booking')
  }
}
