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

export {
  invokeListDogservices,
  invokeGetDogservice,
  invokeSearchDogservices,
  invokeCreateDogservice,
  invokeDeleteDogservice,
  invokeListCategories,
  invokeGetCategory
}
