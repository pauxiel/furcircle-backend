import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb } from '../dogservices/lib/dynamodb.mjs'
import { success, serverError } from '../dogservices/lib/response.mjs'

const CHAT_TABLE = process.env.CHAT_CONVERSATION_TABLE

export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub

    const result = await dynamodb.send(new QueryCommand({
      TableName: CHAT_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ProjectionExpression: 'conversationId, title, createdAt, updatedAt',
      ScanIndexForward: false
    }))

    return success({
      items: result.Items || [],
      count: result.Count || 0
    })
  } catch (error) {
    console.error('Error listing conversations:', error)
    return serverError('Failed to list conversations')
  }
}