import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

/**
 * ServiceAuthGuard - Service-to-service authentication guard
 *
 * Validates service tokens for internal agent-to-API calls.
 * Used by Python agents (Navi, Sage, Chrono) to authenticate their API requests.
 *
 * This guard validates the AGENT_SERVICE_TOKEN environment variable against
 * the Bearer token in the Authorization header.
 *
 * Security considerations:
 * - Token is validated against server-side environment variable (never trusts client)
 * - Timing-safe comparison prevents timing attacks
 * - Token must be set in environment - fails secure if missing
 *
 * @example
 * ```typescript
 * @Controller('internal/agents')
 * @UseGuards(ServiceAuthGuard)
 * export class InternalAgentsController {
 *   @Post('suggestions')
 *   async createSuggestion(@Body() dto: CreateSuggestionDto) {
 *     // Only reachable with valid service token
 *   }
 * }
 * ```
 */
@Injectable()
export class ServiceAuthGuard implements CanActivate {
  private readonly logger = new Logger(ServiceAuthGuard.name)
  private readonly serviceToken: string | undefined

  constructor(private readonly configService: ConfigService) {
    this.serviceToken = this.configService.get<string>('AGENT_SERVICE_TOKEN')

    if (!this.serviceToken) {
      this.logger.warn(
        'AGENT_SERVICE_TOKEN not configured - service auth will reject all requests',
      )
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException('No service token provided')
    }

    if (!this.serviceToken) {
      throw new UnauthorizedException('Service authentication not configured')
    }

    // Use timing-safe comparison to prevent timing attacks
    if (!this.timingSafeEqual(token, this.serviceToken)) {
      this.logger.warn('Invalid service token attempt')
      throw new UnauthorizedException('Invalid service token')
    }

    // Mark request as service-authenticated for downstream handlers
    request.isServiceAuth = true
    return true
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
   * Timing-safe string comparison to prevent timing attacks
   *
   * @param a - First string to compare
   * @param b - Second string to compare
   * @returns true if strings are equal
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      // Still need to do some work to prevent length-based timing attacks
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
