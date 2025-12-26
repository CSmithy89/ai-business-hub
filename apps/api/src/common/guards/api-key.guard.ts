import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { Request } from 'express'
import * as crypto from 'crypto'

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name)

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const apiKey = this.extractApiKey(request)

    if (!apiKey) {
      throw new UnauthorizedException('API key is required')
    }

    // Hash the API key for lookup
    const keyHash = this.hashApiKey(apiKey)

    // Find API key in database
    const apiKeyRecord = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { workspace: true },
    })

    if (!apiKeyRecord) {
      throw new UnauthorizedException('Invalid API key')
    }

    // Check if key is revoked
    if (apiKeyRecord.revokedAt) {
      throw new UnauthorizedException('API key has been revoked')
    }

    // Check if key is expired
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired')
    }

    // Attach workspace and API key to request (using type assertion for custom properties)
    const extendedRequest = request as Request & {
      workspaceId: string
      apiKey: typeof apiKeyRecord
      apiKeyId: string
    }
    extendedRequest.workspaceId = apiKeyRecord.workspaceId
    extendedRequest.apiKey = apiKeyRecord
    extendedRequest.apiKeyId = apiKeyRecord.id

    // Update last used timestamp (async, don't block)
    this.updateLastUsed(apiKeyRecord.id).catch((error) => {
      this.logger.warn(
        `Failed to update lastUsedAt for API key ${apiKeyRecord.id}: ${error instanceof Error ? error.message : String(error)}`
      )
    })

    return true
  }

  private extractApiKey(request: Request): string | null {
    // Check X-API-Key header
    const headerKey = request.headers['x-api-key']
    if (headerKey && typeof headerKey === 'string') {
      return headerKey
    }

    // Check Authorization: Bearer header
    const authHeader = request.headers['authorization']
    if (authHeader && typeof authHeader === 'string') {
      const match = authHeader.match(/^Bearer\s+(.+)$/)
      if (match) {
        return match[1]
      }
    }

    return null
  }

  private hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex')
  }

  private async updateLastUsed(apiKeyId: string): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { lastUsedAt: new Date() },
    })
  }
}
