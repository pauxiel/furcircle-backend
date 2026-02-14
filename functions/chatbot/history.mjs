import { GetCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb } from '../dogservices/lib/dynamodb.mjs'
import { success, notFound, serverError } from '../dogservices/lib/response.mjs'

const CHAT_TABLE = process.env.CHAT_CONVERSATION_TABLE

export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub
    const { conversationId } = event.pathParameters

    const result = await dynamodb.send(new GetCommand({
      TableName: CHAT_TABLE,
      Key: { userId, conversationId }
    }))

    if (!result.Item) {
      return notFound('Conversation not found')
    }

    return success({
      conversationId: result.Item.conversationId,
      title: result.Item.title,
      messages: result.Item.messages,
      createdAt: result.Item.createdAt,
      updatedAt: result.Item.updatedAt
    })
  } catch (error) {
    console.error('Error getting conversation history:', error)
    return serverError('Failed to get conversation history')
  }
}