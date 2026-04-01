import { ScanCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb } from '../dogservices/lib/dynamodb.mjs'
import { success, serverError } from '../dogservices/lib/response.mjs'

const BUSINESS_TABLE = process.env.DOG_BUSINESS_TABLE

export const handler = async (event) => {
  try {
    const { limit = '20', nextToken } = event.queryStringParameters || {}
    const parsedLimit = Math.max(1, Math.min(parseInt(limit) || 20, 100))

    const params = {
      TableName: BUSINESS_TABLE,
      Limit: parsedLimit
    }

    if (nextToken) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64url').toString())
    }

    const result = await dynamodb.send(new ScanCommand(params))

    return success({
      items: result.Items,
      count: result.Count,
      nextToken: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64url')
        : null
    })
  } catch (error) {
    console.error('Error listing businesses:', error)
    return serverError('Failed to list businesses')
  }
}
