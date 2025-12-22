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

    // Initial refresh on mount (optional, but good to ensure we have a fresh one if app was stale)
    // Actually, on mount usually the app loads fresh. Let's strictly stick to the interval
    // to avoid storming the server on every page load if not needed.
    // However, if the user navigates back to the tab after 55 minutes, they might be close to expiry.
    // For now, simple interval is a good start.

    const intervalId = setInterval(refreshCsrfToken, REFRESH_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [hasSession])
}
