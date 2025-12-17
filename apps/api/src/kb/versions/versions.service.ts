import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

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
export class VersionsService {
  private readonly logger = new Logger(VersionsService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new version snapshot for a page
   * Called by PagesService when content changes or on manual save
   */
  async createVersion(
    tenantId: string,
    workspaceId: string,
    pageId: string,
    actorId: string,
    content: any,
    changeNote?: string,
  ) {
    // Verify page exists and belongs to tenant/workspace
    const page = await this.prisma.knowledgePage.findFirst({
      where: { id: pageId, tenantId, workspaceId, deletedAt: null },
      select: { id: true },
    })

    if (!page) {
      throw new NotFoundException('Page not found')
    }

    // Get the current max version number for this page
    const maxVersion = await this.prisma.pageVersion.findFirst({
      where: { pageId },
      orderBy: { version: 'desc' },
      select: { version: true },
    })

    const nextVersion = (maxVersion?.version || 0) + 1
    const contentText = extractPlainText(content)

    const version = await this.prisma.pageVersion.create({
      data: {
        pageId,
        version: nextVersion,
        content,
        contentText,
        changeNote: changeNote || null,
        createdById: actorId,
      },
    })

    return { data: version }
  }

  /**
   * List all versions for a page (paginated)
   */
  async listVersions(
    tenantId: string,
    workspaceId: string,
    pageId: string,
    limit: number = 20,
    offset: number = 0,
  ) {
    // Verify page exists and belongs to tenant/workspace
    const page = await this.prisma.knowledgePage.findFirst({
      where: { id: pageId, tenantId, workspaceId, deletedAt: null },
      select: { id: true },
    })

    if (!page) {
      throw new NotFoundException('Page not found')
    }

    const [versions, total] = await Promise.all([
      this.prisma.pageVersion.findMany({
        where: { pageId },
        orderBy: { version: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          version: true,
          changeNote: true,
          createdById: true,
          createdAt: true,
        },
      }),
      this.prisma.pageVersion.count({ where: { pageId } }),
    ])

    return {
      data: versions,
      meta: {
        total,
        limit,
        offset,
      },
    }
  }

  /**
   * Get a specific version by version number
   */
  async getVersion(
    tenantId: string,
    workspaceId: string,
    pageId: string,
    versionNumber: number,
  ) {
    // Verify page exists and belongs to tenant/workspace
    const page = await this.prisma.knowledgePage.findFirst({
      where: { id: pageId, tenantId, workspaceId, deletedAt: null },
      select: { id: true },
    })

    if (!page) {
      throw new NotFoundException('Page not found')
    }

    const version = await this.prisma.pageVersion.findUnique({
      where: {
        pageId_version: {
          pageId,
          version: versionNumber,
        },
      },
    })

    if (!version) {
      throw new NotFoundException(`Version ${versionNumber} not found`)
    }

    return { data: version }
  }

  /**
   * Restore a page to a specific version
   * This updates the page content and creates a new version
   */
  async restoreVersion(
    tenantId: string,
    workspaceId: string,
    pageId: string,
    versionNumber: number,
    actorId: string,
  ) {
    // Verify page exists and belongs to tenant/workspace
    const page = await this.prisma.knowledgePage.findFirst({
      where: { id: pageId, tenantId, workspaceId, deletedAt: null },
      select: { id: true, content: true },
    })

    if (!page) {
      throw new NotFoundException('Page not found')
    }

    // Get the version to restore
    const versionToRestore = await this.prisma.pageVersion.findUnique({
      where: {
        pageId_version: {
          pageId,
          version: versionNumber,
        },
      },
      select: {
        content: true,
        contentText: true,
      },
    })

    if (!versionToRestore) {
      throw new NotFoundException(`Version ${versionNumber} not found`)
    }

    // Check if the content is different (don't restore if identical)
    if (JSON.stringify(page.content) === JSON.stringify(versionToRestore.content)) {
      throw new BadRequestException('This version is identical to the current content')
    }

    // Perform restore in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update page with restored content
      const updatedPage = await tx.knowledgePage.update({
        where: { id: pageId },
        data: {
          content: versionToRestore.content as any,
          contentText: versionToRestore.contentText,
        },
      })

      // Create new version after restore
      const maxVersion = await tx.pageVersion.findFirst({
        where: { pageId },
        orderBy: { version: 'desc' },
        select: { version: true },
      })

      const nextVersion = (maxVersion?.version || 0) + 1

      await tx.pageVersion.create({
        data: {
          pageId,
          version: nextVersion,
          content: versionToRestore.content as any,
          contentText: versionToRestore.contentText,
          changeNote: `Restored from version ${versionNumber}`,
          createdById: actorId,
        },
      })

      // Log activity
      await tx.pageActivity.create({
        data: {
          pageId,
          userId: actorId,
          type: 'UPDATED',
          data: {
            restoredFromVersion: versionNumber,
            newVersion: nextVersion,
          },
        },
      })

      return updatedPage
    })

    return { data: result }
  }
}
