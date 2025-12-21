import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { CredentialEncryptionService } from '@hyvve/shared/server'
import { IntegrationProvider, IntegrationStatus, Prisma } from '@prisma/client'
import { PrismaService } from '../../common/services/prisma.service'
import { ConnectIntegrationDto } from './dto/connect-integration.dto'

@Injectable()
export class IntegrationsService {
  private encryptionService: CredentialEncryptionService | null = null

  constructor(private readonly prisma: PrismaService) {}

  private getEncryptionService(): CredentialEncryptionService {
    if (!this.encryptionService) {
      this.encryptionService = new CredentialEncryptionService()
    }
    return this.encryptionService
  }

  async listConnections(workspaceId: string) {
    const connections = await this.prisma.integrationConnection.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        provider: true,
        status: true,
        metadata: true,
        lastCheckedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return { data: connections }
  }

  async connect(workspaceId: string, provider: IntegrationProvider, dto: ConnectIntegrationDto) {
    const encrypted = await this.getEncryptionService().encrypt(
      JSON.stringify({ token: dto.token.trim() })
    )

    const connection = await this.prisma.integrationConnection.upsert({
      where: {
        workspaceId_provider: {
          workspaceId,
          provider,
        },
      },
      update: {
        encryptedCredentials: encrypted,
        status: IntegrationStatus.CONNECTED,
        metadata: dto.metadata ? (dto.metadata as Prisma.InputJsonValue) : undefined,
        lastCheckedAt: new Date(),
      },
      create: {
        workspaceId,
        provider,
        encryptedCredentials: encrypted,
        status: IntegrationStatus.CONNECTED,
        metadata: dto.metadata ? (dto.metadata as Prisma.InputJsonValue) : undefined,
        lastCheckedAt: new Date(),
      },
      select: {
        id: true,
        provider: true,
        status: true,
        metadata: true,
        lastCheckedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return { data: connection }
  }

  async disconnect(workspaceId: string, provider: IntegrationProvider) {
    const connection = await this.prisma.integrationConnection.findFirst({
      where: { workspaceId, provider },
      select: { id: true },
    })

    if (!connection) throw new NotFoundException('Integration not found')

    const updated = await this.prisma.integrationConnection.update({
      where: { id: connection.id },
      data: { status: IntegrationStatus.DISCONNECTED },
      select: {
        id: true,
        provider: true,
        status: true,
        metadata: true,
        lastCheckedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return { data: updated }
  }

  async getProviderToken(workspaceId: string, provider: IntegrationProvider) {
    const connection = await this.prisma.integrationConnection.findFirst({
      where: { workspaceId, provider, status: IntegrationStatus.CONNECTED },
      select: { encryptedCredentials: true },
    })

    if (!connection) {
      throw new BadRequestException('Integration is not connected')
    }

    const decrypted = await this.getEncryptionService().decrypt(connection.encryptedCredentials)
    const parsed = JSON.parse(decrypted) as { token?: string }
    if (!parsed.token) throw new BadRequestException('Integration token missing')
    return parsed.token
  }
}
