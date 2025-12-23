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
      const limit = query.limit ?? 50
      const offset = query.offset ?? 0
      const crossProjectOnly = query.crossProjectOnly !== false

      let resultIds: string[] = []
      let total = 0

      if (crossProjectOnly) {
        // Optimized Raw SQL for Cross-Project Filtering
        // Prisma does not support comparing two fields in the same 'where' clause (source.projectId != target.projectId)
        // So we use raw SQL to push this filtering to the database level.
        
        const projectIdFilter = query.projectId
          ? Prisma.sql`AND (s.project_id = ${query.projectId} OR t.project_id = ${query.projectId})`
          : Prisma.sql``

        const relationTypeFilter = query.relationType
          ? Prisma.sql`AND r.relation_type = ${query.relationType}::"TaskRelationType"`
          : Prisma.sql``

        const rawRelations = await this.prisma.$queryRaw<{ id: string }[]>`
          SELECT r.id
          FROM task_relations r
          JOIN tasks s ON r.source_task_id = s.id
          JOIN tasks t ON r.target_task_id = t.id
          WHERE s.workspace_id = ${workspaceId}
            AND t.workspace_id = ${workspaceId}
            AND s.deleted_at IS NULL
            AND t.deleted_at IS NULL
            AND s.project_id != t.project_id
            ${projectIdFilter}
            ${relationTypeFilter}
          ORDER BY r.created_at DESC
        `
        
        resultIds = rawRelations.map((r) => r.id)
        total = resultIds.length
      } else {
        // Standard Prisma Query for All Relations (Intra + Cross)
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

        // Fetch ALL lightweight relations matching the base criteria
        // We do this to handle pagination accurately before fetching full details
        const allRelations = await this.prisma.taskRelation.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          select: { id: true },
        })
        
        resultIds = allRelations.map((r) => r.id)
        total = resultIds.length
      }

      // Pagination
      const paginatedIds = resultIds.slice(offset, offset + limit)
      const hasMore = offset + limit < total

      // Fetch full details for the current page
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
