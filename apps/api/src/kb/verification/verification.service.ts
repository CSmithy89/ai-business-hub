import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { KnowledgePage } from '@prisma/client'
import { EventTypes } from '@hyvve/shared'
import { PrismaService } from '../../common/services/prisma.service'
import { EventPublisherService } from '../../events'
import { VerifyPageDto } from './dto/verify-page.dto'

// Stale content detection thresholds
const STALE_DAYS_THRESHOLD = 90
const LOW_VIEW_THRESHOLD = 5

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  /**
   * Calculate expiration date based on period
   */
  private calculateExpirationDate(expiresIn: string): Date | null {
    if (expiresIn === 'never') return null

    const days = parseInt(expiresIn, 10) // '30d' -> 30
    if (isNaN(days) || days <= 0) {
      throw new BadRequestException('Invalid expiration period')
    }
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + days)
    return expiry
  }

  /**
   * Mark a page as verified with expiration period
   */
  async markVerified(
    pageId: string,
    userId: string,
    dto: VerifyPageDto,
  ): Promise<KnowledgePage> {
    // Find page and verify it exists
    const page = await this.prisma.knowledgePage.findUnique({
      where: { id: pageId },
      select: {
        id: true,
        workspaceId: true,
        tenantId: true,
        deletedAt: true,
        isVerified: true,
        verifyExpires: true,
      },
    })

    if (!page || page.deletedAt) {
      throw new NotFoundException('Page not found')
    }

    // Calculate expiration date
    const verifyExpires = this.calculateExpirationDate(dto.expiresIn)

    // Update page with verification fields
    const updated = await this.prisma.knowledgePage.update({
      where: { id: pageId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedById: userId,
        verifyExpires,
      },
    })

    // Log activity
    await this.prisma.pageActivity.create({
      data: {
        pageId,
        userId,
        type: 'VERIFIED',
        data: {
          expiresIn: dto.expiresIn,
          verifyExpires: verifyExpires?.toISOString() ?? null,
          isReVerification: page.isVerified,
          previousExpiry: page.verifyExpires?.toISOString() ?? null,
        },
      },
    })

    // Publish event
    await this.eventPublisher.publish(
      EventTypes.KB_PAGE_VERIFIED,
      {
        pageId,
        workspaceId: page.workspaceId,
        tenantId: page.tenantId,
        verifiedById: userId,
        verifiedAt: updated.verifiedAt?.toISOString() ?? new Date().toISOString(),
        verifyExpires: verifyExpires?.toISOString() ?? null,
      },
      {
        tenantId: page.tenantId,
        userId,
        source: 'kb-verification',
      },
    )

    this.logger.log(
      `Page ${pageId} verified by user ${userId} with expiration: ${dto.expiresIn}`,
    )

    return updated
  }

  /**
   * Remove verification status from a page
   */
  async removeVerification(
    pageId: string,
    userId: string,
  ): Promise<KnowledgePage> {
    // Find page and verify it exists
    const page = await this.prisma.knowledgePage.findUnique({
      where: { id: pageId },
      select: {
        id: true,
        workspaceId: true,
        tenantId: true,
        deletedAt: true,
      },
    })

    if (!page || page.deletedAt) {
      throw new NotFoundException('Page not found')
    }

    // Clear verification fields
    const updated = await this.prisma.knowledgePage.update({
      where: { id: pageId },
      data: {
        isVerified: false,
        verifiedAt: null,
        verifiedById: null,
        verifyExpires: null,
      },
    })

    // Log activity
    await this.prisma.pageActivity.create({
      data: {
        pageId,
        userId,
        type: 'UNVERIFIED',
      },
    })

    // Publish event
    await this.eventPublisher.publish(
      EventTypes.KB_PAGE_UNVERIFIED,
      {
        pageId,
        workspaceId: page.workspaceId,
        tenantId: page.tenantId,
      },
      {
        tenantId: page.tenantId,
        userId,
        source: 'kb-verification',
      },
    )

    this.logger.log(`Page ${pageId} unverified by user ${userId}`)

    return updated
  }

  /**
   * Get all stale pages needing review
   * Returns pages meeting one or more of these criteria:
   * 1. Expired verification (isVerified=true AND verifyExpires <= now())
   * 2. Not updated in STALE_DAYS_THRESHOLD+ days
   * 3. Low view count (viewCount < LOW_VIEW_THRESHOLD)
   *
   * Each page is annotated with an array of reasons for staleness
   */
  async getStalPages(workspaceId: string) {
    const now = new Date()
    const staleCutoffDate = new Date()
    staleCutoffDate.setDate(staleCutoffDate.getDate() - STALE_DAYS_THRESHOLD)

    const pages = await this.prisma.knowledgePage.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        OR: [
          // Expired verification
          {
            isVerified: true,
            verifyExpires: { lte: now },
          },
          // Not updated in STALE_DAYS_THRESHOLD+ days
          {
            updatedAt: { lte: staleCutoffDate },
          },
          // Low view count
          {
            viewCount: { lt: LOW_VIEW_THRESHOLD },
          },
        ],
      },
      orderBy: { updatedAt: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        updatedAt: true,
        viewCount: true,
        isVerified: true,
        verifyExpires: true,
        ownerId: true,
      },
    })

    // Fetch owner details for all pages
    const ownerIds = [...new Set(pages.map((p) => p.ownerId))]
    const owners = await this.prisma.user.findMany({
      where: { id: { in: ownerIds } },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    })

    const ownersMap = new Map(owners.map((o) => [o.id, o]))

    // Annotate each page with reasons for staleness and owner details
    return pages.map((page) => {
      const reasons: string[] = []

      if (page.isVerified && page.verifyExpires && page.verifyExpires <= now) {
        reasons.push('Expired verification')
      }

      if (page.updatedAt <= staleCutoffDate) {
        reasons.push(`Not updated in ${STALE_DAYS_THRESHOLD}+ days`)
      }

      if (page.viewCount < LOW_VIEW_THRESHOLD) {
        reasons.push('Low view count')
      }

      const owner = ownersMap.get(page.ownerId)

      return {
        ...page,
        owner: owner
          ? {
              id: owner.id,
              name: owner.name || 'Unknown User',
              email: owner.email,
              avatarUrl: owner.image || null,
            }
          : {
              id: page.ownerId,
              name: 'Unknown User',
              email: '',
              avatarUrl: null,
            },
        reasons,
      }
    })
  }

  /**
   * Bulk verify multiple pages with same expiration period
   * Uses Promise.allSettled to handle partial failures gracefully
   */
  async bulkVerify(
    pageIds: string[],
    userId: string,
    expiresIn: string,
  ): Promise<{
    success: number
    failed: number
    results: PromiseSettledResult<KnowledgePage>[]
  }> {
    const dto: VerifyPageDto = { expiresIn: expiresIn as '30d' | '60d' | '90d' | 'never' }

    const results = await Promise.allSettled(
      pageIds.map((pageId) => this.markVerified(pageId, userId, dto)),
    )

    const success = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    this.logger.log(
      `Bulk verify completed: ${success} succeeded, ${failed} failed out of ${pageIds.length} pages`,
    )

    return { success, failed, results }
  }

  /**
   * Bulk delete multiple pages (soft delete)
   * Uses Promise.allSettled to handle partial failures gracefully
   */
  async bulkDelete(
    pageIds: string[],
    tenantId: string,
    workspaceId: string,
    userId: string,
  ): Promise<{
    success: number
    failed: number
    results: PromiseSettledResult<any>[]
  }> {
    const results = await Promise.allSettled(
      pageIds.map(async (pageId) => {
        // Verify page exists and is not already deleted
        const page = await this.prisma.knowledgePage.findFirst({
          where: { id: pageId, tenantId, workspaceId, deletedAt: null },
          select: { id: true, title: true, slug: true },
        })

        if (!page) {
          throw new NotFoundException(`Page ${pageId} not found`)
        }

        // Soft delete the page
        const deleted = await this.prisma.$transaction(async (tx) => {
          const updated = await tx.knowledgePage.update({
            where: { id: pageId },
            data: { deletedAt: new Date() },
            select: { id: true, deletedAt: true },
          })

          // Log activity
          await tx.pageActivity.create({
            data: {
              pageId,
              userId,
              type: 'DELETED',
            },
          })

          return updated
        })

        // Publish event
        await this.eventPublisher.publish(
          EventTypes.KB_PAGE_DELETED,
          {
            pageId: page.id,
            workspaceId,
            title: page.title,
            slug: page.slug,
          },
          { tenantId, userId, source: 'kb-verification' },
        )

        return deleted
      }),
    )

    const success = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    this.logger.log(
      `Bulk delete completed: ${success} succeeded, ${failed} failed out of ${pageIds.length} pages`,
    )

    return { success, failed, results }
  }
}
