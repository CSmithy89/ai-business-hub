/**
 * Resend Invitation API Route
 * POST /api/workspaces/:id/invitations/:invitationId/resend - Resend invitation email
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import {
  requireWorkspaceMembership,
  requireCanInviteMembers,
  handleWorkspaceAuthError,
  WorkspaceAuthError,
} from '@/middleware/workspace-auth'
import { sendWorkspaceInvitationEmail } from '@/lib/email'

interface RouteParams {
  params: Promise<{ id: string; invitationId: string }>
}

/**
 * POST /api/workspaces/:id/invitations/:invitationId/resend
 *
 * Resend an existing invitation email.
 * Requires owner or admin role.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
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

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVITATION_EXPIRED',
          message: 'This invitation has expired. Please create a new invitation.',
        },
        { status: 410 }
      )
    }

    // Get inviter's name for the email
    const inviter = await prisma.user.findUnique({
      where: { id: membership.userId },
      select: { name: true, email: true },
    })
    const inviterName = inviter?.name || inviter?.email || 'A team member'

    // Resend invitation email
    try {
      await sendWorkspaceInvitationEmail(
        invitation.email,
        inviterName,
        membership.workspaceName,
        invitation.token,
        invitation.role
      )
    } catch (emailError) {
      console.error('Failed to resend invitation email:', emailError)
      return NextResponse.json(
        {
          success: false,
          error: 'EMAIL_FAILED',
          message: 'Failed to resend invitation email. Please try again.',
        },
        { status: 500 }
      )
    }

    // Emit event
    console.log('workspace.invitation.resent', {
      workspaceId,
      invitationId,
      email: invitation.email,
      resentBy: membership.userId,
      resentAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully',
      data: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt.toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }

    console.error('Error resending invitation:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while resending the invitation.',
      },
      { status: 500 }
    )
  }
}
