import { describe, it, expect, beforeAll } from 'vitest'
import * as given from '../steps/given.mjs'
import * as when from '../steps/when.mjs'

describe('Bookings', () => {
  let petOwner
  let businessOwner
  let bookingId

  beforeAll(async () => {
    petOwner = await given.an_authenticated_user()
    businessOwner = await given.an_authenticated_user()
  })

  describe('PUT /bookings/{bookingId}/status', () => {
    describe('when bookingId does not exist', () => {
      it('should return 404', async () => {
        const result = await when.invokeUpdateBookingStatus(
          'non-existent-booking-id',
          { status: 'confirmed' },
          businessOwner
        )

        expect(result.statusCode).toBe(404)
      })
    })

    describe('when status is invalid', () => {
      it('should return 400', async () => {
        const result = await when.invokeUpdateBookingStatus(
          'any-booking-id',
          { status: 'flying' },
          businessOwner
        )

        expect(result.statusCode).toBe(400)
        expect(result.body.message).toMatch(/invalid status/i)
      })
    })

    describe('when status is missing', () => {
      it('should return 400', async () => {
        const result = await when.invokeUpdateBookingStatus(
          'any-booking-id',
          {},
          businessOwner
        )

        expect(result.statusCode).toBe(400)
        expect(result.body.message).toMatch(/missing required field/i)
      })
    })

    describe('when caller has no business profile', () => {
      it('should return 403', async () => {
        const result = await when.invokeUpdateBookingStatus(
          'any-booking-id',
          { status: 'confirmed' },
          petOwner
        )

        expect(result.statusCode).toBe(403)
      })
    })
  })
})
