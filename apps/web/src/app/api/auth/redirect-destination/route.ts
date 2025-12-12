/**
 * Redirect Destination API Route
 * GET /api/auth/redirect-destination
 *
 * Determines the appropriate destination after sign-in based on user state:
 * - If onboarding incomplete → /onboarding/account-setup
 * - If no workspaces → /onboarding/account-setup (need to create workspace)
 * - If workspaces but no businesses → /businesses (empty state with CTA)
 * - If businesses exist → /businesses (portfolio view)
 *
 * Story: 15.15 - Update Sign-In Flow Redirect Logic
 */

import { NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { getSession } from '@/lib/auth-server'

/**
 * Determines the redirect destination based on user state
 */
export async function GET() {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'You must be signed in',
        },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Check if user has any workspace memberships
    const workspaces = await prisma.workspaceMember.findMany({
      where: {
        userId,
        workspace: {
          deletedAt: null,
        },
      },
      include: {
        workspace: true,
      },
      take: 1, // We just need to know if any exist
    })

    // If no workspaces, user needs to complete onboarding
    if (workspaces.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          destination: '/onboarding/account-setup',
          reason: 'no_workspace',
          message: 'Please complete your account setup',
        },
      })
    }

    // User has at least one workspace
    // Check if they have an active workspace in their session
    const activeWorkspaceId = session.session.activeWorkspaceId

    // If no active workspace, set the first one as active and redirect to businesses
    if (!activeWorkspaceId) {
      const firstWorkspace = workspaces[0].workspace

      // Update session with active workspace using optimistic locking
      // The WHERE clause ensures we only update if activeWorkspaceId is still null,
      // preventing race conditions where concurrent requests both try to set it
      const updatedSession = await prisma.session.updateMany({
        where: {
          id: session.session.id,
          activeWorkspaceId: null, // Optimistic lock - only update if still null
        },
        data: { activeWorkspaceId: firstWorkspace.id },
      })

      // If no rows updated, another request already set the workspace
      // Fetch the current state to return the correct workspace
      if (updatedSession.count === 0) {
        const currentSession = await prisma.session.findUnique({
          where: { id: session.session.id },
          select: { activeWorkspaceId: true },
        })

        return NextResponse.json({
          success: true,
          data: {
            destination: '/businesses',
            reason: 'workspace_already_set',
            workspaceId: currentSession?.activeWorkspaceId ?? firstWorkspace.id,
            message: 'Active workspace already set by concurrent request',
          },
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          destination: '/businesses',
          reason: 'workspace_set',
          workspaceId: firstWorkspace.id,
          workspaceName: firstWorkspace.name,
          message: 'Active workspace set',
        },
      })
    }

    // User has workspace with active context - redirect to businesses
    // The businesses page will show empty state if no businesses exist
    return NextResponse.json({
      success: true,
      data: {
        destination: '/businesses',
        reason: 'has_workspace',
        workspaceId: activeWorkspaceId,
        message: 'Redirecting to your businesses',
      },
    })
  } catch (error) {
    console.error('Error determining redirect destination:', error)

    // Default fallback to businesses page
    return NextResponse.json({
      success: true,
      data: {
        destination: '/businesses',
        reason: 'fallback',
        message: 'Default redirect',
      },
    })
  }
}
