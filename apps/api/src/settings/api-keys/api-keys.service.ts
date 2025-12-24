import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { ApiScope } from '@hyvve/shared'
import * as crypto from 'crypto'

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

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
          rateLimit: data.rateLimit || 10000,
        },
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
  async getApiKeyUsage(_id: string, _workspaceId: string) {
    // TODO: Implement usage tracking from audit logs
    return {
      totalRequests: 0,
      requestsToday: 0,
      lastUsedAt: null,
    }
  }
}
