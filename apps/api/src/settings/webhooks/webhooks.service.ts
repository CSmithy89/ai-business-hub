import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { CreateWebhookDto } from './dto/create-webhook.dto'
import { UpdateWebhookDto } from './dto/update-webhook.dto'

@Injectable()
export class WebhooksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new webhook subscription
   */
  async createWebhook(data: {
    workspaceId: string
    userId: string
    dto: CreateWebhookDto
  }) {
    const { workspaceId, userId, dto } = data

    return this.prisma.webhook.create({
      data: {
        workspaceId,
        createdBy: userId,
        name: dto.name,
        description: dto.description,
        url: dto.url,
        secret: dto.secret,
        events: dto.events,
      },
    })
  }

  /**
   * List all webhooks for a workspace
   */
  async listWebhooks(workspaceId: string) {
    return this.prisma.webhook.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get a webhook by ID
   */
  async getWebhook(id: string, workspaceId: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, workspaceId },
    })

    if (!webhook) {
      throw new NotFoundException('Webhook not found')
    }

    return webhook
  }

  /**
   * Update a webhook
   */
  async updateWebhook(id: string, workspaceId: string, dto: UpdateWebhookDto) {
    // Verify webhook exists and belongs to workspace
    await this.getWebhook(id, workspaceId)

    return this.prisma.webhook.update({
      where: { id },
      data: dto,
    })
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(id: string, workspaceId: string) {
    // Verify webhook exists and belongs to workspace
    await this.getWebhook(id, workspaceId)

    return this.prisma.webhook.delete({
      where: { id },
    })
  }

  /**
   * Get webhooks subscribed to a specific event type
   */
  async getWebhooksByEvent(workspaceId: string, eventType: string) {
    return this.prisma.webhook.findMany({
      where: {
        workspaceId,
        enabled: true,
        events: {
          has: eventType,
        },
      },
    })
  }

  /**
   * Get webhook delivery history
   */
  async getWebhookDeliveries(webhookId: string, workspaceId: string, limit = 50) {
    // Verify webhook exists and belongs to workspace
    await this.getWebhook(webhookId, workspaceId)

    return this.prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }
}
