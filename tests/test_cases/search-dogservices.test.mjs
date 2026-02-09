import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { init } from '../steps/init.mjs'
import { invokeSearchDogservices } from '../steps/when.mjs'
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

  describe('When we invoke POST /dogservices/search', () => {
    it('should require a search query', async () => {
      const result = await invokeSearchDogservices({}, user)

      expect(result.statusCode).toBe(400)
      expect(result.body.error).toContain('required')
    })

    it('should reject empty query', async () => {
      const result = await invokeSearchDogservices({ query: '  ' }, user)

      expect(result.statusCode).toBe(400)
    })

    it('should search by name', async () => {
      const result = await invokeSearchDogservices({ query: 'Paws' }, user)

      expect(result.statusCode).toBe(200)
      expect(result.body).toHaveProperty('items')
      expect(result.body).toHaveProperty('query', 'Paws')
      expect(result.body.items.length).toBeGreaterThan(0)

      // Should find "Happy Paws Grooming"
      const found = result.body.items.some(item => item.name.includes('Paws'))
      expect(found).toBe(true)
    })

    it('should search by description', async () => {
      const result = await invokeSearchDogservices({ query: 'grooming' }, user)

      expect(result.statusCode).toBe(200)
      expect(result.body.items.length).toBeGreaterThan(0)

      // Should find items with grooming in description
      const found = result.body.items.some(item =>
        item.description.toLowerCase().includes('grooming')
      )
      expect(found).toBe(true)
    })

    it('should filter by category', async () => {
      const result = await invokeSearchDogservices({
        query: 'dog',
        category: 'training-behaviour'
      }, user)

      expect(result.statusCode).toBe(200)

      // All results should be in training-behaviour category
      result.body.items.forEach(item => {
        expect(item.category).toBe('training-behaviour')
      })
    })

    it('should respect limit parameter', async () => {
      const result = await invokeSearchDogservices({
        query: 'dog',
        limit: 2
      }, user)

      expect(result.statusCode).toBe(200)
      expect(result.body.items.length).toBeLessThanOrEqual(2)
    })

    it('should return count matching items length', async () => {
      const result = await invokeSearchDogservices({ query: 'Paws' }, user)

      expect(result.statusCode).toBe(200)
      expect(result.body.count).toBe(result.body.items.length)
    })

    it('should return empty array for no matches', async () => {
      const result = await invokeSearchDogservices({
        query: 'xyznonexistent123'
      }, user)

      expect(result.statusCode).toBe(200)
      expect(result.body.items).toEqual([])
      expect(result.body.count).toBe(0)
    })
  })
})
