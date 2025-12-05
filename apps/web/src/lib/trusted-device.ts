/**
 * Trusted Device Feature
 *
 * Allows users to mark devices as "trusted" during 2FA login to skip 2FA
 * for that device in the future. Devices are stored in the database with
 * a secure token stored in an HTTP-only cookie.
 *
 * Security features:
 * - Token is SHA-256 hashed before storage (only hash in DB)
 * - Device fingerprint (User-Agent + IP hash) verified on each use
 * - Tokens expire after 30 days by default
 * - Users can view and revoke trusted devices
 * - Automatic cleanup of expired devices
 */

import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'

// ============================================================================
// Configuration Constants
// ============================================================================

/** Cookie name for trusted device token */
export const TRUSTED_DEVICE_COOKIE_NAME = 'hyvve_trusted_device'

/** Token validity period in days */
export const TRUSTED_DEVICE_EXPIRY_DAYS = 30

/** Maximum number of trusted devices per user */
export const MAX_TRUSTED_DEVICES_PER_USER = 10

// ============================================================================
// Types
// ============================================================================

export interface TrustedDeviceInfo {
  id: string
  name: string
  ipAddress: string
  lastUsedAt: Date
  createdAt: Date
  expiresAt: Date
  isCurrent: boolean
}

export interface CreateTrustedDeviceResult {
  success: boolean
  token?: string
  deviceId?: string
  error?: string
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Create device fingerprint from User-Agent and IP
 * Used to verify that the device making the request matches the stored device
 */
export function createDeviceFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || ''
  const ip = getClientIP(request)

  const fingerprint = `${userAgent}:${ip}`
  return crypto.createHash('sha256').update(fingerprint).digest('hex')
}

/**
 * Get client IP from request headers
 * Supports proxies and load balancers
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
 * Get device name from User-Agent
 * Returns a user-friendly device name (e.g., "Chrome on Windows")
 */
export function getDeviceName(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || ''

  // Parse user agent to extract browser and OS
  let browser = 'Unknown Browser'
  let os = 'Unknown OS'

  // Detect browser (order matters - check specific before generic)
  if (userAgent.includes('Edg/')) browser = 'Edge'
  else if (userAgent.includes('OPR/') || userAgent.includes('Opera')) browser = 'Opera'
  else if (userAgent.includes('Firefox/')) browser = 'Firefox'
  else if (userAgent.includes('Chrome/')) browser = 'Chrome'
  else if (userAgent.includes('Safari/')) browser = 'Safari'

  // Detect OS (check iPhone/iPad before Mac OS X since iOS UA contains "Mac OS X")
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS'
  else if (userAgent.includes('Windows NT 10')) os = 'Windows 10/11'
  else if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac OS X')) os = 'macOS'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('Linux')) os = 'Linux'

  return `${browser} on ${os}`
}

/**
 * Hash a token for secure storage
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Check if a device is trusted for the given user
 *
 * Verifies:
 * 1. Token exists in cookie
 * 2. Token hash exists in database for this user
 * 3. Device is not expired
 * 4. Device is not revoked
 * 5. Fingerprint matches (same browser/IP)
 *
 * @returns true if device is trusted and should bypass 2FA
 */
export async function isTrustedDevice(
  request: NextRequest,
  userId: string
): Promise<boolean> {
  try {
    // Get token from cookie
    const token = request.cookies.get(TRUSTED_DEVICE_COOKIE_NAME)?.value
    if (!token) {
      return false
    }

    // Hash the token to look up in database
    const tokenHash = hashToken(token)

    // Find device in database
    const device = await prisma.trustedDevice.findFirst({
      where: {
        userId,
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (!device) {
      return false
    }

    // Verify fingerprint matches
    const currentFingerprint = createDeviceFingerprint(request)
    if (device.fingerprint !== currentFingerprint) {
      // Fingerprint mismatch - device/location changed, revoke for security
      await prisma.trustedDevice.update({
        where: { id: device.id },
        data: { revokedAt: new Date() },
      })
      return false
    }

    // Update last used timestamp
    await prisma.trustedDevice.update({
      where: { id: device.id },
      data: { lastUsedAt: new Date() },
    })

    return true
  } catch (error) {
    console.error('Error checking trusted device:', error)
    return false
  }
}

/**
 * Create a trusted device for a user
 *
 * Stores device info in database and returns the token to set in cookie
 * Enforces max devices per user by removing oldest if limit reached
 */
export async function createTrustedDevice(
  request: NextRequest,
  userId: string
): Promise<CreateTrustedDeviceResult> {
  try {
    // Generate secure token
    const token = generateToken()
    const tokenHash = hashToken(token)

    // Get device info
    const fingerprint = createDeviceFingerprint(request)
    const name = getDeviceName(request)
    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Calculate expiry
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + TRUSTED_DEVICE_EXPIRY_DAYS)

    // Check current device count and remove oldest if over limit
    const existingDevices = await prisma.trustedDevice.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      orderBy: { lastUsedAt: 'asc' },
    })

    if (existingDevices.length >= MAX_TRUSTED_DEVICES_PER_USER) {
      // Remove oldest devices to make room
      const devicesToRemove = existingDevices.slice(
        0,
        existingDevices.length - MAX_TRUSTED_DEVICES_PER_USER + 1
      )
      await prisma.trustedDevice.updateMany({
        where: {
          id: { in: devicesToRemove.map((d) => d.id) },
        },
        data: { revokedAt: new Date() },
      })
    }

    // Create new trusted device
    const device = await prisma.trustedDevice.create({
      data: {
        userId,
        tokenHash,
        name,
        fingerprint,
        ipAddress,
        userAgent,
        lastUsedAt: new Date(),
        expiresAt,
      },
    })

    return {
      success: true,
      token,
      deviceId: device.id,
    }
  } catch (error) {
    console.error('Error creating trusted device:', error)
    return {
      success: false,
      error: 'Failed to create trusted device',
    }
  }
}

/**
 * Set the trusted device cookie on a response
 */
export function setTrustedDeviceCookie(
  response: NextResponse,
  token: string
): void {
  response.cookies.set(TRUSTED_DEVICE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TRUSTED_DEVICE_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  })
}

/**
 * Clear the trusted device cookie
 */
export function clearTrustedDeviceCookie(response: NextResponse): void {
  response.cookies.delete(TRUSTED_DEVICE_COOKIE_NAME)
}

/**
 * Get all trusted devices for a user
 *
 * @param userId - User ID
 * @param currentTokenHash - Hash of current device token (to mark as current)
 */
export async function getTrustedDevices(
  userId: string,
  currentToken?: string
): Promise<TrustedDeviceInfo[]> {
  const currentTokenHash = currentToken ? hashToken(currentToken) : null

  const devices = await prisma.trustedDevice.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: { lastUsedAt: 'desc' },
    select: {
      id: true,
      name: true,
      ipAddress: true,
      lastUsedAt: true,
      createdAt: true,
      expiresAt: true,
      tokenHash: true,
    },
  })

  return devices.map((device) => ({
    id: device.id,
    name: device.name,
    ipAddress: device.ipAddress,
    lastUsedAt: device.lastUsedAt,
    createdAt: device.createdAt,
    expiresAt: device.expiresAt,
    isCurrent: currentTokenHash ? device.tokenHash === currentTokenHash : false,
  }))
}

/**
 * Revoke a specific trusted device
 */
export async function revokeTrustedDevice(
  userId: string,
  deviceId: string
): Promise<boolean> {
  try {
    const result = await prisma.trustedDevice.updateMany({
      where: {
        id: deviceId,
        userId, // Ensure user owns this device
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    })

    return result.count > 0
  } catch (error) {
    console.error('Error revoking trusted device:', error)
    return false
  }
}

/**
 * Revoke all trusted devices for a user (e.g., password change, 2FA disabled)
 */
export async function revokeAllTrustedDevices(userId: string): Promise<number> {
  try {
    const result = await prisma.trustedDevice.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    })

    return result.count
  } catch (error) {
    console.error('Error revoking all trusted devices:', error)
    return 0
  }
}

/**
 * Cleanup expired trusted devices (run periodically)
 * Deletes devices that have been expired for more than 30 days
 */
export async function cleanupExpiredDevices(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const result = await prisma.trustedDevice.deleteMany({
      where: {
        OR: [
          // Expired more than 30 days ago
          {
            expiresAt: {
              lt: thirtyDaysAgo,
            },
          },
          // Revoked more than 30 days ago
          {
            revokedAt: {
              lt: thirtyDaysAgo,
            },
          },
        ],
      },
    })

    return result.count
  } catch (error) {
    console.error('Error cleaning up expired devices:', error)
    return 0
  }
}
