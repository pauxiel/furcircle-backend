import { describe, it, expect, beforeAll } from 'vitest'
import { init } from '../steps/init.mjs'
import {
  invokeCreateBusiness,
  invokeGetMyBusiness,
  invokeUpdateBusiness,
  invokeListBusinessBookings
} from '../steps/when.mjs'

const testUser = { sub: 'test-business-owner-sub' }

describe('Business CRUD', () => {
  let createdBusinessId

  beforeAll(async () => {
    await init()
  })

  describe('POST /businesses — create', () => {
    it('should create a business and return 201', async () => {
      const result = await invokeCreateBusiness({
        name: 'Test Business',
        email: 'test@business.com',
        ownerId: testUser.sub,
        phone: '+1 416 000 0001',
        location: 'Toronto, ON'
      })

      expect(result.statusCode).toBe(201)
      expect(result.body).toHaveProperty('businessId')
      expect(result.body.name).toBe('Test Business')
      expect(result.body.ownerId).toBe(testUser.sub)

      createdBusinessId = result.body.businessId
    })

    it('should return 400 when name is missing', async () => {
      const result = await invokeCreateBusiness({ email: 'a@b.com', ownerId: 'x' })
      expect(result.statusCode).toBe(400)
    })

    it('should return 400 when email is missing', async () => {
      const result = await invokeCreateBusiness({ name: 'Test', ownerId: 'x' })
      expect(result.statusCode).toBe(400)
    })

    it('should return 400 when ownerId is missing', async () => {
      const result = await invokeCreateBusiness({ name: 'Test', email: 'a@b.com' })
      expect(result.statusCode).toBe(400)
    })
  })

  describe('GET /businesses/me', () => {
    it('should return the business for the owner', async () => {
      const result = await invokeGetMyBusiness(testUser)

      expect(result.statusCode).toBe(200)
      expect(result.body.ownerId).toBe(testUser.sub)
    })

    it('should return 404 for user with no business', async () => {
      const result = await invokeGetMyBusiness({ sub: 'no-business-user' })
      expect(result.statusCode).toBe(404)
    })
  })

  describe('PUT /businesses/{businessId}', () => {
    it('should update the business and return 200', async () => {
      const result = await invokeUpdateBusiness(
        createdBusinessId,
        { phone: '+1 416 999 9999' },
        testUser
      )

      expect(result.statusCode).toBe(200)
      expect(result.body.phone).toBe('+1 416 999 9999')
    })

    it('should return 400 when no fields provided', async () => {
      const result = await invokeUpdateBusiness(createdBusinessId, {}, testUser)
      expect(result.statusCode).toBe(400)
    })

    it('should return 404 when user does not own any business', async () => {
      const result = await invokeUpdateBusiness(
        createdBusinessId,
        { phone: '+1 000 000 0000' },
        { sub: 'different-user-sub' }
      )
      expect(result.statusCode).toBe(404)
    })
  })

  describe('GET /bookings/business', () => {
    it('should return bookings array for business owner', async () => {
      const result = await invokeListBusinessBookings(testUser)

      expect(result.statusCode).toBe(200)
      expect(Array.isArray(result.body)).toBe(true)
    })

    it('should return 404 when user has no business', async () => {
      const result = await invokeListBusinessBookings({ sub: 'no-business-user' })
      expect(result.statusCode).toBe(404)
    })
  })
})
