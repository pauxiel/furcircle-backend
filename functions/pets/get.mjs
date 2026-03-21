import { GetCommand } from '@aws-sdk/lib-dynamodb'
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

    const result = await dynamodb.send(new GetCommand({
      TableName: PET_TABLE,
      Key: { petId }
    }))

    if (!result.Item) {
      return notFound(`Pet with id '${petId}' not found`)
    }

    if (result.Item.ownerId !== ownerId) {
      return forbidden('You do not have permission to access this pet profile')
    }

    return success(result.Item)
  } catch (error) {
    console.error('Error getting pet profile:', error)
    return serverError('Failed to get pet profile')
  }
}
