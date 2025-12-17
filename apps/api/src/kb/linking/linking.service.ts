import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { EventTypes } from '@hyvve/shared'
import { PrismaService } from '../../common/services/prisma.service'
import { EventPublisherService } from '../../events'
import { LinkProjectDto, UpdateLinkDto } from './dto/link-project.dto'

@Injectable()
export class LinkingService {
  private readonly logger = new Logger(LinkingService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async linkPageToProject(
    tenantId: string,
    workspaceId: string,
    pageId: string,
    actorId: string,
    dto: LinkProjectDto,
  ) {
    // Verify page exists
    const page = await this.prisma.knowledgePage.findFirst({
      where: { id: pageId, tenantId, workspaceId, deletedAt: null },
      select: { id: true, title: true, slug: true },
    })
    if (!page) throw new NotFoundException('Page not found')

    // Verify project exists and belongs to same workspace
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, workspaceId },
      select: { id: true, name: true, slug: true },
    })
    if (!project) throw new NotFoundException('Project not found')

    // Check if already linked
    const existing = await this.prisma.projectPage.findUnique({
      where: {
        projectId_pageId: {
          projectId: dto.projectId,
          pageId,
        },
      },
    })
    if (existing) {
      throw new ConflictException('Page is already linked to this project')
    }

    // Wrap in transaction to prevent race condition with primary flag
    let link: {
      id: string
      isPrimary: boolean
      project: { id: string; name: string; slug: string }
      page: { id: string; title: string; slug: string }
    }
    try {
      link = await this.prisma.$transaction(async (tx) => {
        // If setting as primary, unset any existing primary for this project
        if (dto.isPrimary) {
          await tx.projectPage.updateMany({
            where: { projectId: dto.projectId, isPrimary: true },
            data: { isPrimary: false },
          })
        }

        return tx.projectPage.create({
          data: {
            projectId: dto.projectId,
            pageId,
            isPrimary: dto.isPrimary ?? false,
            linkedBy: actorId,
          },
          include: {
            project: {
              select: { id: true, name: true, slug: true },
            },
            page: {
              select: { id: true, title: true, slug: true },
            },
          },
        })
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Project already has a primary page')
      }
      throw error
    }

    await this.eventPublisher.publish(
      EventTypes.KB_PAGE_LINKED_TO_PROJECT,
      {
        pageId,
        projectId: dto.projectId,
        linkId: link.id,
        isPrimary: link.isPrimary,
        linkedBy: actorId,
      },
      { tenantId, userId: actorId, source: 'api' },
    )

    return { data: link }
  }

  async unlinkPageFromProject(
    tenantId: string,
    workspaceId: string,
    pageId: string,
    projectId: string,
    actorId: string,
  ) {
    // Verify page exists (exclude soft-deleted)
    const page = await this.prisma.knowledgePage.findFirst({
      where: { id: pageId, tenantId, workspaceId, deletedAt: null },
      select: { id: true },
    })
    if (!page) throw new NotFoundException('Page not found')

    // Find the link
    const link = await this.prisma.projectPage.findUnique({
      where: {
        projectId_pageId: {
          projectId,
          pageId,
        },
      },
    })
    if (!link) {
      throw new NotFoundException('Page is not linked to this project')
    }

    await this.prisma.projectPage.delete({
      where: { id: link.id },
    })

    await this.eventPublisher.publish(
      EventTypes.KB_PAGE_UNLINKED_FROM_PROJECT,
      {
        pageId,
        projectId,
        linkId: link.id,
        unlinkedBy: actorId,
      },
      { tenantId, userId: actorId, source: 'api' },
    )

    return { data: { success: true } }
  }

  async updateLink(
    tenantId: string,
    workspaceId: string,
    pageId: string,
    projectId: string,
    actorId: string,
    dto: UpdateLinkDto,
  ) {
    // Verify page exists (exclude soft-deleted)
    const page = await this.prisma.knowledgePage.findFirst({
      where: { id: pageId, tenantId, workspaceId, deletedAt: null },
      select: { id: true },
    })
    if (!page) throw new NotFoundException('Page not found')

    // Find the link
    const link = await this.prisma.projectPage.findUnique({
      where: {
        projectId_pageId: {
          projectId,
          pageId,
        },
      },
    })
    if (!link) {
      throw new NotFoundException('Page is not linked to this project')
    }

    // Wrap in transaction to prevent race condition with primary flag
    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        // If setting as primary, unset any existing primary for this project
        if (dto.isPrimary) {
          await tx.projectPage.updateMany({
            where: { projectId, isPrimary: true, NOT: { id: link.id } },
            data: { isPrimary: false },
          })
        }

        return tx.projectPage.update({
          where: { id: link.id },
          data: {
            isPrimary: dto.isPrimary ?? link.isPrimary,
          },
          include: {
            project: {
              select: { id: true, name: true, slug: true },
            },
            page: {
              select: { id: true, title: true, slug: true },
            },
          },
        })
      })

      return { data: updated }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Project already has a primary page')
      }
      throw error
    }
  }

  async getLinkedProjects(
    tenantId: string,
    workspaceId: string,
    pageId: string,
  ) {
    // Verify page exists (exclude soft-deleted)
    const page = await this.prisma.knowledgePage.findFirst({
      where: { id: pageId, tenantId, workspaceId, deletedAt: null },
      select: { id: true },
    })
    if (!page) throw new NotFoundException('Page not found')

    const links = await this.prisma.projectPage.findMany({
      where: { pageId },
      include: {
        project: {
          select: { id: true, name: true, slug: true, status: true },
        },
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return { data: links }
  }

  async getLinkedPages(
    tenantId: string,
    workspaceId: string,
    projectId: string,
  ) {
    // Verify project exists
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId },
      select: { id: true },
    })
    if (!project) throw new NotFoundException('Project not found')

    const links = await this.prisma.projectPage.findMany({
      where: { projectId },
      include: {
        page: {
          select: {
            id: true,
            title: true,
            slug: true,
            updatedAt: true,
            contentText: true,
          },
        },
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return { data: links }
  }
}
