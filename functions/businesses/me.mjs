import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb } from '../dogservices/lib/dynamodb.mjs'
import { success, notFound, serverError } from '../dogservices/lib/response.mjs'

const BUSINESS_TABLE = process.env.DOG_BUSINESS_TABLE

export const handler = async (event) => {
  try {
    const ownerId = event.requestContext.authorizer.claims.sub

    const result = await dynamodb.send(new QueryCommand({
      TableName: BUSINESS_TABLE,
      IndexName: 'ownerId-index',
      KeyConditionExpression: 'ownerId = :ownerId',
      ExpressionAttributeValues: { ':ownerId': ownerId }
    }))

    if (!result.Items || result.Items.length === 0) {
      return notFound('Business not found')
    }

    return success(result.Items[0])
  } catch (error) {
    console.error('Error getting business:', error)
    return serverError('Failed to get business')
  }
}
