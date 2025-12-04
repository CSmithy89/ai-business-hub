import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { EventTypes } from '@hyvve/shared';

/**
 * Token limit status result
 */
export interface TokenLimitStatus {
  providerId: string;
  provider: string;
  tokensUsed: number;
  maxTokens: number;
  remaining: number;
  percentageUsed: number;
  isWarning: boolean;
  isExceeded: boolean;
}

/**
 * Token limit enforcement error
 */
export class TokenLimitExceededError extends HttpException {
  public readonly limitStatus: TokenLimitStatus;

  constructor(limitStatus: TokenLimitStatus) {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: `Daily token limit exceeded for ${limitStatus.provider}. Used ${limitStatus.tokensUsed.toLocaleString()} of ${limitStatus.maxTokens.toLocaleString()} tokens.`,
        error: 'Token Limit Exceeded',
        details: {
          provider: limitStatus.provider,
          tokensUsed: limitStatus.tokensUsed,
          maxTokens: limitStatus.maxTokens,
          percentageUsed: limitStatus.percentageUsed,
        },
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
    this.limitStatus = limitStatus;
  }
}

/**
 * Warning threshold percentage (80%)
 */
const WARNING_THRESHOLD = 80;

@Injectable()
export class TokenLimitService {
  private readonly logger = new Logger(TokenLimitService.name);

  /**
   * Track which providers have already had warnings emitted today
   * to prevent spamming events
   */
  private readonly warningEmittedToday = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  /**
   * Check token limit status for a provider
   */
  async checkLimitStatus(providerId: string): Promise<TokenLimitStatus> {
    const provider = await this.prisma.aIProviderConfig.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        provider: true,
        tokensUsedToday: true,
        maxTokensPerDay: true,
        workspaceId: true,
      },
    });

    if (!provider) {
      return {
        providerId,
        provider: 'unknown',
        tokensUsed: 0,
        maxTokens: 0,
        remaining: 0,
        percentageUsed: 100,
        isWarning: true,
        isExceeded: true,
      };
    }

    const percentageUsed = provider.maxTokensPerDay > 0
      ? Math.round((provider.tokensUsedToday / provider.maxTokensPerDay) * 100)
      : 0;

    const remaining = Math.max(0, provider.maxTokensPerDay - provider.tokensUsedToday);

    return {
      providerId: provider.id,
      provider: provider.provider,
      tokensUsed: provider.tokensUsedToday,
      maxTokens: provider.maxTokensPerDay,
      remaining,
      percentageUsed,
      isWarning: percentageUsed >= WARNING_THRESHOLD && percentageUsed < 100,
      isExceeded: percentageUsed >= 100,
    };
  }

  /**
   * Enforce token limit before making an AI request.
   * Throws TokenLimitExceededError if limit is exceeded.
   * Emits warning event at 80% threshold.
   *
   * NOTE: This is soft enforcement for usage tracking, not a security boundary.
   * There is a small window between check and token recording where concurrent
   * requests could slip through. This is intentional - going slightly over the
   * daily limit is acceptable, and adding Redis atomic operations would add
   * unnecessary complexity for a non-critical advisory feature.
   */
  async enforceLimit(
    providerId: string,
    workspaceId: string,
    userId: string,
    estimatedTokens?: number,
  ): Promise<TokenLimitStatus> {
    const status = await this.checkLimitStatus(providerId);

    // Check if limit would be exceeded with estimated tokens
    if (estimatedTokens && status.remaining < estimatedTokens) {
      await this.emitLimitExceededEvent(status, workspaceId, userId, estimatedTokens);
      throw new TokenLimitExceededError(status);
    }

    // Check if already exceeded
    if (status.isExceeded) {
      await this.emitLimitExceededEvent(status, workspaceId, userId);
      throw new TokenLimitExceededError(status);
    }

    // Emit warning at 80% threshold (only once per day per provider)
    if (status.isWarning && !this.warningEmittedToday.has(providerId)) {
      await this.emitWarningEvent(status, workspaceId, userId);
      this.warningEmittedToday.add(providerId);
    }

    return status;
  }

  /**
   * Get limit status for all providers in a workspace
   */
  async getWorkspaceLimitStatus(workspaceId: string): Promise<TokenLimitStatus[]> {
    const providers = await this.prisma.aIProviderConfig.findMany({
      where: { workspaceId },
      select: {
        id: true,
        provider: true,
        tokensUsedToday: true,
        maxTokensPerDay: true,
      },
    });

    return providers.map((provider) => {
      const percentageUsed = provider.maxTokensPerDay > 0
        ? Math.round((provider.tokensUsedToday / provider.maxTokensPerDay) * 100)
        : 0;

      const remaining = Math.max(0, provider.maxTokensPerDay - provider.tokensUsedToday);

      return {
        providerId: provider.id,
        provider: provider.provider,
        tokensUsed: provider.tokensUsedToday,
        maxTokens: provider.maxTokensPerDay,
        remaining,
        percentageUsed,
        isWarning: percentageUsed >= WARNING_THRESHOLD && percentageUsed < 100,
        isExceeded: percentageUsed >= 100,
      };
    });
  }

  /**
   * Update the daily token limit for a provider
   */
  async updateLimit(providerId: string, maxTokensPerDay: number): Promise<void> {
    await this.prisma.aIProviderConfig.update({
      where: { id: providerId },
      data: { maxTokensPerDay },
    });

    this.logger.log(`Updated token limit for provider ${providerId} to ${maxTokensPerDay}`);
  }

  /**
   * Clear warning cache (called by token reset cron)
   */
  clearWarningCache(): void {
    this.warningEmittedToday.clear();
    this.logger.debug('Cleared token limit warning cache');
  }

  /**
   * Emit warning event at 80% threshold
   */
  private async emitWarningEvent(
    status: TokenLimitStatus,
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    try {
      await this.eventPublisher.publish(
        EventTypes.TOKEN_LIMIT_WARNING,
        {
          providerId: status.providerId,
          provider: status.provider,
          tokensUsed: status.tokensUsed,
          maxTokens: status.maxTokens,
          percentageUsed: status.percentageUsed,
          threshold: WARNING_THRESHOLD,
        },
        {
          tenantId: workspaceId,
          userId,
          source: 'ai-providers',
        },
      );

      this.logger.warn(
        `Token limit warning for ${status.provider}: ${status.percentageUsed}% used`,
      );
    } catch (error) {
      // Log but don't fail the request
      this.logger.error(
        `Failed to emit token limit warning event: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Emit limit exceeded event
   */
  private async emitLimitExceededEvent(
    status: TokenLimitStatus,
    workspaceId: string,
    userId: string,
    requestedTokens?: number,
  ): Promise<void> {
    try {
      await this.eventPublisher.publish(
        EventTypes.TOKEN_LIMIT_EXCEEDED,
        {
          providerId: status.providerId,
          provider: status.provider,
          tokensUsed: status.tokensUsed,
          maxTokens: status.maxTokens,
          requestedTokens,
        },
        {
          tenantId: workspaceId,
          userId,
          source: 'ai-providers',
        },
      );

      this.logger.warn(
        `Token limit exceeded for ${status.provider}: ${status.tokensUsed}/${status.maxTokens}`,
      );
    } catch (error) {
      // Log but don't fail - the limit enforcement should still work
      this.logger.error(
        `Failed to emit token limit exceeded event: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
