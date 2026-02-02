import { GetCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb, TABLE_NAME } from './lib/dynamodb.mjs'
import { success, notFound, badRequest, serverError } from './lib/response.mjs'

export const handler = async (event) => {
  try {
    const { id } = event.pathParameters || {}

    if (!id) {
      return badRequest('Missing dog service id')
    }

    const result = await dynamodb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { id }
    }))

    if (!result.Item) {
      return notFound(`Dog service with id '${id}' not found`)
    }

    return success(result.Item)
  } catch (error) {
    console.error('Error getting dog service:', error)
    return serverError('Failed to get dog service')
  }
}
