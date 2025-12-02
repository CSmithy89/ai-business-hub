import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { WorkspaceRole } from '@hyvve/shared'
import { ROLES_KEY } from '../decorators/roles.decorator'

/**
 * RolesGuard - Role-based access control guard
 *
 * Checks if the authenticated user's workspace role matches the roles specified
 * in the @Roles() decorator. Uses the permission matrix from @hyvve/shared for
 * role validation.
 *
 * Guard Flow:
 * 1. Read required roles from @Roles() decorator metadata
 * 2. If no roles specified, allow access
 * 3. Extract user's role from request (set by TenantGuard)
 * 4. Check if user's role is in the required roles list
 * 5. Allow or deny access based on role match
 *
 * Role Logic:
 * - Multiple roles use OR logic (user needs ANY of the specified roles)
 * - No @Roles() decorator means no role restriction
 * - Owner role has highest privilege
 *
 * Error Responses:
 * - 403 Forbidden: User's role is insufficient for the endpoint
 *
 * @example
 * ```typescript
 * @Controller('workspaces/:workspaceId/settings')
 * @UseGuards(AuthGuard, TenantGuard, RolesGuard)
 * export class SettingsController {
 *   // Only owners can delete workspace
 *   @Delete()
 *   @Roles('owner')
 *   async deleteWorkspace(@CurrentWorkspace() workspaceId: string) {
 *     return this.workspaceService.delete(workspaceId)
 *   }
 *
 *   // Owners and admins can update settings
 *   @Put()
 *   @Roles('owner', 'admin')
 *   async updateSettings(@Body() dto: UpdateSettingsDto) {
 *     return this.workspaceService.updateSettings(dto)
 *   }
 *
 *   // All authenticated workspace members can view settings
 *   @Get()
 *   async getSettings() {
 *     return this.workspaceService.getSettings()
 *   }
 * }
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Read required roles from @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // If no roles specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const memberRole = request.memberRole as WorkspaceRole

    // Verify role context exists (TenantGuard should run first)
    if (!memberRole) {
      throw new ForbiddenException(
        'Role context missing. TenantGuard must be applied before RolesGuard.',
      )
    }

    // Check if user's role is in the required roles list (OR logic)
    const hasRequiredRole = requiredRoles.includes(memberRole)

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}. Your role: ${memberRole}`,
      )
    }

    return true
  }
}
