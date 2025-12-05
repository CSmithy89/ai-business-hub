/**
 * Backup Codes Management API
 * Story 09-5: View and regenerate backup codes
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@hyvve/db'
import { generateBackupCodes, hashBackupCode } from '@/lib/two-factor'
import { createAuditLog, getClientIp, getUserAgent } from '@/lib/audit-log'

/**
 * GET - Get backup codes count
 */
export async function GET(request: NextRequest) {
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

    // Get backup codes count
    const backupCodesCount = await prisma.backupCode.count({
      where: {
        userId: session.user.id,
      },
    })

    const unusedCount = await prisma.backupCode.count({
      where: {
        userId: session.user.id,
        used: false,
      },
    })

    return NextResponse.json({
      total: backupCodesCount,
      unused: unusedCount,
      used: backupCodesCount - unusedCount,
    })
  } catch (error) {
    console.error('Failed to get backup codes count:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to get backup codes count' } },
      { status: 500 }
    )
  }
}

/**
 * POST - Regenerate backup codes (requires password)
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

    // Parse request body
    let body: any
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

    // Verify user has 2FA enabled
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

    const bcrypt = await import('bcrypt')
    const isValid = await bcrypt.compare(password, passwordAccount.accessToken)

    if (!isValid) {
      await createAuditLog({
        userId: session.user.id,
        eventType: '2fa.backup_code.regenerate_failed',
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
        metadata: { reason: 'invalid_password' },
      })

      return NextResponse.json(
        { error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' } },
        { status: 401 }
      )
    }

    // Generate new backup codes
    const newCodes = generateBackupCodes(10)

    // Hash all codes
    const hashedCodes = await Promise.all(
      newCodes.map(async (code) => ({
        code: await hashBackupCode(code),
      }))
    )

    // Record the current count before deletion so the audit log is accurate
    const oldCodesCount = await prisma.backupCode.count({
      where: { userId: session.user.id },
    })

    // Delete old codes and create new ones in a transaction
    await prisma.$transaction([
      prisma.backupCode.deleteMany({
        where: { userId: session.user.id },
      }),
      prisma.backupCode.createMany({
        data: hashedCodes.map((hashed) => ({
          userId: session.user.id,
          code: hashed.code,
        })),
      }),
    ])

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      eventType: '2fa.backup_code.regenerated',
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
      metadata: {
        oldCodesCount,
        newCodesCount: newCodes.length,
      },
    })

    // Return plaintext codes (only time they'll be shown)
    return NextResponse.json({
      backupCodes: newCodes,
      message: 'Save these codes in a secure location. They will not be shown again.',
    })
  } catch (error) {
    console.error('Failed to regenerate backup codes:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to regenerate backup codes' } },
      { status: 500 }
    )
  }
}
