import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { init } from '../steps/init.mjs'
import { invokeListCategories } from '../steps/when.mjs'
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

  describe('When we invoke GET /categories', () => {
    it('should return a list of categories', async () => {
      const result = await invokeListCategories(user)

      expect(result.statusCode).toBe(200)
      expect(result.body).toHaveProperty('items')
      expect(result.body).toHaveProperty('count')
      expect(Array.isArray(result.body.items)).toBe(true)
      expect(result.body.count).toBeGreaterThan(0)
    })

    it('should return categories with correct structure', async () => {
      const result = await invokeListCategories(user)

      expect(result.statusCode).toBe(200)

      const item = result.body.items[0]
      expect(item).toHaveProperty('slug')
      expect(item).toHaveProperty('name')
      expect(item).toHaveProperty('description')
      expect(item).toHaveProperty('icon')
      expect(item).toHaveProperty('sortOrder')
    })

    it('should return categories sorted by sortOrder', async () => {
      const result = await invokeListCategories(user)

      expect(result.statusCode).toBe(200)

      const sortOrders = result.body.items.map(item => item.sortOrder)
      const sorted = [...sortOrders].sort((a, b) => a - b)
      expect(sortOrders).toEqual(sorted)
    })

    it('should return count matching items length', async () => {
      const result = await invokeListCategories(user)

      expect(result.statusCode).toBe(200)
      expect(result.body.count).toBe(result.body.items.length)
    })
  })
})