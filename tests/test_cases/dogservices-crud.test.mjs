import { describe, it, expect, beforeAll } from 'vitest'
import { init } from '../steps/init.mjs'
import {
  invokeCreateDogservice,
  invokeGetDogserviceDirect,
  invokeUpdateDogservice,
  invokeDeleteDogserviceDirect
} from '../steps/when.mjs'

describe('Dog Service CRUD', () => {
  let createdId

  beforeAll(async () => {
    await init()
  })

  describe('POST /dogservices — create', () => {
    it('should create a dog service and return 201', async () => {
      const result = await invokeCreateDogservice({
        name: 'Test Grooming Service',
        category: 'grooming',
        price: '$50',
        location: 'Toronto, ON'
      })

      expect(result.statusCode).toBe(201)
      expect(result.body).toHaveProperty('id')
      expect(result.body.name).toBe('Test Grooming Service')
      expect(result.body.category).toBe('grooming')

      createdId = result.body.id
    })

    it('should return 400 when name is missing', async () => {
      const result = await invokeCreateDogservice({ category: 'grooming' })
      expect(result.statusCode).toBe(400)
    })

    it('should return 400 when category is missing', async () => {
      const result = await invokeCreateDogservice({ name: 'Test' })
      expect(result.statusCode).toBe(400)
    })
  })

  describe('GET /dogservices/{id}', () => {
    it('should return the created service', async () => {
      const result = await invokeGetDogserviceDirect(createdId)

      expect(result.statusCode).toBe(200)
      expect(result.body.id).toBe(createdId)
      expect(result.body.name).toBe('Test Grooming Service')
    })

    it('should return 404 for non-existent id', async () => {
      const result = await invokeGetDogserviceDirect('non-existent-id')
      expect(result.statusCode).toBe(404)
    })
  })

  describe('PUT /dogservices/{id}', () => {
    it('should update the service and return 200', async () => {
      const result = await invokeUpdateDogservice(createdId, { price: '$75' })

      expect(result.statusCode).toBe(200)
      expect(result.body.price).toBe('$75')
    })

    it('should return 400 when no fields to update', async () => {
      const result = await invokeUpdateDogservice(createdId, {})
      expect(result.statusCode).toBe(400)
    })

    it('should return 404 for non-existent id', async () => {
      const result = await invokeUpdateDogservice('non-existent-id', { price: '$10' })
      expect(result.statusCode).toBe(404)
    })
  })

  describe('DELETE /dogservices/{id}', () => {
    it('should delete the service and return 200', async () => {
      const result = await invokeDeleteDogserviceDirect(createdId)
      expect(result.statusCode).toBe(200)
    })

    it('should return 404 after deletion', async () => {
      const result = await invokeGetDogserviceDirect(createdId)
      expect(result.statusCode).toBe(404)
    })

    it('should return 404 for non-existent id', async () => {
      const result = await invokeDeleteDogserviceDirect('non-existent-id')
      expect(result.statusCode).toBe(404)
    })
  })
})
