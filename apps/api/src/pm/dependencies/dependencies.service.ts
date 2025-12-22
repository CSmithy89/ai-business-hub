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

      // 1. Fetch ALL lightweight relations matching the base criteria
      // We do this to handle cross-project filtering accurately before pagination
      // This is efficient enough for typical workspace sizes (<10k relations)
      const allRelations = await this.prisma.taskRelation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          sourceTask: { select: { projectId: true } },
          targetTask: { select: { projectId: true } },
        },
      })

      const crossProjectOnly = query.crossProjectOnly !== false

      // 2. Apply filtering in memory
      const filtered = crossProjectOnly
        ? allRelations.filter((relation) => {
            if (!relation.sourceTask.projectId || !relation.targetTask.projectId) return false
            return relation.sourceTask.projectId !== relation.targetTask.projectId
          })
        : allRelations

      // 3. Calculate pagination metadata based on filtered results
      const total = filtered.length
      const paginatedIds = filtered.slice(offset, offset + limit).map((r) => r.id)
      const hasMore = offset + limit < total

      // 4. Fetch full details for the current page
      const paged =
        paginatedIds.length > 0
          ? await this.prisma.taskRelation.findMany({
              where: { id: { in: paginatedIds } },
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
          : []

      // Restore order (database 'IN' query does not guarantee order)
      const pagedMap = new Map(paged.map((r) => [r.id, r]))
      const sortedPaged = paginatedIds
        .map((id) => pagedMap.get(id))
        .filter((r): r is typeof paged[0] => Boolean(r))

      const projectIds = Array.from(
        new Set(
          sortedPaged
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

      this.logger.log(`Dependencies list fetched in ${Date.now() - startTime}ms`, {
        count: sortedPaged.length,
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
          relations: sortedPaged.map((relation) => ({
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
