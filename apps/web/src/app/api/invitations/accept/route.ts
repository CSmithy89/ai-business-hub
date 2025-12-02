/**
 * Invitation Acceptance API Route
 * POST /api/invitations/accept - Accept a workspace invitation
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { getSession, updateSessionWorkspace } from '@/lib/auth-server'
import { isInvitationExpired } from '@/lib/invitation'
import { z } from 'zod'

/**
 * Request body schema
 */
const AcceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

/**
 * POST /api/invitations/accept
 *
 * Accept a workspace invitation and create membership.
 * Requires authentication and email match.
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'You must be signed in to accept an invitation',
        },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const userEmail = session.user.email.toLowerCase()

    // Parse and validate request body
    const body = await request.json()
    const result = AcceptInvitationSchema.safeParse(body)

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

    const { token } = result.data

    // Find invitation by token
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
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

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVITATION_NOT_FOUND',
          message: 'Invalid invitation link',
        },
        { status: 404 }
      )
    }

    // Check if workspace is deleted
    if (invitation.workspace.deletedAt) {
      return NextResponse.json(
        {
          success: false,
          error: 'WORKSPACE_DELETED',
          message: 'This workspace has been deleted',
        },
        { status: 410 }
      )
    }

    // Check if invitation is expired
    if (isInvitationExpired(invitation.expiresAt)) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVITATION_EXPIRED',
          message: 'This invitation has expired. Please request a new invitation.',
        },
        { status: 410 }
      )
    }

    // Check email match
    if (invitation.email.toLowerCase() !== userEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'EMAIL_MISMATCH',
          message: 'This invitation was sent to a different email address. Please sign in with the correct account.',
          invitedEmail: invitation.email,
        },
        { status: 403 }
      )
    }

    // Check if already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: invitation.workspaceId,
        },
      },
    })

    if (existingMember) {
      // Already a member - delete the invitation and redirect gracefully
      await prisma.workspaceInvitation.delete({
        where: { id: invitation.id },
      })

      return NextResponse.json(
        {
          success: true,
          data: {
            workspace: {
              id: invitation.workspace.id,
              name: invitation.workspace.name,
              slug: invitation.workspace.slug,
            },
            role: existingMember.role,
            alreadyMember: true,
          },
        },
        { status: 200 }
      )
    }

    // Accept invitation in transaction
    const membership = await prisma.$transaction(async (tx) => {
      // Create membership
      const member = await tx.workspaceMember.create({
        data: {
          userId,
          workspaceId: invitation.workspaceId,
          role: invitation.role,
          invitedById: invitation.invitedById,
          invitedAt: invitation.createdAt,
          acceptedAt: new Date(),
        },
      })

      // Delete invitation
      await tx.workspaceInvitation.delete({
        where: { id: invitation.id },
      })

      return member
    })

    // Update session with new workspace (non-blocking)
    if (session.session?.id) {
      updateSessionWorkspace(session.session.id, invitation.workspaceId).catch((err) => {
        console.error('Failed to update session workspace:', err)
      })
    }

    // Emit event
    console.log('workspace.member.joined', {
      workspaceId: invitation.workspaceId,
      workspaceName: invitation.workspace.name,
      userId,
      role: membership.role,
      invitedBy: invitation.invitedById,
      acceptedAt: membership.acceptedAt?.toISOString(),
    })

    return NextResponse.json({
      success: true,
      data: {
        workspace: {
          id: invitation.workspace.id,
          name: invitation.workspace.name,
          slug: invitation.workspace.slug,
        },
        role: membership.role,
      },
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while accepting the invitation.',
      },
      { status: 500 }
    )
  }
}
