/**
 * Unlink Account API
 * Story 09-7: Unlink an OAuth provider from user account
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@hyvve/db'
import { createAuditLog, getClientIp, getUserAgent } from '@/lib/audit-log'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { provider } = body

    if (!provider || typeof provider !== 'string') {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Provider is required' } },
        { status: 400 }
      )
    }

    // Validate provider is one of the supported OAuth providers
    const supportedProviders = ['google', 'microsoft', 'github']
    if (!supportedProviders.includes(provider)) {
      return NextResponse.json(
        { error: { code: 'INVALID_PROVIDER', message: 'Unsupported provider' } },
        { status: 400 }
      )
    }

    // Fetch user's current auth methods
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        passwordHash: true,
        twoFactorEnabled: true,
        accounts: {
          select: {
            id: true,
            provider: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    // Find the account to unlink
    const accountToUnlink = user.accounts.find(acc => acc.provider === provider)
    if (!accountToUnlink) {
      return NextResponse.json(
        { error: { code: 'ACCOUNT_NOT_LINKED', message: 'This provider is not linked to your account' } },
        { status: 404 }
      )
    }

    // Check if user has at least one other auth method
    const hasPassword = !!user.passwordHash
    const otherOAuthAccounts = user.accounts.filter(
      acc => acc.provider !== provider && acc.provider !== 'credential'
    )

    // User must have either a password or at least one other OAuth provider
    if (!hasPassword && otherOAuthAccounts.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'LAST_AUTH_METHOD',
            message: 'Cannot unlink the last authentication method. Please set a password or link another provider first.'
          }
        },
        { status: 400 }
      )
    }

    // Delete the account
    await prisma.account.delete({
      where: { id: accountToUnlink.id },
    })

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      eventType: 'account.unlinked' as any,
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
      metadata: {
        provider,
        remainingAuthMethods: {
          hasPassword,
          linkedProviders: otherOAuthAccounts.map(acc => acc.provider),
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} account unlinked successfully`,
    })
  } catch (error) {
    console.error('Unlink account error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to unlink account' } },
      { status: 500 }
    )
  }
}
