/**
 * Two-Factor Authentication Status API
 * Story 09-3: Get user's 2FA status
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@hyvve/db'
import { getTrustedDevices, TRUSTED_DEVICE_COOKIE_NAME } from '@/lib/trusted-device'

export async function GET(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Fetch user's 2FA status from database with enhanced metadata
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        twoFactorEnabled: true,
        updatedAt: true,
        accounts: {
          where: { provider: 'credential' },
          select: { id: true },
        },
        backupCodes: {
          where: { used: false },
          select: { id: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    // Return enhanced metadata when 2FA is enabled
    if (user.twoFactorEnabled) {
      // Get trusted devices count
      const currentToken = request.cookies.get(TRUSTED_DEVICE_COOKIE_NAME)?.value
      const trustedDevices = await getTrustedDevices(session.user.id, currentToken)
      const currentDeviceTrusted = trustedDevices.some((d) => d.isCurrent)

      return NextResponse.json({
        twoFactorEnabled: true,
        method: 'totp',
        enabledAt: user.updatedAt.toISOString(),
        backupCodesRemaining: user.backupCodes.length,
        hasPassword: !!user.accounts[0]?.id,
        trustedDevicesCount: trustedDevices.length,
        currentDeviceTrusted,
      })
    }

    // Return minimal data when 2FA is disabled
    return NextResponse.json({
      twoFactorEnabled: false,
    })
  } catch (error) {
    console.error('2FA status check error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to check 2FA status' } },
      { status: 500 }
    )
  }
}
