import { UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb } from '../dogservices/lib/dynamodb.mjs'
import { success, notFound, forbidden, badRequest, serverError } from '../dogservices/lib/response.mjs'

const BUSINESS_TABLE = process.env.DOG_BUSINESS_TABLE

export const handler = async (event) => {
  try {
    const ownerId = event.requestContext.authorizer.claims.sub
    const { businessId } = event.pathParameters

    const existing = await dynamodb.send(new QueryCommand({
      TableName: BUSINESS_TABLE,
      IndexName: 'ownerId-index',
      KeyConditionExpression: 'ownerId = :ownerId',
      ExpressionAttributeValues: { ':ownerId': ownerId }
    }))

    if (!existing.Items || existing.Items.length === 0) {
      return notFound('Business not found')
    }

    if (existing.Items[0].businessId !== businessId) {
      return forbidden('You do not have permission to update this business')
    }

    const body = JSON.parse(event.body || '{}')
    const { name, phone, location, description } = body

    const updates = []
    const expressionValues = {}
    const expressionNames = {}

    if (name !== undefined) {
      updates.push('#name = :name')
      expressionValues[':name'] = name
      expressionNames['#name'] = 'name'
    }
    if (phone !== undefined) {
      updates.push('phone = :phone')
      expressionValues[':phone'] = phone
    }
    if (location !== undefined) {
      updates.push('#location = :location')
      expressionValues[':location'] = location
      expressionNames['#location'] = 'location'
    }
    if (description !== undefined) {
      updates.push('description = :description')
      expressionValues[':description'] = description
    }

    if (updates.length === 0) {
      return badRequest('No fields to update')
    }

    updates.push('updatedAt = :updatedAt')
    expressionValues[':updatedAt'] = new Date().toISOString()

    const result = await dynamodb.send(new UpdateCommand({
      TableName: BUSINESS_TABLE,
      Key: { businessId },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
      ...(Object.keys(expressionNames).length > 0 && { ExpressionAttributeNames: expressionNames }),
      ReturnValues: 'ALL_NEW'
    }))

    return success(result.Attributes)
  } catch (error) {
    console.error('Error updating business:', error)
    return serverError('Failed to update business')
  }
}
