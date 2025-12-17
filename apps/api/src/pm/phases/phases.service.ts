import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PhaseStatus } from '@prisma/client'
import { EventTypes } from '@hyvve/shared'
import { PrismaService } from '../../common/services/prisma.service'
import { EventPublisherService } from '../../events'
import { CreatePhaseDto } from './dto/create-phase.dto'
import { UpdatePhaseDto } from './dto/update-phase.dto'

function isValidTransition(from: PhaseStatus, to: PhaseStatus): boolean {
  if (from === to) return true
  if (from === PhaseStatus.UPCOMING && to === PhaseStatus.CURRENT) return true
  if (from === PhaseStatus.CURRENT && to === PhaseStatus.COMPLETED) return true
  return false
}

@Injectable()
export class PhasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

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

  async assertPhaseProjectLead(workspaceId: string, actorId: string, phaseId: string) {
    const phase = await this.prisma.phase.findFirst({
      where: {
        id: phaseId,
        project: { workspaceId, deletedAt: null },
      },
      select: { project: { select: { team: { select: { leadUserId: true } } } } },
    })

    const leadUserId = phase?.project?.team?.leadUserId
    if (!leadUserId || leadUserId !== actorId) {
      throw new ForbiddenException('Project lead access required')
    }
  }

  async create(workspaceId: string, actorId: string, projectId: string, dto: CreatePhaseDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, deletedAt: null },
      select: { id: true },
    })
    if (!project) throw new NotFoundException('Project not found')

    const phase = await this.prisma.phase.create({
      data: {
        projectId,
        name: dto.name,
        description: dto.description,
        phaseNumber: dto.phaseNumber,
        status: PhaseStatus.UPCOMING,
      },
    })

    await this.eventPublisher.publish(
      EventTypes.PM_PHASE_CREATED,
      { phaseId: phase.id, projectId: phase.projectId, status: phase.status, phaseNumber: phase.phaseNumber },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )

    return { data: phase }
  }

  async list(workspaceId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, deletedAt: null },
      select: { id: true },
    })
    if (!project) throw new NotFoundException('Project not found')

    const phases = await this.prisma.phase.findMany({
      where: { projectId },
      orderBy: { phaseNumber: 'asc' },
    })

    return { data: phases }
  }

  async update(workspaceId: string, actorId: string, phaseId: string, dto: UpdatePhaseDto) {
    const existing = await this.prisma.phase.findFirst({
      where: {
        id: phaseId,
        project: { workspaceId, deletedAt: null },
      },
      select: { id: true, status: true, projectId: true, phaseNumber: true },
    })
    if (!existing) throw new NotFoundException('Phase not found')

    const nextStatus = dto.status ?? existing.status
    const statusChanged = dto.status !== undefined && dto.status !== existing.status

    if (statusChanged && !isValidTransition(existing.status, nextStatus)) {
      throw new BadRequestException(
        `Invalid phase transition: ${existing.status} -> ${nextStatus}`,
      )
    }

    const { phase, completedCurrentPhaseId } = await this.prisma.$transaction(async (tx) => {
      let completedId: string | null = null

      if (nextStatus === PhaseStatus.CURRENT && existing.status !== PhaseStatus.CURRENT) {
        const current = await tx.phase.findFirst({
          where: { projectId: existing.projectId, status: PhaseStatus.CURRENT },
          select: { id: true, status: true },
        })

        if (current && current.id !== existing.id) {
          await tx.phase.update({
            where: { id: current.id },
            data: { status: PhaseStatus.COMPLETED },
          })
          completedId = current.id
        }
      }

      const updated = await tx.phase.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          description: dto.description,
          phaseNumber: dto.phaseNumber,
          status: dto.status,
        },
      })

      return { phase: updated, completedCurrentPhaseId: completedId }
    })

    if (completedCurrentPhaseId) {
      await this.eventPublisher.publish(
        EventTypes.PM_PHASE_TRANSITIONED,
        {
          phaseId: completedCurrentPhaseId,
          projectId: existing.projectId,
          fromStatus: PhaseStatus.CURRENT,
          toStatus: PhaseStatus.COMPLETED,
        },
        { tenantId: workspaceId, userId: actorId, source: 'api' },
      )
    }

    if (statusChanged) {
      await this.eventPublisher.publish(
        EventTypes.PM_PHASE_TRANSITIONED,
        {
          phaseId: phase.id,
          projectId: phase.projectId,
          fromStatus: existing.status,
          toStatus: phase.status,
        },
        { tenantId: workspaceId, userId: actorId, source: 'api' },
      )
    } else {
      await this.eventPublisher.publish(
        EventTypes.PM_PHASE_UPDATED,
        { phaseId: phase.id, projectId: phase.projectId, status: phase.status, phaseNumber: phase.phaseNumber },
        { tenantId: workspaceId, userId: actorId, source: 'api' },
      )
    }

    return { data: phase }
  }
}
