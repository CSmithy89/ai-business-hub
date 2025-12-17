/**
 * Centralized API Configuration
 *
 * This module provides consistent API base URLs for all frontend services.
 *
 * Architecture:
 * - Next.js API Routes: Run on the same origin (empty base URL)
 * - NestJS Backend: Runs on a separate port (NEXT_PUBLIC_API_URL)
 *
 * Environment Variables:
 * - NEXT_PUBLIC_API_URL: Base URL for NestJS backend (default: http://localhost:3001)
 * - NEXT_PUBLIC_ENABLE_MOCK_DATA: Explicitly enable mock data (default: false in production)
 */

/**
 * NestJS Backend API base URL
 * Used for: Approval actions, workspace management, authentication
 */
export const NESTJS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * KB collaboration WebSocket URL (Hocuspocus/Yjs)
 *
 * Environment Variables:
 * - NEXT_PUBLIC_KB_COLLAB_WS_URL: Full ws(s):// URL (recommended for prod)
 * - NEXT_PUBLIC_KB_COLLAB_PORT: Port override when deriving from NEXT_PUBLIC_API_URL (default: 3002)
 */
export const KB_COLLAB_WS_URL = (() => {
  const explicit = process.env.NEXT_PUBLIC_KB_COLLAB_WS_URL
  if (explicit && explicit.trim().length > 0) {
    return explicit.replace(/\/$/, '')
  }

  try {
    const apiUrl = new URL(NESTJS_API_URL)
    apiUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'
    apiUrl.port = process.env.NEXT_PUBLIC_KB_COLLAB_PORT || '3002'
    return apiUrl.toString().replace(/\/$/, '')
  } catch {
    return 'ws://localhost:3002'
  }
})()

/**
 * Next.js API Routes base URL
 * Used for: Metrics, session management, BFF patterns
 * Note: Empty string means same-origin requests
 */
export const NEXTJS_API_URL = ''

/**
 * Check if we're in development mode
 */
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'

/**
 * Check if we're in production mode
 */
export const IS_PRODUCTION = process.env.NODE_ENV === 'production'

/**
 * Check if mock data is enabled
 *
 * Safety: In production, mock data is NEVER enabled unless explicitly overridden.
 * This prevents accidental exposure of fake data to users.
 */
export const IS_MOCK_DATA_ENABLED = IS_PRODUCTION
  ? process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true'
  : IS_DEVELOPMENT

// Runtime safety check - warn if mock data is enabled in production
if (IS_PRODUCTION && IS_MOCK_DATA_ENABLED) {
  console.warn(
    '[API Config] Mock data is enabled in production. ' +
    'This should only be used for demos. Set NEXT_PUBLIC_ENABLE_MOCK_DATA=false to disable.'
  )
}

/**
 * Cache durations in milliseconds
 */
export const CACHE_DURATIONS = {
  /** 5 minutes - for metrics and stats */
  METRICS: 5 * 60 * 1000,
  /** 1 minute - for frequently changing data */
  SHORT: 1 * 60 * 1000,
  /** 15 minutes - for rarely changing data */
  LONG: 15 * 60 * 1000,
} as const

/**
 * API endpoint builders for consistent URL construction
 */
export const API_ENDPOINTS = {
  // NestJS Backend endpoints
  approvals: {
    approve: (id: string) => `${NESTJS_API_URL}/api/approvals/${id}/approve`,
    reject: (id: string) => `${NESTJS_API_URL}/api/approvals/${id}/reject`,
    list: () => `${NESTJS_API_URL}/api/approvals`,
    get: (id: string) => `${NESTJS_API_URL}/api/approvals/${id}`,
  },

  // Next.js API Routes
  metrics: {
    approvals: () => `${NEXTJS_API_URL}/api/approvals/metrics`,
  },
} as const
