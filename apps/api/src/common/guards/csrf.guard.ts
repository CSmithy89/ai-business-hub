import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHmac, timingSafeEqual } from 'crypto'
import type { Request } from 'express'

const CSRF_SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const csrfEnabled = this.configService.get<string>('CSRF_ENABLED')
    if (csrfEnabled !== 'true') {
      return true
    }

    const request = context.switchToHttp().getRequest<Request>()

    if (CSRF_SAFE_METHODS.has(request.method)) {
      return true
    }

    const sessionCookieName =
      this.configService.get<string>('CSRF_SESSION_COOKIE_NAME') ||
      'hyvve.session_token'
    const cookies = this.parseCookies(request.headers.cookie)

    if (!cookies[sessionCookieName]) {
      return true
    }

    const csrfHeaderName = (
      this.configService.get<string>('CSRF_HEADER_NAME') || 'x-csrf-token'
    ).toLowerCase()
    const csrfCookieName =
      this.configService.get<string>('CSRF_COOKIE_NAME') || 'hyvve_csrf_token'
    const csrfSecret =
      this.configService.get<string>('CSRF_SECRET') ||
      this.configService.get<string>('BETTER_AUTH_SECRET')

    if (!csrfSecret) {
      throw new ForbiddenException('CSRF configuration error')
    }

    const headerToken = this.normalizeHeaderValue(request.headers[csrfHeaderName])
    const cookieToken = cookies[csrfCookieName]

    if (!headerToken || !cookieToken) {
      throw new ForbiddenException('CSRF token mismatch')
    }

    if (!this.constantTimeCompare(headerToken, cookieToken)) {
      throw new ForbiddenException('CSRF token mismatch')
    }

    if (!this.isSignedTokenValid(headerToken, csrfSecret)) {
      throw new ForbiddenException('CSRF token invalid')
    }

    return true
  }

  private parseCookies(cookieHeader?: string): Record<string, string> {
    if (!cookieHeader) return {}
    return cookieHeader.split(';').reduce<Record<string, string>>((acc, part) => {
      const [rawKey, ...rawValue] = part.trim().split('=')
      if (!rawKey) return acc
      try {
        acc[rawKey] = decodeURIComponent(rawValue.join('='))
      } catch {
        // Ignore malformed cookies
      }
      return acc
    }, {})
  }

  private normalizeHeaderValue(
    value: string | string[] | undefined,
  ): string | undefined {
    if (!value) return undefined
    return Array.isArray(value) ? value[0] : value
  }

  private constantTimeCompare(a?: string, b?: string): boolean {
    if (!a || !b) return false
    if (a.length !== b.length) return false
    return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
  }

  private isSignedTokenValid(value: string, secret: string): boolean {
    const parts = value.split('.')
    if (parts.length !== 2) return false
    
    const [token, signature] = parts
    if (!token || !signature) return false
    
    const expected = createHmac('sha256', secret).update(token).digest('hex')
    if (signature.length !== expected.length) return false
    
    return timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expected, 'utf8'),
    )
  }
}
