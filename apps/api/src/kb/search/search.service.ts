import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../common/services/prisma.service'
import { SearchQueryDto } from './dto/search-query.dto'
import { SemanticSearchDto } from './dto/semantic-search.dto'
import { EmbeddingsService } from '../embeddings/embeddings.service'
import { vectorToPgvectorText } from '../embeddings/embeddings.utils'

export interface SearchResult {
  pageId: string
  title: string
  slug: string
  snippet: string
  rank: number
  updatedAt: string
  path: string[]
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async search(
    tenantId: string,
    workspaceId: string,
    dto: SearchQueryDto,
  ): Promise<{ results: SearchResult[]; total: number }> {
    const { q, limit: rawLimit = 20, offset: rawOffset = 0 } = dto
    // Ensure limit and offset are integers for PostgreSQL
    const limit = Math.floor(rawLimit)
    const offset = Math.floor(rawOffset)

    try {
      // Use PostgreSQL full-text search with tsvector
      // ts_rank() provides relevance scoring
      // ts_headline() generates highlighted snippets
      const rawResults = await this.prisma.$queryRaw<
        Array<{
          id: string
          title: string
          slug: string
          snippet: string
          rank: number
          updated_at: Date
          parent_id: string | null
        }>
      >`
        WITH ranked_pages AS (
          SELECT
            id,
            title,
            slug,
            parent_id,
            updated_at,
            ts_rank(to_tsvector('english', content_text), plainto_tsquery('english', ${q})) AS rank,
            ts_headline(
              'english',
              content_text,
              plainto_tsquery('english', ${q}),
              'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20, MaxFragments=2, FragmentDelimiter=" ... "'
            ) AS snippet
          FROM knowledge_pages
          WHERE
            tenant_id = ${tenantId}
            AND workspace_id = ${workspaceId}
            AND deleted_at IS NULL
            AND to_tsvector('english', content_text) @@ plainto_tsquery('english', ${q})
          ORDER BY rank DESC, updated_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        )
        SELECT * FROM ranked_pages
      `

      // Get total count for pagination
      const countResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM knowledge_pages
        WHERE
          tenant_id = ${tenantId}
          AND workspace_id = ${workspaceId}
          AND deleted_at IS NULL
          AND to_tsvector('english', content_text) @@ plainto_tsquery('english', ${q})
      `

      const total = Number(countResult[0]?.count || 0)

      // Build breadcrumb paths for all results in a single batch query
      const pageIds = rawResults.map((r) => r.id)
      const breadcrumbMap = await this.buildBreadcrumbPathsBatch(
        tenantId,
        workspaceId,
        pageIds,
      )

      const results: SearchResult[] = rawResults.map((row) => {
        const path = breadcrumbMap.get(row.id) || []
        return {
          pageId: row.id,
          title: row.title,
          slug: row.slug,
          snippet: row.snippet,
          rank: Number(row.rank),
          updatedAt: row.updated_at.toISOString(),
          path: path.slice(0, -1), // Exclude current page from path
        }
      })

      this.logger.log(
        `Search for "${q}" returned ${results.length} results (${total} total)`,
      )

      return { results, total }
    } catch (error) {
      this.logger.error(`Search failed for query "${q}":`, error)
      throw error
    }
  }

  async semanticSearch(
    tenantId: string,
    workspaceId: string,
    dto: SemanticSearchDto,
  ): Promise<{ results: SearchResult[]; total: number }> {
    const { q, limit: rawLimit = 10, offset: rawOffset = 0 } = dto
    const limit = Math.floor(rawLimit)
    const offset = Math.max(0, Math.floor(rawOffset))

    const embedded = await this.embeddingsService.embedTextsForWorkspace(workspaceId, [q])
    if (!embedded) {
      throw new BadRequestException('No valid embeddings provider configured for semantic search')
    }

    const dims = this.embeddingsService.getEmbeddingDims()
    const queryVectorText = vectorToPgvectorText(embedded.embeddings[0] ?? [], dims)

    const rawResults = await this.prisma.$queryRaw<
      Array<{
        page_id: string
        title: string
        slug: string
        snippet: string
        distance: number
        updated_at: Date
      }>
    >`
      WITH best_chunk_per_page AS (
        SELECT
          pe.page_id,
          kp.title,
        kp.slug,
        kp.updated_at,
        pe.chunk_text AS snippet,
          (pe.embedding <=> ${queryVectorText}::vector(${dims})) AS distance,
          ROW_NUMBER() OVER (
            PARTITION BY pe.page_id
            ORDER BY (pe.embedding <=> ${queryVectorText}::vector(${dims})) ASC
          ) AS chunk_rank
        FROM page_embeddings pe
        INNER JOIN knowledge_pages kp ON kp.id = pe.page_id
        WHERE
          kp.tenant_id = ${tenantId}
          AND kp.workspace_id = ${workspaceId}
          AND kp.deleted_at IS NULL
      )
      SELECT page_id, title, slug, snippet, distance, updated_at
      FROM best_chunk_per_page
      WHERE chunk_rank = 1
      ORDER BY distance ASC, updated_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    const countResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT pe.page_id) as count
      FROM page_embeddings pe
      INNER JOIN knowledge_pages kp ON kp.id = pe.page_id
      WHERE
        kp.tenant_id = ${tenantId}
        AND kp.workspace_id = ${workspaceId}
        AND kp.deleted_at IS NULL
    `

      const total = Number(countResult[0]?.count || 0)
      const pageIds = rawResults.map((r) => r.page_id)
      const breadcrumbMap = await this.buildBreadcrumbPathsBatch(
        tenantId,
        workspaceId,
        pageIds,
      )

    const results: SearchResult[] = rawResults.map((row) => {
      const path = breadcrumbMap.get(row.page_id) || []
      const rank = 1 / (1 + Number(row.distance))
      return {
        pageId: row.page_id,
        title: row.title,
        slug: row.slug,
        snippet: row.snippet,
        rank,
        updatedAt: row.updated_at.toISOString(),
        path: path.slice(0, -1),
      }
    })

    this.logger.log(
      `Semantic search for "${q}" returned ${results.length} results (${total} total)`,
    )

    return { results, total }
  }

  /**
   * Build breadcrumb paths for multiple pages in a single batch query.
   * Fetches all necessary pages iteratively and builds paths in memory.
   */
  private async buildBreadcrumbPathsBatch(
    tenantId: string,
    workspaceId: string,
    pageIds: string[],
  ): Promise<Map<string, string[]>> {
    if (pageIds.length === 0) {
      return new Map()
    }

    const maxDepth = 10
    const uniquePageIds = Array.from(new Set(pageIds))

    const rows = await this.prisma.$queryRaw<
      Array<{ origin_id: string; path: string[] | null }>
    >(Prisma.sql`
      WITH RECURSIVE ancestors AS (
        SELECT
          kp.id,
          kp.title,
          kp.parent_id,
          kp.id AS origin_id,
          ARRAY[kp.id] AS visited,
          0 AS depth
        FROM knowledge_pages kp
        WHERE kp.id IN (${Prisma.join(uniquePageIds)})
          AND kp.tenant_id = ${tenantId}
          AND kp.workspace_id = ${workspaceId}
          AND kp.deleted_at IS NULL

        UNION ALL

        SELECT
          parent.id,
          parent.title,
          parent.parent_id,
          ancestors.origin_id,
          ancestors.visited || parent.id,
          ancestors.depth + 1
        FROM ancestors
        JOIN knowledge_pages parent ON parent.id = ancestors.parent_id
        WHERE ancestors.parent_id IS NOT NULL
          AND ancestors.depth < ${maxDepth}
          AND parent.tenant_id = ${tenantId}
          AND parent.workspace_id = ${workspaceId}
          AND parent.deleted_at IS NULL
          AND NOT (parent.id = ANY(ancestors.visited))
      )
      SELECT
        origin_id,
        ARRAY_AGG(title ORDER BY depth DESC) AS path
      FROM ancestors
      GROUP BY origin_id
    `)

    const result = new Map<string, string[]>()
    for (const row of rows) {
      result.set(row.origin_id, row.path ?? [])
    }

    // Ensure all requested ids exist in map (even if missing/deleted)
    for (const id of pageIds) {
      if (!result.has(id)) result.set(id, [])
    }

    return result
  }
}
