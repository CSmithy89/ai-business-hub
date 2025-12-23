'use client'

import { useEffect } from 'react'
import { NESTJS_API_URL } from '@/lib/api-config'
import { useSession } from '@/lib/auth-client'

const REFRESH_INTERVAL_MS = 50 * 60 * 1000 // 50 minutes (TTL is 60m)

export function useCsrfRefresh() {
  const { data: session } = useSession()
  // We only need to refresh if the user is authenticated (has a session)
  // because typically CSRF protection is relevant for session-based flows.
  // If the app uses Bearer tokens primarily, this might be less critical,
  // but if we are using cookies (which the review implies), we definitely need this.
  const hasSession = !!session

  useEffect(() => {
    if (!hasSession) return

    // Function to refresh the token
    const refreshCsrfToken = async () => {
      try {
        const res = await fetch(`${NESTJS_API_URL}/csrf`, {
          method: 'GET',
          credentials: 'include', // Important to send/receive cookies
          cache: 'no-store',
        })
        if (!res.ok) {
          console.warn('Failed to refresh CSRF token', res.status)
        }
      } catch (error) {
        console.error('Error refreshing CSRF token:', error)
      }
    }

    // Initial refresh on mount to handle stale tokens
    refreshCsrfToken()

    const intervalId = setInterval(refreshCsrfToken, REFRESH_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [hasSession])
}
