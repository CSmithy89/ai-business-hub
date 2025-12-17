import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { TeamRole } from '@prisma/client'
import { EventTypes } from '@hyvve/shared'
import { PrismaService } from '../../common/services/prisma.service'
import { EventPublisherService } from '../../events'
import { ProjectsService } from '../projects/projects.service'
import { CreateTeamMemberDto } from './dto/create-team-member.dto'
import { UpdateTeamMemberDto } from './dto/update-team-member.dto'

type MemberWithUser = {
  id: string
  teamId: string
  userId: string
  role: TeamRole
  customRoleName: string | null
  hoursPerWeek: number
  productivity: number
  canAssignTasks: boolean
  canApproveAgents: boolean
  canModifyPhases: boolean
  isActive: boolean
  joinedAt: Date
  assignedTaskCount: number
  user: null | { id: string; email: string; name: string | null; image: string | null }
}

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
    private readonly projectsService: ProjectsService,
  ) {}

  async getTeam(workspaceId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, deletedAt: null },
      select: {
        id: true,
        team: {
          include: {
            members: {
              orderBy: { joinedAt: 'asc' },
            },
          },
        },
      },
    })

    if (!project || !project.team) throw new NotFoundException('Project team not found')

    const activeMembers = project.team.members.filter((m) => m.isActive)
    const userIds = activeMembers.map((m) => m.userId)

    const [workspaceMembers, assignedTasks] = await this.prisma.$transaction([
      this.prisma.workspaceMember.findMany({
        where: { workspaceId, userId: { in: userIds } },
        include: {
          user: { select: { id: true, email: true, name: true, image: true } },
        },
      }),
      this.prisma.task.findMany({
        where: { projectId, assigneeId: { in: userIds } },
        select: { assigneeId: true },
      }),
    ])

    const userById = new Map(workspaceMembers.map((wm) => [wm.userId, wm.user]))
    const tasksByAssignee = new Map<string, number>()
    for (const row of assignedTasks) {
      const assigneeId = row.assigneeId
      if (!assigneeId) continue
      tasksByAssignee.set(assigneeId, (tasksByAssignee.get(assigneeId) ?? 0) + 1)
    }

    const members: MemberWithUser[] = activeMembers.map((m) => ({
      id: m.id,
      teamId: m.teamId,
      userId: m.userId,
      role: m.role,
      customRoleName: m.customRoleName,
      hoursPerWeek: m.hoursPerWeek,
      productivity: m.productivity,
      canAssignTasks: m.canAssignTasks,
      canApproveAgents: m.canApproveAgents,
      canModifyPhases: m.canModifyPhases,
      isActive: m.isActive,
      joinedAt: m.joinedAt,
      assignedTaskCount: tasksByAssignee.get(m.userId) ?? 0,
      user: userById.get(m.userId) ?? null,
    }))

    return {
      data: {
        id: project.team.id,
        projectId: project.id,
        leadUserId: project.team.leadUserId,
        members,
      },
    }
  }

  async addMember(workspaceId: string, actorId: string, projectId: string, dto: CreateTeamMemberDto) {
    if (dto.role === TeamRole.PROJECT_LEAD) {
      throw new BadRequestException('Use lead assignment to set PROJECT_LEAD')
    }

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, deletedAt: null },
      select: { id: true, team: { select: { id: true } } },
    })
    if (!project || !project.team) throw new NotFoundException('Project team not found')

    const inWorkspace = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: dto.userId },
      select: { id: true },
    })
    if (!inWorkspace) throw new BadRequestException('User is not a member of this workspace')

    const existing = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: project.team.id, userId: dto.userId } },
      select: { id: true, isActive: true, userId: true },
    })

    if (existing?.isActive) {
      throw new BadRequestException('User is already on this project team')
    }

    const member = existing
      ? await this.prisma.teamMember.update({
          where: { id: existing.id },
          data: {
            role: dto.role ?? TeamRole.DEVELOPER,
            customRoleName: dto.customRoleName,
            hoursPerWeek: dto.hoursPerWeek ?? 40,
            productivity: dto.productivity ?? 0.8,
            canAssignTasks: dto.canAssignTasks ?? false,
            canApproveAgents: dto.canApproveAgents ?? false,
            canModifyPhases: dto.canModifyPhases ?? false,
            isActive: true,
          },
        })
      : await this.prisma.teamMember.create({
          data: {
            teamId: project.team.id,
            userId: dto.userId,
            role: dto.role ?? TeamRole.DEVELOPER,
            customRoleName: dto.customRoleName,
            hoursPerWeek: dto.hoursPerWeek ?? 40,
            productivity: dto.productivity ?? 0.8,
            canAssignTasks: dto.canAssignTasks ?? false,
            canApproveAgents: dto.canApproveAgents ?? false,
            canModifyPhases: dto.canModifyPhases ?? false,
            isActive: true,
          },
        })

    await this.eventPublisher.publish(
      EventTypes.PM_TEAM_MEMBER_ADDED,
      { projectId, teamMemberId: member.id, userId: member.userId, role: member.role },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )

    return { data: member }
  }

  async updateMember(workspaceId: string, actorId: string, teamMemberId: string, dto: UpdateTeamMemberDto) {
    if (dto.role === TeamRole.PROJECT_LEAD) {
      throw new BadRequestException('Use lead assignment to set PROJECT_LEAD')
    }

    const existing = await this.prisma.teamMember.findFirst({
      where: {
        id: teamMemberId,
        team: { project: { workspaceId, deletedAt: null } },
      },
      select: {
        id: true,
        userId: true,
        role: true,
        isActive: true,
        team: { select: { leadUserId: true, projectId: true } },
      },
    })
    if (!existing) throw new NotFoundException('Team member not found')
    if (existing.userId === existing.team.leadUserId) {
      throw new BadRequestException('Cannot edit the project lead via team member update')
    }

    const updated = await this.prisma.teamMember.update({
      where: { id: existing.id },
      data: {
        role: dto.role,
        customRoleName: dto.customRoleName,
        hoursPerWeek: dto.hoursPerWeek,
        productivity: dto.productivity,
        canAssignTasks: dto.canAssignTasks,
        canApproveAgents: dto.canApproveAgents,
        canModifyPhases: dto.canModifyPhases,
        isActive: dto.isActive,
      },
    })

    await this.eventPublisher.publish(
      EventTypes.PM_TEAM_MEMBER_UPDATED,
      { projectId: existing.team.projectId, teamMemberId: updated.id, userId: updated.userId, role: updated.role },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )

    return { data: updated }
  }

  async removeMember(params: {
    workspaceId: string
    actorId: string
    teamMemberId: string
    reassignToUserId?: string
  }) {
    const existing = await this.prisma.teamMember.findFirst({
      where: {
        id: params.teamMemberId,
        team: { project: { workspaceId: params.workspaceId, deletedAt: null } },
      },
      select: {
        id: true,
        userId: true,
        isActive: true,
        team: { select: { leadUserId: true, projectId: true, id: true } },
      },
    })
    if (!existing) throw new NotFoundException('Team member not found')
    if (existing.userId === existing.team.leadUserId) {
      throw new BadRequestException('Cannot remove the project lead')
    }

    const assignedCount = await this.prisma.task.count({
      where: { projectId: existing.team.projectId, assigneeId: existing.userId },
    })

    if (assignedCount > 0 && !params.reassignToUserId) {
      throw new BadRequestException('reassignToUserId is required when the member has assigned tasks')
    }

    await this.prisma.$transaction(async (tx) => {
      if (assignedCount > 0 && params.reassignToUserId) {
        if (params.reassignToUserId === existing.userId) {
          throw new BadRequestException('reassignToUserId must be different from removed userId')
        }

        const target = await tx.teamMember.findFirst({
          where: {
            teamId: existing.team.id,
            userId: params.reassignToUserId,
            isActive: true,
          },
          select: { id: true },
        })
        if (!target) throw new BadRequestException('reassignToUserId must be an active team member')

        await tx.task.updateMany({
          where: { projectId: existing.team.projectId, assigneeId: existing.userId },
          data: { assigneeId: params.reassignToUserId },
        })
      }

      await tx.teamMember.update({
        where: { id: existing.id },
        data: { isActive: false },
      })
    })

    await this.eventPublisher.publish(
      EventTypes.PM_TEAM_MEMBER_REMOVED,
      { projectId: existing.team.projectId, teamMemberId: existing.id, userId: existing.userId },
      { tenantId: params.workspaceId, userId: params.actorId, source: 'api' },
    )

    return { data: { id: existing.id, isActive: false } }
  }

  async getTeamMemberProjectId(workspaceId: string, teamMemberId: string) {
    const record = await this.prisma.teamMember.findFirst({
      where: { id: teamMemberId, team: { project: { workspaceId, deletedAt: null } } },
      select: { team: { select: { projectId: true } } },
    })
    if (!record) throw new NotFoundException('Team member not found')
    return { projectId: record.team.projectId }
  }

  async assertProjectLead(workspaceId: string, actorId: string, projectId: string) {
    await this.projectsService.assertProjectLead(workspaceId, actorId, projectId)
  }
}
