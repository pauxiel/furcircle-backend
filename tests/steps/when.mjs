import { AwsClient } from 'aws4fetch'
import { fromIni } from '@aws-sdk/credential-providers'

// Mode can be 'handler' (integration) or 'http' (e2e)
const mode = process.env.TEST_MODE || 'handler'

/**
 * Invoke handler directly (integration test) or via HTTP (e2e test)
 * @param {Object} queryParams - Query parameters
 * @param {Object} user - Authenticated user with idToken (required for http mode)
 */
const invokeListDogservices = async (queryParams = {}, user = null) => {
  if (mode === 'handler') {
    return invokeHandlerListDogservices(queryParams)
  } else {
    return invokeHttpListDogservices(queryParams, user)
  }
}

/**
 * Integration test: invoke handler directly
 */
const invokeHandlerListDogservices = async (queryParams = {}) => {
  const { handler } = await import('../../functions/dogservices/list.mjs')

  const event = {
    queryStringParameters: Object.keys(queryParams).length > 0 ? queryParams : null
  }

  const response = await handler(event)
  const body = JSON.parse(response.body)

  return {
    statusCode: response.statusCode,
    body
  }
}

/**
 * E2E test: invoke via HTTP with Cognito ID token
 */
const invokeHttpListDogservices = async (queryParams = {}, user) => {
  const queryString = new URLSearchParams(queryParams).toString()
  const baseUrl = process.env.API_ENDPOINT
  const url = queryString ? baseUrl + '/dogservices?' + queryString : baseUrl + '/dogservices'

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${user.idToken}`
    }
  })

  const body = await response.json()

  return {
    statusCode: response.status,
    body
  }
}

/**
 * Invoke get single dog service
 */
const invokeGetDogservice = async (id, user = null) => {
  if (mode === 'handler') {
    return invokeHandlerGetDogservice(id)
  } else {
    return invokeHttpGetDogservice(id, user)
  }
}

const invokeHandlerGetDogservice = async (id) => {
  const { handler } = await import('../../functions/dogservices/get.mjs')

  const event = {
    pathParameters: { id }
  }

  const response = await handler(event)
  const body = JSON.parse(response.body)

  return {
    statusCode: response.statusCode,
    body
  }
}

const invokeHttpGetDogservice = async (id, user) => {
  const url = process.env.API_ENDPOINT + '/dogservices/' + id

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${user.idToken}`
    }
  })

  const body = await response.json()

  return {
    statusCode: response.status,
    body
  }
}

/**
 * Invoke create dog service (admin only - IAM auth)
 */
const invokeCreateDogservice = async (data) => {
  if (mode === 'handler') {
    return invokeHandlerCreateDogservice(data)
  } else {
    return invokeHttpCreateDogservice(data)
  }
}

const invokeHandlerCreateDogservice = async (data) => {
  const { handler } = await import('../../functions/dogservices/create.mjs')

  const event = {
    body: JSON.stringify(data)
  }

  const response = await handler(event)
  const body = JSON.parse(response.body)

  return {
    statusCode: response.statusCode,
    body
  }
}

const invokeHttpCreateDogservice = async (data) => {
  const credentials = await fromIni()()

  const aws = new AwsClient({
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
    sessionToken: credentials.sessionToken,
    region: 'us-east-1',
    service: 'execute-api'
  })

  const url = process.env.API_ENDPOINT + '/dogservices'

  const response = await aws.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  const body = await response.json()

  return {
    statusCode: response.status,
    body
  }
}

/**
 * Invoke search dog services (authenticated users - Cognito auth)
 * @param {Object} searchParams - { query, category, limit }
 * @param {Object} user - Authenticated user with idToken (required for http mode)
 */
const invokeSearchDogservices = async (searchParams, user = null) => {
  if (mode === 'handler') {
    return invokeHandlerSearchDogservices(searchParams)
  } else {
    return invokeHttpSearchDogservices(searchParams, user)
  }
}

const invokeHandlerSearchDogservices = async (searchParams) => {
  const { handler } = await import('../../functions/dogservices/search.mjs')

  const event = {
    body: JSON.stringify(searchParams)
  }

  const response = await handler(event)
  const body = JSON.parse(response.body)

  return {
    statusCode: response.statusCode,
    body
  }
}

const invokeHttpSearchDogservices = async (searchParams, user) => {
  const url = process.env.API_ENDPOINT + '/dogservices/search'

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.idToken}`
    },
    body: JSON.stringify(searchParams)
  })

  const body = await response.json()

  return {
    statusCode: response.status,
    body
  }
}

/**
 * Invoke delete dog service (admin only - IAM auth)
 */
const invokeDeleteDogservice = async (id) => {
  if (mode === 'handler') {
    return invokeHandlerDeleteDogservice(id)
  } else {
    return invokeHttpDeleteDogservice(id)
  }
}

const invokeHandlerDeleteDogservice = async (id) => {
  const { handler } = await import('../../functions/dogservices/delete.mjs')

  const event = {
    pathParameters: { id }
  }

  const response = await handler(event)
  const body = JSON.parse(response.body)

  return {
    statusCode: response.statusCode,
    body
  }
}

const invokeHttpDeleteDogservice = async (id) => {
  const credentials = await fromIni()()

  const aws = new AwsClient({
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
    sessionToken: credentials.sessionToken,
    region: 'us-east-1',
    service: 'execute-api'
  })

  const url = process.env.API_ENDPOINT + '/dogservices/' + id

  const response = await aws.fetch(url, {
    method: 'DELETE'
  })

  const body = await response.json()

  return {
    statusCode: response.status,
    body
  }
}

/**
 * Invoke list categories
 */
const invokeListCategories = async (user = null) => {
  if (mode === 'handler') {
    return invokeHandlerListCategories()
  } else {
    return invokeHttpListCategories(user)
  }
}

const invokeHandlerListCategories = async () => {
  const { handler } = await import('../../functions/categories/list.mjs')

  const response = await handler({})
  const body = JSON.parse(response.body)

  return {
    statusCode: response.statusCode,
    body
  }
}

const invokeHttpListCategories = async (user) => {
  const url = process.env.API_ENDPOINT + '/categories'

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${user.idToken}`
    }
  })

  const body = await response.json()

  return {
    statusCode: response.status,
    body
  }
}

/**
 * Invoke get single category with its services
 */
const invokeGetCategory = async (slug, queryParams = {}, user = null) => {
  if (mode === 'handler') {
    return invokeHandlerGetCategory(slug, queryParams)
  } else {
    return invokeHttpGetCategory(slug, queryParams, user)
  }
}

const invokeHandlerGetCategory = async (slug, queryParams = {}) => {
  const { handler } = await import('../../functions/categories/get.mjs')

  const event = {
    pathParameters: { slug },
    queryStringParameters: Object.keys(queryParams).length > 0 ? queryParams : null
  }

  const response = await handler(event)
  const body = JSON.parse(response.body)

  return {
    statusCode: response.statusCode,
    body
  }
}

const invokeHttpGetCategory = async (slug, queryParams = {}, user) => {
  const queryString = new URLSearchParams(queryParams).toString()
  const baseUrl = process.env.API_ENDPOINT + '/categories/' + slug
  const url = queryString ? baseUrl + '?' + queryString : baseUrl

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${user.idToken}`
    }
  })

  const body = await response.json()

  return {
    statusCode: response.status,
    body
  }
}

/**
 * Invoke chatbot chat (send message)
 * @param {Object} chatParams - { message, conversationId? }
 * @param {Object} user - Authenticated user with idToken (required for http mode)
 */
const invokeChatSend = async (chatParams, user = null) => {
  if (mode === 'handler') {
    return invokeHandlerChatSend(chatParams, user)
  } else {
    return invokeHttpChatSend(chatParams, user)
  }
}

const invokeHandlerChatSend = async (chatParams, user) => {
  const { handler } = await import('../../functions/chatbot/chat.mjs')

  const event = {
    body: JSON.stringify(chatParams),
    requestContext: {
      authorizer: {
        claims: { sub: user?.username || 'test-user-id' }
      }
    }
  }

  const response = await handler(event)
  const body = JSON.parse(response.body)

  return {
    statusCode: response.statusCode,
    body
  }
}

const invokeHttpChatSend = async (chatParams, user) => {
  const url = process.env.API_ENDPOINT + '/chatbot/chat'

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.idToken}`
    },
    body: JSON.stringify(chatParams)
  })

  const body = await response.json()

  return {
    statusCode: response.status,
    body
  }
}

/**
 * Invoke list conversations
 */
const invokeChatConversations = async (user = null) => {
  if (mode === 'handler') {
    return invokeHandlerChatConversations(user)
  } else {
    return invokeHttpChatConversations(user)
  }
}

const invokeHandlerChatConversations = async (user) => {
  const { handler } = await import('../../functions/chatbot/conversations.mjs')

  const event = {
    requestContext: {
      authorizer: {
        claims: { sub: user?.username || 'test-user-id' }
      }
    }
  }

  const response = await handler(event)
  const body = JSON.parse(response.body)

  return {
    statusCode: response.statusCode,
    body
  }
}

const invokeHttpChatConversations = async (user) => {
  const url = process.env.API_ENDPOINT + '/chatbot/conversations'

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${user.idToken}`
    }
  })

  const body = await response.json()

  return {
    statusCode: response.status,
    body
  }
}

/**
 * Invoke get conversation history
 */
const invokeChatHistory = async (conversationId, user = null) => {
  if (mode === 'handler') {
    return invokeHandlerChatHistory(conversationId, user)
  } else {
    return invokeHttpChatHistory(conversationId, user)
  }
}

const invokeHandlerChatHistory = async (conversationId, user) => {
  const { handler } = await import('../../functions/chatbot/history.mjs')

  const event = {
    pathParameters: { conversationId },
    requestContext: {
      authorizer: {
        claims: { sub: user?.username || 'test-user-id' }
      }
    }
  }

  const response = await handler(event)
  const body = JSON.parse(response.body)

  return {
    statusCode: response.statusCode,
    body
  }
}

const invokeHttpChatHistory = async (conversationId, user) => {
  const url = process.env.API_ENDPOINT + '/chatbot/history/' + conversationId

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${user.idToken}`
    }
  })

  const body = await response.json()

  return {
    statusCode: response.status,
    body
  }
}

/**
 * Invoke create pet profile (pet owner - Cognito auth)
 */
const invokeCreatePet = async (data, user) => {
  if (mode === 'handler') {
    return invokeHandlerCreatePet(data, user)
  } else {
    return invokeHttpCreatePet(data, user)
  }
}

const invokeHandlerCreatePet = async (data, user) => {
  const { handler } = await import('../../functions/pets/create.mjs')

  const event = {
    body: JSON.stringify(data),
    requestContext: {
      authorizer: {
        claims: { sub: user?.username || 'test-user-id' }
      }
    }
  }

  const response = await handler(event)
  const body = JSON.parse(response.body)

  return { statusCode: response.statusCode, body }
}

const invokeHttpCreatePet = async (data, user) => {
  const response = await fetch(process.env.API_ENDPOINT + '/pets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.idToken}`
    },
    body: JSON.stringify(data)
  })

  return { statusCode: response.status, body: await response.json() }
}

/**
 * Invoke list pet profiles (pet owner - Cognito auth)
 */
const invokeListPets = async (user) => {
  if (mode === 'handler') {
    return invokeHandlerListPets(user)
  } else {
    return invokeHttpListPets(user)
  }
}

const invokeHandlerListPets = async (user) => {
  const { handler } = await import('../../functions/pets/list.mjs')

  const event = {
    requestContext: {
      authorizer: {
        claims: { sub: user?.username || 'test-user-id' }
      }
    }
  }

  const response = await handler(event)
  const body = JSON.parse(response.body)

  return { statusCode: response.statusCode, body }
}

const invokeHttpListPets = async (user) => {
  const response = await fetch(process.env.API_ENDPOINT + '/pets', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${user.idToken}` }
  })

  return { statusCode: response.status, body: await response.json() }
}

/**
 * Invoke get single pet profile (pet owner - Cognito auth)
 */
const invokeGetPet = async (petId, user) => {
  if (mode === 'handler') {
    return invokeHandlerGetPet(petId, user)
  } else {
    return invokeHttpGetPet(petId, user)
  }
}

const invokeHandlerGetPet = async (petId, user) => {
  const { handler } = await import('../../functions/pets/get.mjs')

  const event = {
    pathParameters: { petId },
    requestContext: {
      authorizer: {
        claims: { sub: user?.username || 'test-user-id' }
      }
    }
  }

  const response = await handler(event)
  const body = JSON.parse(response.body)

  return { statusCode: response.statusCode, body }
}

const invokeHttpGetPet = async (petId, user) => {
  const response = await fetch(process.env.API_ENDPOINT + '/pets/' + petId, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${user.idToken}` }
  })

  return { statusCode: response.status, body: await response.json() }
}

/**
 * Invoke update pet profile (pet owner - Cognito auth)
 */
const invokeUpdatePet = async (petId, data, user) => {
  if (mode === 'handler') {
    return invokeHandlerUpdatePet(petId, data, user)
  } else {
    return invokeHttpUpdatePet(petId, data, user)
  }
}

const invokeHandlerUpdatePet = async (petId, data, user) => {
  const { handler } = await import('../../functions/pets/update.mjs')

  const event = {
    pathParameters: { petId },
    body: JSON.stringify(data),
    requestContext: {
      authorizer: {
        claims: { sub: user?.username || 'test-user-id' }
      }
    }
  }

  const response = await handler(event)
  const body = JSON.parse(response.body)

  return { statusCode: response.statusCode, body }
}

const invokeHttpUpdatePet = async (petId, data, user) => {
  const response = await fetch(process.env.API_ENDPOINT + '/pets/' + petId, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.idToken}`
    },
    body: JSON.stringify(data)
  })

  return { statusCode: response.status, body: await response.json() }
}

/**
 * Invoke delete pet profile (pet owner - Cognito auth)
 */
const invokeDeletePet = async (petId, user) => {
  if (mode === 'handler') {
    return invokeHandlerDeletePet(petId, user)
  } else {
    return invokeHttpDeletePet(petId, user)
  }
}

const invokeHandlerDeletePet = async (petId, user) => {
  const { handler } = await import('../../functions/pets/delete.mjs')

  const event = {
    pathParameters: { petId },
    requestContext: {
      authorizer: {
        claims: { sub: user?.username || 'test-user-id' }
      }
    }
  }

  const response = await handler(event)
  const body = JSON.parse(response.body)

  return { statusCode: response.statusCode, body }
}

const invokeHttpDeletePet = async (petId, user) => {
  const response = await fetch(process.env.API_ENDPOINT + '/pets/' + petId, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${user.idToken}` }
  })

  return { statusCode: response.status, body: await response.json() }
}

/**
 * Invoke log wellness activity (pet owner - Cognito auth)
 */
const invokeLogWellness = async (petId, data, user) => {
  if (mode === 'handler') {
    return invokeHandlerLogWellness(petId, data, user)
  } else {
    return invokeHttpLogWellness(petId, data, user)
  }
}

const invokeHandlerLogWellness = async (petId, data, user) => {
  const { handler } = await import('../../functions/wellness/log.mjs')

  const event = {
    pathParameters: { petId },
    body: JSON.stringify(data),
    requestContext: {
      authorizer: {
        claims: { sub: user?.username || 'test-user-id' }
      }
    }
  }

  const response = await handler(event)
  const body = JSON.parse(response.body)

  return { statusCode: response.statusCode, body }
}

const invokeHttpLogWellness = async (petId, data, user) => {
  const response = await fetch(`${process.env.API_ENDPOINT}/pets/${petId}/wellness`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.idToken}`
    },
    body: JSON.stringify(data)
  })

  return { statusCode: response.status, body: await response.json() }
}

/**
 * Invoke get wellness summary (pet owner - Cognito auth)
 */
const invokeGetWellness = async (petId, user) => {
  if (mode === 'handler') {
    return invokeHandlerGetWellness(petId, user)
  } else {
    return invokeHttpGetWellness(petId, user)
  }
}

const invokeHandlerGetWellness = async (petId, user) => {
  const { handler } = await import('../../functions/wellness/get.mjs')

  const event = {
    pathParameters: { petId },
    requestContext: {
      authorizer: {
        claims: { sub: user?.username || 'test-user-id' }
      }
    }
  }

  const response = await handler(event)
  const body = JSON.parse(response.body)

  return { statusCode: response.statusCode, body }
}

const invokeHttpGetWellness = async (petId, user) => {
  const response = await fetch(`${process.env.API_ENDPOINT}/pets/${petId}/wellness`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${user.idToken}` }
  })

  return { statusCode: response.status, body: await response.json() }
}

/**
 * Invoke update booking status (business owner - Cognito auth)
 */
const invokeUpdateBookingStatus = async (bookingId, data, user) => {
  if (mode === 'handler') {
    return invokeHandlerUpdateBookingStatus(bookingId, data, user)
  } else {
    return invokeHttpUpdateBookingStatus(bookingId, data, user)
  }
}

const invokeHandlerUpdateBookingStatus = async (bookingId, data, user) => {
  const { handler } = await import('../../functions/bookings/updateStatus.mjs')

  const event = {
    pathParameters: { bookingId },
    body: JSON.stringify(data),
    requestContext: {
      authorizer: {
        claims: { sub: user?.username || 'test-user-id' }
      }
    }
  }

  const response = await handler(event)
  const body = JSON.parse(response.body)

  return { statusCode: response.statusCode, body }
}

const invokeHttpUpdateBookingStatus = async (bookingId, data, user) => {
  const response = await fetch(`${process.env.API_ENDPOINT}/bookings/${bookingId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.idToken}`
    },
    body: JSON.stringify(data)
  })

  return { statusCode: response.status, body: await response.json() }
}

export {
  invokeListDogservices,
  invokeGetDogservice,
  invokeSearchDogservices,
  invokeCreateDogservice,
  invokeDeleteDogservice,
  invokeListCategories,
  invokeGetCategory,
  invokeChatSend,
  invokeChatConversations,
  invokeChatHistory,
  invokeCreatePet,
  invokeListPets,
  invokeGetPet,
  invokeUpdatePet,
  invokeDeletePet,
  invokeLogWellness,
  invokeGetWellness,
  invokeUpdateBookingStatus
}
