import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { init } from '../steps/init.mjs'
import { invokeGetCategory } from '../steps/when.mjs'
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

  describe('When we invoke GET /categories/{slug}', () => {
    it('should return a category with its services', async () => {
      const result = await invokeGetCategory('grooming', {}, user)

      expect(result.statusCode).toBe(200)
      expect(result.body).toHaveProperty('category')
      expect(result.body).toHaveProperty('services')
      expect(result.body).toHaveProperty('serviceCount')
      expect(result.body.category.slug).toBe('grooming')
      expect(result.body.category.name).toBe('Grooming')
    })

    it('should return services belonging to the category', async () => {
      const result = await invokeGetCategory('grooming', {}, user)

      expect(result.statusCode).toBe(200)
      expect(Array.isArray(result.body.services)).toBe(true)

      result.body.services.forEach(service => {
        expect(service.category).toBe('grooming')
      })
    })

    it('should return 404 for non-existent category', async () => {
      const result = await invokeGetCategory('nonexistent-slug', {}, user)

      expect(result.statusCode).toBe(404)
      expect(result.body).toHaveProperty('error')
    })

    it('should respect limit parameter for services', async () => {
      const result = await invokeGetCategory('grooming', { limit: '1' }, user)

      expect(result.statusCode).toBe(200)
      expect(result.body.services.length).toBeLessThanOrEqual(1)
    })

    it('should return category metadata fields', async () => {
      const result = await invokeGetCategory('daycare', {}, user)

      expect(result.statusCode).toBe(200)

      const category = result.body.category
      expect(category).toHaveProperty('slug')
      expect(category).toHaveProperty('name')
      expect(category).toHaveProperty('description')
      expect(category).toHaveProperty('icon')
      expect(category).toHaveProperty('sortOrder')
    })
  })
})