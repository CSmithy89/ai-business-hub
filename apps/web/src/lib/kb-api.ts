/**
 * KB API Client
 *
 * Provides API functions for Knowledge Base operations
 */

import { apiPost, apiDelete } from './api-client'

interface VerificationResponse {
  id: string
  isVerified: boolean
  verifiedAt: string | null
  verifiedById: string | null
  verifyExpires: string | null
  [key: string]: unknown
}

/**
 * Mark a page as verified with expiration period
 */
export async function verifyPage(
  pageId: string,
  expiresIn: '30d' | '60d' | '90d' | 'never',
): Promise<VerificationResponse> {
  const response = await apiPost(`/api/kb/pages/${pageId}/verify`, {
    expiresIn,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to verify page' }))
    throw new Error(error.message || 'Failed to verify page')
  }

  return response.json()
}

/**
 * Remove verification status from a page
 */
export async function unverifyPage(pageId: string): Promise<VerificationResponse> {
  const response = await apiDelete(`/api/kb/pages/${pageId}/verify`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to unverify page' }))
    throw new Error(error.message || 'Failed to unverify page')
  }

  return response.json()
}
