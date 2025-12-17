import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import type { Request } from 'express'
import { ProjectsService } from '../projects/projects.service'
import { CreateExpenseDto } from './dto/create-expense.dto'
import { ExpensesService } from './expenses.service'

@ApiTags('PM Expenses')
@Controller('pm')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Get('projects/:projectId/expenses')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'List expenses for a project (budget tracking)' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async list(
    @CurrentWorkspace() workspaceId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.expensesService.list(workspaceId, projectId)
  }

  @Post('projects/:projectId/expenses')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Log an expense for a project (increments actualSpend)' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async create(
    @CurrentWorkspace() workspaceId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateExpenseDto,
    @CurrentUser() actor: any,
    @Req() req: Request,
  ) {
    const memberRole = (req as unknown as { memberRole?: string }).memberRole
    if (memberRole === 'member') {
      await this.projectsService.assertProjectLead(workspaceId, actor.id, projectId)
    }
    return this.expensesService.create(workspaceId, actor.id, projectId, dto)
  }
}

