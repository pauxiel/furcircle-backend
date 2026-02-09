import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb, CATEGORIES_TABLE_NAME } from '../dogservices/lib/dynamodb.mjs'
import { created, badRequest, serverError } from '../dogservices/lib/response.mjs'

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}')
    const { name, slug, description, icon, sortOrder } = body

    if (!name || !slug) {
      return badRequest('Missing required fields: name and slug are required')
    }

    const item = {
      slug,
      name,
      description: description || '',
      icon: icon || '',
      sortOrder: sortOrder || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await dynamodb.send(new PutCommand({
      TableName: CATEGORIES_TABLE_NAME,
      Item: item
    }))

    return created(item)
  } catch (error) {
    console.error('Error creating category:', error)
    return serverError('Failed to create category')
  }
}