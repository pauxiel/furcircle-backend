import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { dynamodb, TABLE_NAME } from './lib/dynamodb.mjs'
import { created, badRequest, serverError } from './lib/response.mjs'

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}')

    const { name, category, description, price, rating, image, location } = body

    if (!name || !category) {
      return badRequest('Missing required fields: name and category are required')
    }

    const item = {
      id: randomUUID(),
      name,
      category,
      description: description || '',
      price: price || '',
      rating: rating || 0,
      image: image || '',
      location: location || '',
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
