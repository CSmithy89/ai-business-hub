import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { EventTypes } from '@hyvve/shared'
import { PrismaService } from '../../common/services/prisma.service'
import { EventPublisherService } from '../../events'
import { CreatePageDto } from './dto/create-page.dto'
import { ListPagesQueryDto } from './dto/list-pages.query.dto'
import { UpdatePageDto } from './dto/update-page.dto'

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

@Injectable()
export class PagesService {
  private readonly logger = new Logger(PagesService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  private async generateUniqueSlug(
    tenantId: string,
    workspaceId: string,
    title: string,
  ): Promise<string> {
    const base = slugify(title) || 'page'
    let candidate = base

    for (let attempt = 0; attempt < 100; attempt += 1) {
      const existing = await this.prisma.knowledgePage.findUnique({
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

  async create(
    tenantId: string,
    workspaceId: string,
    actorId: string,
    dto: CreatePageDto,
  ) {
    const slug = await this.generateUniqueSlug(tenantId, workspaceId, dto.title)

    const defaultContent = {
      type: 'doc',
      content: [],
    }

    const content = dto.content || defaultContent
    const contentText = extractPlainText(content)

    const page = await this.prisma.$transaction(async (tx) => {
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

    return { data: page }
  }

  async list(tenantId: string, workspaceId: string, query: ListPagesQueryDto) {
    const where: Prisma.KnowledgePageWhereInput = {
      tenantId,
      workspaceId,
      ...(query.includeDeleted ? {} : { deletedAt: null }),
      ...(query.parentId !== undefined ? { parentId: query.parentId } : {}),
    }

    if (query.flat) {
      // Return flat list
      const pages = await this.prisma.knowledgePage.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
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
      })

      return { data: pages }
    } else {
      // Return tree structure (root level only, client can fetch children)
      const pages = await this.prisma.knowledgePage.findMany({
        where: {
          ...where,
          parentId: query.parentId || null,
        },
        orderBy: { updatedAt: 'desc' },
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
      })

      return { data: pages }
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
      throw new NotFoundException('Page not found')
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
      select: { id: true, title: true, slug: true },
    })
    if (!existing) throw new NotFoundException('Page not found')

    const data: Prisma.KnowledgePageUpdateInput = {}

    // Update title and regenerate slug if title changed
    if (dto.title && dto.title !== existing.title) {
      data.title = dto.title
      data.slug = await this.generateUniqueSlug(tenantId, workspaceId, dto.title)
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
        data.parent = { connect: { id: dto.parentId } }
      }
    }

    const page = await this.prisma.$transaction(async (tx) => {
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

    return { data: page }
  }

  async remove(tenantId: string, workspaceId: string, actorId: string, id: string) {
    const existing = await this.prisma.knowledgePage.findFirst({
      where: { id, tenantId, workspaceId, deletedAt: null },
      select: { id: true, title: true, slug: true },
    })
    if (!existing) throw new NotFoundException('Page not found')

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

    if (!existing) throw new NotFoundException('Page not found')
    if (!existing.deletedAt) {
      throw new NotFoundException('Page is not deleted')
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

    if (!page) throw new NotFoundException('Page not found')

    const favoritedBy = page.favoritedBy || []
    const isFavorited = favoritedBy.includes(actorId)

    if (favorite && !isFavorited) {
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
}
