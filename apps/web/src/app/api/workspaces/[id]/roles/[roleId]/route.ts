/**
 * Custom Role Individual API Routes
 * Story 09-14: Implement Custom Role Creation
 *
 * PATCH /api/workspaces/:id/roles/:roleId - Update a custom role
 * DELETE /api/workspaces/:id/roles/:roleId - Delete a custom role
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@hyvve/db'
import {
  requireWorkspaceMembership,
  requireRole,
  handleWorkspaceAuthError,
  WorkspaceAuthError,
} from '@/middleware/workspace-auth'
import { getAllPermissionIds, isBuiltInRole } from '@/lib/permissions'
import { sanitizeInput } from '@/lib/utils/sanitize'

interface RouteParams {
  params: Promise<{ id: string; roleId: string }>
}

/**
 * Schema for updating a custom role
 */
const UpdateCustomRoleSchema = z.object({
  name: z
    .string()
    .min(3, 'Role name must be at least 3 characters')
    .max(50, 'Role name must be under 50 characters')
    .trim()
    .transform(sanitizeInput)
    .refine((name) => name.length >= 3, {
      message: 'Role name must be at least 3 characters after sanitization',
    })
    .refine((name) => !isBuiltInRole(name), {
      message: 'Cannot use built-in role names (owner, admin, member, viewer, guest)',
    })
    .optional(),
  description: z
    .string()
    .max(200)
    .nullable()
    .optional()
    .transform((val) => (val ? sanitizeInput(val) : val)),
  permissions: z
    .array(z.string())
    .min(1, 'At least one permission is required')
    .refine(
      (permissions) => permissions.every((p) => getAllPermissionIds().includes(p)),
      {
        message: 'Invalid permission ID',
      }
    )
    .optional(),
})


/**
 * PATCH /api/workspaces/:id/roles/:roleId
 *
 * Update a custom role
 * Only workspace owners can update custom roles
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId, roleId } = await params

    // Verify ownership (only owners can update custom roles)
    const membership = await requireWorkspaceMembership(workspaceId)
    requireRole(membership.role, ['owner'])

    // Verify the role exists and belongs to this workspace
    const existingRole = await prisma.customRole.findUnique({
      where: { id: roleId },
    })

    if (!existingRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'ROLE_NOT_FOUND',
          message: 'Custom role not found.',
        },
        { status: 404 }
      )
    }

    if (existingRole.workspaceId !== workspaceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'This role does not belong to your workspace.',
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = UpdateCustomRoleSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid role data',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { name, description, permissions } = validationResult.data

    // If name is being changed, check for duplicates
    if (name && name !== existingRole.name) {
      const duplicateRole = await prisma.customRole.findFirst({
        where: {
          workspaceId,
          name: {
            equals: name,
            mode: 'insensitive',
          },
          id: {
            not: roleId,
          },
        },
      })

      if (duplicateRole) {
        return NextResponse.json(
          {
            success: false,
            error: 'ROLE_NAME_EXISTS',
            message: 'A role with this name already exists in this workspace.',
          },
          { status: 409 }
        )
      }
    }

    // Build update data
    const updateData: {
      name?: string
      description?: string | null
      permissions?: string[]
    } = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (permissions !== undefined) updateData.permissions = permissions

    // Update custom role
    const updatedRole = await prisma.customRole.update({
      where: { id: roleId },
      data: updateData,
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        workspaceId,
        action: 'custom_role.updated',
        entity: 'custom_role',
        entityId: roleId,
        userId: membership.userId,
        oldValues: {
          name: existingRole.name,
          description: existingRole.description,
          permissions: existingRole.permissions,
        },
        newValues: {
          name: updatedRole.name,
          description: updatedRole.description,
          permissions: updatedRole.permissions,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description,
        permissions: updatedRole.permissions as string[],
        isBuiltIn: false,
        createdAt: updatedRole.createdAt.toISOString(),
        updatedAt: updatedRole.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }

    console.error('Error updating custom role:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while updating the role.',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/workspaces/:id/roles/:roleId
 *
 * Delete a custom role
 * Only workspace owners can delete custom roles
 * Cannot delete if members are assigned to this role
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId, roleId } = await params

    // Verify ownership (only owners can delete custom roles)
    const membership = await requireWorkspaceMembership(workspaceId)
    requireRole(membership.role, ['owner'])

    // Verify the role exists and belongs to this workspace
    const existingRole = await prisma.customRole.findUnique({
      where: { id: roleId },
    })

    if (!existingRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'ROLE_NOT_FOUND',
          message: 'Custom role not found.',
        },
        { status: 404 }
      )
    }

    if (existingRole.workspaceId !== workspaceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'This role does not belong to your workspace.',
        },
        { status: 403 }
      )
    }

    // Check if any members are assigned to this role and delete in a single transaction
    const membersWithRole = await prisma.$transaction(async (tx) => {
      const count = await tx.workspaceMember.count({
        where: {
          workspaceId,
          role: existingRole.name,
        },
      })
      if (count > 0) {
        // Return the count without performing the delete
        return count
      }
      // No members found, perform delete within the same transaction
      await tx.customRole.delete({
        where: { id: roleId },
      })
      return 0
    })

    if (membersWithRole > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'ROLE_IN_USE',
          message: `Cannot delete role. ${membersWithRole} member(s) are assigned to this role. Please reassign them first.`,
          memberCount: membersWithRole,
        },
        { status: 409 }
      )
    }

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        workspaceId,
        action: 'custom_role.deleted',
        entity: 'custom_role',
        entityId: roleId,
        userId: membership.userId,
        oldValues: {
          name: existingRole.name,
          description: existingRole.description,
          permissions: existingRole.permissions,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Custom role deleted successfully.',
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }

    console.error('Error deleting custom role:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while deleting the role.',
      },
      { status: 500 }
    )
  }
}
