/**
 * Security Constants
 * Story 09: Centralized security-related configuration values
 *
 * These constants control security-sensitive parameters.
 * Changes to these values should be reviewed carefully.
 */

// ============================================================================
// Encryption Constants
// ============================================================================

/**
 * PBKDF2 iteration count for key derivation
 * Higher values increase brute-force resistance but also CPU usage
 * NIST recommends minimum 10,000; we use 100,000 for strong security
 */
export const PBKDF2_ITERATIONS = 100000

/**
 * AES key length in bytes (256 bits = 32 bytes)
 */
export const AES_KEY_LENGTH = 32

/**
 * AES-GCM IV length in bytes (recommended 12 bytes for GCM)
 */
export const AES_IV_LENGTH = 16

/**
 * Salt length for PBKDF2 key derivation
 */
export const SALT_LENGTH = 64

/**
 * GCM authentication tag length in bytes
 */
export const GCM_AUTH_TAG_LENGTH = 16

// ============================================================================
// Two-Factor Authentication Constants
// ============================================================================

/**
 * Number of backup codes to generate per user
 */
export const BACKUP_CODE_COUNT = 10

/**
 * Backup code bcrypt hash rounds
 * Cost factor 12 provides good security (~250ms per hash)
 */
export const BACKUP_CODE_HASH_ROUNDS = 12

/**
 * TOTP code validity window (number of time steps before/after current)
 * Window of 1 allows codes from -30s to +30s around current time
 */
export const TOTP_WINDOW = 1

/**
 * TOTP period in seconds (standard is 30s)
 */
export const TOTP_PERIOD = 30

/**
 * TOTP code length
 */
export const TOTP_DIGITS = 6

// ============================================================================
// Session Constants
// ============================================================================

/**
 * Session duration in seconds (7 days)
 */
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7

/**
 * Session refresh age in seconds (1 day)
 */
export const SESSION_REFRESH_AGE_SECONDS = 60 * 60 * 24

/**
 * Access token lifetime in seconds (15 minutes)
 */
export const ACCESS_TOKEN_LIFETIME_SECONDS = 60 * 15

// ============================================================================
// Rate Limiting Constants
// ============================================================================

/**
 * Maximum entries in in-memory rate limit store (fallback mode)
 * Prevents unbounded memory growth under attack
 */
export const RATE_LIMIT_MAX_ENTRIES = 10000

/**
 * Default rate limit window in seconds (15 minutes)
 */
export const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 15 * 60

/**
 * Default max attempts per rate limit window
 */
export const DEFAULT_RATE_LIMIT_MAX_ATTEMPTS = 5

/**
 * 2FA verification rate limit (5 attempts per 15 minutes)
 */
export const TWO_FACTOR_RATE_LIMIT = {
  maxAttempts: 5,
  windowSeconds: 15 * 60,
}

/**
 * Password reset rate limit (3 attempts per hour)
 */
export const PASSWORD_RESET_RATE_LIMIT = {
  maxAttempts: 3,
  windowSeconds: 60 * 60,
}

/**
 * Email resend rate limit (3 per 5 minutes)
 */
export const EMAIL_RESEND_RATE_LIMIT = {
  maxAttempts: 3,
  windowSeconds: 5 * 60,
}

/**
 * Login rate limit (5 attempts per 15 minutes)
 */
export const LOGIN_RATE_LIMIT = {
  maxAttempts: 5,
  windowSeconds: 15 * 60,
}

/**
 * Workspace creation rate limit (5 per hour)
 */
export const WORKSPACE_CREATION_RATE_LIMIT = {
  maxAttempts: 5,
  windowSeconds: 60 * 60,
}

// ============================================================================
// Trusted Device Constants
// ============================================================================

/**
 * Cookie name for trusted device token
 */
export const TRUSTED_DEVICE_COOKIE_NAME = 'hyvve_trusted_device'

/**
 * Trusted device token validity in days
 */
export const TRUSTED_DEVICE_EXPIRY_DAYS = 30

/**
 * Maximum trusted devices per user
 */
export const MAX_TRUSTED_DEVICES_PER_USER = 10

// ============================================================================
// Token Constants
// ============================================================================

/**
 * Magic link token expiry in seconds (15 minutes)
 */
export const MAGIC_LINK_EXPIRY_SECONDS = 15 * 60

/**
 * Password reset token expiry in seconds (1 hour)
 */
export const PASSWORD_RESET_EXPIRY_SECONDS = 60 * 60

/**
 * Email verification token expiry in seconds (24 hours)
 */
export const EMAIL_VERIFICATION_EXPIRY_SECONDS = 24 * 60 * 60
