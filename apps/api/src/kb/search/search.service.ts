import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'
import { SearchQueryDto } from './dto/search-query.dto'

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

  constructor(private readonly prisma: PrismaService) {}

  async search(
    tenantId: string,
    workspaceId: string,
    dto: SearchQueryDto,
  ): Promise<{ results: SearchResult[]; total: number }> {
    const { q, limit = 20, offset = 0 } = dto

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
              'MaxWords=50, MinWords=20, MaxFragments=2, FragmentDelimiter=" ... "'
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

      // Build breadcrumb paths for each result
      const results: SearchResult[] = await Promise.all(
        rawResults.map(async (row) => {
          const path = await this.buildBreadcrumbPath(row.id)
          return {
            pageId: row.id,
            title: row.title,
            slug: row.slug,
            snippet: row.snippet,
            rank: Number(row.rank),
            updatedAt: row.updated_at.toISOString(),
            path: path.slice(0, -1), // Exclude current page from path
          }
        }),
      )

      this.logger.log(
        `Search for "${q}" returned ${results.length} results (${total} total)`,
      )

      return { results, total }
    } catch (error) {
      this.logger.error(`Search failed for query "${q}":`, error)
      throw error
    }
  }

  private async buildBreadcrumbPath(pageId: string): Promise<string[]> {
    // Recursively build path from current page to root
    const path: string[] = []
    let currentId: string | null = pageId

    // Limit recursion depth to prevent infinite loops
    const maxDepth = 10
    let depth = 0

    while (currentId && depth < maxDepth) {
      const page: { title: string; parentId: string | null } | null =
        await this.prisma.knowledgePage.findUnique({
          where: { id: currentId },
          select: { title: true, parentId: true },
        })

      if (!page) break

      path.unshift(page.title)
      currentId = page.parentId
      depth += 1
    }

    return path
  }
}
