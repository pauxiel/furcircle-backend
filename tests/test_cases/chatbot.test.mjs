import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { init } from '../steps/init.mjs'
import { invokeChatSend, invokeChatConversations, invokeChatHistory } from '../steps/when.mjs'
import * as given from '../steps/given.mjs'
import * as teardown from '../steps/teardown.mjs'
import { DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb } from '../steps/init.mjs'

const mode = process.env.TEST_MODE || 'handler'

// Mock Bedrock for handler tests to avoid real API calls and costs.
// vi.mock is hoisted above all imports, so we read process.env directly
// instead of using the `mode` variable (which wouldn't exist yet at hoist time).
vi.mock('../../functions/chatbot/lib/bedrock.mjs', async (importOriginal) => {
  if (process.env.TEST_MODE === 'http') {
    return importOriginal()
  }
  return {
    invokeModel: vi.fn(async (systemPrompt, messages) => {
      const lastMessage = messages[messages.length - 1].content
      return `Mock response to: ${lastMessage}. I'm FurCircle's Pet Care Assistant!`
    })
  }
})

describe('Given an authenticated user', () => {
  let user = null
  const conversationIds = [] // track for cleanup

  beforeAll(async () => {
    await init()
    if (mode === 'http') {
      user = await given.an_authenticated_user()
    }
  })

  afterAll(async () => {
    // Clean up created conversations
    const userId = user?.username || 'test-user-id'
    for (const conversationId of conversationIds) {
      try {
        await dynamodb.send(new DeleteCommand({
          TableName: process.env.CHAT_CONVERSATION_TABLE,
          Key: { userId, conversationId }
        }))
      } catch (e) {
        // ignore cleanup errors
      }
    }

    if (user) {
      await teardown.an_authenticated_user(user)
    }
  })

  describe('When we invoke POST /chatbot/chat', () => {
    it('should require a message', async () => {
      const result = await invokeChatSend({}, user)

      expect(result.statusCode).toBe(400)
      expect(result.body.error).toContain('required')
    })

    it('should reject empty message', async () => {
      const result = await invokeChatSend({ message: '   ' }, user)

      expect(result.statusCode).toBe(400)
    })

    it('should return a response with a new conversationId', async () => {
      const result = await invokeChatSend({ message: 'What should I feed my puppy?' }, user)

      expect(result.statusCode).toBe(200)
      expect(result.body).toHaveProperty('conversationId')
      expect(result.body).toHaveProperty('message')
      expect(result.body.conversationId).toBeTruthy()
      expect(result.body.message.length).toBeGreaterThan(0)

      conversationIds.push(result.body.conversationId)
    })

    it('should continue an existing conversation', async () => {
      // Start a new conversation
      const first = await invokeChatSend({ message: 'Tell me about dog grooming' }, user)
      expect(first.statusCode).toBe(200)
      conversationIds.push(first.body.conversationId)

      // Continue the same conversation
      const second = await invokeChatSend({
        message: 'How often should I do it?',
        conversationId: first.body.conversationId
      }, user)

      expect(second.statusCode).toBe(200)
      expect(second.body.conversationId).toBe(first.body.conversationId)
      expect(second.body.message.length).toBeGreaterThan(0)
    })
  })

  describe('When we invoke GET /chatbot/conversations', () => {
    it('should return a list of conversations', async () => {
      // Ensure at least one conversation exists
      const chat = await invokeChatSend({ message: 'Hello pet assistant' }, user)
      conversationIds.push(chat.body.conversationId)

      const result = await invokeChatConversations(user)

      expect(result.statusCode).toBe(200)
      expect(result.body).toHaveProperty('items')
      expect(result.body).toHaveProperty('count')
      expect(result.body.items.length).toBeGreaterThan(0)

      // Each item should have basic fields but NOT the full messages array
      const item = result.body.items[0]
      expect(item).toHaveProperty('conversationId')
      expect(item).toHaveProperty('title')
      expect(item).toHaveProperty('createdAt')
    })
  })

  describe('When we invoke GET /chatbot/history/{conversationId}', () => {
    it('should return conversation with full message history', async () => {
      // Create a conversation with 2 exchanges
      const first = await invokeChatSend({ message: 'What vaccines does my puppy need?' }, user)
      conversationIds.push(first.body.conversationId)

      await invokeChatSend({
        message: 'At what age?',
        conversationId: first.body.conversationId
      }, user)

      const result = await invokeChatHistory(first.body.conversationId, user)

      expect(result.statusCode).toBe(200)
      expect(result.body).toHaveProperty('conversationId', first.body.conversationId)
      expect(result.body).toHaveProperty('title')
      expect(result.body).toHaveProperty('messages')
      expect(result.body.messages.length).toBe(4) // 2 user + 2 assistant

      // Verify message structure
      expect(result.body.messages[0].role).toBe('user')
      expect(result.body.messages[1].role).toBe('assistant')
      expect(result.body.messages[2].role).toBe('user')
      expect(result.body.messages[3].role).toBe('assistant')
    })

    it('should return 404 for non-existent conversation', async () => {
      const result = await invokeChatHistory('non-existent-id', user)

      expect(result.statusCode).toBe(404)
    })
  })
})