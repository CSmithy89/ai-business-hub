import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { KnowledgePage } from '@prisma/client'
import { EventTypes } from '@hyvve/shared'
import { PrismaService } from '../../common/services/prisma.service'
import { EventPublisherService } from '../../events'
import { VerifyPageDto } from './dto/verify-page.dto'

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

    const days = parseInt(expiresIn) // '30d' -> 30
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
}
