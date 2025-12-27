import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common'
import { WebhooksService } from './webhooks.service'
import { AuthGuard } from '@/common/guards/auth.guard'
import { TenantGuard } from '@/common/guards/tenant.guard'
import { CurrentWorkspace } from '@/common/decorators/current-workspace.decorator'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { CreateWebhookDto } from './dto/create-webhook.dto'
import { UpdateWebhookDto } from './dto/update-webhook.dto'

@Controller('settings/webhooks')
@UseGuards(AuthGuard, TenantGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  async listWebhooks(@CurrentWorkspace() workspaceId: string) {
    return this.webhooksService.listWebhooks(workspaceId)
  }

  @Post()
  async createWebhook(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWebhookDto
  ) {
    return this.webhooksService.createWebhook({
      workspaceId,
      userId,
      dto,
    })
  }

  @Get(':id')
  async getWebhook(
    @Param('id') id: string,
    @CurrentWorkspace() workspaceId: string
  ) {
    return this.webhooksService.getWebhook(id, workspaceId)
  }

  @Put(':id')
  async updateWebhook(
    @Param('id') id: string,
    @CurrentWorkspace() workspaceId: string,
    @Body() dto: UpdateWebhookDto
  ) {
    return this.webhooksService.updateWebhook(id, workspaceId, dto)
  }

  @Delete(':id')
  async deleteWebhook(
    @Param('id') id: string,
    @CurrentWorkspace() workspaceId: string
  ) {
    return this.webhooksService.deleteWebhook(id, workspaceId)
  }

  @Get(':id/deliveries')
  async getWebhookDeliveries(
    @Param('id') id: string,
    @CurrentWorkspace() workspaceId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ) {
    return this.webhooksService.getWebhookDeliveries(id, workspaceId, limit)
  }
}
