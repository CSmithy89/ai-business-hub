/**
 * Check Trusted Device API
 * Story 09-4: Check if current device is trusted for 2FA bypass
 *
 * POST /api/auth/trusted-devices/check
 *
 * Called during login flow after credential verification to determine
 * if the user can bypass 2FA due to a trusted device.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isTrustedDevice } from '@/lib/trusted-device'

interface CheckTrustedDeviceRequest {
  userId: string
}

/**
 * POST /api/auth/trusted-devices/check
 *
 * Check if the current device is trusted for a specific user.
 * Used during login flow to determine if 2FA can be bypassed.
 *
 * Note: This endpoint uses userId from request body rather than session
 * because it's called DURING the login flow before session is established.
 */
export async function POST(request: NextRequest) {
  try {
    const body: CheckTrustedDeviceRequest = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_INPUT', message: 'User ID is required' },
        },
        { status: 400 }
      )
    }

    // Check if device is trusted
    const trusted = await isTrustedDevice(request, userId)

    return NextResponse.json({
      success: true,
      data: {
        isTrusted: trusted,
      },
    })
  } catch (error) {
    console.error('Error checking trusted device:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to check trusted device' },
      },
      { status: 500 }
    )
  }
}
