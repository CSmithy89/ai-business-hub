import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'
import { PrismaService } from '../services/prisma.service'

/**
 * AuthOrServiceGuard - Combined user/service authentication guard
 *
 * Allows access via EITHER:
 * 1. Valid user session token (same as AuthGuard)
 * 2. Valid service token (AGENT_SERVICE_TOKEN)
 *
 * This enables both human users and internal services (Python agents) to
 * access the same endpoints with appropriate authentication.
 *
 * When service auth is used:
 * - request.isServiceAuth = true
 * - request.user may be undefined (service doesn't act as a user)
 *
 * When user auth is used:
 * - request.isServiceAuth = false
 * - request.user contains the authenticated user
 *
 * @example
 * ```typescript
 * @Controller('pm/agents')
 * @UseGuards(AuthOrServiceGuard, TenantGuard)
 * export class AgentsController {
 *   @Post('suggestions')
 *   async createSuggestion(
 *     @CurrentWorkspace() workspaceId: string,
 *     @Body() dto: CreateSuggestionDto,
 *   ) {
 *     // Accessible by both users and Python agents
 *   }
 * }
 * ```
 */
@Injectable()
export class AuthOrServiceGuard implements CanActivate {
  private readonly logger = new Logger(AuthOrServiceGuard.name)
  private readonly serviceToken: string | undefined

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.serviceToken = this.configService.get<string>('AGENT_SERVICE_TOKEN')
  }

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

    // Try service token first (faster check)
    if (this.serviceToken && this.isServiceToken(token)) {
      request.isServiceAuth = true
      return true
    }

    // Fall back to user session validation
    try {
      const user = await this.validateUserToken(token)
      request.user = user
      request.isServiceAuth = false
      return true
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token')
    }
  }

  /**
   * Check if token matches service token using timing-safe comparison
   */
  private isServiceToken(token: string): boolean {
    if (!this.serviceToken) return false
    return this.timingSafeEqual(token, this.serviceToken)
  }

  /**
   * Extract Bearer token from Authorization header
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
   * Validate user session token against database
   */
  private async validateUserToken(token: string): Promise<any> {
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

    if (!session) {
      throw new Error('Invalid session')
    }

    if (session.expiresAt < new Date()) {
      throw new Error('Session expired')
    }

    if (!session.user) {
      throw new Error('User not found')
    }

    return {
      ...session.user,
      sessionId: session.id,
      activeWorkspaceId: session.activeWorkspaceId,
    }
  }

  /**
   * Timing-safe string comparison to prevent timing attacks
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      let _dummy = 0
      for (let i = 0; i < a.length; i++) {
        _dummy |= a.charCodeAt(i) ^ b.charCodeAt(i % b.length)
      }
      return false
    }

    let xorResult = 0
    for (let i = 0; i < a.length; i++) {
      xorResult |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return xorResult === 0
  }
}
