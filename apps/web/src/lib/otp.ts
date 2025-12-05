import crypto from 'crypto'

/**
 * OTP Configuration
 */
export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_SECONDS: 24 * 60 * 60, // 24 hours (same as verification token)
} as const

/**
 * Derive a 6-digit OTP code from a verification token
 *
 * This approach avoids storing OTP separately in the database.
 * The OTP is deterministically generated from the token, so it will
 * always produce the same OTP for the same token.
 *
 * @param token - Verification token
 * @returns 6-digit OTP code as string
 */
export function deriveOTPFromToken(token: string): string {
  // Create SHA-256 hash of the token
  const hash = crypto.createHash('sha256').update(token).digest('hex')

  // Convert first 15 characters of hex to a large number
  const numericHash = parseInt(hash.substring(0, 15), 16)

  // Get 6-digit code using modulo
  const otp = String(numericHash % 1000000).padStart(OTP_CONFIG.LENGTH, '0')

  return otp
}

/**
 * Verify that an OTP code matches the expected code from a token
 *
 * @param providedOtp - OTP code provided by user
 * @param token - Verification token to derive expected OTP from
 * @returns true if OTP matches
 */
export function verifyOTP(providedOtp: string, token: string): boolean {
  // Normalize input (remove spaces, convert to string)
  const normalizedInput = String(providedOtp).replace(/\s/g, '')

  // Validate format
  if (!/^\d{6}$/.test(normalizedInput)) {
    return false
  }

  // Derive expected OTP from token
  const expectedOtp = deriveOTPFromToken(token)

  // Compare (constant-time comparison to prevent timing attacks)
  return crypto.timingSafeEqual(
    Buffer.from(normalizedInput),
    Buffer.from(expectedOtp)
  )
}

/**
 * Format OTP for display (adds space in middle for readability)
 * Example: "123456" -> "123 456"
 *
 * @param otp - 6-digit OTP code
 * @returns Formatted OTP string
 */
export function formatOTP(otp: string): string {
  if (otp.length !== OTP_CONFIG.LENGTH) {
    return otp
  }

  return `${otp.substring(0, 3)} ${otp.substring(3)}`
}
