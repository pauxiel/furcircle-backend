import { ScanCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb } from '../dogservices/lib/dynamodb.mjs'
import { success, serverError } from '../dogservices/lib/response.mjs'

const BUSINESS_TABLE = process.env.DOG_BUSINESS_TABLE

export const handler = async (event) => {
  try {
    const { limit = '20' } = event.queryStringParameters || {}
    const parsedLimit = Math.min(parseInt(limit) || 20, 100)

    const result = await dynamodb.send(new ScanCommand({
      TableName: BUSINESS_TABLE,
      Limit: parsedLimit
    }))

    return success({
      items: result.Items,
      count: result.Count,
      lastEvaluatedKey: result.LastEvaluatedKey
    })
  } catch (error) {
    console.error('Error listing businesses:', error)
    return serverError('Failed to list businesses')
  }
}
