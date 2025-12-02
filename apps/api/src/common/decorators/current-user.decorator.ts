import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * CurrentUser parameter decorator
 *
 * Extracts the authenticated user from the request context.
 * User is attached to the request by AuthGuard.
 *
 * @example
 * ```typescript
 * @Get('profile')
 * async getProfile(@CurrentUser() user: User) {
 *   return user
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.user
  },
)
