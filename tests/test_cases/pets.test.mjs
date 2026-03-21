import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { init } from '../steps/init.mjs'
import {
  invokeCreatePet,
  invokeListPets,
  invokeGetPet,
  invokeUpdatePet,
  invokeDeletePet
} from '../steps/when.mjs'
import * as given from '../steps/given.mjs'
import * as teardown from '../steps/teardown.mjs'

const mode = process.env.TEST_MODE || 'handler'

describe('Pet Profiles', () => {
  let user = null
  let otherUser = null

  beforeAll(async () => {
    await init()
    if (mode === 'http') {
      user = await given.an_authenticated_user()
      otherUser = await given.an_authenticated_user()
    } else {
      user = { username: 'test-user-id' }
      otherUser = { username: 'other-user-id' }
    }
  })

  afterAll(async () => {
    if (mode === 'http') {
      if (user) await teardown.an_authenticated_user(user)
      if (otherUser) await teardown.an_authenticated_user(otherUser)
    }
  })

  describe('POST /pets — create a pet profile', () => {
    it('should create a pet and return 201', async () => {
      const result = await invokeCreatePet({
        name: 'Max',
        type: 'Dog',
        breed: 'Golden Retriever',
        gender: 'Male',
        weight: 21.5,
        birthday: '2020-04-15',
        about: 'Loves fetch and long walks.'
      }, user)

      expect(result.statusCode).toBe(201)
      expect(result.body).toHaveProperty('petId')
      expect(result.body.name).toBe('Max')
      expect(result.body.type).toBe('Dog')
      expect(result.body.ownerId).toBe(user.sub || user.username)
    })

    it('should return 400 when name is missing', async () => {
      const result = await invokeCreatePet({ type: 'Dog' }, user)

      expect(result.statusCode).toBe(400)
    })

    it('should return 400 when type is missing', async () => {
      const result = await invokeCreatePet({ name: 'Bella' }, user)

      expect(result.statusCode).toBe(400)
    })
  })

  describe('GET /pets — list own pets', () => {
    it('should return only the calling user\'s pets', async () => {
      await invokeCreatePet({ name: 'Buddy', type: 'Dog' }, user)

      const result = await invokeListPets(user)

      expect(result.statusCode).toBe(200)
      expect(result.body).toHaveProperty('items')
      expect(result.body).toHaveProperty('count')
      expect(Array.isArray(result.body.items)).toBe(true)

      result.body.items.forEach(pet => {
        expect(pet.ownerId).toBe(user.sub || user.username)
      })
    })

    it('should not return other users\' pets', async () => {
      await invokeCreatePet({ name: 'OtherDog', type: 'Cat' }, otherUser)

      const result = await invokeListPets(user)

      expect(result.statusCode).toBe(200)
      const names = result.body.items.map(p => p.name)
      expect(names).not.toContain('OtherDog')
    })
  })

  describe('GET /pets/{petId} — get a single pet', () => {
    let createdPetId

    beforeAll(async () => {
      const result = await invokeCreatePet({ name: 'Luna', type: 'Dog', breed: 'Labrador' }, user)
      createdPetId = result.body.petId
    })

    it('should return the pet when requested by owner', async () => {
      const result = await invokeGetPet(createdPetId, user)

      expect(result.statusCode).toBe(200)
      expect(result.body.petId).toBe(createdPetId)
      expect(result.body.name).toBe('Luna')
    })

    it('should return 403 when another user requests the pet', async () => {
      const result = await invokeGetPet(createdPetId, otherUser)

      expect(result.statusCode).toBe(403)
    })

    it('should return 404 for a non-existent pet', async () => {
      const result = await invokeGetPet('non-existent-pet-id', user)

      expect(result.statusCode).toBe(404)
    })
  })

  describe('PUT /pets/{petId} — update a pet profile', () => {
    let petId

    beforeAll(async () => {
      const result = await invokeCreatePet({ name: 'Bella', type: 'Dog', weight: 10 }, user)
      petId = result.body.petId
    })

    it('should update allowed fields and return updated pet', async () => {
      const result = await invokeUpdatePet(petId, { weight: 15.5, about: 'Loves cuddles.' }, user)

      expect(result.statusCode).toBe(200)
      expect(result.body.weight).toBe(15.5)
      expect(result.body.about).toBe('Loves cuddles.')
      expect(result.body.name).toBe('Bella')
    })

    it('should return 403 when another user tries to update', async () => {
      const result = await invokeUpdatePet(petId, { name: 'Hacked' }, otherUser)

      expect(result.statusCode).toBe(403)
    })

    it('should return 400 when no fields are provided', async () => {
      const result = await invokeUpdatePet(petId, {}, user)

      expect(result.statusCode).toBe(400)
    })

    it('should return 404 for a non-existent pet', async () => {
      const result = await invokeUpdatePet('non-existent-id', { name: 'Ghost' }, user)

      expect(result.statusCode).toBe(404)
    })
  })

  describe('DELETE /pets/{petId} — remove a pet profile', () => {
    let petId

    beforeAll(async () => {
      const result = await invokeCreatePet({ name: 'ToDelete', type: 'Cat' }, user)
      petId = result.body.petId
    })

    it('should return 403 when another user tries to delete', async () => {
      const result = await invokeDeletePet(petId, otherUser)

      expect(result.statusCode).toBe(403)
    })

    it('should delete the pet and return 200', async () => {
      const result = await invokeDeletePet(petId, user)

      expect(result.statusCode).toBe(200)
      expect(result.body).toHaveProperty('message')
    })

    it('should return 404 after deletion', async () => {
      const result = await invokeGetPet(petId, user)

      expect(result.statusCode).toBe(404)
    })
  })
})
