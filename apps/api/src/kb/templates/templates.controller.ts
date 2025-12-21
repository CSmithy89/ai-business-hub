import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { CreateTemplateDto } from './dto/create-template.dto'
import { TemplatesService } from './templates.service'

@ApiTags('KB Templates')
@Controller('kb/templates')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'List KB templates' })
  @ApiResponse({ status: 200, description: 'List of templates' })
  async listTemplates(@CurrentUser() actor: { tenantId: string; workspaceId: string }) {
    return this.templatesService.listTemplates(actor.workspaceId, actor.tenantId)
  }

  @Post()
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Create a custom KB template' })
  @ApiResponse({ status: 201, description: 'Template created' })
  async createTemplate(
    @CurrentUser() actor: { tenantId: string; workspaceId: string; id: string },
    @Body() dto: CreateTemplateDto,
  ) {
    return this.templatesService.createTemplate(actor.tenantId, actor.workspaceId, actor.id, dto)
  }
}
