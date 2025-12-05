/**
 * API Response Utilities Tests
 * Story 09: Tests for standardized API response formatting
 *
 * @module api-response.test
 */

import { describe, it, expect } from 'vitest'
import {
  successResponse,
  errorResponse,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  rateLimited,
  serverError,
  validationError,
  ErrorCodes,
} from './api-response'

describe('Success Response', () => {
  it('should create basic success response', async () => {
    const response = successResponse()

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeUndefined()
    expect(body.message).toBeUndefined()
  })

  it('should include data when provided', async () => {
    const data = { id: '123', name: 'Test' }
    const response = successResponse(data)

    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual(data)
  })

  it('should include message when provided', async () => {
    const response = successResponse(undefined, 'Operation completed')

    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.message).toBe('Operation completed')
  })

  it('should include both data and message', async () => {
    const data = { count: 5 }
    const response = successResponse(data, 'Found 5 items')

    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual(data)
    expect(body.message).toBe('Found 5 items')
  })

  it('should allow custom status code', async () => {
    const response = successResponse({ created: true }, 'Resource created', 201)

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.success).toBe(true)
  })

  it('should handle null data', async () => {
    const response = successResponse(null)

    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeNull()
  })

  it('should handle array data', async () => {
    const data = [1, 2, 3]
    const response = successResponse(data)

    const body = await response.json()
    expect(body.data).toEqual([1, 2, 3])
  })
})

describe('Error Response', () => {
  it('should create error response with required fields', async () => {
    const response = errorResponse('TEST_ERROR', 'Test error message', 400)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('TEST_ERROR')
    expect(body.error.message).toBe('Test error message')
    expect(body.details).toBeUndefined()
  })

  it('should include details when provided', async () => {
    const details = { field: 'email', reason: 'invalid format' }
    const response = errorResponse('VALIDATION_ERROR', 'Invalid input', 400, details)

    const body = await response.json()
    expect(body.details).toEqual(details)
  })
})

describe('Bad Request (400)', () => {
  it('should create default bad request response', async () => {
    const response = badRequest()

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error.code).toBe(ErrorCodes.INVALID_INPUT)
    expect(body.error.message).toBe('Invalid request')
  })

  it('should allow custom message', async () => {
    const response = badRequest('Email is required')

    const body = await response.json()
    expect(body.error.code).toBe(ErrorCodes.INVALID_INPUT)
    expect(body.error.message).toBe('Email is required')
  })

  it('should include details', async () => {
    const response = badRequest('Invalid input', ErrorCodes.INVALID_INPUT, {
      fields: ['email', 'password'],
    })

    const body = await response.json()
    expect(body.details).toEqual({ fields: ['email', 'password'] })
  })
})

describe('Unauthorized (401)', () => {
  it('should create default unauthorized response', async () => {
    const response = unauthorized()

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error.code).toBe(ErrorCodes.UNAUTHORIZED)
    expect(body.error.message).toBe('Authentication required')
  })

  it('should allow custom message', async () => {
    const response = unauthorized('Session expired')

    const body = await response.json()
    expect(body.error.code).toBe(ErrorCodes.UNAUTHORIZED)
    expect(body.error.message).toBe('Session expired')
  })
})

describe('Forbidden (403)', () => {
  it('should create default forbidden response', async () => {
    const response = forbidden()

    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error.code).toBe(ErrorCodes.FORBIDDEN)
    expect(body.error.message).toBe('You do not have permission to perform this action')
  })

  it('should allow custom message', async () => {
    const response = forbidden('Admin access required')

    const body = await response.json()
    expect(body.error.code).toBe(ErrorCodes.FORBIDDEN)
    expect(body.error.message).toBe('Admin access required')
  })
})

describe('Not Found (404)', () => {
  it('should create default not found response', async () => {
    const response = notFound()

    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error.code).toBe(ErrorCodes.NOT_FOUND)
    expect(body.error.message).toBe('Resource not found')
  })

  it('should allow custom message', async () => {
    const response = notFound('User not found')

    const body = await response.json()
    expect(body.error.code).toBe(ErrorCodes.NOT_FOUND)
    expect(body.error.message).toBe('User not found')
  })
})

describe('Conflict (409)', () => {
  it('should create default conflict response', async () => {
    const response = conflict()

    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.error.code).toBe(ErrorCodes.CONFLICT)
    expect(body.error.message).toBe('Resource conflict')
  })

  it('should allow custom message', async () => {
    const response = conflict('Email already exists')

    const body = await response.json()
    expect(body.error.code).toBe(ErrorCodes.CONFLICT)
    expect(body.error.message).toBe('Email already exists')
  })
})

describe('Rate Limited (429)', () => {
  it('should create rate limited response with retry info', async () => {
    const response = rateLimited(300) // 5 minutes

    expect(response.status).toBe(429)
    const body = await response.json()
    expect(body.error.code).toBe(ErrorCodes.RATE_LIMITED)
    expect(body.error.message).toBe('Too many requests. Please try again in 5 minute(s).')
    expect(body.details?.retryAfter).toBe(300)
  })

  it('should calculate minutes correctly', async () => {
    const response = rateLimited(90) // 1.5 minutes -> rounds up to 2

    const body = await response.json()
    expect(body.error.message).toBe('Too many requests. Please try again in 2 minute(s).')
  })

  it('should allow custom message', async () => {
    const response = rateLimited(60, 'Too many login attempts')

    const body = await response.json()
    expect(body.error.message).toBe('Too many login attempts')
  })
})

describe('Server Error (500)', () => {
  it('should create default server error response', async () => {
    const response = serverError()

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error.code).toBe(ErrorCodes.INTERNAL_ERROR)
    expect(body.error.message).toBe('An unexpected error occurred')
  })

  it('should allow custom message', async () => {
    const response = serverError('Database connection failed')

    const body = await response.json()
    expect(body.error.code).toBe(ErrorCodes.INTERNAL_ERROR)
    expect(body.error.message).toBe('Database connection failed')
  })
})

describe('Validation Error', () => {
  it('should create validation error with field errors', async () => {
    const errors = {
      email: ['Email is required', 'Email must be valid'],
      password: ['Password must be at least 8 characters'],
    }
    const response = validationError(errors)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error.code).toBe(ErrorCodes.VALIDATION_ERROR)
    expect(body.error.message).toBe('Validation failed')
    expect(body.details?.errors).toEqual(errors)
  })

  it('should allow custom message', async () => {
    const response = validationError({ name: ['Required'] }, 'Please fix the errors below')

    const body = await response.json()
    expect(body.error.message).toBe('Please fix the errors below')
  })
})

describe('Error Codes', () => {
  it('should have all expected error codes', () => {
    // Authentication
    expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED')
    expect(ErrorCodes.INVALID_TOKEN).toBe('INVALID_TOKEN')
    expect(ErrorCodes.SESSION_EXPIRED).toBe('SESSION_EXPIRED')

    // Authorization
    expect(ErrorCodes.FORBIDDEN).toBe('FORBIDDEN')
    expect(ErrorCodes.INSUFFICIENT_PERMISSIONS).toBe('INSUFFICIENT_PERMISSIONS')

    // Validation
    expect(ErrorCodes.INVALID_INPUT).toBe('INVALID_INPUT')
    expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
    expect(ErrorCodes.INVALID_REQUEST).toBe('INVALID_REQUEST')

    // Not Found
    expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND')
    expect(ErrorCodes.USER_NOT_FOUND).toBe('USER_NOT_FOUND')
    expect(ErrorCodes.RESOURCE_NOT_FOUND).toBe('RESOURCE_NOT_FOUND')

    // Conflict
    expect(ErrorCodes.CONFLICT).toBe('CONFLICT')
    expect(ErrorCodes.ALREADY_EXISTS).toBe('ALREADY_EXISTS')

    // Rate Limiting
    expect(ErrorCodes.RATE_LIMITED).toBe('RATE_LIMITED')
    expect(ErrorCodes.TOO_MANY_REQUESTS).toBe('TOO_MANY_REQUESTS')

    // Server
    expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR')
    expect(ErrorCodes.SERVER_ERROR).toBe('SERVER_ERROR')
    expect(ErrorCodes.DATABASE_ERROR).toBe('DATABASE_ERROR')
  })
})
