/**
 * Workspace Members API Routes
 * GET /api/workspaces/:id/members - List workspace members
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import {
  requireWorkspaceMembership,
  handleWorkspaceAuthError,
  WorkspaceAuthError,
} from '@/middleware/workspace-auth'
import { ROLE_HIERARCHY } from '@hyvve/shared'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/workspaces/:id/members
 *
 * List all members of a workspace.
 * Any member can view the list.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Verify membership (any role can view)
    await requireWorkspaceMembership(workspaceId)

    // Get all members with user details and last activity from sessions
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            sessions: {
              select: {
                updatedAt: true,
              },
              orderBy: {
                updatedAt: 'desc',
              },
              take: 1,
            },
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Sort by role hierarchy (highest first), then by name
    const sortedMembers = members.sort((a, b) => {
      const roleA = ROLE_HIERARCHY[a.role as keyof typeof ROLE_HIERARCHY] ?? 0
      const roleB = ROLE_HIERARCHY[b.role as keyof typeof ROLE_HIERARCHY] ?? 0

      // Higher hierarchy first
      if (roleA !== roleB) {
        return roleB - roleA
      }

      // Then by name alphabetically
      const nameA = a.user.name || a.user.email
      const nameB = b.user.name || b.user.email
      return nameA.localeCompare(nameB)
    })

    return NextResponse.json({
      success: true,
      data: sortedMembers.map((member) => ({
        id: member.id,
        userId: member.user.id,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image,
        role: member.role,
        invitedAt: member.invitedAt.toISOString(),
        acceptedAt: member.acceptedAt?.toISOString() ?? null,
        lastActiveAt: member.user.sessions[0]?.updatedAt?.toISOString() ?? null,
        invitedBy: member.invitedBy
          ? {
              id: member.invitedBy.id,
              name: member.invitedBy.name,
            }
          : null,
      })),
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }

    console.error('Error listing members:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching members.',
      },
      { status: 500 }
    )
  }
}
