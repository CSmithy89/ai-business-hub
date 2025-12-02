/**
 * Single Member API Routes
 * PATCH /api/workspaces/:id/members/:userId - Update member role
 * DELETE /api/workspaces/:id/members/:userId - Remove member
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import {
  requireWorkspaceMembership,
  requireCanUpdateWorkspace,
  handleWorkspaceAuthError,
  WorkspaceAuthError,
} from '@/middleware/workspace-auth'
import { z } from 'zod'
import { INVITABLE_ROLES } from '@hyvve/shared'

interface RouteParams {
  params: Promise<{ id: string; userId: string }>
}

/**
 * Schema for updating member role
 */
const UpdateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer', 'guest'], {
    message: 'Invalid role. Must be admin, member, viewer, or guest.',
  }),
})

/**
 * PATCH /api/workspaces/:id/members/:userId
 *
 * Update a member's role.
 * Requires owner or admin role.
 * Cannot change owner's role.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId, userId: targetUserId } = await params

    // Verify membership and check permissions
    const membership = await requireWorkspaceMembership(workspaceId)
    requireCanUpdateWorkspace(membership)

    // Validate UUID format for target user
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(targetUserId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_ID',
          message: 'Invalid user ID format',
        },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const result = UpdateMemberRoleSchema.safeParse(body)

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

    const { role: newRole } = result.data

    // Find target member
    const targetMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: targetUserId,
          workspaceId,
        },
      },
    })

    if (!targetMember) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: 'Member not found',
        },
        { status: 404 }
      )
    }

    // Cannot change owner's role
    if (targetMember.role === 'owner') {
      return NextResponse.json(
        {
          success: false,
          error: 'CANNOT_DEMOTE_OWNER',
          message: "Cannot change the owner's role",
        },
        { status: 403 }
      )
    }

    // Admin cannot promote to owner (only owner can transfer ownership)
    // Admin can only set roles they are allowed to invite
    if (membership.role === 'admin' && !INVITABLE_ROLES.includes(newRole as typeof INVITABLE_ROLES[number])) {
      return NextResponse.json(
        {
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admin cannot assign this role',
        },
        { status: 403 }
      )
    }

    // Update member role
    const updatedMember = await prisma.workspaceMember.update({
      where: { id: targetMember.id },
      data: { role: newRole },
    })

    // Emit event
    console.log('workspace.member.role_changed', {
      workspaceId,
      targetUserId,
      previousRole: targetMember.role,
      newRole,
      changedBy: membership.userId,
      changedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      data: {
        userId: updatedMember.userId,
        role: updatedMember.role,
      },
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }

    console.error('Error updating member role:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while updating member role.',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/workspaces/:id/members/:userId
 *
 * Remove a member from the workspace.
 * Requires owner or admin role.
 * Cannot remove the owner.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId, userId: targetUserId } = await params

    // Verify membership and check permissions
    const membership = await requireWorkspaceMembership(workspaceId)
    requireCanUpdateWorkspace(membership)

    // Validate UUID format for target user
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(targetUserId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_ID',
          message: 'Invalid user ID format',
        },
        { status: 400 }
      )
    }

    // Find target member
    const targetMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: targetUserId,
          workspaceId,
        },
      },
      include: {
        user: {
          select: { email: true },
        },
      },
    })

    if (!targetMember) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: 'Member not found',
        },
        { status: 404 }
      )
    }

    // Cannot remove owner
    if (targetMember.role === 'owner') {
      return NextResponse.json(
        {
          success: false,
          error: 'CANNOT_REMOVE_OWNER',
          message: 'Cannot remove the workspace owner',
        },
        { status: 403 }
      )
    }

    // Admin cannot remove other admins (only owner can)
    if (membership.role === 'admin' && targetMember.role === 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admin cannot remove other admins',
        },
        { status: 403 }
      )
    }

    // Delete member
    await prisma.workspaceMember.delete({
      where: { id: targetMember.id },
    })

    // Emit event
    console.log('workspace.member.removed', {
      workspaceId,
      targetUserId,
      targetEmail: targetMember.user.email,
      removedBy: membership.userId,
      removedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }

    console.error('Error removing member:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while removing the member.',
      },
      { status: 500 }
    )
  }
}
