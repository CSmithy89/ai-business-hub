import { Controller, Get, Res } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { randomUUID } from 'crypto'
import type { Response } from 'express'
import { Public } from '../decorators/public.decorator'

@Controller('csrf')
export class CsrfController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @Public()
  getToken(@Res({ passthrough: true }) res: Response) {
    const token = randomUUID()
    const cookieName = this.configService.get<string>('CSRF_COOKIE_NAME') ?? 'hyvve.csrf_token'
    const sameSite =
      (this.configService.get<string>('CSRF_COOKIE_SAMESITE') ?? 'lax').toLowerCase()
    const secure =
      this.configService.get<string>('CSRF_COOKIE_SECURE') === 'true' ||
      this.configService.get<string>('NODE_ENV') === 'production'
    const httpOnly = this.configService.get<string>('CSRF_COOKIE_HTTPONLY') !== 'false'

    res.cookie(cookieName, token, {
      httpOnly,
      secure,
      sameSite: sameSite === 'none' || sameSite === 'strict' ? sameSite : 'lax',
      path: '/',
    })

    return { csrfToken: token }
  }
}
