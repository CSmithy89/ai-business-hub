import { SetMetadata } from '@nestjs/common'
import { WorkspaceRole } from '@hyvve/shared'

/**
 * Roles decorator for role-based access control
 *
 * Specifies which workspace roles are allowed to access an endpoint.
 * Used in conjunction with RolesGuard to enforce role requirements.
 *
 * @param roles - One or more workspace roles that can access the endpoint
 *
 * @example
 * ```typescript
 * // Single role requirement
 * @Roles('owner')
 *
 * // Multiple roles (OR logic - user needs ANY of these roles)
 * @Roles('admin', 'owner')
 * ```
 */
export const ROLES_KEY = 'roles'
export const Roles = (...roles: WorkspaceRole[]) => SetMetadata(ROLES_KEY, roles)
