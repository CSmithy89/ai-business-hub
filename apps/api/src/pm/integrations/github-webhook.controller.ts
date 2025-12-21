import { BadRequestException, Body, Controller, Headers, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import crypto from 'node:crypto'
import { Public } from '../../common/decorators/public.decorator'
import { GithubPullRequestsService } from './github-pull-requests.service'

@ApiTags('PM Integrations')
@Controller('pm/integrations/github/webhook')
export class GithubWebhookController {
  constructor(private readonly githubPullRequestsService: GithubPullRequestsService) {}

  @Post(':workspaceId')
  @Public()
  @ApiOperation({ summary: 'GitHub webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(
    @Param('workspaceId') workspaceId: string,
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Body() payload: any,
  ) {
    verifyGithubSignature(signature, payload)

    if (event !== 'pull_request') {
      return { data: { ignored: true } }
    }

    return this.githubPullRequestsService.handleWebhook(workspaceId, payload)
  }
}

function verifyGithubSignature(signature: string | undefined, payload: unknown) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret) return
  if (!signature) throw new BadRequestException('Missing signature')

  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')

  const expected = `sha256=${hash}`
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (signatureBuffer.length !== expectedBuffer.length) {
    throw new BadRequestException('Invalid signature')
  }

  const valid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  if (!valid) throw new BadRequestException('Invalid signature')
}
