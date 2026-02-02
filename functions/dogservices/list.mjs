import { ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb, TABLE_NAME } from './lib/dynamodb.mjs'
import { success, serverError } from './lib/response.mjs'

export const handler = async (event) => {
  try {
    const { category, limit = '20' } = event.queryStringParameters || {}
    const parsedLimit = Math.min(parseInt(limit) || 20, 100)

    let command

    if (category) {
      // Use Query on GSI when filtering by category (more efficient than Scan)
      command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'category-index',
        KeyConditionExpression: 'category = :category',
        ExpressionAttributeValues: {
          ':category': category
        },
        Limit: parsedLimit
      })
    } else {
      // Scan when no filter (paginated)
      command = new ScanCommand({
        TableName: TABLE_NAME,
        Limit: parsedLimit
      })
    }

    const result = await dynamodb.send(command)

    return success({
      items: result.Items,
      count: result.Count,
      lastEvaluatedKey: result.LastEvaluatedKey
    })
  } catch (error) {
    console.error('Error listing dog services:', error)
    return serverError('Failed to list dog services')
  }
}
