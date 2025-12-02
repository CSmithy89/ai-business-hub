import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common'
import { PrismaService } from '../services/prisma.service'
import { WorkspaceRole } from '@hyvve/shared'

/**
 * TenantGuard - Workspace context and membership validation guard
 *
 * Extracts workspace context from the request and verifies the authenticated user
 * is a member of the workspace. Loads workspace data, member role, and module
 * permissions, then attaches them to the request context.
 *
 * Guard Flow:
 * 1. Verify user is authenticated (requires AuthGuard to run first)
 * 2. Extract workspace ID from route params, body, query, or session
 * 3. Query WorkspaceMember table to verify membership
 * 4. Load workspace data and member permissions
 * 5. Attach workspace context to request
 *
 * Workspace ID Priority:
 * 1. request.params.workspaceId (route parameter)
 * 2. request.body.workspaceId (request body)
 * 3. request.query.workspaceId (query parameter)
 * 4. user.activeWorkspaceId (from session)
 *
 * Error Responses:
 * - 401 Unauthorized: User context missing (AuthGuard not run)
 * - 400 Bad Request: Workspace ID not provided
 * - 403 Forbidden: User is not a member of the workspace
 *
 * @example
 * ```typescript
 * @Controller('workspaces/:workspaceId/contacts')
 * @UseGuards(AuthGuard, TenantGuard)
 * export class ContactsController {
 *   @Get()
 *   async list(
 *     @CurrentUser() user: User,
 *     @CurrentWorkspace() workspaceId: string
 *   ) {
 *     // User is authenticated and a member of the workspace
 *     return this.contactsService.findAll(workspaceId)
 *   }
 * }
 * ```
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user

    // Verify user is authenticated (AuthGuard should run first)
    if (!user) {
      throw new UnauthorizedException(
        'User context missing. AuthGuard must be applied before TenantGuard.',
      )
    }

    // Extract workspace ID from multiple sources
    const workspaceId = this.extractWorkspaceId(request, user)

    if (!workspaceId) {
      throw new BadRequestException(
        'Workspace context required. Provide workspaceId in route params, body, query, or session.',
      )
    }

    // Verify workspace membership
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspaceId,
        },
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            timezone: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          },
        },
      },
    })

    // Check if user is a member of the workspace
    if (!member) {
      throw new ForbiddenException(
        'Access denied. You are not a member of this workspace.',
      )
    }

    // Check if workspace is deleted
    if (member.workspace.deletedAt) {
      throw new ForbiddenException(
        'Access denied. This workspace has been deleted.',
      )
    }

    // Attach workspace context to request
    request.workspaceId = workspaceId
    request.workspace = member.workspace
    request.memberRole = member.role as WorkspaceRole
    request.modulePermissions = member.modulePermissions

    return true
  }

  /**
   * Extract workspace ID from request context
   *
   * Priority order:
   * 1. Route params (e.g., /workspaces/:workspaceId/...)
   * 2. Request body (e.g., { workspaceId: '...' })
   * 3. Query params (e.g., ?workspaceId=...)
   * 4. User session (user.activeWorkspaceId)
   *
   * @param request - HTTP request object
   * @param user - Authenticated user object
   * @returns Workspace ID or undefined
   */
  private extractWorkspaceId(request: any, user: any): string | undefined {
    return (
      request.params?.workspaceId ||
      request.body?.workspaceId ||
      request.query?.workspaceId ||
      user.activeWorkspaceId
    )
  }
}
