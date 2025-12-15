/**
 * Workspace Invitations API Routes
 * POST /api/workspaces/:id/invitations - Create invitation
 * GET /api/workspaces/:id/invitations - List pending invitations
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import {
  requireWorkspaceMembership,
  requireCanInviteMembers,
  handleWorkspaceAuthError,
  WorkspaceAuthError,
} from '@/middleware/workspace-auth'
import { generateInvitationToken, getInvitationExpiry } from '@/lib/invitation'
import { sendWorkspaceInvitationEmail } from '@/lib/email'
import { CreateInvitationSchema } from '@hyvve/shared'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/workspaces/:id/invitations
 *
 * Create a new workspace invitation.
 * Requires owner or admin role.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Verify membership and check permissions
    const membership = await requireWorkspaceMembership(workspaceId)
    requireCanInviteMembers(membership)

    // Parse and validate request body
    const body = await request.json()
    const result = CreateInvitationSchema.safeParse(body)

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

    const { email, role } = result.data
    const normalizedEmail = email.toLowerCase()

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: {
          email: normalizedEmail,
        },
      },
      include: {
        user: {
          select: { email: true },
        },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        {
          success: false,
          error: 'ALREADY_MEMBER',
          message: 'This user is already a member of the workspace.',
        },
        { status: 409 }
      )
    }

    // Check if a pending invitation already exists
    // Note: Invitations are deleted when accepted, so we just check for existence
    const existingInvitation = await prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        email: normalizedEmail,
        expiresAt: { gt: new Date() }, // Not expired
      },
    })

    if (existingInvitation) {
      return NextResponse.json(
        {
          success: false,
          error: 'PENDING_INVITATION',
          message: 'An invitation is already pending for this email.',
        },
        { status: 409 }
      )
    }

    // Generate secure invitation token
    const token = generateInvitationToken()
    const expiresAt = getInvitationExpiry()

    // Create invitation record
    const invitation = await prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        email: normalizedEmail,
        role,
        token,
        invitedById: membership.userId,
        expiresAt,
      },
    })

    // Get inviter's name for the email
    const inviter = await prisma.user.findUnique({
      where: { id: membership.userId },
      select: { name: true, email: true },
    })
    const inviterName = inviter?.name || inviter?.email || 'A team member'

    // Send invitation email (blocking - we want to know if it fails)
    try {
      await sendWorkspaceInvitationEmail(
        normalizedEmail,
        inviterName,
        membership.workspaceName,
        token,
        role
      )
    } catch (emailError) {
      // Rollback invitation if email fails
      await prisma.workspaceInvitation.delete({
        where: { id: invitation.id },
      })

      console.error('Failed to send invitation email:', emailError)
      return NextResponse.json(
        {
          success: false,
          error: 'EMAIL_FAILED',
          message: 'Failed to send invitation email. Please try again.',
        },
        { status: 500 }
      )
    }

    // Emit event
    console.log('workspace.member.invited', {
      workspaceId,
      invitationId: invitation.id,
      email: normalizedEmail,
      role,
      invitedBy: membership.userId,
      createdAt: invitation.createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt.toISOString(),
          createdAt: invitation.createdAt.toISOString(),
          workspaceId: invitation.workspaceId,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }

    console.error('Error creating invitation:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while creating the invitation.',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/workspaces/:id/invitations
 *
 * List all pending invitations for a workspace.
 * Requires owner or admin role.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Verify membership and check permissions
    const membership = await requireWorkspaceMembership(workspaceId)
    requireCanInviteMembers(membership)

    // Get pending invitations (not expired - invitations are deleted when accepted)
    const invitations = await prisma.workspaceInvitation.findMany({
      where: {
        workspaceId,
        expiresAt: { gt: new Date() }, // Not expired
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        expiresAt: inv.expiresAt.toISOString(),
        createdAt: inv.createdAt.toISOString(),
        invitedBy: {
          id: inv.invitedBy.id,
          name: inv.invitedBy.name,
          email: inv.invitedBy.email,
        },
      })),
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }

    console.error('Error listing invitations:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching invitations.',
      },
      { status: 500 }
    )
  }
}
