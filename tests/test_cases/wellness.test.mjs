import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { init } from '../steps/init.mjs'
import { invokeCreatePet } from '../steps/when.mjs'
import { invokeLogWellness, invokeGetWellness } from '../steps/when.mjs'
import * as given from '../steps/given.mjs'
import * as teardown from '../steps/teardown.mjs'

const mode = process.env.TEST_MODE || 'handler'

describe('Wellness Scoring', () => {
  let user = null
  let otherUser = null
  let petId = null

  beforeAll(async () => {
    await init()
    if (mode === 'http') {
      user = await given.an_authenticated_user()
      otherUser = await given.an_authenticated_user()
    } else {
      user = { username: 'wellness-user-id' }
      otherUser = { username: 'wellness-other-id' }
    }

    const result = await invokeCreatePet({ name: 'Wellness Dog', type: 'Dog' }, user)
    petId = result.body.petId
  })

  afterAll(async () => {
    if (mode === 'http') {
      if (user) await teardown.an_authenticated_user(user)
      if (otherUser) await teardown.an_authenticated_user(otherUser)
    }
  })

  describe('POST /pets/{petId}/wellness — log a wellness activity', () => {
    it('should log an activity and return 201', async () => {
      const result = await invokeLogWellness(petId, {
        pillar: 'activity',
        score: 80,
        note: 'Good walk today'
      }, user)

      expect(result.statusCode).toBe(201)
      expect(result.body).toHaveProperty('logId')
      expect(result.body.petId).toBe(petId)
      expect(result.body.pillar).toBe('activity')
      expect(result.body.score).toBe(80)
    })

    it('should return 400 for an invalid pillar', async () => {
      const result = await invokeLogWellness(petId, {
        pillar: 'invalid-pillar',
        score: 50
      }, user)

      expect(result.statusCode).toBe(400)
    })

    it('should return 400 when score is out of range', async () => {
      const result = await invokeLogWellness(petId, {
        pillar: 'nutrition',
        score: 150
      }, user)

      expect(result.statusCode).toBe(400)
    })

    it('should return 403 when another user tries to log', async () => {
      const result = await invokeLogWellness(petId, {
        pillar: 'behaviour',
        score: 70
      }, otherUser)

      expect(result.statusCode).toBe(403)
    })

    it('should return 404 for a non-existent pet', async () => {
      const result = await invokeLogWellness('non-existent-pet', {
        pillar: 'activity',
        score: 60
      }, user)

      expect(result.statusCode).toBe(404)
    })
  })

  describe('GET /pets/{petId}/wellness — get wellness summary', () => {
    beforeAll(async () => {
      // Log a few pillars so we have data to summarise
      await invokeLogWellness(petId, { pillar: 'nutrition', score: 60 }, user)
      await invokeLogWellness(petId, { pillar: 'behaviour', score: 90 }, user)
    })

    it('should return a wellness summary with overall score', async () => {
      const result = await invokeGetWellness(petId, user)

      expect(result.statusCode).toBe(200)
      expect(result.body.petId).toBe(petId)
      expect(result.body).toHaveProperty('overall')
      expect(result.body).toHaveProperty('pillars')
      expect(result.body).toHaveProperty('totalLogs')
      expect(Array.isArray(result.body.pillars)).toBe(true)
      expect(result.body.pillars).toHaveLength(4)
    })

    it('should return null score for pillars not yet logged', async () => {
      const result = await invokeGetWellness(petId, user)

      const socialisation = result.body.pillars.find(p => p.pillar === 'socialisation')
      expect(socialisation.score).toBeNull()
    })

    it('should return 403 when another user requests wellness', async () => {
      const result = await invokeGetWellness(petId, otherUser)

      expect(result.statusCode).toBe(403)
    })

    it('should return 404 for a non-existent pet', async () => {
      const result = await invokeGetWellness('non-existent-pet', user)

      expect(result.statusCode).toBe(404)
    })
  })
})
