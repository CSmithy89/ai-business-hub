/**
 * Disable Two-Factor Authentication API
 * Story 09-5: Disable 2FA with password verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@hyvve/db'
import { createAuditLog, getClientIp, getUserAgent } from '@/lib/audit-log'

/**
 * POST - Disable 2FA (requires password)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Parse request body (handle invalid JSON)
    let body
    try {
      body = await request.json()
    } catch (err) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body' } },
        { status: 400 }
      )
    }
    const { password } = body || {}

    if (!password) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Current password is required' } },
        { status: 400 }
      )
    }

    // Get user with accounts
    if (!session.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { accounts: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    // Check that 2FA is currently enabled
    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: { code: 'TWO_FACTOR_NOT_ENABLED', message: 'Two-factor authentication is not enabled' } },
        { status: 400 }
      )
    }

    // Verify password
    const passwordAccount = user.accounts.find(acc => acc.provider === 'credential')
    if (!passwordAccount?.accessToken) {
      return NextResponse.json(
        { error: { code: 'NO_PASSWORD', message: 'Password verification not available for OAuth-only accounts' } },
        { status: 400 }
      )
    }

    const bcryptModule = await import('bcrypt')
    const compare = (bcryptModule as any).compare ?? (bcryptModule as any).default?.compare
    if (typeof compare !== 'function') {
      throw new Error('bcrypt.compare is not available')
    }
    const isValid = await compare(password, passwordAccount.accessToken)

    if (!isValid) {
      await createAuditLog({
        userId: session.user.id,
        eventType: '2fa.disable_failed',
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
        metadata: { reason: 'invalid_password' },
      })

      return NextResponse.json(
        { error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' } },
        { status: 401 }
      )
    }

    // Disable 2FA and delete all backup codes in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      }),
      prisma.backupCode.deleteMany({
        where: { userId: session.user.id },
      }),
    ])

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      eventType: '2fa.disabled',
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
    })

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication has been disabled',
    })
  } catch (error) {
    console.error('Failed to disable 2FA:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to disable two-factor authentication' } },
      { status: 500 }
    )
  }
}
