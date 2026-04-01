import { describe, it, expect, beforeAll } from 'vitest'
import { init } from '../steps/init.mjs'
import { invokeCreateCategory } from '../steps/when.mjs'

describe('Category Create', () => {
  beforeAll(async () => {
    await init()
  })

  describe('POST /categories — create', () => {
    it('should create a category and return 201', async () => {
      const result = await invokeCreateCategory({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category',
        icon: 'test-icon',
        sortOrder: 99
      })

      expect(result.statusCode).toBe(201)
      expect(result.body.slug).toBe('test-category')
      expect(result.body.name).toBe('Test Category')
    })

    it('should return 400 when name is missing', async () => {
      const result = await invokeCreateCategory({ slug: 'test-slug' })
      expect(result.statusCode).toBe(400)
    })

    it('should return 400 when slug is missing', async () => {
      const result = await invokeCreateCategory({ name: 'Test' })
      expect(result.statusCode).toBe(400)
    })

    it('should use defaults for optional fields', async () => {
      const result = await invokeCreateCategory({
        name: 'Minimal Category',
        slug: 'minimal-category'
      })

      expect(result.statusCode).toBe(201)
      expect(result.body.description).toBe('')
      expect(result.body.icon).toBe('')
      expect(result.body.sortOrder).toBe(0)
    })
  })
})
