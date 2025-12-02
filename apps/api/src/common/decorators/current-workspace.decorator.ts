import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * CurrentWorkspace parameter decorator
 *
 * Extracts the workspace ID from the request context.
 * Workspace ID is attached to the request by TenantGuard.
 *
 * @example
 * ```typescript
 * @Get('data')
 * async getData(@CurrentWorkspace() workspaceId: string) {
 *   return this.service.findByWorkspace(workspaceId)
 * }
 * ```
 */
export const CurrentWorkspace = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.workspaceId
  },
)
