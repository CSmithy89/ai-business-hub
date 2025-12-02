/**
 * Invitation token utilities
 * Secure token generation and expiry management for workspace invitations
 */

import { randomBytes } from 'crypto'

/**
 * Generate a cryptographically secure invitation token
 * Uses 32 bytes of random data encoded as base64url for URL-safe transmission
 *
 * @returns 43-character base64url encoded token
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Invitation expiry period in days
 */
export const INVITATION_EXPIRY_DAYS = 7

/**
 * Calculate invitation expiry date (7 days from now)
 *
 * @returns Date object set to 7 days in the future
 */
export function getInvitationExpiry(): Date {
  return new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
}

/**
 * Check if an invitation has expired
 *
 * @param expiresAt - The expiry date of the invitation
 * @returns true if the invitation has expired, false otherwise
 */
export function isInvitationExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt)
}

/**
 * Format invitation expiry for display
 *
 * @param expiresAt - The expiry date
 * @returns Human-readable expiry string
 */
export function formatInvitationExpiry(expiresAt: Date): string {
  return new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
