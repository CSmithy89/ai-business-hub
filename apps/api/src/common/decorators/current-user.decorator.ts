import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * CurrentUser parameter decorator
 *
 * Extracts the authenticated user from the request context.
 * User is attached to the request by AuthGuard.
 *
 * @example
 * ```typescript
 * // Get entire user object
 * @Get('profile')
 * async getProfile(@CurrentUser() user: User) {
 *   return user
 * }
 *
 * // Get specific property
 * @Get('my-id')
 * async getMyId(@CurrentUser('id') userId: string) {
 *   return userId
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user
    return data ? user?.[data] : user
  },
)
