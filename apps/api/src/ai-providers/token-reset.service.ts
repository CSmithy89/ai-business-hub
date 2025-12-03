import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/services/prisma.service';

/**
 * Service to handle daily token reset and cleanup tasks
 */
@Injectable()
export class TokenResetService {
  private readonly logger = new Logger(TokenResetService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Reset daily token counters at midnight UTC
   * Runs every day at 00:00 UTC
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailyTokens(): Promise<void> {
    this.logger.log('Starting daily token reset...');

    try {
      const result = await this.prisma.aIProviderConfig.updateMany({
        data: { tokensUsedToday: 0 },
      });

      this.logger.log(
        `Daily token reset complete. Reset ${result.count} provider(s).`
      );
    } catch (error) {
      this.logger.error('Failed to reset daily tokens', error);
      throw error;
    }
  }

  /**
   * Clean up old usage records (older than 90 days)
   * Runs weekly on Sunday at 02:00 UTC
   */
  @Cron('0 2 * * 0')
  async cleanupOldUsageRecords(): Promise<void> {
    this.logger.log('Starting old usage records cleanup...');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    try {
      const result = await this.prisma.tokenUsage.deleteMany({
        where: {
          requestedAt: { lt: cutoffDate },
        },
      });

      this.logger.log(
        `Cleanup complete. Deleted ${result.count} old usage record(s).`
      );
    } catch (error) {
      this.logger.error('Failed to cleanup old usage records', error);
      throw error;
    }
  }

  /**
   * Manual trigger for daily token reset (for testing/admin use)
   */
  async manualResetDailyTokens(): Promise<{ count: number }> {
    const result = await this.prisma.aIProviderConfig.updateMany({
      data: { tokensUsedToday: 0 },
    });

    this.logger.log(`Manual token reset complete. Reset ${result.count} provider(s).`);

    return { count: result.count };
  }

  /**
   * Reset tokens for a specific workspace
   */
  async resetWorkspaceTokens(workspaceId: string): Promise<{ count: number }> {
    const result = await this.prisma.aIProviderConfig.updateMany({
      where: { workspaceId },
      data: { tokensUsedToday: 0 },
    });

    this.logger.log(
      `Reset tokens for workspace ${workspaceId}. Reset ${result.count} provider(s).`
    );

    return { count: result.count };
  }
}
