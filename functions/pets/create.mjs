import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { dynamodb } from '../dogservices/lib/dynamodb.mjs'
import { created, badRequest, serverError } from '../dogservices/lib/response.mjs'

const PET_TABLE = process.env.PET_TABLE

export const handler = async (event) => {
  try {
    const ownerId = event.requestContext.authorizer.claims.sub
    const body = JSON.parse(event.body || '{}')
    const { name, type, breed, gender, weight, birthday, about, photo, medicalInfo } = body

    if (!name || !type) {
      return badRequest('Missing required fields: name and type are required')
    }

    const item = {
      petId: randomUUID(),
      ownerId,
      name,
      type,
      breed: breed || '',
      gender: gender || '',
      weight: weight || null,
      birthday: birthday || '',
      about: about || '',
      photo: photo || '',
      medicalInfo: medicalInfo || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await dynamodb.send(new PutCommand({
      TableName: PET_TABLE,
      Item: item
    }))

    return created(item)
  } catch (error) {
    console.error('Error creating pet profile:', error)
    return serverError('Failed to create pet profile')
  }
}
