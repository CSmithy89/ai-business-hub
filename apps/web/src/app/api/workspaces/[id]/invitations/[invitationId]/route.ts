/**
 * Single Invitation API Route
 * DELETE /api/workspaces/:id/invitations/:invitationId - Cancel invitation
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import {
  requireWorkspaceMembership,
  requireCanInviteMembers,
  handleWorkspaceAuthError,
  WorkspaceAuthError,
} from '@/middleware/workspace-auth'

interface RouteParams {
  params: Promise<{ id: string; invitationId: string }>
}

/**
 * DELETE /api/workspaces/:id/invitations/:invitationId
 *
 * Cancel a pending invitation.
 * Requires owner or admin role.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId, invitationId } = await params

    // Verify membership and check permissions
    const membership = await requireWorkspaceMembership(workspaceId)
    requireCanInviteMembers(membership)

    // Validate UUID format for invitation ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(invitationId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_ID',
          message: 'Invalid invitation ID format',
        },
        { status: 400 }
      )
    }

    // Find the invitation
    const invitation = await prisma.workspaceInvitation.findFirst({
      where: {
        id: invitationId,
        workspaceId, // Ensure invitation belongs to this workspace
      },
    })

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: 'Invitation not found',
        },
        { status: 404 }
      )
    }

    // Note: No acceptedAt check needed - invitations are deleted when accepted

    // Delete the invitation
    await prisma.workspaceInvitation.delete({
      where: { id: invitationId },
    })

    // Emit event
    console.log('workspace.invitation.cancelled', {
      workspaceId,
      invitationId,
      email: invitation.email,
      cancelledBy: membership.userId,
      cancelledAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully',
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }

    console.error('Error cancelling invitation:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while cancelling the invitation.',
      },
      { status: 500 }
    )
  }
}
