import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'
import { PrismaService } from '../services/prisma.service'

/**
 * AuthGuard - JWT token validation guard
 *
 * Validates JWT tokens from the Authorization header and attaches the authenticated
 * user to the request context. Integrates with better-auth by verifying tokens
 * against the sessions table.
 *
 * Guard Flow:
 * 1. Check if route is marked as @Public() - if yes, allow access
 * 2. Extract JWT token from Authorization header
 * 3. Verify token exists in sessions table and is not expired
 * 4. Load user data from database
 * 5. Attach user to request.user
 *
 * Error Responses:
 * - 401 Unauthorized: Missing, invalid, or expired token
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @UseGuards(AuthGuard)
 * export class UsersController {
 *   @Get('me')
 *   async getCurrentUser(@CurrentUser() user: User) {
 *     return user
 *   }
 *
 *   @Get('health')
 *   @Public()
 *   async healthCheck() {
 *     return { status: 'ok' }
 *   }
 * }
 * ```
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException('No authentication token provided')
    }

    try {
      const user = await this.validateToken(token)

      // Attach user to request for downstream guards and controllers
      request.user = user
      return true
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired authentication token')
    }
  }

  /**
   * Extract Bearer token from Authorization header
   *
   * @param request - HTTP request object
   * @returns JWT token string or undefined
   */
  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization

    if (!authHeader) {
      return undefined
    }

    const [type, token] = authHeader.split(' ')
    return type === 'Bearer' ? token : undefined
  }

  /**
   * Validate JWT token against better-auth sessions
   *
   * For MVP, we verify tokens by checking the sessions table directly.
   * This approach ensures tokens are valid and not revoked.
   *
   * @param token - JWT token string
   * @returns User object if valid
   * @throws Error if token is invalid or expired
   */
  private async validateToken(token: string): Promise<any> {
    // Query sessions table to verify token
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            emailVerified: true,
          },
        },
      },
    })

    // Check if session exists
    if (!session) {
      throw new Error('Invalid session')
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      throw new Error('Session expired')
    }

    // Check if user exists
    if (!session.user) {
      throw new Error('User not found')
    }

    // Return user data with active workspace ID from session
    return {
      ...session.user,
      sessionId: session.id,
      activeWorkspaceId: session.activeWorkspaceId,
    }
  }
}
