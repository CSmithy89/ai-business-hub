/**
 * Linked Accounts API
 * Story 09-7: Get user's linked OAuth providers
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@hyvve/db'

export interface LinkedAccount {
  provider: string
  providerId: string
  linkedAt: string
}

export interface LinkedAccountsResponse {
  accounts: LinkedAccount[]
  hasPassword: boolean
  supportedProviders: string[]
}

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

    // Fetch user's linked accounts from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        passwordHash: true,
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
            createdAt: true,
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

    // Map accounts to response format
    const linkedAccounts: LinkedAccount[] = user.accounts
      .filter(account => account.provider !== 'credential' && account.provider !== 'credentials') // Exclude password accounts
      .map(account => ({
        provider: account.provider,
        providerId: account.providerAccountId,
        linkedAt: account.createdAt.toISOString(),
      }))

    // List of supported OAuth providers
    const supportedProviders = ['google', 'microsoft', 'github']

    return NextResponse.json({
      accounts: linkedAccounts,
      hasPassword: !!user.passwordHash,
      supportedProviders,
    })
  } catch (error) {
    console.error('Linked accounts fetch error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch linked accounts' } },
      { status: 500 }
    )
  }
}
