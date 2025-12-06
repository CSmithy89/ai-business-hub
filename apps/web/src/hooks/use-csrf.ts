'use client'

/**
 * React hook for CSRF token management
 *
 * Story: 10.6 - CSRF Protection
 *
 * Provides CSRF token for use in custom fetch calls.
 * For most cases, use the apiClient utilities instead.
 *
 * @module use-csrf
 */

import { useState, useEffect, useCallback } from 'react'
import { getCSRFToken, fetchCSRFToken } from '@/lib/api-client'

/**
 * CSRF token state
 */
export interface CSRFState {
  /** Current CSRF token */
  token: string | null
  /** Whether token is being loaded */
  isLoading: boolean
  /** Error if token fetch failed */
  error: Error | null
  /** Refresh the token */
  refresh: () => Promise<void>
}

/**
 * Hook for accessing CSRF token
 *
 * Features:
 * - Auto-fetches token on mount if not available
 * - Provides refresh function for manual refresh
 * - Tracks loading and error states
 *
 * For most use cases, prefer using the apiClient utilities
 * which handle CSRF automatically.
 *
 * @returns CSRF state with token and utilities
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { token, isLoading, error, refresh } = useCSRF()
 *
 *   // Use token in custom fetch
 *   const handleSubmit = async () => {
 *     await fetch('/api/custom', {
 *       method: 'POST',
 *       headers: {
 *         'x-csrf-token': token || '',
 *       },
 *     })
 *   }
 *
 *   if (isLoading) return <Loading />
 *   if (error) return <Error message={error.message} onRetry={refresh} />
 *
 *   return <Form onSubmit={handleSubmit} />
 * }
 * ```
 */
export function useCSRF(): CSRFState {
  const [token, setToken] = useState<string | null>(() => {
    // Try to get token from cookie on initial render (client-only)
    if (typeof window !== 'undefined') {
      return getCSRFToken() ?? null
    }
    return null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const newToken = await fetchCSRFToken()
      setToken(newToken)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch CSRF token'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Auto-fetch token on mount if not available
  useEffect(() => {
    if (!token && !isLoading && !error) {
      refresh()
    }
  }, [token, isLoading, error, refresh])

  return {
    token,
    isLoading,
    error,
    refresh,
  }
}

/**
 * Get CSRF headers object for use with fetch
 *
 * @param token - CSRF token
 * @returns Headers object with CSRF token
 *
 * @example
 * ```typescript
 * const { token } = useCSRF()
 *
 * await fetch('/api/data', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     ...getCSRFHeaders(token),
 *   },
 *   body: JSON.stringify(data),
 * })
 * ```
 */
export function getCSRFHeaders(token: string | null): Record<string, string> {
  if (!token) return {}
  return { 'x-csrf-token': token }
}
