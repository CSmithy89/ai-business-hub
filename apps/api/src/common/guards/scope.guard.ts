import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { SCOPES_KEY } from '@/common/decorators/scopes.decorator'
import { ApiScope } from '@hyvve/shared'

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<ApiScope[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (!requiredScopes || requiredScopes.length === 0) {
      return true // No scopes required
    }

    const request = context.switchToHttp().getRequest()
    const apiKey = request.apiKey

    if (!apiKey) {
      throw new ForbiddenException('API key not found in request')
    }

    const permissions = apiKey.permissions as { scopes: ApiScope[] }
    const userScopes = permissions.scopes || []

    // Check if user has ANY of the required scopes (OR logic)
    const hasRequiredScope = requiredScopes.some((scope) =>
      userScopes.includes(scope)
    )

    if (!hasRequiredScope) {
      throw new ForbiddenException(
        `Insufficient permissions. Required scopes: ${requiredScopes.join(', ')}`
      )
    }

    return true
  }
}
