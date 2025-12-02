/**
 * Workspace Switch API Route
 * POST /api/workspaces/switch - Switch active workspace
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { getSession, updateSessionWorkspace } from '@/lib/auth-server'
import { z } from 'zod'

/**
 * Request body schema
 */
const SwitchWorkspaceSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID format'),
})

/**
 * POST /api/workspaces/switch
 *
 * Switch the user's active workspace.
 * Updates session with new workspace ID.
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'You must be signed in to switch workspaces',
        },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const sessionId = session.session.id

    // Parse and validate request body
    const body = await request.json()
    const result = SwitchWorkspaceSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_INPUT',
          message: result.error.issues[0].message,
        },
        { status: 400 }
      )
    }

    const { workspaceId } = result.data

    // Verify user has membership in target workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            deletedAt: true,
          },
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_MEMBER',
          message: 'You are not a member of this workspace',
        },
        { status: 403 }
      )
    }

    // Check if workspace is deleted
    if (membership.workspace.deletedAt) {
      return NextResponse.json(
        {
          success: false,
          error: 'WORKSPACE_DELETED',
          message: 'This workspace has been deleted',
        },
        { status: 410 }
      )
    }

    // Update session with new workspace
    await updateSessionWorkspace(sessionId, workspaceId)

    // Emit event
    console.log('workspace.switched', {
      userId,
      workspaceId,
      workspaceName: membership.workspace.name,
      previousWorkspaceId: session.session.activeWorkspaceId,
      switchedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      data: {
        workspace: {
          id: membership.workspace.id,
          name: membership.workspace.name,
          slug: membership.workspace.slug,
        },
      },
    })
  } catch (error) {
    console.error('Error switching workspace:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while switching workspaces.',
      },
      { status: 500 }
    )
  }
}
