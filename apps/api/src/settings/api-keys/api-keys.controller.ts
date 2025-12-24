import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common'
import { ApiKeysService } from './api-keys.service'
import { AuthGuard } from '@/common/guards/auth.guard'
import { TenantGuard } from '@/common/guards/tenant.guard'
import { CurrentWorkspace } from '@/common/decorators/current-workspace.decorator'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { CreateApiKeyDto } from './dto/create-api-key.dto'

@Controller('settings/api-keys')
@UseGuards(AuthGuard, TenantGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  async listApiKeys(@CurrentWorkspace() workspaceId: string) {
    return this.apiKeysService.listApiKeys(workspaceId)
  }

  @Post()
  async createApiKey(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateApiKeyDto
  ) {
    return this.apiKeysService.createApiKey({
      workspaceId,
      userId,
      ...dto,
    })
  }

  @Delete(':id')
  async revokeApiKey(
    @Param('id') id: string,
    @CurrentWorkspace() workspaceId: string
  ) {
    return this.apiKeysService.revokeApiKey(id, workspaceId)
  }

  @Get(':id/usage')
  async getApiKeyUsage(
    @Param('id') id: string,
    @CurrentWorkspace() workspaceId: string
  ) {
    return this.apiKeysService.getApiKeyUsage(id, workspaceId)
  }
}
