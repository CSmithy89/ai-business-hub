import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { RateLimitService } from '@/common/services/rate-limit.service'
import { ApiScope } from '@hyvve/shared'
import * as crypto from 'crypto'

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  /**
   * Generate a new API key with format: sk_prod_{random}
   */
  generateApiKey(): { key: string; prefix: string; hash: string } {
    const randomBytes = crypto.randomBytes(32).toString('hex')
    const key = `sk_prod_${randomBytes}`
    const prefix = key.substring(0, 16) // sk_prod_xxxxxxx
    const hash = crypto.createHash('sha256').update(key).digest('hex')

    return { key, prefix, hash }
  }

  /**
   * Create a new API key
   */
  async createApiKey(data: {
    workspaceId: string
    userId: string
    name: string
    scopes: ApiScope[]
    expiresAt?: Date
    rateLimit?: number
  }) {
    const { key, prefix, hash } = this.generateApiKey()

    const apiKey = await this.prisma.apiKey.create({
      data: {
        workspaceId: data.workspaceId,
        createdById: data.userId,
        name: data.name,
        keyPrefix: prefix,
        keyHash: hash,
        permissions: {
          scopes: data.scopes,
        },
        rateLimit: data.rateLimit || 1000, // Default: 1000 requests/hour
        expiresAt: data.expiresAt,
      },
    })

    return { apiKey, plainKey: key }
  }

  /**
   * List API keys for workspace
   */
  async listApiKeys(workspaceId: string) {
    return this.prisma.apiKey.findMany({
      where: {
        workspaceId,
        revokedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        rateLimit: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(id: string, workspaceId: string) {
    return this.prisma.apiKey.update({
      where: { id, workspaceId },
      data: { revokedAt: new Date() },
    })
  }

  /**
   * Get API key usage stats
   */
  async getApiKeyUsage(id: string, workspaceId: string) {
    // Get API key details
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id, workspaceId },
      select: {
        id: true,
        rateLimit: true,
        lastUsedAt: true,
      },
    })

    if (!apiKey) {
      return {
        currentUsage: 0,
        rateLimit: 1000,
        remaining: 1000,
        resetAt: new Date(),
        lastUsedAt: null,
      }
    }

    // Get current usage from Redis
    const currentUsage = await this.rateLimitService.getCurrentUsage(apiKey.id)
    const remaining = Math.max(0, apiKey.rateLimit - currentUsage)

    // Calculate reset time (next hour boundary)
    const now = Date.now()
    const nextHour = Math.ceil(now / 3600000) * 3600000
    const resetAt = new Date(nextHour)

    return {
      currentUsage,
      rateLimit: apiKey.rateLimit,
      remaining,
      resetAt,
      lastUsedAt: apiKey.lastUsedAt,
    }
  }
}
