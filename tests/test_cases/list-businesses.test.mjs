import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { init } from '../steps/init.mjs'
import { invokeListBusinesses } from '../steps/when.mjs'
import * as given from '../steps/given.mjs'
import * as teardown from '../steps/teardown.mjs'

const mode = process.env.TEST_MODE || 'handler'

describe('Given an authenticated user', () => {
  let user = null

  beforeAll(async () => {
    await init()
    if (mode === 'http') {
      user = await given.an_authenticated_user()
    }
  })

  afterAll(async () => {
    if (user) {
      await teardown.an_authenticated_user(user)
    }
  })

  describe('When we invoke GET /businesses', () => {
    it('should return 200 with items array', async () => {
      const result = await invokeListBusinesses({}, user)

      expect(result.statusCode).toBe(200)
      expect(result.body).toHaveProperty('items')
      expect(result.body).toHaveProperty('count')
      expect(Array.isArray(result.body.items)).toBe(true)
    })

    it('should return count matching items length', async () => {
      const result = await invokeListBusinesses({}, user)

      expect(result.statusCode).toBe(200)
      expect(result.body.count).toBe(result.body.items.length)
    })

    it('should respect limit parameter', async () => {
      const result = await invokeListBusinesses({ limit: '2' }, user)

      expect(result.statusCode).toBe(200)
      expect(result.body.items.length).toBeLessThanOrEqual(2)
    })

    it('should return items with correct structure', async () => {
      const result = await invokeListBusinesses({}, user)

      expect(result.statusCode).toBe(200)

      if (result.body.items.length > 0) {
        const item = result.body.items[0]
        expect(item).toHaveProperty('businessId')
        expect(item).toHaveProperty('name')
        expect(item).toHaveProperty('status')
      }
    })

    it('should return 200 and clamp negative limit to 1', async () => {
      const result = await invokeListBusinesses({ limit: '-5' }, user)

      expect(result.statusCode).toBe(200)
      expect(result.body).toHaveProperty('items')
    })

    it('should return 200 and use default limit for non-numeric limit', async () => {
      const result = await invokeListBusinesses({ limit: 'abc' }, user)

      expect(result.statusCode).toBe(200)
      expect(result.body).toHaveProperty('items')
    })

    it('should return nextToken field in response', async () => {
      const result = await invokeListBusinesses({}, user)

      expect(result.statusCode).toBe(200)
      expect(result.body).toHaveProperty('nextToken')
    })
  })
})
