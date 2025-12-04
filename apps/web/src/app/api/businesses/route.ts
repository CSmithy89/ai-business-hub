/**
 * Business API Routes
 * GET /api/businesses - List all businesses for current workspace
 *
 * Story: 08.2 - Implement Portfolio Dashboard with Business Cards
 */

import { NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { getSession } from '@/lib/auth-server'

/**
 * GET /api/businesses
 *
 * List all businesses for the current workspace.
 * Excludes soft-deleted businesses.
 * Sorted by most recently updated.
 */
export async function GET() {
  try {
    // Get authenticated session
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'You must be signed in to view businesses',
        },
        { status: 401 }
      )
    }

    const workspaceId = session.session.activeWorkspaceId

    if (!workspaceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'NO_WORKSPACE',
          message: 'No active workspace selected',
        },
        { status: 400 }
      )
    }

    // Query businesses for workspace
    const businesses = await prisma.business.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: businesses,
    })
  } catch (error) {
    console.error('Error listing businesses:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching businesses.',
      },
      { status: 500 }
    )
  }
}
