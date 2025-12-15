/**
 * Single Workspace API Routes
 * GET /api/workspaces/:id - Get workspace details
 * PATCH /api/workspaces/:id - Update workspace
 * DELETE /api/workspaces/:id - Soft delete workspace
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import {
  requireWorkspaceMembership,
  requireCanUpdateWorkspace,
  requireCanDeleteWorkspace,
  handleWorkspaceAuthError,
  WorkspaceAuthError,
} from '@/middleware/workspace-auth'
import { generateUniqueSlug } from '@/lib/workspace'
import { sendWorkspaceDeletionEmail } from '@/lib/email'
import { UpdateWorkspaceSchema } from '@hyvve/shared'
import type { WorkspaceWithRole } from '@hyvve/shared'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/workspaces/:id
 *
 * Get workspace details including member count and user's role.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Verify membership and get role
    const membership = await requireWorkspaceMembership(workspaceId)

    // Get workspace with member count
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        _count: {
          select: {
            members: {
              where: {
                acceptedAt: { not: null }, // Only count accepted members
              },
            },
          },
        },
      },
    })

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: 'Workspace not found',
        },
        { status: 404 }
      )
    }

    const response: WorkspaceWithRole = {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      image: workspace.image,
      timezone: workspace.timezone,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      deletedAt: workspace.deletedAt,
      role: membership.role,
      memberCount: workspace._count.members,
    }

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }

    console.error('Error getting workspace:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching the workspace.',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/workspaces/:id
 *
 * Update workspace settings.
 * Requires owner or admin role.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Verify membership and check permissions
    const membership = await requireWorkspaceMembership(workspaceId)
    requireCanUpdateWorkspace(membership)

    // Parse and validate request body
    const body = await request.json()
    const result = UpdateWorkspaceSchema.safeParse(body)

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

    const updateData = result.data
    const updatedFields: string[] = []

    // Build update payload
    const prismaUpdate: { name?: string; slug?: string; image?: string | null; timezone?: string } = {}

    if (updateData.name !== undefined) {
      prismaUpdate.name = updateData.name
      updatedFields.push('name')

      // Regenerate slug if name changed
      prismaUpdate.slug = await generateUniqueSlug(updateData.name, async (slugToCheck) => {
        const existing = await prisma.workspace.findFirst({
          where: {
            slug: slugToCheck,
            id: { not: workspaceId }, // Exclude current workspace
          },
          select: { id: true },
        })
        return existing !== null
      })
      updatedFields.push('slug')
    }

    if (updateData.image !== undefined) {
      prismaUpdate.image = updateData.image
      updatedFields.push('image')
    }

    if (updateData.timezone !== undefined) {
      prismaUpdate.timezone = updateData.timezone
      updatedFields.push('timezone')
    }

    // Check if there's anything to update
    if (Object.keys(prismaUpdate).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'NO_CHANGES',
          message: 'No valid fields provided for update',
        },
        { status: 400 }
      )
    }

    // Update workspace
    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: prismaUpdate,
    })

    // Emit event
    console.log('workspace.updated', {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      updatedFields,
      updatedBy: membership.userId,
      updatedAt: workspace.updatedAt.toISOString(),
    })

    return NextResponse.json({
      success: true,
      data: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        image: workspace.image,
        timezone: workspace.timezone,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
        deletedAt: workspace.deletedAt,
      },
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }

    // Handle slug generation failure
    if (error instanceof Error && error.message.includes('unique slug')) {
      return NextResponse.json(
        {
          success: false,
          error: 'SLUG_COLLISION',
          message: 'Failed to generate unique workspace URL. Please try a different name.',
        },
        { status: 409 }
      )
    }

    console.error('Error updating workspace:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while updating the workspace.',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/workspaces/:id
 *
 * Soft delete workspace (owner only).
 * Sets deletedAt timestamp and blocks access.
 * Hard delete scheduled for 30 days (Epic 05).
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Verify membership and check permissions (owner only)
    const membership = await requireWorkspaceMembership(workspaceId)
    requireCanDeleteWorkspace(membership)

    // Get current workspace state
    const existingWorkspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        deletedAt: true,
      },
    })

    if (!existingWorkspace) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: 'Workspace not found',
        },
        { status: 404 }
      )
    }

    // Check if already deleted
    if (existingWorkspace.deletedAt) {
      return NextResponse.json(
        {
          success: false,
          error: 'ALREADY_DELETED',
          message: 'Workspace is already scheduled for deletion',
        },
        { status: 409 }
      )
    }

    // Soft delete: set deletedAt timestamp
    const deletedAt = new Date()
    const hardDeleteAt = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { deletedAt },
    })

    // Get owner's email for deletion notification
    const owner = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        role: 'owner',
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    })

    // Send deletion confirmation email (non-blocking)
    if (owner?.user?.email) {
      sendWorkspaceDeletionEmail(owner.user.email, workspace.name, deletedAt).catch((err) => {
        console.error('Failed to send workspace deletion email:', err)
      })
    }

    // Emit event
    console.log('workspace.deleted', {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      deletedBy: membership.userId,
      deletedAt: deletedAt.toISOString(),
      hardDeleteScheduledAt: hardDeleteAt.toISOString(),
    })

    // TODO: Schedule hard delete job via BullMQ in Epic 05

    return NextResponse.json({
      success: true,
      message: 'Workspace scheduled for deletion in 30 days',
      deletedAt: deletedAt.toISOString(),
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }

    console.error('Error deleting workspace:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while deleting the workspace.',
      },
      { status: 500 }
    )
  }
}
