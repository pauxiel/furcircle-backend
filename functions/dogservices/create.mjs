import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { dynamodb, TABLE_NAME } from './lib/dynamodb.mjs'
import { created, badRequest, serverError } from './lib/response.mjs'

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}')

    const { name, category, description, price, credits, rating, image, location, businessId, duration, format } = body

    if (!name || !category) {
      return badRequest('Missing required fields: name and category are required')
    }

    const item = {
      id: randomUUID(),
      name,
      category,
      description: description || '',
      price: price || '',
      credits: credits || 0,
      rating: rating || 0,
      image: image || '',
      location: location || '',
      businessId: businessId || '',
      duration: duration || 0,
      format: format || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await dynamodb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }))

    return created(item)
  } catch (error) {
    console.error('Error creating dog service:', error)
    return serverError('Failed to create dog service')
  }
}
