import { Controller, Get, Res } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ConfigService } from '@nestjs/config'
import { createHmac, randomBytes } from 'crypto'
import type { Response } from 'express'
import { Public } from '../decorators/public.decorator'

@Controller('csrf')
export class CsrfController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Public()
  getToken(@Res({ passthrough: true }) res: Response) {
    const secret =
      this.configService.get<string>('CSRF_SECRET') ??
      this.configService.get<string>('BETTER_AUTH_SECRET')
    if (!secret) {
      throw new Error('CSRF_SECRET or BETTER_AUTH_SECRET must be set when CSRF is enabled')
    }

    const token = randomBytes(32).toString('base64url')
    const signature = createHmac('sha256', secret).update(token).digest('hex')
    const signedToken = `${token}.${signature}`
    const cookieName =
      this.configService.get<string>('CSRF_COOKIE_NAME') ?? 'hyvve_csrf_token'
    
    const sameSite =
      (this.configService.get<string>('CSRF_COOKIE_SAMESITE') ?? 'lax').toLowerCase()
    
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production'
    const forceSecure = this.configService.get<string>('CSRF_COOKIE_SECURE') === 'true'
    
    // Secure is required if SameSite=None, otherwise depends on config/env
    const secure = sameSite === 'none' ? true : (forceSecure || isProduction)
    
    const httpOnly = this.configService.get<string>('CSRF_COOKIE_HTTPONLY') !== 'false'
    const maxAge = 3600000 // 1 hour

    res.cookie(cookieName, signedToken, {
      httpOnly,
      secure,
      sameSite: sameSite === 'none' || sameSite === 'strict' ? sameSite : 'lax',
      path: '/',
      maxAge,
    })

    return { csrfToken: signedToken }
  }
}
