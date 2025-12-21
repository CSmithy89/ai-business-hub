import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { IntegrationProvider } from '@prisma/client'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { ConnectIntegrationDto } from './dto/connect-integration.dto'
import { IntegrationsService } from './integrations.service'

@ApiTags('PM Integrations')
@Controller('pm/integrations')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'List integration connections' })
  async listConnections(@CurrentWorkspace() workspaceId: string) {
    return this.integrationsService.listConnections(workspaceId)
  }

  @Post(':provider/connect')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Connect an integration provider' })
  @ApiParam({ name: 'provider', description: 'Integration provider (github, jira, asana, trello)' })
  @ApiResponse({ status: 201, description: 'Integration connected' })
  async connect(
    @CurrentWorkspace() workspaceId: string,
    @Param('provider') provider: string,
    @Body() dto: ConnectIntegrationDto,
  ) {
    return this.integrationsService.connect(workspaceId, parseProvider(provider), dto)
  }

  @Post(':provider/disconnect')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Disconnect an integration provider' })
  @ApiParam({ name: 'provider', description: 'Integration provider (github, jira, asana, trello)' })
  async disconnect(@CurrentWorkspace() workspaceId: string, @Param('provider') provider: string) {
    return this.integrationsService.disconnect(workspaceId, parseProvider(provider))
  }
}

function parseProvider(raw: string): IntegrationProvider {
  const normalized = raw.trim().toUpperCase()
  if (normalized in IntegrationProvider) {
    return IntegrationProvider[normalized as keyof typeof IntegrationProvider]
  }
  throw new BadRequestException('Unsupported integration provider')
}
