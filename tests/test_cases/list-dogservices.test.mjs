import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { init } from '../steps/init.mjs'
import { invokeListDogservices } from '../steps/when.mjs'
import * as given from '../steps/given.mjs'
import * as teardown from '../steps/teardown.mjs'

const mode = process.env.TEST_MODE || 'handler'

describe('Given an authenticated user', () => {
  let user = null

  beforeAll(async () => {
    await init()
    // Only create user for e2e tests (http mode)
    if (mode === 'http') {
      user = await given.an_authenticated_user()
    }
  })

  afterAll(async () => {
    // Clean up user after e2e tests
    if (user) {
      await teardown.an_authenticated_user(user)
    }
  })

  describe('When we invoke GET /dogservices', () => {
    it('should return a list of dog services', async () => {
      const result = await invokeListDogservices({}, user)

      expect(result.statusCode).toBe(200)
      expect(result.body).toHaveProperty('items')
      expect(result.body).toHaveProperty('count')
      expect(Array.isArray(result.body.items)).toBe(true)
    })

    it('should return items with correct structure', async () => {
      const result = await invokeListDogservices({}, user)

      expect(result.statusCode).toBe(200)

      if (result.body.items.length > 0) {
        const item = result.body.items[0]
        expect(item).toHaveProperty('id')
        expect(item).toHaveProperty('name')
        expect(item).toHaveProperty('category')
        expect(item).toHaveProperty('description')
      }
    })

    it('should filter by category when provided', async () => {
      const result = await invokeListDogservices({ category: 'grooming' }, user)

      expect(result.statusCode).toBe(200)
      expect(result.body).toHaveProperty('items')

      // All returned items should have the requested category
      result.body.items.forEach(item => {
        expect(item.category).toBe('grooming')
      })
    })

    it('should respect limit parameter', async () => {
      const result = await invokeListDogservices({ limit: '2' }, user)

      expect(result.statusCode).toBe(200)
      expect(result.body.items.length).toBeLessThanOrEqual(2)
    })

    it('should return count matching items length', async () => {
      const result = await invokeListDogservices({}, user)

      expect(result.statusCode).toBe(200)
      expect(result.body.count).toBe(result.body.items.length)
    })
  })
})
