/**
 * Trusted Devices API Routes
 * Story 09-4: Manage trusted devices for 2FA bypass
 *
 * GET /api/auth/trusted-devices - List user's trusted devices
 * DELETE /api/auth/trusted-devices?deviceId=xxx - Revoke a specific device
 * DELETE /api/auth/trusted-devices?all=true - Revoke all trusted devices
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import {
  getTrustedDevices,
  revokeTrustedDevice,
  revokeAllTrustedDevices,
  clearTrustedDeviceCookie,
  TRUSTED_DEVICE_COOKIE_NAME,
} from '@/lib/trusted-device'

/**
 * GET /api/auth/trusted-devices
 *
 * Returns list of user's trusted devices with current device marked
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'You must be signed in' },
        },
        { status: 401 }
      )
    }

    // Get current device token to mark it in the list
    const currentToken = request.cookies.get(TRUSTED_DEVICE_COOKIE_NAME)?.value

    const devices = await getTrustedDevices(session.user.id, currentToken)

    return NextResponse.json({
      success: true,
      data: devices,
    })
  } catch (error) {
    console.error('Error listing trusted devices:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to list trusted devices' },
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/auth/trusted-devices
 *
 * Revoke trusted device(s)
 * Query params:
 * - deviceId: Revoke specific device
 * - all: Revoke all devices (set to "true")
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'You must be signed in' },
        },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const deviceId = url.searchParams.get('deviceId')
    const revokeAll = url.searchParams.get('all') === 'true'

    if (!deviceId && !revokeAll) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Either deviceId or all=true is required',
          },
        },
        { status: 400 }
      )
    }

    const response = NextResponse.json({ success: true, data: {} })

    if (revokeAll) {
      // Revoke all trusted devices
      const count = await revokeAllTrustedDevices(session.user.id)

      // Clear the cookie since current device is now revoked
      clearTrustedDeviceCookie(response)

      return NextResponse.json({
        success: true,
        data: { revokedCount: count },
      })
    } else if (deviceId) {
      // Revoke specific device
      const success = await revokeTrustedDevice(session.user.id, deviceId)

      if (!success) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Device not found or already revoked' },
          },
          { status: 404 }
        )
      }

      // Check if we're revoking the current device
      const currentToken = request.cookies.get(TRUSTED_DEVICE_COOKIE_NAME)?.value
      if (currentToken) {
        // Get devices to check if current device was the one revoked
        const remainingDevices = await getTrustedDevices(session.user.id, currentToken)
        const currentDeviceExists = remainingDevices.some((d) => d.isCurrent)

        if (!currentDeviceExists) {
          clearTrustedDeviceCookie(response)
        }
      }

      return response
    }

    // Should not reach here
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Invalid request' },
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error revoking trusted device:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to revoke trusted device' },
      },
      { status: 500 }
    )
  }
}
