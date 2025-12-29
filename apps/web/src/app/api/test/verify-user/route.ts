/**
 * Test API: Verify User Email
 *
 * Only available in development/test environments.
 * Used by e2e test fixtures to verify users without email.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'

// Only allow in non-production environments
const isTestEnv = process.env.NODE_ENV !== 'production'

export async function POST(req: Request) {
  if (!isTestEnv) {
    return NextResponse.json(
      { error: 'Test endpoints are not available in production' },
      { status: 403 }
    )
  }

  try {
    const { userId, email } = await req.json()

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Either userId or email is required' },
        { status: 400 }
      )
    }

    const where = userId ? { id: userId } : { email }

    const user = await prisma.user.update({
      where,
      data: { emailVerified: true },
      select: { id: true, email: true, emailVerified: true },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Error verifying user:', error)
    return NextResponse.json(
      { error: 'Failed to verify user' },
      { status: 500 }
    )
  }
}
