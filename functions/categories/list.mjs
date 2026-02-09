import { ScanCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb, CATEGORIES_TABLE_NAME } from '../dogservices/lib/dynamodb.mjs'
import { success, serverError } from '../dogservices/lib/response.mjs'

export const handler = async () => {
  try {
    const result = await dynamodb.send(new ScanCommand({
      TableName: CATEGORIES_TABLE_NAME
    }))

    const items = (result.Items || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

    return success({
      items,
      count: items.length
    })
  } catch (error) {
    console.error('Error listing categories:', error)
    return serverError('Failed to list categories')
  }
}