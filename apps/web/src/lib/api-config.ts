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
 */

/**
 * NestJS Backend API base URL
 * Used for: Approval actions, workspace management, authentication
 */
export const NESTJS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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
 * Check if mock data is enabled
 * This is true when backend services aren't fully connected
 */
export const IS_MOCK_DATA_ENABLED = IS_DEVELOPMENT

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
