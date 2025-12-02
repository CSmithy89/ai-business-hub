/**
 * Workspace authorization middleware
 * Handles membership verification and role-based access control
 */

import { prisma } from '@hyvve/db'
import { getSession } from '@/lib/auth-server'
import type { WorkspaceRole } from '@hyvve/shared'

/**
 * Workspace membership check result
 */
export interface WorkspaceMembershipResult {
  userId: string
  workspaceId: string
  role: WorkspaceRole
  workspaceName: string
  workspaceSlug: string
}

/**
 * Error class for workspace authorization failures
 */
export class WorkspaceAuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message)
    this.name = 'WorkspaceAuthError'
  }
}

/**
 * Check if user has membership in a workspace
 * Validates authentication, membership, and workspace status
 *
 * @param workspaceId - The workspace ID to check membership for
 * @returns Membership result with user ID, role, and workspace info
 * @throws WorkspaceAuthError if not authorized
 */
export async function requireWorkspaceMembership(
  workspaceId: string
): Promise<WorkspaceMembershipResult> {
  // Get authenticated session
  const session = await getSession()

  if (!session?.user?.id) {
    throw new WorkspaceAuthError('Unauthorized', 401, 'UNAUTHORIZED')
  }

  const userId = session.user.id

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(workspaceId)) {
    throw new WorkspaceAuthError('Invalid workspace ID format', 400, 'INVALID_ID')
  }

  // Query membership with workspace data
  const member = await prisma.workspaceMember.findUnique({
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

  // Check if user is a member
  if (!member) {
    throw new WorkspaceAuthError(
      'Workspace not found or you are not a member',
      404,
      'NOT_FOUND'
    )
  }

  // Check if workspace is soft-deleted
  if (member.workspace.deletedAt) {
    throw new WorkspaceAuthError(
      'Workspace scheduled for deletion',
      410,
      'WORKSPACE_DELETED'
    )
  }

  return {
    userId,
    workspaceId: member.workspace.id,
    role: member.role as WorkspaceRole,
    workspaceName: member.workspace.name,
    workspaceSlug: member.workspace.slug,
  }
}

/**
 * Roles allowed for workspace updates (name, image, timezone)
 */
export const UPDATE_ALLOWED_ROLES: WorkspaceRole[] = ['owner', 'admin']

/**
 * Roles allowed for workspace deletion (owner only)
 */
export const DELETE_ALLOWED_ROLES: WorkspaceRole[] = ['owner']

/**
 * Roles allowed for inviting members (owner and admin)
 */
export const INVITE_ALLOWED_ROLES: WorkspaceRole[] = ['owner', 'admin']

/**
 * Check if user has one of the required roles
 *
 * @param userRole - The user's current role
 * @param allowedRoles - Array of allowed roles
 * @throws WorkspaceAuthError if role not in allowed list
 */
export function requireRole(
  userRole: WorkspaceRole,
  allowedRoles: WorkspaceRole[]
): void {
  if (!allowedRoles.includes(userRole)) {
    const roleList = allowedRoles.join(' or ')
    throw new WorkspaceAuthError(
      `Insufficient permissions. ${roleList.charAt(0).toUpperCase() + roleList.slice(1)} role required.`,
      403,
      'INSUFFICIENT_PERMISSIONS'
    )
  }
}

/**
 * Helper to check if user can update workspace
 *
 * @param membership - Membership result from requireWorkspaceMembership
 * @throws WorkspaceAuthError if not owner or admin
 */
export function requireCanUpdateWorkspace(
  membership: WorkspaceMembershipResult
): void {
  requireRole(membership.role, UPDATE_ALLOWED_ROLES)
}

/**
 * Helper to check if user can delete workspace
 *
 * @param membership - Membership result from requireWorkspaceMembership
 * @throws WorkspaceAuthError if not owner
 */
export function requireCanDeleteWorkspace(
  membership: WorkspaceMembershipResult
): void {
  requireRole(membership.role, DELETE_ALLOWED_ROLES)
}

/**
 * Helper to check if user can invite members
 *
 * @param membership - Membership result from requireWorkspaceMembership
 * @throws WorkspaceAuthError if not owner or admin
 */
export function requireCanInviteMembers(
  membership: WorkspaceMembershipResult
): void {
  requireRole(membership.role, INVITE_ALLOWED_ROLES)
}

/**
 * Handle WorkspaceAuthError in API routes
 * Returns a NextResponse-compatible object
 *
 * @param error - The error to handle
 * @returns Object with error details and status code
 */
export function handleWorkspaceAuthError(error: unknown): {
  body: { success: false; error: string; message: string }
  status: number
} {
  if (error instanceof WorkspaceAuthError) {
    return {
      body: {
        success: false,
        error: error.code,
        message: error.message,
      },
      status: error.status,
    }
  }

  // Unknown error
  console.error('Unexpected error in workspace auth:', error)
  return {
    body: {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    status: 500,
  }
}
