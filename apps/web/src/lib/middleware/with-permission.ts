/**
 * Permission middleware for Next.js API routes
 * Checks role-based permissions using the permission matrix
 *
 * @module with-permission
 */

import { NextRequest, NextResponse } from 'next/server'
import { hasPermission, type Permission, type WorkspaceRole } from '@hyvve/shared'
import type { TenantContext } from './with-tenant'

/**
 * Route handler that receives tenant context with validated permissions
 *
 * @template T - Response type
 * @param req - Next.js request object
 * @param context - Tenant context with user, workspace, and permissions
 * @param args - Additional arguments (e.g., params for dynamic routes)
 * @returns Response or Promise of response
 */
export type PermissionHandler<T = any> = (
  req: NextRequest,
  context: TenantContext,
  ...args: any[]
) => Promise<T> | T

/**
 * Permission middleware for Next.js API routes
 * Checks if user has required permissions based on their workspace role
 *
 * Requirements:
 * - Must be used with withAuth and withTenant
 * - Uses OR logic for multiple permissions (user needs ANY permission)
 * - Returns 403 if user lacks required permissions
 *
 * Permission Logic:
 * - OR logic: User needs ANY of the specified permissions
 * - For AND logic: Nest multiple withPermission calls
 *
 * @param permissions - Array of required permissions (OR logic)
 * @param handler - Route handler that requires permissions
 * @returns Wrapped handler with permission check
 *
 * @example
 * ```typescript
 * // Single permission check
 * export const POST = withAuth(
 *   withTenant(
 *     withPermission([PERMISSIONS.MEMBERS_INVITE], async (req, { workspace }) => {
 *       // User has MEMBERS_INVITE permission
 *       return NextResponse.json({ success: true })
 *     })
 *   )
 * )
 * ```
 *
 * @example
 * ```typescript
 * // Multiple permissions (OR logic - needs ANY permission)
 * export const DELETE = withAuth(
 *   withTenant(
 *     withPermission(
 *       [PERMISSIONS.RECORDS_DELETE, PERMISSIONS.WORKSPACE_DELETE],
 *       async (req, { workspace, memberRole }) => {
 *         // User has either RECORDS_DELETE or WORKSPACE_DELETE
 *         return NextResponse.json({ deleted: true })
 *       }
 *     )
 *   )
 * )
 * ```
 *
 * @example
 * ```typescript
 * // AND logic - nest multiple withPermission calls
 * export const POST = withAuth(
 *   withTenant(
 *     withPermission([PERMISSIONS.MEMBERS_VIEW],
 *       withPermission([PERMISSIONS.MEMBERS_INVITE], async (req, ctx) => {
 *         // User has BOTH MEMBERS_VIEW AND MEMBERS_INVITE
 *         return NextResponse.json({ success: true })
 *       })
 *     )
 *   )
 * )
 * ```
 */
export function withPermission<T>(
  permissions: Permission[],
  handler: PermissionHandler<T>
) {
  return async (
    req: NextRequest,
    context: TenantContext,
    ...args: any[]
  ): Promise<T | NextResponse> => {
    try {
      // Validate permissions array
      if (!Array.isArray(permissions) || permissions.length === 0) {
        console.error('withPermission: Invalid permissions array')
        return NextResponse.json(
          {
            error: 'Internal Server Error',
            message: 'Invalid permission configuration',
          },
          { status: 500 }
        )
      }

      // Check if user has at least one of the required permissions (OR logic)
      const hasRequiredPermission = permissions.some((permission) =>
        hasPermission(context.memberRole as WorkspaceRole, permission)
      )

      if (!hasRequiredPermission) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: 'Insufficient permissions',
            required: permissions,
          },
          { status: 403 }
        )
      }

      // User has permission, execute handler
      return handler(req, context, ...args)
    } catch (error) {
      console.error('Permission check error:', error)
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: 'Failed to validate permissions',
        },
        { status: 500 }
      )
    }
  }
}
