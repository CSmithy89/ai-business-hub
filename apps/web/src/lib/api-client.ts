/**
 * API Client with CSRF Protection
 *
 * Story: 10.6 - CSRF Protection
 *
 * Provides a fetch wrapper that automatically includes:
 * - CSRF token for state-changing requests
 * - Session credentials
 * - Standard headers
 *
 * @module api-client
 */

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from './csrf'

/**
 * Safe HTTP methods that don't need CSRF protection
 */
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

/**
 * Get CSRF token from cookie
 *
 * @returns CSRF token or null if not available
 */
export function getCSRFToken(): string | null {
  if (typeof window === 'undefined') return null

  const cookies = document.cookie.split(';')
  const csrfCookie = cookies.find((c) =>
    c.trim().startsWith(`${CSRF_COOKIE_NAME}=`)
  )

  if (!csrfCookie) return null

  const value = csrfCookie.split('=')[1]
  return value ? decodeURIComponent(value) : null
}

/**
 * Fetch a new CSRF token from the server
 *
 * Call this after login or if token is missing/expired.
 *
 * @returns CSRF token
 * @throws Error if token fetch fails
 */
export async function fetchCSRFToken(): Promise<string> {
  const response = await fetch('/api/auth/csrf-token', {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch CSRF token')
  }

  const data = await response.json()
  return data.csrfToken
}

/**
 * Ensure CSRF token is available
 *
 * Returns existing token from cookie or fetches a new one.
 *
 * @returns CSRF token
 */
export async function ensureCSRFToken(): Promise<string | null> {
  let token = getCSRFToken()

  if (!token) {
    try {
      token = await fetchCSRFToken()
    } catch (error) {
      console.warn('Failed to fetch CSRF token:', error)
      return null
    }
  }

  return token
}

/**
 * Extended RequestInit with additional options
 */
export interface ApiClientOptions extends RequestInit {
  /**
   * Skip CSRF token inclusion (use for exempt routes)
   */
  skipCSRF?: boolean

  /**
   * Base URL for the request (defaults to current origin)
   */
  baseURL?: string

  /**
   * JSON body to send (automatically stringified)
   */
  json?: unknown
}

/**
 * API client with automatic CSRF protection
 *
 * Features:
 * - Automatically includes CSRF token for POST/PUT/DELETE/PATCH
 * - Includes session credentials
 * - Sets Content-Type for JSON bodies
 * - Handles JSON serialization
 *
 * @param url - Request URL (relative or absolute)
 * @param options - Fetch options with extensions
 * @returns Fetch response
 *
 * @example
 * ```typescript
 * // GET request (no CSRF needed)
 * const response = await apiClient('/api/businesses')
 *
 * // POST request (CSRF token automatically included)
 * const response = await apiClient('/api/businesses', {
 *   method: 'POST',
 *   json: { name: 'My Business' }
 * })
 *
 * // Skip CSRF for specific request
 * const response = await apiClient('/api/webhooks/stripe', {
 *   method: 'POST',
 *   skipCSRF: true,
 *   body: webhookPayload
 * })
 * ```
 */
export async function apiClient(
  url: string,
  options: ApiClientOptions = {}
): Promise<Response> {
  const {
    skipCSRF = false,
    baseURL = '',
    json,
    ...fetchOptions
  } = options

  // Build full URL
  const fullUrl = baseURL ? `${baseURL}${url}` : url

  // Prepare headers
  const headers = new Headers(fetchOptions.headers)

  // Add CSRF token for state-changing methods
  const method = (fetchOptions.method || 'GET').toUpperCase()
  if (!SAFE_METHODS.includes(method) && !skipCSRF) {
    const csrfToken = await ensureCSRFToken()
    if (csrfToken) {
      headers.set(CSRF_HEADER_NAME, csrfToken)
    }
  }

  // Handle JSON body
  let body = fetchOptions.body
  if (json !== undefined) {
    body = JSON.stringify(json)
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
  }

  return fetch(fullUrl, {
    ...fetchOptions,
    headers,
    body,
    credentials: 'include', // Always include cookies
  })
}

/**
 * Shorthand for GET request
 */
export function apiGet(url: string, options?: ApiClientOptions): Promise<Response> {
  return apiClient(url, { ...options, method: 'GET' })
}

/**
 * Shorthand for POST request
 */
export function apiPost(
  url: string,
  data?: unknown,
  options?: ApiClientOptions
): Promise<Response> {
  return apiClient(url, { ...options, method: 'POST', json: data })
}

/**
 * Shorthand for PUT request
 */
export function apiPut(
  url: string,
  data?: unknown,
  options?: ApiClientOptions
): Promise<Response> {
  return apiClient(url, { ...options, method: 'PUT', json: data })
}

/**
 * Shorthand for PATCH request
 */
export function apiPatch(
  url: string,
  data?: unknown,
  options?: ApiClientOptions
): Promise<Response> {
  return apiClient(url, { ...options, method: 'PATCH', json: data })
}

/**
 * Shorthand for DELETE request
 */
export function apiDelete(
  url: string,
  options?: ApiClientOptions
): Promise<Response> {
  return apiClient(url, { ...options, method: 'DELETE' })
}
