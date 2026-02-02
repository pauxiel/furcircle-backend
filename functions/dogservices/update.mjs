import { UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb, TABLE_NAME } from './lib/dynamodb.mjs'
import { success, notFound, badRequest, serverError } from './lib/response.mjs'

export const handler = async (event) => {
  try {
    const { id } = event.pathParameters || {}

    if (!id) {
      return badRequest('Missing dog service id')
    }

    const body = JSON.parse(event.body || '{}')
    const { name, category, description, price, rating, image, location } = body

    // Check if item exists
    const existing = await dynamodb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { id }
    }))

    if (!existing.Item) {
      return notFound(`Dog service with id '${id}' not found`)
    }

    // Build update expression dynamically
    const updates = []
    const expressionValues = {}
    const expressionNames = {}

    if (name !== undefined) {
      updates.push('#name = :name')
      expressionValues[':name'] = name
      expressionNames['#name'] = 'name'
    }
    if (category !== undefined) {
      updates.push('category = :category')
      expressionValues[':category'] = category
    }
    if (description !== undefined) {
      updates.push('description = :description')
      expressionValues[':description'] = description
    }
    if (price !== undefined) {
      updates.push('price = :price')
      expressionValues[':price'] = price
    }
    if (rating !== undefined) {
      updates.push('rating = :rating')
      expressionValues[':rating'] = rating
    }
    if (image !== undefined) {
      updates.push('image = :image')
      expressionValues[':image'] = image
    }
    if (location !== undefined) {
      updates.push('#location = :location')
      expressionValues[':location'] = location
      expressionNames['#location'] = 'location'
    }

    if (updates.length === 0) {
      return badRequest('No fields to update')
    }

    updates.push('updatedAt = :updatedAt')
    expressionValues[':updatedAt'] = new Date().toISOString()

    const result = await dynamodb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
      ...(Object.keys(expressionNames).length > 0 && { ExpressionAttributeNames: expressionNames }),
      ReturnValues: 'ALL_NEW'
    }))

    return success(result.Attributes)
  } catch (error) {
    console.error('Error updating dog service:', error)
    return serverError('Failed to update dog service')
  }
}
