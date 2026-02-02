import { ScanCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb, TABLE_NAME } from './lib/dynamodb.mjs'
import { success, badRequest, serverError } from './lib/response.mjs'

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}')
    const { query, category, limit = 20 } = body

    if (!query || query.trim().length === 0) {
      return badRequest('Search query is required')
    }

    const searchTerm = query.trim()
    const parsedLimit = Math.min(parseInt(limit) || 20, 100)

    console.log(`Searching for dog services with query: "${searchTerm}"`)

    // Build filter expression - search in name and description (case-sensitive)
    let filterExpression = '(contains(#name, :query) OR contains(#desc, :query))'
    const expressionAttributeNames = {
      '#name': 'name',
      '#desc': 'description'
    }
    const expressionAttributeValues = {
      ':query': searchTerm
    }

    // Add category filter if provided
    if (category) {
      filterExpression += ' AND #category = :category'
      expressionAttributeNames['#category'] = 'category'
      expressionAttributeValues[':category'] = category
    }

    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: filterExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    })

    const result = await dynamodb.send(command)

    // Limit results
    const items = (result.Items || []).slice(0, parsedLimit)

    console.log(`Found ${items.length} dog services matching "${searchTerm}"`)

    return success({
      items,
      count: items.length,
      query: searchTerm,
      category: category || null
    })
  } catch (error) {
    console.error('Error searching dog services:', error)
    return serverError('Failed to search dog services')
  }
}
