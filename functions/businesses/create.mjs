import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { dynamodb } from '../dogservices/lib/dynamodb.mjs'
import { created, badRequest, serverError } from '../dogservices/lib/response.mjs'

const BUSINESS_TABLE = process.env.DOG_BUSINESS_TABLE

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}')
    const { name, email, phone, location, description, ownerId, businessName, certifications, format, serviceArea, bookingRequirement, verified } = body

    if (!name || !ownerId) {
      return badRequest('Missing required fields: name and ownerId are required')
    }

    const item = {
      businessId: randomUUID(),
      ownerId,
      name,
      businessName: businessName || '',
      email: email || '',
      phone: phone || '',
      location: location || '',
      serviceArea: serviceArea || '',
      description: description || '',
      certifications: certifications || [],
      format: format || [],
      bookingRequirement: bookingRequirement || 'open',
      verified: verified === true,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await dynamodb.send(new PutCommand({
      TableName: BUSINESS_TABLE,
      Item: item
    }))

    return created(item)
  } catch (error) {
    console.error('Error creating business:', error)
    return serverError('Failed to create business')
  }
}
