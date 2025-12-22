import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../common/services/prisma.service'
import { DependenciesQueryDto } from './dto/dependencies-query.dto'

@Injectable()
export class DependenciesService {
  private readonly logger = new Logger(DependenciesService.name)

  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string, query: DependenciesQueryDto) {
    const startTime = Date.now()
    this.logger.log(`Fetching dependencies list for workspace ${workspaceId}`)

    try {
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

      const limit = query.limit ?? 50
      const offset = query.offset ?? 0

      // 1. Get total count for pagination metadata
      const total = await this.prisma.taskRelation.count({ where })

      // 2. Fetch paged results directly from DB
      const relations = await this.prisma.taskRelation.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
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

      // Note: Strict cross-project filtering is applied after pagination because
      // Prisma findMany does not support field-to-field comparison in where clause.
      // This may result in fewer than 'limit' items being returned if many are intra-project.
      const filtered = crossProjectOnly
        ? relations.filter((relation) => {
            if (!relation.sourceTask.projectId || !relation.targetTask.projectId) return false
            return relation.sourceTask.projectId !== relation.targetTask.projectId
          })
        : relations

      const paged = filtered // Already paged in DB

      const projectIds = Array.from(
        new Set(
          paged
            .flatMap((relation) => [relation.sourceTask.projectId, relation.targetTask.projectId])
            .filter((id): id is string => Boolean(id))
        )
      )

      const projects = projectIds.length
        ? await this.prisma.project.findMany({
            where: { id: { in: projectIds }, workspaceId },
            select: { id: true, slug: true, name: true },
        })
        : []

      const projectMap = new Map(projects.map((project) => [project.id, project]))

      // hasMore calculation based on total count
      const hasMore = offset + limit < total

      this.logger.log(`Dependencies list fetched in ${Date.now() - startTime}ms`, {
        count: filtered.length,
        total,
      })

      return {
        data: {
          total,
          meta: {
            total,
            limit,
            offset,
            hasMore,
          },
          relations: paged.map((relation) => ({
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
    } catch (error) {
      this.logger.error('Error fetching dependencies', error)
      throw error
    }
  }
}
