import { GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
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
      return forbidden('You do not have permission to delete this pet profile')
    }

    await dynamodb.send(new DeleteCommand({
      TableName: PET_TABLE,
      Key: { petId }
    }))

    return success({ message: `Pet profile '${petId}' deleted successfully` })
  } catch (error) {
    console.error('Error deleting pet profile:', error)
    return serverError('Failed to delete pet profile')
  }
}
