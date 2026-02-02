import { DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb, TABLE_NAME } from './lib/dynamodb.mjs'
import { success, notFound, badRequest, serverError } from './lib/response.mjs'

export const handler = async (event) => {
  try {
    const { id } = event.pathParameters || {}

    if (!id) {
      return badRequest('Missing dog service id')
    }

    // Check if item exists
    const existing = await dynamodb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { id }
    }))

    if (!existing.Item) {
      return notFound(`Dog service with id '${id}' not found`)
    }

    await dynamodb.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id }
    }))

    return success({ message: `Dog service '${id}' deleted successfully` })
  } catch (error) {
    console.error('Error deleting dog service:', error)
    return serverError('Failed to delete dog service')
  }
}
