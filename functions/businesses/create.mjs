import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { dynamodb } from '../dogservices/lib/dynamodb.mjs'
import { created, badRequest, serverError } from '../dogservices/lib/response.mjs'

const BUSINESS_TABLE = process.env.DOG_BUSINESS_TABLE

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}')
    const { name, email, phone, location, description, ownerId } = body

    if (!name || !email || !ownerId) {
      return badRequest('Missing required fields: name, email, and ownerId are required')
    }

    const item = {
      businessId: randomUUID(),
      ownerId,
      name,
      email,
      phone: phone || '',
      location: location || '',
      description: description || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await dynamodb.send(new PutCommand({
      TableName: BUSINESS_TABLE,
      Item: item
    }))

    return created(item)
  } catch (error) {
    console.error('Error creating business:', error)
    return serverError('Failed to create business')
  }
}
