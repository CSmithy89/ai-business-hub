import { BadRequestException, Body, Controller, Headers, Logger, Param, Post, Req } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import crypto from 'node:crypto'
import type { RawBodyRequest } from '@nestjs/common'
import type { Request } from 'express'
import { Public } from '../../common/decorators/public.decorator'
import { RedisProvider } from '../../events/redis.provider'
import { GithubPullRequestsService } from './github-pull-requests.service'

// Webhook deduplication TTL (15 minutes)
const WEBHOOK_DEDUP_TTL_SECONDS = 900

@ApiTags('PM Integrations')
@Controller('pm/integrations/github/webhook')
export class GithubWebhookController {
  private readonly logger = new Logger(GithubWebhookController.name)

  constructor(
    private readonly githubPullRequestsService: GithubPullRequestsService,
    private readonly redisProvider: RedisProvider,
  ) {}

  @Post(':workspaceId')
  @Public()
  @ApiOperation({ summary: 'GitHub webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(
    @Param('workspaceId') workspaceId: string,
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Headers('x-github-delivery') deliveryId: string | undefined,
    @Req() req: RawBodyRequest<Request>,
    @Body() payload: Record<string, unknown>,
  ) {
    // Verify webhook signature using raw body
    this.verifyGithubSignature(signature, req.rawBody)

    // Check for replay attacks using delivery ID
    if (deliveryId) {
      const isDuplicate = await this.checkDuplicateDelivery(deliveryId)
      if (isDuplicate) {
        this.logger.debug(`Duplicate webhook delivery ignored: ${deliveryId}`)
        return { data: { ignored: true, reason: 'duplicate' } }
      }
    }

    if (event !== 'pull_request') {
      return { data: { ignored: true } }
    }

    return this.githubPullRequestsService.handleWebhook(workspaceId, payload)
  }

  private verifyGithubSignature(signature: string | undefined, rawBody: Buffer | undefined) {
    const secret = process.env.GITHUB_WEBHOOK_SECRET

    // Security: Reject webhooks when secret is not configured
    if (!secret) {
      this.logger.error('GITHUB_WEBHOOK_SECRET is not configured - rejecting webhook')
      throw new BadRequestException('Webhook secret not configured')
    }

    if (!signature) {
      throw new BadRequestException('Missing signature header')
    }

    if (!rawBody) {
      throw new BadRequestException('Missing request body')
    }

    // Compute HMAC using raw body (not re-serialized JSON)
    const hash = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')

    const expected = `sha256=${hash}`
    const signatureBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expected)

    if (signatureBuffer.length !== expectedBuffer.length) {
      throw new BadRequestException('Invalid signature')
    }

    const valid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    if (!valid) {
      throw new BadRequestException('Invalid signature')
    }
  }

  private async checkDuplicateDelivery(deliveryId: string): Promise<boolean> {
    const redis = this.redisProvider.getClient()
    const key = `github:webhook:delivery:${deliveryId}`

    // Try to set the key with NX (only if not exists)
    const result = await redis.set(key, '1', 'EX', WEBHOOK_DEDUP_TTL_SECONDS, 'NX')

    // If result is null, the key already existed (duplicate)
    return result === null
  }
}
