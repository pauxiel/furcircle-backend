import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb, TABLE_NAME, CATEGORIES_TABLE_NAME } from '../dogservices/lib/dynamodb.mjs'
import { success, notFound, badRequest, serverError } from '../dogservices/lib/response.mjs'

export const handler = async (event) => {
  try {
    const slug = event.pathParameters?.slug

    if (!slug) {
      return badRequest('Category slug is required')
    }

    // Get category metadata
    const categoryResult = await dynamodb.send(new GetCommand({
      TableName: CATEGORIES_TABLE_NAME,
      Key: { slug }
    }))

    if (!categoryResult.Item) {
      return notFound(`Category '${slug}' not found`)
    }

    // Get services in this category using the GSI
    const { limit = '20' } = event.queryStringParameters || {}
    const parsedLimit = Math.min(parseInt(limit) || 20, 100)

    const servicesResult = await dynamodb.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'category-index',
      KeyConditionExpression: 'category = :category',
      ExpressionAttributeValues: {
        ':category': slug
      },
      Limit: parsedLimit
    }))

    return success({
      category: categoryResult.Item,
      services: servicesResult.Items || [],
      serviceCount: servicesResult.Count
    })
  } catch (error) {
    console.error('Error getting category:', error)
    return serverError('Failed to get category')
  }
}