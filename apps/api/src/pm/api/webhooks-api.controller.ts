import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards, Req } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiSecurity } from '@nestjs/swagger'
import { Request } from 'express'
import { API_SCOPES } from '@hyvve/shared'
import { WebhooksService } from '@/settings/webhooks/webhooks.service'
import { CreateWebhookDto } from '@/settings/webhooks/dto/create-webhook.dto'
import { UpdateWebhookDto } from '@/settings/webhooks/dto/update-webhook.dto'
import { ApiKeyGuard } from '@/common/guards/api-key.guard'
import { ScopeGuard } from '@/common/guards/scope.guard'
import { RateLimitGuard } from '@/common/guards/rate-limit.guard'
import { Scopes } from '@/common/decorators/scopes.decorator'
import { ApiAuthenticatedRequest } from '@/common/types/request-user'

@ApiTags('webhooks')
@Controller('api/v1/webhooks')
@UseGuards(ApiKeyGuard, ScopeGuard, RateLimitGuard)
@ApiSecurity('api-key')
export class WebhooksApiController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  @Scopes(API_SCOPES.WEBHOOK_READ)
  @ApiOperation({ summary: 'List all webhooks' })
  @ApiResponse({ status: 200, description: 'Webhooks retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async listWebhooks(@Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId
    return this.webhooksService.listWebhooks(workspaceId)
  }

  @Post()
  @Scopes(API_SCOPES.WEBHOOK_WRITE)
  @ApiOperation({ summary: 'Create a new webhook' })
  @ApiResponse({ status: 201, description: 'Webhook created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async createWebhook(
    @Body() dto: CreateWebhookDto,
    @Req() request: Request & ApiAuthenticatedRequest
  ) {
    const workspaceId = request.workspaceId
    const userId = request.apiKey.createdById

    return this.webhooksService.createWebhook({
      workspaceId,
      userId,
      dto,
    })
  }

  @Get(':id')
  @Scopes(API_SCOPES.WEBHOOK_READ)
  @ApiOperation({ summary: 'Get webhook by ID' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async getWebhook(
    @Param('id') id: string,
    @Req() request: Request & ApiAuthenticatedRequest
  ) {
    const workspaceId = request.workspaceId
    return this.webhooksService.getWebhook(id, workspaceId)
  }

  @Put(':id')
  @Scopes(API_SCOPES.WEBHOOK_WRITE)
  @ApiOperation({ summary: 'Update webhook' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook updated successfully' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async updateWebhook(
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
    @Req() request: Request & ApiAuthenticatedRequest
  ) {
    const workspaceId = request.workspaceId
    return this.webhooksService.updateWebhook(id, workspaceId, dto)
  }

  @Delete(':id')
  @HttpCode(204)
  @Scopes(API_SCOPES.WEBHOOK_WRITE)
  @ApiOperation({ summary: 'Delete webhook' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 204, description: 'Webhook deleted successfully' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async deleteWebhook(
    @Param('id') id: string,
    @Req() request: Request & ApiAuthenticatedRequest
  ) {
    const workspaceId = request.workspaceId
    await this.webhooksService.deleteWebhook(id, workspaceId)
  }

  @Get(':id/deliveries')
  @Scopes(API_SCOPES.WEBHOOK_READ)
  @ApiOperation({ summary: 'Get webhook delivery history' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Delivery history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async getWebhookDeliveries(
    @Param('id') id: string,
    @Req() request: Request & ApiAuthenticatedRequest
  ) {
    const workspaceId = request.workspaceId
    return this.webhooksService.getWebhookDeliveries(id, workspaceId)
  }
}
