/**
 * Trusted Device Feature Tests
 * Story 09: Tests for device fingerprinting, cookie handling, and device management
 *
 * @module trusted-device.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock Prisma
vi.mock('@hyvve/db', () => ({
  prisma: {
    trustedDevice: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

import { prisma } from '@hyvve/db'
import {
  createDeviceFingerprint,
  getClientIP,
  getDeviceName,
  isTrustedDevice,
  createTrustedDevice,
  setTrustedDeviceCookie,
  clearTrustedDeviceCookie,
  getTrustedDevices,
  revokeTrustedDevice,
  revokeAllTrustedDevices,
  cleanupExpiredDevices,
  TRUSTED_DEVICE_COOKIE_NAME,
  TRUSTED_DEVICE_EXPIRY_DAYS,
  MAX_TRUSTED_DEVICES_PER_USER,
} from './trusted-device'

// Helper to create mock request with headers
function createMockRequest(
  url: string,
  options: {
    headers?: Record<string, string>
    cookies?: Record<string, string>
  } = {}
): NextRequest {
  const headers = new Headers(options.headers || {})
  const req = new NextRequest(new URL(url, 'http://localhost:3000'), { headers })

  // Mock cookies
  if (options.cookies) {
    for (const [name, value] of Object.entries(options.cookies)) {
      vi.spyOn(req.cookies, 'get').mockImplementation((nameOrCookie) => {
        const cookieName = typeof nameOrCookie === 'string' ? nameOrCookie : nameOrCookie.name
        if (cookieName === name) {
          return { name, value }
        }
        return undefined
      })
    }
  }

  return req
}

describe('Device Fingerprinting', () => {
  it('should create consistent fingerprint for same request', () => {
    const req = createMockRequest('/api/auth', {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        'x-forwarded-for': '192.168.1.1',
      },
    })

    const fingerprint1 = createDeviceFingerprint(req)
    const fingerprint2 = createDeviceFingerprint(req)

    expect(fingerprint1).toBe(fingerprint2)
    expect(fingerprint1).toHaveLength(64) // SHA-256 hex = 64 chars
  })

  it('should create different fingerprints for different user agents', () => {
    const req1 = createMockRequest('/api/auth', {
      headers: {
        'user-agent': 'Chrome/120.0.0.0',
        'x-forwarded-for': '192.168.1.1',
      },
    })

    const req2 = createMockRequest('/api/auth', {
      headers: {
        'user-agent': 'Firefox/121.0',
        'x-forwarded-for': '192.168.1.1',
      },
    })

    expect(createDeviceFingerprint(req1)).not.toBe(createDeviceFingerprint(req2))
  })

  it('should create different fingerprints for different IPs', () => {
    const req1 = createMockRequest('/api/auth', {
      headers: {
        'user-agent': 'Chrome/120.0.0.0',
        'x-forwarded-for': '192.168.1.1',
      },
    })

    const req2 = createMockRequest('/api/auth', {
      headers: {
        'user-agent': 'Chrome/120.0.0.0',
        'x-forwarded-for': '192.168.1.2',
      },
    })

    expect(createDeviceFingerprint(req1)).not.toBe(createDeviceFingerprint(req2))
  })
})

describe('Client IP Extraction', () => {
  it('should extract IP from x-forwarded-for header', () => {
    const req = createMockRequest('/api/auth', {
      headers: {
        'x-forwarded-for': '203.0.113.1',
      },
    })

    expect(getClientIP(req)).toBe('203.0.113.1')
  })

  it('should extract first IP from multiple x-forwarded-for IPs', () => {
    const req = createMockRequest('/api/auth', {
      headers: {
        'x-forwarded-for': '203.0.113.1, 70.41.3.18, 150.172.238.178',
      },
    })

    expect(getClientIP(req)).toBe('203.0.113.1')
  })

  it('should fallback to x-real-ip header', () => {
    const req = createMockRequest('/api/auth', {
      headers: {
        'x-real-ip': '203.0.113.2',
      },
    })

    expect(getClientIP(req)).toBe('203.0.113.2')
  })

  it('should return unknown when no IP headers present', () => {
    const req = createMockRequest('/api/auth')

    expect(getClientIP(req)).toBe('unknown')
  })
})

describe('Device Name Parsing', () => {
  it('should detect Chrome on Windows', () => {
    const req = createMockRequest('/api/auth', {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    expect(getDeviceName(req)).toBe('Chrome on Windows 10/11')
  })

  it('should detect Firefox on macOS', () => {
    const req = createMockRequest('/api/auth', {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
      },
    })

    expect(getDeviceName(req)).toBe('Firefox on macOS')
  })

  it('should detect Safari on iOS', () => {
    const req = createMockRequest('/api/auth', {
      headers: {
        'user-agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
    })

    expect(getDeviceName(req)).toBe('Safari on iOS')
  })

  it('should detect Edge on Windows', () => {
    const req = createMockRequest('/api/auth', {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      },
    })

    expect(getDeviceName(req)).toBe('Edge on Windows 10/11')
  })

  it('should detect Chrome on Android', () => {
    const req = createMockRequest('/api/auth', {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      },
    })

    expect(getDeviceName(req)).toBe('Chrome on Android')
  })

  it('should handle unknown user agents', () => {
    const req = createMockRequest('/api/auth', {
      headers: {
        'user-agent': 'CustomBot/1.0',
      },
    })

    expect(getDeviceName(req)).toBe('Unknown Browser on Unknown OS')
  })

  it('should handle missing user agent', () => {
    const req = createMockRequest('/api/auth')

    expect(getDeviceName(req)).toBe('Unknown Browser on Unknown OS')
  })
})

describe('Trusted Device Check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return false when no cookie present', async () => {
    const req = createMockRequest('/api/auth')
    vi.spyOn(req.cookies, 'get').mockReturnValue(undefined)

    const result = await isTrustedDevice(req, 'user-123')

    expect(result).toBe(false)
    expect(prisma.trustedDevice.findFirst).not.toHaveBeenCalled()
  })

  it('should return false when device not found in database', async () => {
    const req = createMockRequest('/api/auth', {
      cookies: { [TRUSTED_DEVICE_COOKIE_NAME]: 'some-token' },
    })

    vi.mocked(prisma.trustedDevice.findFirst).mockResolvedValue(null)

    const result = await isTrustedDevice(req, 'user-123')

    expect(result).toBe(false)
  })

  it('should return true for valid trusted device', async () => {
    const token = 'valid-token'
    const req = createMockRequest('/api/auth', {
      headers: {
        'user-agent': 'Chrome/120.0.0.0',
        'x-forwarded-for': '192.168.1.1',
      },
      cookies: { [TRUSTED_DEVICE_COOKIE_NAME]: token },
    })

    const fingerprint = createDeviceFingerprint(req)

    vi.mocked(prisma.trustedDevice.findFirst).mockResolvedValue({
      id: 'device-123',
      userId: 'user-123',
      tokenHash: 'hashed-token',
      fingerprint,
      name: 'Chrome on Windows',
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120.0.0.0',
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000), // Tomorrow
      revokedAt: null,
      createdAt: new Date(),
    })

    vi.mocked(prisma.trustedDevice.update).mockResolvedValue({} as any)

    const result = await isTrustedDevice(req, 'user-123')

    expect(result).toBe(true)
    expect(prisma.trustedDevice.update).toHaveBeenCalled() // lastUsedAt updated
  })

  it('should revoke device and return false when fingerprint mismatches', async () => {
    const req = createMockRequest('/api/auth', {
      headers: {
        'user-agent': 'Firefox/121.0', // Different browser
        'x-forwarded-for': '192.168.1.1',
      },
      cookies: { [TRUSTED_DEVICE_COOKIE_NAME]: 'some-token' },
    })

    vi.mocked(prisma.trustedDevice.findFirst).mockResolvedValue({
      id: 'device-123',
      userId: 'user-123',
      tokenHash: 'hashed-token',
      fingerprint: 'old-fingerprint', // Different from current
      name: 'Chrome on Windows',
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120.0.0.0',
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: null,
      createdAt: new Date(),
    })

    vi.mocked(prisma.trustedDevice.update).mockResolvedValue({} as any)

    const result = await isTrustedDevice(req, 'user-123')

    expect(result).toBe(false)
    expect(prisma.trustedDevice.update).toHaveBeenCalledWith({
      where: { id: 'device-123' },
      data: { revokedAt: expect.any(Date) },
    })
  })

  it('should handle database errors gracefully', async () => {
    const req = createMockRequest('/api/auth', {
      cookies: { [TRUSTED_DEVICE_COOKIE_NAME]: 'some-token' },
    })

    vi.mocked(prisma.trustedDevice.findFirst).mockRejectedValue(new Error('DB error'))

    const result = await isTrustedDevice(req, 'user-123')

    expect(result).toBe(false)
  })
})

describe('Create Trusted Device', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a trusted device successfully', async () => {
    const req = createMockRequest('/api/auth', {
      headers: {
        'user-agent': 'Chrome/120.0.0.0',
        'x-forwarded-for': '192.168.1.1',
      },
    })

    vi.mocked(prisma.trustedDevice.findMany).mockResolvedValue([])
    vi.mocked(prisma.trustedDevice.create).mockResolvedValue({
      id: 'device-123',
      userId: 'user-123',
      tokenHash: 'hashed',
      fingerprint: 'fp',
      name: 'Chrome on Unknown OS',
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120.0.0.0',
      lastUsedAt: new Date(),
      expiresAt: new Date(),
      revokedAt: null,
      createdAt: new Date(),
    })

    const result = await createTrustedDevice(req, 'user-123')

    expect(result.success).toBe(true)
    expect(result.token).toBeDefined()
    expect(result.token).toHaveLength(64) // 32 bytes hex = 64 chars
    expect(result.deviceId).toBe('device-123')
    expect(result.error).toBeUndefined()
  })

  it('should remove oldest devices when limit exceeded', async () => {
    const req = createMockRequest('/api/auth', {
      headers: {
        'user-agent': 'Chrome/120.0.0.0',
        'x-forwarded-for': '192.168.1.1',
      },
    })

    // Mock existing devices at limit
    const existingDevices = Array.from({ length: MAX_TRUSTED_DEVICES_PER_USER }, (_, i) => ({
      id: `device-${i}`,
      userId: 'user-123',
      lastUsedAt: new Date(Date.now() - i * 86400000), // Staggered dates
    }))

    vi.mocked(prisma.trustedDevice.findMany).mockResolvedValue(existingDevices as any)
    vi.mocked(prisma.trustedDevice.updateMany).mockResolvedValue({ count: 1 })
    vi.mocked(prisma.trustedDevice.create).mockResolvedValue({
      id: 'new-device',
      userId: 'user-123',
    } as any)

    await createTrustedDevice(req, 'user-123')

    // Should revoke oldest device
    expect(prisma.trustedDevice.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: expect.any(Array) },
      },
      data: { revokedAt: expect.any(Date) },
    })
  })

  it('should handle creation errors', async () => {
    const req = createMockRequest('/api/auth')

    vi.mocked(prisma.trustedDevice.findMany).mockResolvedValue([])
    vi.mocked(prisma.trustedDevice.create).mockRejectedValue(new Error('DB error'))

    const result = await createTrustedDevice(req, 'user-123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to create trusted device')
    expect(result.token).toBeUndefined()
  })
})

describe('Cookie Management', () => {
  it('should set trusted device cookie with correct options', () => {
    const response = NextResponse.json({ success: true })
    const mockSet = vi.fn()
    vi.spyOn(response.cookies, 'set').mockImplementation(mockSet)

    setTrustedDeviceCookie(response, 'test-token')

    expect(mockSet).toHaveBeenCalledWith(TRUSTED_DEVICE_COOKIE_NAME, 'test-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: TRUSTED_DEVICE_EXPIRY_DAYS * 24 * 60 * 60,
      path: '/',
    })
  })

  it('should clear trusted device cookie', () => {
    const response = NextResponse.json({ success: true })
    const mockDelete = vi.fn()
    vi.spyOn(response.cookies, 'delete').mockImplementation(mockDelete)

    clearTrustedDeviceCookie(response)

    expect(mockDelete).toHaveBeenCalledWith(TRUSTED_DEVICE_COOKIE_NAME)
  })
})

describe('Get Trusted Devices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return list of trusted devices', async () => {
    const mockDevices = [
      {
        id: 'device-1',
        name: 'Chrome on Windows',
        ipAddress: '192.168.1.1',
        lastUsedAt: new Date(),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        tokenHash: 'hash-1',
      },
      {
        id: 'device-2',
        name: 'Safari on macOS',
        ipAddress: '192.168.1.2',
        lastUsedAt: new Date(),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        tokenHash: 'hash-2',
      },
    ]

    vi.mocked(prisma.trustedDevice.findMany).mockResolvedValue(mockDevices as any)

    const devices = await getTrustedDevices('user-123')

    expect(devices).toHaveLength(2)
    expect(devices[0].id).toBe('device-1')
    expect(devices[0].name).toBe('Chrome on Windows')
    expect(devices[0].isCurrent).toBe(false)
  })

  it('should mark current device when token provided', async () => {
    const mockDevices = [
      {
        id: 'device-1',
        name: 'Chrome on Windows',
        ipAddress: '192.168.1.1',
        lastUsedAt: new Date(),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        tokenHash:
          '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824', // sha256 of "hello"
      },
    ]

    vi.mocked(prisma.trustedDevice.findMany).mockResolvedValue(mockDevices as any)

    const devices = await getTrustedDevices('user-123', 'hello')

    expect(devices[0].isCurrent).toBe(true)
  })
})

describe('Revoke Trusted Devices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should revoke a specific device', async () => {
    vi.mocked(prisma.trustedDevice.updateMany).mockResolvedValue({ count: 1 })

    const result = await revokeTrustedDevice('user-123', 'device-456')

    expect(result).toBe(true)
    expect(prisma.trustedDevice.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'device-456',
        userId: 'user-123',
        revokedAt: null,
      },
      data: { revokedAt: expect.any(Date) },
    })
  })

  it('should return false when device not found', async () => {
    vi.mocked(prisma.trustedDevice.updateMany).mockResolvedValue({ count: 0 })

    const result = await revokeTrustedDevice('user-123', 'nonexistent')

    expect(result).toBe(false)
  })

  it('should revoke all devices for a user', async () => {
    vi.mocked(prisma.trustedDevice.updateMany).mockResolvedValue({ count: 5 })

    const count = await revokeAllTrustedDevices('user-123')

    expect(count).toBe(5)
    expect(prisma.trustedDevice.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-123',
        revokedAt: null,
      },
      data: { revokedAt: expect.any(Date) },
    })
  })
})

describe('Cleanup Expired Devices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete expired and revoked devices', async () => {
    vi.mocked(prisma.trustedDevice.deleteMany).mockResolvedValue({ count: 10 })

    const count = await cleanupExpiredDevices()

    expect(count).toBe(10)
    expect(prisma.trustedDevice.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { expiresAt: { lt: expect.any(Date) } },
          { revokedAt: { lt: expect.any(Date) } },
        ],
      },
    })
  })

  it('should handle cleanup errors', async () => {
    vi.mocked(prisma.trustedDevice.deleteMany).mockRejectedValue(new Error('DB error'))

    const count = await cleanupExpiredDevices()

    expect(count).toBe(0)
  })
})

describe('Constants', () => {
  it('should have correct cookie name', () => {
    expect(TRUSTED_DEVICE_COOKIE_NAME).toBe('hyvve_trusted_device')
  })

  it('should have 30 day expiry', () => {
    expect(TRUSTED_DEVICE_EXPIRY_DAYS).toBe(30)
  })

  it('should allow max 10 devices per user', () => {
    expect(MAX_TRUSTED_DEVICES_PER_USER).toBe(10)
  })
})
