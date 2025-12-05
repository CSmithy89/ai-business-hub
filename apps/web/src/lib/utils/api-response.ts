/**
 * API Response Utilities
 * Story 09: Standardized error and success response formats
 *
 * Standard response format:
 * - Success: { success: true, data: T, message?: string }
 * - Error: { success: false, error: { code: string, message: string }, details?: object }
 */

import { NextResponse } from 'next/server'

// ============================================================================
// Types
// ============================================================================

export interface ApiError {
  code: string
  message: string
}

export interface ApiErrorResponse {
  success: false
  error: ApiError
  details?: Record<string, unknown>
}

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data?: T
  message?: string
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

// ============================================================================
// Standard Error Codes
// ============================================================================

export const ErrorCodes = {
  // Authentication errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validation errors (400)
  INVALID_INPUT: 'INVALID_INPUT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',

  // Not found errors (404)
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // Conflict errors (409)
  CONFLICT: 'CONFLICT',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Rate limiting (429)
  RATE_LIMITED: 'RATE_LIMITED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

// ============================================================================
// Response Builders
// ============================================================================

/**
 * Create a standardized success response
 */
export function successResponse<T>(
  data?: T,
  message?: string,
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  const body: ApiSuccessResponse<T> = { success: true }

  if (data !== undefined) {
    body.data = data
  }

  if (message) {
    body.message = message
  }

  return NextResponse.json(body, { status })
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  const body: ApiErrorResponse = {
    success: false,
    error: { code, message },
  }

  if (details) {
    body.details = details
  }

  return NextResponse.json(body, { status })
}

// ============================================================================
// Common Error Responses
// ============================================================================

/**
 * 400 Bad Request - Invalid input
 */
export function badRequest(
  message = 'Invalid request',
  code = ErrorCodes.INVALID_INPUT,
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  return errorResponse(code, message, 400, details)
}

/**
 * 401 Unauthorized - Authentication required
 */
export function unauthorized(
  message = 'Authentication required',
  code = ErrorCodes.UNAUTHORIZED
): NextResponse<ApiErrorResponse> {
  return errorResponse(code, message, 401)
}

/**
 * 403 Forbidden - Insufficient permissions
 */
export function forbidden(
  message = 'You do not have permission to perform this action',
  code = ErrorCodes.FORBIDDEN
): NextResponse<ApiErrorResponse> {
  return errorResponse(code, message, 403)
}

/**
 * 404 Not Found - Resource not found
 */
export function notFound(
  message = 'Resource not found',
  code = ErrorCodes.NOT_FOUND
): NextResponse<ApiErrorResponse> {
  return errorResponse(code, message, 404)
}

/**
 * 409 Conflict - Resource conflict
 */
export function conflict(
  message = 'Resource conflict',
  code = ErrorCodes.CONFLICT
): NextResponse<ApiErrorResponse> {
  return errorResponse(code, message, 409)
}

/**
 * 429 Too Many Requests - Rate limited
 */
export function rateLimited(
  retryAfterSeconds: number,
  message?: string
): NextResponse<ApiErrorResponse> {
  const remainingMinutes = Math.ceil(retryAfterSeconds / 60)
  const defaultMessage = `Too many requests. Please try again in ${remainingMinutes} minute(s).`

  return errorResponse(ErrorCodes.RATE_LIMITED, message || defaultMessage, 429, {
    retryAfter: retryAfterSeconds,
  })
}

/**
 * 500 Internal Server Error
 */
export function serverError(
  message = 'An unexpected error occurred',
  code = ErrorCodes.INTERNAL_ERROR
): NextResponse<ApiErrorResponse> {
  return errorResponse(code, message, 500)
}

/**
 * Validation error with field details
 */
export function validationError(
  errors: Record<string, string[]>,
  message = 'Validation failed'
): NextResponse<ApiErrorResponse> {
  return errorResponse(ErrorCodes.VALIDATION_ERROR, message, 400, { errors })
}
