import { SetMetadata } from '@nestjs/common'

/**
 * Public decorator to mark routes as publicly accessible
 *
 * When applied to a route handler or controller, the AuthGuard will skip
 * JWT validation for that endpoint. Useful for health checks, webhooks,
 * and public API endpoints.
 *
 * @example
 * ```typescript
 * @Get('health')
 * @Public()
 * async healthCheck() {
 *   return { status: 'ok' }
 * }
 * ```
 */
export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
