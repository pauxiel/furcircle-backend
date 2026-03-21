import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodb } from '../dogservices/lib/dynamodb.mjs'
import { success, badRequest, forbidden, notFound, serverError } from '../dogservices/lib/response.mjs'

const PET_TABLE = process.env.PET_TABLE
const WELLNESS_LOG_TABLE = process.env.WELLNESS_LOG_TABLE

const PILLARS = ['behaviour', 'nutrition', 'activity', 'socialisation']

export const handler = async (event) => {
  try {
    const ownerId = event.requestContext.authorizer.claims.sub
    const { petId } = event.pathParameters || {}

    if (!petId) {
      return badRequest('Missing petId')
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
      return forbidden('You do not have permission to view wellness for this pet')
    }

    // Fetch all logs for this pet via petId-index
    const result = await dynamodb.send(new QueryCommand({
      TableName: WELLNESS_LOG_TABLE,
      IndexName: 'petId-index',
      KeyConditionExpression: 'petId = :petId',
      ExpressionAttributeValues: { ':petId': petId }
    }))

    const logs = result.Items || []

    // For each pillar, find the most recent log entry
    const latestByPillar = {}
    for (const log of logs) {
      const existing = latestByPillar[log.pillar]
      if (!existing || log.loggedAt > existing.loggedAt) {
        latestByPillar[log.pillar] = log
      }
    }

    // Build pillar scores (null if never logged)
    const pillars = PILLARS.map(pillar => ({
      pillar,
      score: latestByPillar[pillar]?.score ?? null,
      lastLoggedAt: latestByPillar[pillar]?.loggedAt ?? null
    }))

    // Overall score = average of pillars that have been logged
    const scored = pillars.filter(p => p.score !== null)
    const overall = scored.length > 0
      ? Math.round(scored.reduce((sum, p) => sum + p.score, 0) / scored.length)
      : null

    return success({
      petId,
      overall,
      pillars,
      totalLogs: logs.length
    })
  } catch (error) {
    console.error('Error getting wellness summary:', error)
    return serverError('Failed to get wellness summary')
  }
}
