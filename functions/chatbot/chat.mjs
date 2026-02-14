import { ScanCommand, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { dynamodb, TABLE_NAME, CATEGORIES_TABLE_NAME } from '../dogservices/lib/dynamodb.mjs'
import { success, badRequest, serverError } from '../dogservices/lib/response.mjs'
import { invokeModel } from './lib/bedrock.mjs'
import { buildSystemPrompt } from './lib/system-prompt.mjs'

const CHAT_TABLE = process.env.CHAT_CONVERSATION_TABLE
const TTL_SECONDS = 14 * 24 * 60 * 60 // 2 weeks

export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub
    const body = JSON.parse(event.body || '{}')
    const { message, conversationId } = body

    if (!message || message.trim().length === 0) {
      return badRequest('Message is required')
    }

    const userMessage = message.trim()
    let conversation = null
    let messages = []

    // Load existing conversation if conversationId provided
    if (conversationId) {
      const result = await dynamodb.send(new GetCommand({
        TableName: CHAT_TABLE,
        Key: { userId, conversationId }
      }))
      conversation = result.Item
      if (conversation) {
        messages = conversation.messages || []
      }
    }

    // Fetch services and categories for context
    const [servicesResult, categoriesResult] = await Promise.all([
      dynamodb.send(new ScanCommand({ TableName: TABLE_NAME })),
      dynamodb.send(new ScanCommand({ TableName: CATEGORIES_TABLE_NAME }))
    ])

    const services = servicesResult.Items || []
    const categories = (categoriesResult.Items || []).sort((a, b) => a.sortOrder - b.sortOrder)

    // Build system prompt with service data
    const systemPrompt = buildSystemPrompt(services, categories)

    // Append user message
    messages.push({ role: 'user', content: userMessage })

    // Call Bedrock Claude
    const assistantResponse = await invokeModel(systemPrompt, messages)

    // Append assistant response
    messages.push({ role: 'assistant', content: assistantResponse })

    const now = new Date().toISOString()

    if (conversation) {
      // Update existing conversation
      await dynamodb.send(new UpdateCommand({
        TableName: CHAT_TABLE,
        Key: { userId, conversationId },
        UpdateExpression: 'SET messages = :messages, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':messages': messages,
          ':updatedAt': now
        }
      }))

      return success({
        conversationId,
        message: assistantResponse
      })
    } else {
      // Create new conversation
      const newConversationId = randomUUID()
      const title = userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage
      const ttl = Math.floor(Date.now() / 1000) + TTL_SECONDS

      await dynamodb.send(new PutCommand({
        TableName: CHAT_TABLE,
        Item: {
          userId,
          conversationId: newConversationId,
          title,
          messages,
          createdAt: now,
          updatedAt: now,
          ttl
        }
      }))

      return success({
        conversationId: newConversationId,
        message: assistantResponse
      })
    }
  } catch (error) {
    console.error('Error in chatbot:', error)
    return serverError('Failed to process chat message')
  }
}