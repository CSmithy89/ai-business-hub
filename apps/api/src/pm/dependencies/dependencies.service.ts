import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../common/services/prisma.service'
import { DependenciesQueryDto } from './dto/dependencies-query.dto'

@Injectable()
export class DependenciesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string, query: DependenciesQueryDto) {
    const andFilters: Prisma.TaskRelationWhereInput[] = [
      { sourceTask: { workspaceId, deletedAt: null } },
      { targetTask: { workspaceId, deletedAt: null } },
    ]

    if (query.projectId) {
      andFilters.push({
        OR: [
          { sourceTask: { projectId: query.projectId } },
          { targetTask: { projectId: query.projectId } },
        ],
      })
    }

    const where: Prisma.TaskRelationWhereInput = {
      ...(query.relationType ? { relationType: query.relationType } : {}),
      AND: andFilters,
    }

    const relations = await this.prisma.taskRelation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 250,
      include: {
        sourceTask: {
          select: {
            id: true,
            taskNumber: true,
            title: true,
            projectId: true,
          },
        },
        targetTask: {
          select: {
            id: true,
            taskNumber: true,
            title: true,
            projectId: true,
          },
        },
      },
    })

    const crossProjectOnly = query.crossProjectOnly !== false

    const projectIds = Array.from(
      new Set(
        relations.flatMap((relation) => [
          relation.sourceTask.projectId,
          relation.targetTask.projectId,
        ])
      )
    )

    const projects = projectIds.length
      ? await this.prisma.project.findMany({
          where: { id: { in: projectIds } },
          select: { id: true, slug: true, name: true },
        })
      : []

    const projectMap = new Map(projects.map((project) => [project.id, project]))

    const filtered = crossProjectOnly
      ? relations.filter((relation) => relation.sourceTask.projectId !== relation.targetTask.projectId)
      : relations

    return {
      data: {
        total: filtered.length,
        relations: filtered.map((relation) => ({
          id: relation.id,
          relationType: relation.relationType,
          createdAt: relation.createdAt,
          source: {
            taskId: relation.sourceTask.id,
            taskNumber: relation.sourceTask.taskNumber,
            title: relation.sourceTask.title,
            projectId: relation.sourceTask.projectId,
            projectSlug: projectMap.get(relation.sourceTask.projectId)?.slug ?? '',
            projectName: projectMap.get(relation.sourceTask.projectId)?.name ?? '',
          },
          target: {
            taskId: relation.targetTask.id,
            taskNumber: relation.targetTask.taskNumber,
            title: relation.targetTask.title,
            projectId: relation.targetTask.projectId,
            projectSlug: projectMap.get(relation.targetTask.projectId)?.slug ?? '',
            projectName: projectMap.get(relation.targetTask.projectId)?.name ?? '',
          },
        })),
      },
    }
  }
}
