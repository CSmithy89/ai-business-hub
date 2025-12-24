import { Module } from '@nestjs/common'
import { WebhooksService } from './webhooks.service'
import { WebhooksController } from './webhooks.controller'
import { WebhookDeliveryService } from './webhook-delivery.service'
import { PrismaService } from '@/common/services/prisma.service'

@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhookDeliveryService, PrismaService],
  exports: [WebhooksService, WebhookDeliveryService],
})
export class WebhooksModule {}
