import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb } from '../dogservices/lib/dynamodb.mjs'
import { success, serverError } from '../dogservices/lib/response.mjs'

const PET_TABLE = process.env.PET_TABLE

export const handler = async (event) => {
  try {
    const ownerId = event.requestContext.authorizer.claims.sub

    const result = await dynamodb.send(new QueryCommand({
      TableName: PET_TABLE,
      IndexName: 'ownerId-index',
      KeyConditionExpression: 'ownerId = :ownerId',
      ExpressionAttributeValues: { ':ownerId': ownerId }
    }))

    return success({
      items: result.Items || [],
      count: result.Count || 0
    })
  } catch (error) {
    console.error('Error listing pet profiles:', error)
    return serverError('Failed to list pet profiles')
  }
}
