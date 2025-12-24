import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import * as crypto from 'crypto'

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Queue a webhook delivery for an event
   */
  async queueDelivery(data: {
    webhookId: string
    workspaceId: string
    eventType: string
    eventId: string
    payload: Record<string, any>
  }) {
    const { webhookId, workspaceId, eventType, eventId, payload } = data

    // Check if delivery already exists for this event
    const existing = await this.prisma.webhookDelivery.findFirst({
      where: {
        webhookId,
        eventType,
        eventId,
      },
    })

    if (existing) {
      this.logger.debug(`Webhook delivery already exists for event ${eventId}`)
      return existing
    }

    return this.prisma.webhookDelivery.create({
      data: {
        webhookId,
        workspaceId,
        eventType,
        eventId,
        payload,
        status: 'PENDING',
      },
    })
  }

  /**
   * Process pending webhook deliveries
   * This would typically be called by a queue processor (BullMQ)
   */
  async processPendingDeliveries() {
    const deliveries = await this.prisma.webhookDelivery.findMany({
      where: {
        status: {
          in: ['PENDING', 'RETRYING'],
        },
        OR: [
          { nextRetryAt: null },
          { nextRetryAt: { lte: new Date() } },
        ],
      },
      include: {
        webhook: true,
      },
      take: 100,
    })

    for (const delivery of deliveries) {
      await this.deliverWebhook(delivery.id)
    }
  }

  /**
   * Deliver a single webhook
   */
  async deliverWebhook(deliveryId: string) {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { webhook: true },
    })

    if (!delivery || !delivery.webhook) {
      this.logger.error(`Webhook delivery ${deliveryId} not found`)
      return
    }

    const { webhook } = delivery

    if (!webhook.enabled) {
      this.logger.debug(`Webhook ${webhook.id} is disabled, skipping delivery`)
      return
    }

    try {
      // Generate HMAC signature
      const signature = this.generateSignature(
        delivery.payload,
        webhook.secret
      )

      // Make HTTP request
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': delivery.eventType,
          'X-Webhook-ID': delivery.id,
          'X-Webhook-Delivery-Attempt': String(delivery.attempts + 1),
        },
        body: JSON.stringify(delivery.payload),
      })

      const responseBody = await response.text()

      if (response.ok) {
        // Success
        await this.prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'DELIVERED',
            attempts: { increment: 1 },
            httpStatus: response.status,
            responseBody,
            deliveredAt: new Date(),
          },
        })

        // Update webhook stats
        await this.prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            deliveryCount: { increment: 1 },
            lastDeliveredAt: new Date(),
          },
        })

        this.logger.log(
          `Webhook delivery ${deliveryId} succeeded (${response.status})`
        )
      } else {
        // HTTP error
        await this.handleDeliveryFailure(
          deliveryId,
          delivery.attempts + 1,
          delivery.maxAttempts,
          `HTTP ${response.status}: ${responseBody}`,
          response.status
        )
      }
    } catch (error) {
      // Network or other error
      const errorMessage = error instanceof Error ? error.message : String(error)
      await this.handleDeliveryFailure(
        deliveryId,
        delivery.attempts + 1,
        delivery.maxAttempts,
        errorMessage,
        null
      )
    }
  }

  /**
   * Handle delivery failure with exponential backoff retry
   */
  private async handleDeliveryFailure(
    deliveryId: string,
    attempts: number,
    maxAttempts: number,
    errorMessage: string,
    httpStatus: number | null
  ) {
    const shouldRetry = attempts < maxAttempts

    if (shouldRetry) {
      // Calculate exponential backoff: 2^attempts minutes
      const backoffMinutes = Math.pow(2, attempts)
      const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000)

      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'RETRYING',
          attempts,
          httpStatus,
          errorMessage,
          nextRetryAt,
        },
      })

      this.logger.warn(
        `Webhook delivery ${deliveryId} failed (attempt ${attempts}/${maxAttempts}), retrying at ${nextRetryAt.toISOString()}`
      )
    } else {
      // Max retries exhausted
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'FAILED',
          attempts,
          httpStatus,
          errorMessage,
          failedAt: new Date(),
        },
      })

      // Update webhook failure count
      const delivery = await this.prisma.webhookDelivery.findUnique({
        where: { id: deliveryId },
      })

      if (delivery) {
        await this.prisma.webhook.update({
          where: { id: delivery.webhookId },
          data: {
            failureCount: { increment: 1 },
          },
        })
      }

      this.logger.error(
        `Webhook delivery ${deliveryId} failed permanently after ${attempts} attempts: ${errorMessage}`
      )
    }
  }

  /**
   * Generate HMAC-SHA256 signature for webhook payload
   */
  private generateSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload)
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payloadString)
    return `sha256=${hmac.digest('hex')}`
  }

  /**
   * Trigger webhooks for an event
   * This is the main entry point called when an event occurs
   */
  async triggerWebhooks(data: {
    workspaceId: string
    eventType: string
    eventId: string
    payload: Record<string, any>
  }) {
    const { workspaceId, eventType, eventId, payload } = data

    // Find all webhooks subscribed to this event
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        workspaceId,
        enabled: true,
        events: {
          has: eventType,
        },
      },
    })

    this.logger.debug(
      `Triggering ${webhooks.length} webhooks for event ${eventType}`
    )

    // Queue deliveries for all matching webhooks
    for (const webhook of webhooks) {
      await this.queueDelivery({
        webhookId: webhook.id,
        workspaceId,
        eventType,
        eventId,
        payload,
      })
    }
  }
}
