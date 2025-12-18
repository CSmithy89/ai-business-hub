import {
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
  Inject,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { EventTypes } from '@hyvve/shared'
import { PrismaService } from '../../common/services/prisma.service'
import { EventPublisherService } from '../../events'
import { CreatePageDto } from './dto/create-page.dto'
import { ListPagesQueryDto } from './dto/list-pages.query.dto'
import { UpdatePageDto } from './dto/update-page.dto'
import type { VersionsService } from '../versions/versions.service'
import { EmbeddingsService } from '../embeddings/embeddings.service'
import { KB_ERROR } from '../kb.errors'

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function extractPlainText(content: any): string {
  if (!content || typeof content !== 'object') return ''

  function traverse(node: any): string {
    if (node.text) return node.text
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(traverse).join(' ')
    }
    return ''
  }

  return traverse(content).trim()
}

const MAX_FAVORITED_BY_PER_PAGE = 10_000
const MAX_RELATED_PAGES_LIMIT = 20
const DEFAULT_RELATED_PAGES_LIMIT = 8

export type RelatedPageSuggestion = {
  pageId: string
  title: string
  slug: string
  snippet: string
  distance: number
  score: number
  updatedAt: string
}

@Injectable()
export class PagesService {
  private readonly logger = new Logger(PagesService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
    @Inject(forwardRef(() => 'VersionsService'))
    private readonly versionsService: VersionsService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  /**
   * Generate a unique slug within a transaction to prevent race conditions.
   * @param tx - Prisma transaction client (or PrismaService for non-transactional use)
   */
  private async generateUniqueSlug(
    tx: Prisma.TransactionClient | PrismaService,
    tenantId: string,
    workspaceId: string,
    title: string,
  ): Promise<string> {
    const base = slugify(title) || 'page'
    let candidate = base

    for (let attempt = 0; attempt < 100; attempt += 1) {
      const existing = await tx.knowledgePage.findUnique({
        where: {
          tenantId_workspaceId_slug: { tenantId, workspaceId, slug: candidate },
        },
        select: { id: true },
      })
      if (!existing) return candidate
      candidate = `${base}-${attempt + 2}`
    }

    // Extremely unlikely, but ensures we never loop forever
    return `${base}-${Date.now()}`
  }

  /**
   * Validate that setting a new parent doesn't create a circular reference.
   * Walks up the ancestor chain from the new parent to check if the page
   * being updated is found (which would create a cycle).
   *
   * @param tx - Prisma transaction client
   * @param pageId - The page being updated
   * @param newParentId - The proposed new parent ID
   * @throws BadRequestException if circular reference would be created
   */
  private async validateNoCircularReference(
    tx: Prisma.TransactionClient | PrismaService,
    pageId: string,
    newParentId: string,
  ): Promise<void> {
    // Cannot set self as parent
    if (pageId === newParentId) {
      throw new BadRequestException(KB_ERROR.PAGE_SELF_PARENT)
    }

    // Walk up the ancestor chain from the new parent
    let currentId: string | null = newParentId
    const visited = new Set<string>()

    while (currentId) {
      // Check for the page we're updating in the ancestor chain
      if (currentId === pageId) {
        throw new BadRequestException(
          KB_ERROR.PAGE_CIRCULAR_PARENT,
        )
      }

      // Prevent infinite loops from existing bad data
      if (visited.has(currentId)) {
        this.logger.error(`Circular reference detected in existing data: ${currentId}`)
        break
      }
      visited.add(currentId)

      // Get the parent of the current ancestor
      const ancestor: { parentId: string | null } | null = await tx.knowledgePage.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      })

      currentId = ancestor?.parentId ?? null
    }
  }

  async create(
    tenantId: string,
    workspaceId: string,
    actorId: string,
    dto: CreatePageDto,
  ) {
    const defaultContent = {
      type: 'doc',
      content: [],
    }

    const content = dto.content || defaultContent
    const contentText = extractPlainText(content)

    // Retry logic for race conditions on slug uniqueness
    const maxRetries = 3
    let lastError: unknown

    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
      try {
        const page = await this.prisma.$transaction(async (tx) => {
          // Generate slug inside transaction for atomicity
          const slug = await this.generateUniqueSlug(tx, tenantId, workspaceId, dto.title)

          const created = await tx.knowledgePage.create({
            data: {
              tenantId,
              workspaceId,
              slug,
              title: dto.title,
              parentId: dto.parentId || null,
              content,
              contentText,
              ownerId: actorId,
            },
          })

          // Create initial version
          await tx.pageVersion.create({
            data: {
              pageId: created.id,
              version: 1,
              content,
              contentText,
              changeNote: 'Initial version',
              createdById: actorId,
            },
          })

          // Create activity log
          await tx.pageActivity.create({
            data: {
              pageId: created.id,
              userId: actorId,
              type: 'CREATED',
            },
          })

          return created
        })

        // Success - publish event and return
        await this.eventPublisher.publish(
          EventTypes.KB_PAGE_CREATED,
          {
            pageId: page.id,
            workspaceId: page.workspaceId,
            title: page.title,
            slug: page.slug,
            ownerId: page.ownerId,
            parentId: page.parentId,
          },
          { tenantId, userId: actorId, source: 'api' },
        )

        this.embeddingsService
          .enqueuePageEmbeddings({
            tenantId,
            workspaceId,
            pageId: page.id,
            reason: 'created',
          })
          .catch((error) =>
            this.logger.error('Failed to enqueue KB embeddings job (create):', error),
          )

        return { data: page }
      } catch (error) {
        lastError = error
        // Check if it's a unique constraint violation on slug (Prisma error P2002)
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          (error.meta?.target as string[] | undefined)?.includes('slug')
        ) {
          this.logger.warn(
            `Slug collision on attempt ${attempt + 1}, retrying...`,
          )
          continue // Retry
        }
        throw error // Rethrow non-slug errors
      }
    }

    // All retries exhausted
    this.logger.error('Failed to create page after max retries', lastError)
    throw new ConflictException(KB_ERROR.SLUG_GENERATION_FAILED)
  }

  async list(tenantId: string, workspaceId: string, query: ListPagesQueryDto) {
    const page = query.page ?? 1
    const limit = Math.min(query.limit ?? 50, 100)
    const skip = (page - 1) * limit

    const where: Prisma.KnowledgePageWhereInput = {
      tenantId,
      workspaceId,
      ...(query.includeDeleted ? {} : { deletedAt: null }),
      ...(query.parentId !== undefined ? { parentId: query.parentId } : {}),
    }

    if (query.flat) {
      // Return flat list with pagination
      const [total, pages] = await this.prisma.$transaction([
        this.prisma.knowledgePage.count({ where }),
        this.prisma.knowledgePage.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            title: true,
            slug: true,
            parentId: true,
            ownerId: true,
            viewCount: true,
            lastViewedAt: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          },
        }),
      ])

      return {
        data: pages,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }
    } else {
      // Return tree structure with pagination (root level only)
      const treeWhere: Prisma.KnowledgePageWhereInput = {
        ...where,
        parentId: query.parentId || null,
      }

      const [total, pages] = await this.prisma.$transaction([
        this.prisma.knowledgePage.count({ where: treeWhere }),
        this.prisma.knowledgePage.findMany({
          where: treeWhere,
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            title: true,
            slug: true,
            parentId: true,
            ownerId: true,
            viewCount: true,
            lastViewedAt: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            children: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        }),
      ])

      return {
        data: pages,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }
    }
  }

  async findOne(tenantId: string, workspaceId: string, id: string, actorId: string) {
    const page = await this.prisma.knowledgePage.findFirst({
      where: { id, tenantId, workspaceId, deletedAt: null },
      include: {
        children: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        projects: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    if (!page) {
      throw new NotFoundException(KB_ERROR.PAGE_NOT_FOUND)
    }

    // Increment view count asynchronously (fire and forget)
    this.prisma.knowledgePage
      .update({
        where: { id },
        data: {
          viewCount: { increment: 1 },
          lastViewedAt: new Date(),
        },
      })
      .catch((err) => this.logger.error('Failed to update view count:', err))

    // Log activity
    this.prisma.pageActivity
      .create({
        data: {
          pageId: id,
          userId: actorId,
          type: 'VIEWED',
        },
      })
      .catch((err) => this.logger.error('Failed to log page view:', err))

    return { data: page }
  }

  async update(
    tenantId: string,
    workspaceId: string,
    actorId: string,
    id: string,
    dto: UpdatePageDto,
  ) {
    const existing = await this.prisma.knowledgePage.findFirst({
      where: { id, tenantId, workspaceId, deletedAt: null },
      select: { id: true, title: true, slug: true, content: true },
    })
    if (!existing) throw new NotFoundException(KB_ERROR.PAGE_NOT_FOUND)

    let contentChanged = false

    // Check if content changed
    if (dto.content) {
      contentChanged = JSON.stringify(existing.content) !== JSON.stringify(dto.content)
    }

    const page = await this.prisma.$transaction(async (tx) => {
      const data: Prisma.KnowledgePageUpdateInput = {}

      // Update title and regenerate slug if title changed
      if (dto.title && dto.title !== existing.title) {
        data.title = dto.title
        // Generate slug inside transaction for atomicity
        data.slug = await this.generateUniqueSlug(tx, tenantId, workspaceId, dto.title)
      }

      // Update content and extract plain text
      if (dto.content) {
        data.content = dto.content
        data.contentText = extractPlainText(dto.content)
      }

      // Update parent (use parent relation instead of parentId field)
      if (dto.parentId !== undefined) {
        if (dto.parentId === null) {
          data.parent = { disconnect: true }
        } else {
          // Validate no circular reference before setting new parent
          await this.validateNoCircularReference(tx, id, dto.parentId)
          data.parent = { connect: { id: dto.parentId } }
        }
      }

      const updated = await tx.knowledgePage.update({
        where: { id },
        data,
        include: {
          children: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          projects: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      })

      // Log activity
      await tx.pageActivity.create({
        data: {
          pageId: id,
          userId: actorId,
          type: 'UPDATED',
        },
      })

      return updated
    })

    // Create version if requested or if content changed significantly
    if (dto.createVersion && contentChanged && dto.content) {
      try {
        await this.versionsService.createVersion(
          tenantId,
          workspaceId,
          id,
          actorId,
          dto.content,
          dto.changeNote,
        )
      } catch (error) {
        this.logger.error('Failed to create version:', error)
        // Don't fail the update if version creation fails
      }
    }

    await this.eventPublisher.publish(
      EventTypes.KB_PAGE_UPDATED,
      {
        pageId: page.id,
        workspaceId: page.workspaceId,
        title: page.title,
        slug: page.slug,
      },
      { tenantId, userId: actorId, source: 'api' },
    )

    if (contentChanged) {
      this.embeddingsService
        .enqueuePageEmbeddings({
          tenantId,
          workspaceId,
          pageId: page.id,
          reason: 'updated',
        })
        .catch((error) =>
          this.logger.error('Failed to enqueue KB embeddings job (update):', error),
        )
    }

    return { data: page }
  }

  async remove(tenantId: string, workspaceId: string, actorId: string, id: string) {
    const existing = await this.prisma.knowledgePage.findFirst({
      where: { id, tenantId, workspaceId, deletedAt: null },
      select: { id: true, title: true, slug: true },
    })
    if (!existing) throw new NotFoundException(KB_ERROR.PAGE_NOT_FOUND)

    const page = await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.knowledgePage.update({
        where: { id },
        data: { deletedAt: new Date() },
        select: { id: true, deletedAt: true },
      })

      // Log activity
      await tx.pageActivity.create({
        data: {
          pageId: id,
          userId: actorId,
          type: 'DELETED',
        },
      })

      return deleted
    })

    await this.eventPublisher.publish(
      EventTypes.KB_PAGE_DELETED,
      {
        pageId: existing.id,
        workspaceId,
        title: existing.title,
        slug: existing.slug,
      },
      { tenantId, userId: actorId, source: 'api' },
    )

    return { data: page }
  }

  async restore(tenantId: string, workspaceId: string, actorId: string, id: string) {
    const existing = await this.prisma.knowledgePage.findFirst({
      where: { id, tenantId, workspaceId },
      select: { id: true, title: true, slug: true, deletedAt: true },
    })

    if (!existing) throw new NotFoundException(KB_ERROR.PAGE_NOT_FOUND)
    if (!existing.deletedAt) {
      throw new NotFoundException(KB_ERROR.PAGE_NOT_DELETED)
    }

    const page = await this.prisma.$transaction(async (tx) => {
      const restored = await tx.knowledgePage.update({
        where: { id },
        data: { deletedAt: null },
      })

      // Log activity
      await tx.pageActivity.create({
        data: {
          pageId: id,
          userId: actorId,
          type: 'RESTORED',
        },
      })

      return restored
    })

    await this.eventPublisher.publish(
      EventTypes.KB_PAGE_RESTORED,
      {
        pageId: existing.id,
        workspaceId,
        title: existing.title,
        slug: existing.slug,
      },
      { tenantId, userId: actorId, source: 'api' },
    )

    return { data: page }
  }

  async toggleFavorite(
    tenantId: string,
    workspaceId: string,
    actorId: string,
    id: string,
    favorite: boolean,
  ) {
    const page = await this.prisma.knowledgePage.findFirst({
      where: { id, tenantId, workspaceId, deletedAt: null },
      select: { id: true, favoritedBy: true },
    })

    if (!page) throw new NotFoundException(KB_ERROR.PAGE_NOT_FOUND)

    const favoritedBy = page.favoritedBy || []
    const isFavorited = favoritedBy.includes(actorId)

    if (favorite && !isFavorited) {
      if (favoritedBy.length >= MAX_FAVORITED_BY_PER_PAGE) {
        throw new BadRequestException(KB_ERROR.PAGE_MAX_FAVORITES)
      }
      // Add to favorites
      await this.prisma.knowledgePage.update({
        where: { id },
        data: {
          favoritedBy: [...favoritedBy, actorId],
        },
      })
    } else if (!favorite && isFavorited) {
      // Remove from favorites
      await this.prisma.knowledgePage.update({
        where: { id },
        data: {
          favoritedBy: favoritedBy.filter((uid) => uid !== actorId),
        },
      })
    }

    return { data: { success: true } }
  }

  async getRecentPages(tenantId: string, workspaceId: string, actorId: string, limit = 10) {
    // Get pages that the user has recently viewed
    const recentActivities = await this.prisma.pageActivity.findMany({
      where: {
        userId: actorId,
        type: 'VIEWED',
        page: {
          tenantId,
          workspaceId,
          deletedAt: null,
        },
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['pageId'],
      take: limit,
      select: {
        pageId: true,
        createdAt: true,
        page: {
          select: {
            id: true,
            title: true,
            slug: true,
            parentId: true,
            updatedAt: true,
          },
        },
      },
    })

    const pages = recentActivities.map((activity) => ({
      ...activity.page,
      lastViewedAt: activity.createdAt,
    }))

    return { data: pages }
  }

  async getFavorites(tenantId: string, workspaceId: string, actorId: string) {
    const pages = await this.prisma.knowledgePage.findMany({
      where: {
        tenantId,
        workspaceId,
        deletedAt: null,
        favoritedBy: { has: actorId },
      },
      orderBy: { title: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        parentId: true,
        updatedAt: true,
        favoritedBy: true,
      },
    })

    // Add isFavorited flag (always true for this query, but useful for consistency)
    const pagesWithFavorite = pages.map((page) => ({
      ...page,
      isFavorited: true,
    }))

    return { data: pagesWithFavorite }
  }

  async getRelatedPages(
    tenantId: string,
    workspaceId: string,
    pageId: string,
    limit: number = DEFAULT_RELATED_PAGES_LIMIT,
  ): Promise<{ data: RelatedPageSuggestion[] }> {
    const clampedLimit = Math.min(Math.max(Math.floor(limit), 1), MAX_RELATED_PAGES_LIMIT)

    const exists = await this.prisma.knowledgePage.findFirst({
      where: { id: pageId, tenantId, workspaceId, deletedAt: null },
      select: { id: true },
    })
    if (!exists) throw new NotFoundException(KB_ERROR.PAGE_NOT_FOUND)

    const rows = await this.prisma.$queryRaw<
      Array<{
        page_id: string
        title: string
        slug: string
        snippet: string
        distance: number
        updated_at: Date
      }>
    >`
      WITH source AS (
        SELECT embedding
        FROM page_embeddings
        WHERE page_id = ${pageId}
        ORDER BY chunk_index ASC
        LIMIT 1
      ),
      best_chunk_per_page AS (
        SELECT
          pe.page_id,
          kp.title,
          kp.slug,
          kp.updated_at,
          pe.chunk_text AS snippet,
          (pe.embedding <=> source.embedding) AS distance,
          ROW_NUMBER() OVER (
            PARTITION BY pe.page_id
            ORDER BY (pe.embedding <=> source.embedding) ASC
          ) AS chunk_rank
        FROM source
        INNER JOIN page_embeddings pe ON true
        INNER JOIN knowledge_pages kp ON kp.id = pe.page_id
        WHERE
          kp.tenant_id = ${tenantId}
          AND kp.workspace_id = ${workspaceId}
          AND kp.deleted_at IS NULL
          AND pe.page_id <> ${pageId}
      )
      SELECT page_id, title, slug, snippet, distance, updated_at
      FROM best_chunk_per_page
      WHERE chunk_rank = 1
      ORDER BY distance ASC, updated_at DESC
      LIMIT ${clampedLimit}
    `

    const data: RelatedPageSuggestion[] = rows.map((row) => {
      const distance = Number(row.distance)
      const score = 1 / (1 + distance)
      return {
        pageId: row.page_id,
        title: row.title,
        slug: row.slug,
        snippet: row.snippet,
        distance,
        score,
        updatedAt: row.updated_at.toISOString(),
      }
    })

    return { data }
  }
}
