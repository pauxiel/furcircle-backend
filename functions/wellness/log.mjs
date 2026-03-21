import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { dynamodb } from '../dogservices/lib/dynamodb.mjs'
import { created, badRequest, forbidden, notFound, serverError } from '../dogservices/lib/response.mjs'

const PET_TABLE = process.env.PET_TABLE
const WELLNESS_LOG_TABLE = process.env.WELLNESS_LOG_TABLE

const VALID_PILLARS = ['behaviour', 'nutrition', 'activity', 'socialisation']

export const handler = async (event) => {
  try {
    const ownerId = event.requestContext.authorizer.claims.sub
    const { petId } = event.pathParameters || {}
    const body = JSON.parse(event.body || '{}')
    const { pillar, score, note } = body

    if (!petId) {
      return badRequest('Missing petId')
    }

    if (!pillar || !VALID_PILLARS.includes(pillar)) {
      return badRequest(`pillar must be one of: ${VALID_PILLARS.join(', ')}`)
    }

    if (score === undefined || score === null || !Number.isInteger(Number(score)) || score < 0 || score > 100) {
      return badRequest('score must be an integer between 0 and 100')
    }

    // Verify pet exists and belongs to this owner
    const pet = await dynamodb.send(new GetCommand({
      TableName: PET_TABLE,
      Key: { petId }
    }))

    if (!pet.Item) {
      return notFound(`Pet '${petId}' not found`)
    }

    if (pet.Item.ownerId !== ownerId) {
      return forbidden('You do not have permission to log wellness for this pet')
    }

    const item = {
      logId: randomUUID(),
      petId,
      ownerId,
      pillar,
      score: Number(score),
      note: note || '',
      loggedAt: new Date().toISOString()
    }

    await dynamodb.send(new PutCommand({
      TableName: WELLNESS_LOG_TABLE,
      Item: item
    }))

    return created(item)
  } catch (error) {
    console.error('Error logging wellness activity:', error)
    return serverError('Failed to log wellness activity')
  }
}
