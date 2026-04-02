import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as given from '../steps/given.mjs'
import * as teardown from '../steps/teardown.mjs'
import * as when from '../steps/when.mjs'
import { init } from '../steps/init.mjs'

const mode = process.env.TEST_MODE || 'handler'

describe('Bookings', () => {
  let petOwner
  let businessOwner
  let createdBookingId

  const bookingPayload = {
    serviceId: 'test-service-id',
    businessId: 'test-business-id',
    scheduledAt: '2026-06-01T09:00:00Z',
    notes: 'Test booking',
    dropOffTime: '08:00 AM',
    pickUpTime: '04:00 PM',
    location: '123 Elm Street, Vaughan, ON'
  }

  beforeAll(async () => {
    await init()
    if (mode === 'http') {
      petOwner = await given.an_authenticated_user()
      businessOwner = await given.an_authenticated_user()
    } else {
      petOwner = { sub: 'test-pet-owner-sub', idToken: 'test-token' }
      businessOwner = { sub: 'test-business-owner-sub', idToken: 'test-token' }
    }
  })

  afterAll(async () => {
    if (mode === 'http') {
      if (petOwner) await teardown.an_authenticated_user(petOwner)
      if (businessOwner) await teardown.an_authenticated_user(businessOwner)
    }
  })

  describe('POST /bookings — create a booking', () => {
    it('should create a booking and return 201', async () => {
      const result = await when.invokeCreateBooking(bookingPayload, petOwner)

      expect(result.statusCode).toBe(201)
      expect(result.body).toHaveProperty('bookingId')
      expect(result.body.status).toBe('pending')
      expect(result.body.dropOffTime).toBe('08:00 AM')
      expect(result.body.pickUpTime).toBe('04:00 PM')
      expect(result.body.location).toBe('123 Elm Street, Vaughan, ON')

      createdBookingId = result.body.bookingId
    })

    it('should return 400 when required fields are missing', async () => {
      const result = await when.invokeCreateBooking({ notes: 'incomplete' }, petOwner)

      expect(result.statusCode).toBe(400)
    })
  })

  describe('GET /bookings/{bookingId} — get single booking', () => {
    it('should return booking for the pet owner', async () => {
      const result = await when.invokeGetBooking(createdBookingId, petOwner)

      expect(result.statusCode).toBe(200)
      expect(result.body.bookingId).toBe(createdBookingId)
      expect(result.body.dropOffTime).toBe('08:00 AM')
    })

    it('should return 404 for non-existent booking', async () => {
      const result = await when.invokeGetBooking('non-existent-id', petOwner)

      expect(result.statusCode).toBe(404)
    })

    it('should return 403 when another user tries to view the booking', async () => {
      const otherUser = await given.an_authenticated_user()
      const result = await when.invokeGetBooking(createdBookingId, otherUser)

      expect(result.statusCode).toBe(403)
    })
  })

  describe('DELETE /bookings/{bookingId} — cancel a booking', () => {
    it('should return 403 when another user tries to cancel', async () => {
      const otherUser = await given.an_authenticated_user()
      const result = await when.invokeCancelBooking(createdBookingId, otherUser)

      expect(result.statusCode).toBe(403)
    })

    it('should cancel the booking and return status cancelled', async () => {
      const result = await when.invokeCancelBooking(createdBookingId, petOwner)

      expect(result.statusCode).toBe(200)
      expect(result.body.status).toBe('cancelled')
    })

    it('should return 400 when trying to cancel an already cancelled booking', async () => {
      const result = await when.invokeCancelBooking(createdBookingId, petOwner)

      expect(result.statusCode).toBe(400)
    })

    it('should return 404 for non-existent booking', async () => {
      const result = await when.invokeCancelBooking('non-existent-id', petOwner)

      expect(result.statusCode).toBe(404)
    })
  })

  describe('PUT /bookings/{bookingId}/status', () => {
    it('should return 400 when status is invalid', async () => {
      const result = await when.invokeUpdateBookingStatus(
        'any-booking-id',
        { status: 'flying' },
        businessOwner
      )

      expect(result.statusCode).toBe(400)
      expect(result.body.error).toMatch(/invalid status/i)
    })

    it('should return 400 when status is missing', async () => {
      const result = await when.invokeUpdateBookingStatus(
        'any-booking-id',
        {},
        businessOwner
      )

      expect(result.statusCode).toBe(400)
      expect(result.body.error).toMatch(/missing required field/i)
    })

    it('should return 403 when caller has no business profile', async () => {
      const result = await when.invokeUpdateBookingStatus(
        'any-booking-id',
        { status: 'confirmed' },
        petOwner
      )

      expect(result.statusCode).toBe(403)
    })

    it('should return 403 when caller has no business profile (non-existent booking)', async () => {
      const result = await when.invokeUpdateBookingStatus(
        'non-existent-booking-id',
        { status: 'confirmed' },
        petOwner
      )

      expect(result.statusCode).toBe(403)
    })
  })
})
