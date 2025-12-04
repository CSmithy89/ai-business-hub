import crypto from 'crypto'
import { NextRequest } from 'next/server'

/**
 * Create device fingerprint from User-Agent and IP
 */
export function createDeviceFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || ''
  const ip = getClientIP(request)

  const fingerprint = `${userAgent}:${ip}`
  return crypto.createHash('sha256').update(fingerprint).digest('hex')
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwarded) {
    // x-forwarded-for may contain multiple IPs, get the first one
    return forwarded.split(',')[0].trim()
  }

  return realIP || 'unknown'
}

/**
 * Check if device is trusted
 */
export function isTrustedDevice(request: NextRequest): boolean {
  const trustedDeviceToken = request.cookies.get('hyvve_trusted_device')?.value

  if (!trustedDeviceToken) {
    return false
  }

  // Verify device fingerprint matches stored token
  // In production, store device fingerprints in database
  // For now, trust the cookie existence
  return true
}

/**
 * Get device name from User-Agent
 */
export function getDeviceName(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || ''

  // Parse user agent to extract browser and OS
  let browser = 'Unknown Browser'
  let os = 'Unknown OS'

  if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Edge')) browser = 'Edge'

  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iOS')) os = 'iOS'

  return `${browser} on ${os}`
}
