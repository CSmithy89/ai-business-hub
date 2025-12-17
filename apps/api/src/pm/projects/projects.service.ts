import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, ProjectStatus, TeamRole } from '@prisma/client'
import { EventTypes } from '@hyvve/shared'
import { PrismaService } from '../../common/services/prisma.service'
import { EventPublisherService } from '../../events'
import { getPhaseTemplates } from '../templates/bmad-phase-templates'
import { CreateProjectDto } from './dto/create-project.dto'
import { ListProjectsQueryDto } from './dto/list-projects.query.dto'
import { UpdateProjectDto } from './dto/update-project.dto'

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  private async generateUniqueSlug(workspaceId: string, name: string): Promise<string> {
    const base = slugify(name) || 'project'
    let candidate = base

    for (let attempt = 0; attempt < 100; attempt += 1) {
      const existing = await this.prisma.project.findUnique({
        where: { workspaceId_slug: { workspaceId, slug: candidate } },
        select: { id: true },
      })
      if (!existing) return candidate
      candidate = `${base}-${attempt + 2}`
    }

    // Extremely unlikely, but ensures we never loop forever
    return `${base}-${Date.now()}`
  }

  async create(workspaceId: string, actorId: string, dto: CreateProjectDto) {
    const slug = await this.generateUniqueSlug(workspaceId, dto.name)

    const leadUserId = dto.leadUserId || actorId
    const phaseTemplates = getPhaseTemplates(dto.bmadTemplateId)

    const project = await this.prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          workspaceId,
          businessId: dto.businessId,
          slug,
          name: dto.name,
          description: dto.description,
          type: dto.type,
          color: dto.color,
          icon: dto.icon,
          bmadTemplateId: dto.bmadTemplateId,
          status: ProjectStatus.PLANNING,
        },
      })

      // Initialize a project team so "project lead" access can be enforced.
      const team = await tx.projectTeam.create({
        data: {
          projectId: created.id,
          leadUserId,
          members: {
            create: {
              userId: leadUserId,
              role: TeamRole.PROJECT_LEAD,
              canAssignTasks: true,
              canApproveAgents: true,
              canModifyPhases: true,
            },
          },
        },
      })

      if (phaseTemplates.length > 0) {
        await tx.phase.createMany({
          data: phaseTemplates.map((phase) => ({
            projectId: created.id,
            name: phase.name,
            description: phase.description,
            bmadPhase: phase.bmadPhase ?? null,
            phaseNumber: phase.phaseNumber,
            status: phase.status,
          })),
        })
      }

      return { ...created, team }
    })

    await this.eventPublisher.publish(
      EventTypes.PM_PROJECT_CREATED,
      { projectId: project.id, businessId: project.businessId, slug: project.slug },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )

    return { data: project }
  }

  async list(workspaceId: string, query: ListProjectsQueryDto) {
    const page = query.page ?? 1
    const limit = Math.min(query.limit ?? 20, 100)
    const skip = (page - 1) * limit

    const where: Prisma.ProjectWhereInput = {
      workspaceId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.businessId ? { businessId: query.businessId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    }

    const [total, projects] = await this.prisma.$transaction([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          workspaceId: true,
          businessId: true,
          slug: true,
          name: true,
          description: true,
          color: true,
          icon: true,
          type: true,
          status: true,
          totalTasks: true,
          completedTasks: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ])

    return {
      data: projects,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getById(workspaceId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: {
        phases: {
          orderBy: { phaseNumber: 'asc' },
        },
        team: {
          include: { members: true },
        },
      },
    })

    if (!project) {
      throw new NotFoundException('Project not found')
    }

    return { data: project }
  }

  async getBySlug(workspaceId: string, slug: string) {
    const project = await this.prisma.project.findFirst({
      where: { slug, workspaceId, deletedAt: null },
      include: {
        phases: {
          orderBy: { phaseNumber: 'asc' },
        },
        team: {
          include: { members: true },
        },
      },
    })

    if (!project) {
      throw new NotFoundException('Project not found')
    }

    return { data: project }
  }

  async update(workspaceId: string, actorId: string, id: string, dto: UpdateProjectDto) {
    const existing = await this.prisma.project.findFirst({
      where: { id, workspaceId, deletedAt: null },
      select: { id: true, budget: true, actualSpend: true },
    })
    if (!existing) throw new NotFoundException('Project not found')

    const data: Prisma.ProjectUpdateInput = {
      name: dto.name,
      description: dto.description,
      type: dto.type,
      color: dto.color,
      icon: dto.icon,
      bmadTemplateId: dto.bmadTemplateId,
      status: dto.status,
      startDate: dto.startDate,
      targetDate: dto.targetDate,
      autoApprovalThreshold: dto.autoApprovalThreshold,
      suggestionMode: dto.suggestionMode,
    }

    if (dto.budget !== undefined) {
      if (dto.budget === null) {
        data.budget = null
        data.actualSpend = null
      } else {
        data.budget = dto.budget
        if (existing.actualSpend === null) {
          data.actualSpend = 0
        }
      }
    }

    const project = await this.prisma.project.update({
      where: { id },
      data,
      include: {
        phases: {
          orderBy: { phaseNumber: 'asc' },
        },
        team: {
          include: { members: true },
        },
      },
    })

    await this.eventPublisher.publish(
      EventTypes.PM_PROJECT_UPDATED,
      { projectId: project.id, businessId: project.businessId, slug: project.slug },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )

    return { data: project }
  }

  async assertProjectLead(workspaceId: string, actorId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, deletedAt: null },
      select: { team: { select: { leadUserId: true } } },
    })

    const leadUserId = project?.team?.leadUserId
    if (!leadUserId || leadUserId !== actorId) {
      throw new ForbiddenException('Project lead access required')
    }
  }

  async softDelete(workspaceId: string, actorId: string, id: string) {
    const existing = await this.prisma.project.findFirst({
      where: { id, workspaceId, deletedAt: null },
      select: { id: true, businessId: true, slug: true },
    })
    if (!existing) throw new NotFoundException('Project not found')

    const project = await this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    })

    await this.eventPublisher.publish(
      EventTypes.PM_PROJECT_DELETED,
      { projectId: existing.id, businessId: existing.businessId, slug: existing.slug },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )

    return { data: project }
  }
}
