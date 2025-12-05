/**
 * Custom Roles API Routes
 * Story 09-14: Implement Custom Role Creation
 *
 * GET /api/workspaces/:id/roles - List all roles (built-in + custom)
 * POST /api/workspaces/:id/roles - Create a custom role
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@hyvve/db'
import { ROLE_PERMISSIONS } from '@hyvve/shared'
import {
  requireWorkspaceMembership,
  requireRole,
  handleWorkspaceAuthError,
  WorkspaceAuthError,
} from '@/middleware/workspace-auth'
import { getAllPermissionIds, isBuiltInRole } from '@/lib/permissions'
import { sanitizeInput } from '@/lib/utils/sanitize'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Precompute valid permission IDs once to avoid repeated array construction during validation
const ALL_PERMISSION_IDS = getAllPermissionIds()

/**
 * Schema for creating a custom role
 */
const CreateCustomRoleSchema = z.object({
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
    }),
  description: z
    .string()
    .max(200)
    .optional()
    .transform((val) => (val ? sanitizeInput(val) : val)),
  permissions: z
    .array(z.string())
    .min(1, 'At least one permission is required')
    .refine(
      (permissions) => permissions.every((p) => ALL_PERMISSION_IDS.includes(p)),
      {
        message: 'Invalid permission ID',
      }
    ),
})


/**
 * GET /api/workspaces/:id/roles
 *
 * List all roles (built-in + custom) for a workspace
 * Returns built-in roles with their default permissions plus any custom roles
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Verify membership (any member can view roles)
    await requireWorkspaceMembership(workspaceId)

    // Get custom roles from database
    const customRoles = await prisma.customRole.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
    })

    // Build built-in roles array
    const builtInRoles = Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => ({
      id: role,
      name: role,
      description: getBuiltInRoleDescription(role),
      permissions: permissions as string[],
      isBuiltIn: true,
      createdAt: null,
      updatedAt: null,
    }))

    // Map custom roles to response format
    const customRolesFormatted = customRoles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions as string[],
      isBuiltIn: false,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data: {
        builtInRoles,
        customRoles: customRolesFormatted,
      },
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }

    console.error('Error listing roles:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching roles.',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/workspaces/:id/roles
 *
 * Create a custom role
 * Only workspace owners can create custom roles
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Verify ownership (only owners can create custom roles)
    const membership = await requireWorkspaceMembership(workspaceId)
    requireRole(membership.role, ['owner'])

    // Parse and validate request body
    const body = await request.json()
    const validationResult = CreateCustomRoleSchema.safeParse(body)

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

    // Check if role name already exists (case-insensitive)
    const existingRole = await prisma.customRole.findFirst({
      where: {
        workspaceId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    })

    if (existingRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'ROLE_NAME_EXISTS',
          message: 'A role with this name already exists in this workspace.',
        },
        { status: 409 }
      )
    }

    // Create custom role and audit log inside a single transaction
    const customRole = await prisma.$transaction(async (tx) => {
      const role = await tx.customRole.create({
        data: {
          workspaceId,
          name,
          description: description || null,
          permissions,
        },
      })

      await tx.auditLog.create({
        data: {
          workspaceId,
          action: 'custom_role.created',
          entity: 'custom_role',
          entityId: role.id,
          userId: membership.userId,
          newValues: {
            name,
            description,
            permissions,
          },
        },
      })

      return role
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: customRole.id,
          name: customRole.name,
          description: customRole.description,
          permissions: customRole.permissions as string[],
          isBuiltIn: false,
          createdAt: customRole.createdAt.toISOString(),
          updatedAt: customRole.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }

    console.error('Error creating custom role:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while creating the role.',
      },
      { status: 500 }
    )
  }
}

/**
 * Get description for built-in roles
 */
function getBuiltInRoleDescription(role: string): string {
  const descriptions: Record<string, string> = {
    owner: 'Full access to all workspace features, including deletion',
    admin: 'Full access to workspace features except deletion',
    member: 'Can view and create content, run agents',
    viewer: 'Read-only access to workspace content',
    guest: 'Limited read-only access',
  }
  return descriptions[role] || ''
}
