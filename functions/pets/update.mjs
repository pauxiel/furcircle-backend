import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb } from '../dogservices/lib/dynamodb.mjs'
import { success, notFound, forbidden, badRequest, serverError } from '../dogservices/lib/response.mjs'

const PET_TABLE = process.env.PET_TABLE

export const handler = async (event) => {
  try {
    const ownerId = event.requestContext.authorizer.claims.sub
    const { petId } = event.pathParameters || {}

    if (!petId) {
      return badRequest('Missing petId')
    }

    const existing = await dynamodb.send(new GetCommand({
      TableName: PET_TABLE,
      Key: { petId }
    }))

    if (!existing.Item) {
      return notFound(`Pet with id '${petId}' not found`)
    }

    if (existing.Item.ownerId !== ownerId) {
      return forbidden('You do not have permission to update this pet profile')
    }

    const body = JSON.parse(event.body || '{}')
    const { name, type, breed, gender, weight, birthday, about, photo, medicalInfo } = body

    const updates = []
    const expressionValues = {}
    const expressionNames = {}

    if (name !== undefined) {
      updates.push('#name = :name')
      expressionValues[':name'] = name
      expressionNames['#name'] = 'name'
    }
    if (type !== undefined) {
      updates.push('#type = :type')
      expressionValues[':type'] = type
      expressionNames['#type'] = 'type'
    }
    if (breed !== undefined) {
      updates.push('breed = :breed')
      expressionValues[':breed'] = breed
    }
    if (gender !== undefined) {
      updates.push('gender = :gender')
      expressionValues[':gender'] = gender
    }
    if (weight !== undefined) {
      updates.push('weight = :weight')
      expressionValues[':weight'] = weight
    }
    if (birthday !== undefined) {
      updates.push('birthday = :birthday')
      expressionValues[':birthday'] = birthday
    }
    if (about !== undefined) {
      updates.push('about = :about')
      expressionValues[':about'] = about
    }
    if (photo !== undefined) {
      updates.push('photo = :photo')
      expressionValues[':photo'] = photo
    }
    if (medicalInfo !== undefined) {
      updates.push('medicalInfo = :medicalInfo')
      expressionValues[':medicalInfo'] = medicalInfo
    }

    if (updates.length === 0) {
      return badRequest('No fields to update')
    }

    updates.push('updatedAt = :updatedAt')
    expressionValues[':updatedAt'] = new Date().toISOString()

    const result = await dynamodb.send(new UpdateCommand({
      TableName: PET_TABLE,
      Key: { petId },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
      ...(Object.keys(expressionNames).length > 0 && { ExpressionAttributeNames: expressionNames }),
      ReturnValues: 'ALL_NEW'
    }))

    return success(result.Attributes)
  } catch (error) {
    console.error('Error updating pet profile:', error)
    return serverError('Failed to update pet profile')
  }
}
