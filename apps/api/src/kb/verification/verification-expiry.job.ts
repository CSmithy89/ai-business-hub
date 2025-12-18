import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { EventTypes } from '@hyvve/shared'
import { PrismaService } from '../../common/services/prisma.service'
import { EventPublisherService } from '../../events'

/**
 * Daily cron job to detect and process expired page verifications
 * Runs at midnight UTC to flag pages whose verification has expired
 */
@Injectable()
export class VerificationExpiryJob {
  private readonly logger = new Logger(VerificationExpiryJob.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  /**
   * Check for expired verifications daily at midnight
   * Finds pages with isVerified=true AND verifyExpires <= NOW()
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpirations(): Promise<void> {
    this.logger.log('Starting daily verification expiration check...')

    const now = new Date()

    try {
      // Find pages with expired verification
      const expiredPages = await this.prisma.knowledgePage.findMany({
        where: {
          isVerified: true,
          verifyExpires: {
            lte: now,
            not: null,
          },
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          workspaceId: true,
          tenantId: true,
          ownerId: true,
          verifyExpires: true,
          isVerified: true,
        },
      })

      this.logger.log(`Found ${expiredPages.length} expired page verification(s)`)

      // Process each expired page
      for (const page of expiredPages) {
        try {
          // Create PageActivity entry
          await this.prisma.pageActivity.create({
            data: {
              pageId: page.id,
              userId: 'system',
              type: 'VERIFICATION_EXPIRED',
              data: {
                title: page.title,
                slug: page.slug,
                expiredAt: now.toISOString(),
                verifyExpires: page.verifyExpires?.toISOString() ?? null,
              },
            },
          })

          // Publish kb.page.verification_expired event
          await this.eventPublisher.publish(
            EventTypes.KB_PAGE_VERIFICATION_EXPIRED,
            {
              pageId: page.id,
              workspaceId: page.workspaceId,
              ownerId: page.ownerId,
            },
            {
              tenantId: page.tenantId,
              userId: 'system',
              source: 'kb-verification-expiry-job',
            },
          )

          this.logger.debug(
            `Processed expired verification for page ${page.id} (${page.title})`,
          )
        } catch (error) {
          // Log error but continue processing remaining pages
          this.logger.error(
            `Failed to process expired verification for page ${page.id}: ${error}`,
            error instanceof Error ? error.stack : undefined,
          )
        }
      }

      this.logger.log(
        `Verification expiration check complete. Processed ${expiredPages.length} page(s).`,
      )
    } catch (error) {
      this.logger.error(
        'Failed to check for expired verifications',
        error instanceof Error ? error.stack : undefined,
      )
      throw error
    }
  }
}
