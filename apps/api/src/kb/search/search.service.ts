import { BadRequestException, Injectable, Logger } from '@nestjs/common'
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
      const breadcrumbMap = await this.buildBreadcrumbPathsBatch(pageIds)

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
    const offset = Math.floor(rawOffset)

    const embedded = await this.embeddingsService.embedTextsForWorkspace(workspaceId, [q])
    if (!embedded) {
      throw new BadRequestException('No valid embeddings provider configured for semantic search')
    }

    const queryVectorText = vectorToPgvectorText(embedded.embeddings[0] ?? [], 1536)

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
          (pe.embedding <=> ${queryVectorText}::vector(1536)) AS distance,
          ROW_NUMBER() OVER (
            PARTITION BY pe.page_id
            ORDER BY (pe.embedding <=> ${queryVectorText}::vector(1536)) ASC
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
    const breadcrumbMap = await this.buildBreadcrumbPathsBatch(pageIds)

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
    pageIds: string[],
  ): Promise<Map<string, string[]>> {
    if (pageIds.length === 0) {
      return new Map()
    }

    // Fetch initial pages and their parents
    const pageMap = new Map<string, { title: string; parentId: string | null }>()
    const idsToFetch = new Set(pageIds)
    const maxDepth = 10
    let depth = 0

    // Iteratively fetch pages until we have all ancestors or hit max depth
    while (idsToFetch.size > 0 && depth < maxDepth) {
      const ids = Array.from(idsToFetch)
      idsToFetch.clear()

      const pages = await this.prisma.knowledgePage.findMany({
        where: {
          id: { in: ids },
          deletedAt: null,
        },
        select: { id: true, title: true, parentId: true },
      })

      for (const page of pages) {
        if (!pageMap.has(page.id)) {
          pageMap.set(page.id, { title: page.title, parentId: page.parentId })
          // Queue parent for fetching if we haven't seen it yet
          if (page.parentId && !pageMap.has(page.parentId)) {
            idsToFetch.add(page.parentId)
          }
  }
}

      depth += 1
    }

    // Build breadcrumb paths from the fetched data
    const result = new Map<string, string[]>()

    for (const pageId of pageIds) {
      const path: string[] = []
      let currentId: string | null = pageId
      let pathDepth = 0
      const visited = new Set<string>()

      while (currentId && pathDepth < maxDepth) {
        if (visited.has(currentId)) break
        visited.add(currentId)

        const page = pageMap.get(currentId)
        if (!page) break

        path.unshift(page.title)
        currentId = page.parentId
        pathDepth += 1
      }

      result.set(pageId, path)
    }

    return result
  }
}
