import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import type { Request } from 'express'
import { CreateTeamMemberDto } from './dto/create-team-member.dto'
import { UpdateTeamMemberDto } from './dto/update-team-member.dto'
import { TeamService } from './team.service'

@ApiTags('PM Team')
@Controller('pm')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get('projects/:projectId/team')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get a project team (members, roles, capacity)' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getTeam(@CurrentWorkspace() workspaceId: string, @Param('projectId') projectId: string) {
    return this.teamService.getTeam(workspaceId, projectId)
  }

  @Post('projects/:projectId/team/members')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Add a member to a project team' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async addMember(
    @CurrentWorkspace() workspaceId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTeamMemberDto,
    @CurrentUser() actor: any,
    @Req() req: Request,
  ) {
    const memberRole = (req as unknown as { memberRole?: string }).memberRole
    if (memberRole === 'member') {
      await this.teamService.assertProjectLead(workspaceId, actor.id, projectId)
    }
    return this.teamService.addMember(workspaceId, actor.id, projectId, dto)
  }

  @Patch('team-members/:id')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Update a project team member' })
  @ApiParam({ name: 'id', description: 'Team member ID' })
  async updateMember(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTeamMemberDto,
    @CurrentUser() actor: any,
    @Req() req: Request,
  ) {
    const memberRole = (req as unknown as { memberRole?: string }).memberRole
    if (memberRole === 'member') {
      const record = await this.teamService.getTeamMemberProjectId(workspaceId, id)
      await this.teamService.assertProjectLead(workspaceId, actor.id, record.projectId)
    }
    return this.teamService.updateMember(workspaceId, actor.id, id, dto)
  }

  @Delete('team-members/:id')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Remove (deactivate) a project team member' })
  @ApiParam({ name: 'id', description: 'Team member ID' })
  async removeMember(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() actor: any,
    @Req() req: Request,
    @Query('reassignToUserId') reassignToUserId?: string,
  ) {
    const memberRole = (req as unknown as { memberRole?: string }).memberRole
    if (memberRole === 'member') {
      const record = await this.teamService.getTeamMemberProjectId(workspaceId, id)
      await this.teamService.assertProjectLead(workspaceId, actor.id, record.projectId)
    }
    return this.teamService.removeMember({ workspaceId, actorId: actor.id, teamMemberId: id, reassignToUserId })
  }
}
