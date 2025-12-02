/**
 * Tenant context middleware for Next.js API routes
 * Validates workspace membership and extracts workspace context
 *
 * @module with-tenant
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import type { Workspace } from '@hyvve/db'
import type { WorkspaceRole } from '@hyvve/shared'
import type { AuthContext } from './with-auth'

/**
 * Tenant context passed to route handlers
 * Extends AuthContext with workspace information
 */
export interface TenantContext extends AuthContext {
  /** Workspace object from database */
  workspace: Workspace
  /** User's role in the workspace */
  memberRole: WorkspaceRole
  /** Module-specific permission overrides */
  modulePermissions: any
}

/**
 * Route handler that receives tenant context
 *
 * @template T - Response type
 * @param req - Next.js request object
 * @param context - Tenant context with user and workspace
 * @param args - Additional arguments (e.g., params for dynamic routes)
 * @returns Response or Promise of response
 */
export type TenantHandler<T = any> = (
  req: NextRequest,
  context: TenantContext,
  ...args: any[]
) => Promise<T> | T

/**
 * Extract workspace ID from request
 * Checks URL pathname and query string
 *
 * Supported patterns:
 * - URL pathname: /api/workspaces/[workspaceId]/...
 * - Query parameter: ?workspaceId=...
 *
 * @param req - Next.js request object
 * @returns Workspace ID or null if not found
 *
 * @internal
 */
export function extractWorkspaceId(req: NextRequest): string | null {
  // Check URL pathname for workspace ID
  // Example: /api/workspaces/[workspaceId]/...
  const pathMatch = req.nextUrl.pathname.match(/\/workspaces\/([^\/]+)/)
  if (pathMatch) return pathMatch[1]

  // Check query params
  const queryWorkspaceId = req.nextUrl.searchParams.get('workspaceId')
  if (queryWorkspaceId) return queryWorkspaceId

  return null
}

/**
 * Tenant context middleware for Next.js API routes
 * Validates workspace membership and extracts workspace context
 *
 * Requirements:
 * - Must be used with withAuth (requires authenticated user)
 * - Validates user is a workspace member
 * - Loads workspace and member role
 * - Returns 400 if workspace ID not found
 * - Returns 403 if user is not a member
 *
 * @param handler - Route handler that requires tenant context
 * @returns Wrapped handler with tenant validation
 *
 * @example
 * ```typescript
 * export const GET = withAuth(
 *   withTenant(async (req, { user, workspace, memberRole }) => {
 *     // User is authenticated and workspace member verified
 *     return NextResponse.json({
 *       workspaceId: workspace.id,
 *       workspaceName: workspace.name,
 *       userRole: memberRole
 *     })
 *   })
 * )
 * ```
 *
 * @example
 * ```typescript
 * // Workspace ID from URL params
 * // Route: /api/workspaces/[id]/members/route.ts
 * export const GET = withAuth(
 *   withTenant(async (req, { workspace }) => {
 *     // workspace.id extracted from URL
 *   })
 * )
 * ```
 */
export function withTenant<T>(handler: TenantHandler<T>) {
  return async (
    req: NextRequest,
    context: AuthContext,
    ...args: any[]
  ): Promise<T | NextResponse> => {
    try {
      // Extract workspace ID from URL or query params
      const workspaceId = extractWorkspaceId(req)

      if (!workspaceId) {
        return NextResponse.json(
          {
            error: 'Bad Request',
            message: 'Workspace ID required',
          },
          { status: 400 }
        )
      }

      // Verify membership and load workspace
      const member = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: context.user.id,
            workspaceId,
          },
        },
        include: {
          workspace: true,
        },
      })

      // Check if user is a member
      if (!member) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: 'Not a workspace member',
          },
          { status: 403 }
        )
      }

      // Check if workspace is soft-deleted
      if (member.workspace.deletedAt) {
        return NextResponse.json(
          {
            error: 'Gone',
            message: 'Workspace scheduled for deletion',
          },
          { status: 410 }
        )
      }

      // Pass workspace context to handler
      const tenantContext: TenantContext = {
        ...context,
        workspace: member.workspace,
        memberRole: member.role as WorkspaceRole,
        modulePermissions: member.modulePermissions,
      }

      return handler(req, tenantContext, ...args)
    } catch (error) {
      console.error('Tenant context error:', error)
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: 'Failed to validate workspace membership',
        },
        { status: 500 }
      )
    }
  }
}
