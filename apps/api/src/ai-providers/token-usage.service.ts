import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

/**
 * Record for tracking token usage
 */
export interface TokenUsageRecord {
  workspaceId: string;
  providerId: string;
  agentId?: string;
  sessionId?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  duration: number; // milliseconds
}

/**
 * Usage statistics for a workspace
 */
export interface UsageStats {
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCost: number;
  requestCount: number;
}

/**
 * Daily usage breakdown
 */
export interface DailyUsage {
  date: string;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
}

/**
 * Usage by agent breakdown
 */
export interface AgentUsage {
  agentId: string;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
}

/**
 * Provider pricing per million tokens (approximate)
 */
const PROVIDER_PRICING: Record<string, { input: number; output: number }> = {
  claude: { input: 3.0, output: 15.0 },
  openai: { input: 2.5, output: 10.0 },
  gemini: { input: 0.35, output: 1.05 },
  deepseek: { input: 0.14, output: 0.28 },
  openrouter: { input: 2.0, output: 8.0 }, // Variable, using average
};

@Injectable()
export class TokenUsageService {
  private readonly logger = new Logger(TokenUsageService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record token usage for a request
   */
  async recordUsage(record: TokenUsageRecord): Promise<void> {
    const totalTokens = record.promptTokens + record.completionTokens;

    // Get provider type for cost calculation
    const provider = await this.prisma.aIProviderConfig.findUnique({
      where: { id: record.providerId },
      select: { provider: true },
    });

    const pricing = provider ? PROVIDER_PRICING[provider.provider] : PROVIDER_PRICING.openai;
    const estimatedCost = this.calculateCost(
      record.promptTokens,
      record.completionTokens,
      pricing
    );

    // Record the usage
    await this.prisma.$transaction([
      // Create usage record
      this.prisma.tokenUsage.create({
        data: {
          workspaceId: record.workspaceId,
          providerId: record.providerId,
          agentId: record.agentId,
          sessionId: record.sessionId,
          model: record.model,
          promptTokens: record.promptTokens,
          completionTokens: record.completionTokens,
          totalTokens,
          estimatedCost,
          duration: record.duration,
          requestedAt: new Date(),
        },
      }),
      // Update daily counter on provider
      this.prisma.aIProviderConfig.update({
        where: { id: record.providerId },
        data: {
          tokensUsedToday: { increment: totalTokens },
        },
      }),
    ]);

    this.logger.debug(
      `Recorded ${totalTokens} tokens for workspace ${record.workspaceId}`
    );
  }

  /**
   * Get usage statistics for a workspace
   */
  async getWorkspaceUsage(
    workspaceId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageStats> {
    const where = {
      workspaceId,
      ...(startDate && endDate
        ? {
            requestedAt: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {}),
    };

    const result = await this.prisma.tokenUsage.aggregate({
      where,
      _sum: {
        totalTokens: true,
        promptTokens: true,
        completionTokens: true,
        estimatedCost: true,
      },
      _count: true,
    });

    return {
      totalTokens: result._sum.totalTokens ?? 0,
      totalPromptTokens: result._sum.promptTokens ?? 0,
      totalCompletionTokens: result._sum.completionTokens ?? 0,
      totalCost: result._sum.estimatedCost ?? 0,
      requestCount: result._count,
    };
  }

  /**
   * Get daily usage breakdown for a workspace
   */
  async getDailyUsage(
    workspaceId: string,
    days: number = 30
  ): Promise<DailyUsage[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const usage = await this.prisma.tokenUsage.groupBy({
      by: ['requestedAt'],
      where: {
        workspaceId,
        requestedAt: { gte: startDate },
      },
      _sum: {
        totalTokens: true,
        estimatedCost: true,
      },
      _count: true,
    });

    // Group by date (since requestedAt includes time)
    const dailyMap = new Map<string, DailyUsage>();

    for (const record of usage) {
      const dateStr = record.requestedAt.toISOString().split('T')[0];
      const existing = dailyMap.get(dateStr);

      if (existing) {
        existing.totalTokens += record._sum.totalTokens ?? 0;
        existing.totalCost += record._sum.estimatedCost ?? 0;
        existing.requestCount += record._count;
      } else {
        dailyMap.set(dateStr, {
          date: dateStr,
          totalTokens: record._sum.totalTokens ?? 0,
          totalCost: record._sum.estimatedCost ?? 0,
          requestCount: record._count,
        });
      }
    }

    // Convert to array and sort by date
    return Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }

  /**
   * Get usage breakdown by agent
   */
  async getUsageByAgent(workspaceId: string): Promise<AgentUsage[]> {
    const usage = await this.prisma.tokenUsage.groupBy({
      by: ['agentId'],
      where: {
        workspaceId,
        agentId: { not: null },
      },
      _sum: {
        totalTokens: true,
        estimatedCost: true,
      },
      _count: true,
    });

    return usage.map((record) => ({
      agentId: record.agentId!,
      totalTokens: record._sum.totalTokens ?? 0,
      totalCost: record._sum.estimatedCost ?? 0,
      requestCount: record._count,
    }));
  }

  /**
   * Get usage for a specific provider
   */
  async getProviderUsage(
    workspaceId: string,
    providerId: string
  ): Promise<UsageStats> {
    const result = await this.prisma.tokenUsage.aggregate({
      where: {
        workspaceId,
        providerId,
      },
      _sum: {
        totalTokens: true,
        promptTokens: true,
        completionTokens: true,
        estimatedCost: true,
      },
      _count: true,
    });

    return {
      totalTokens: result._sum.totalTokens ?? 0,
      totalPromptTokens: result._sum.promptTokens ?? 0,
      totalCompletionTokens: result._sum.completionTokens ?? 0,
      totalCost: result._sum.estimatedCost ?? 0,
      requestCount: result._count,
    };
  }

  /**
   * Check if provider has exceeded daily limit
   */
  async checkDailyLimit(providerId: string): Promise<{
    exceeded: boolean;
    used: number;
    limit: number;
    remaining: number;
  }> {
    const provider = await this.prisma.aIProviderConfig.findUnique({
      where: { id: providerId },
      select: {
        tokensUsedToday: true,
        maxTokensPerDay: true,
      },
    });

    if (!provider) {
      return { exceeded: true, used: 0, limit: 0, remaining: 0 };
    }

    const remaining = Math.max(0, provider.maxTokensPerDay - provider.tokensUsedToday);

    return {
      exceeded: provider.tokensUsedToday >= provider.maxTokensPerDay,
      used: provider.tokensUsedToday,
      limit: provider.maxTokensPerDay,
      remaining,
    };
  }

  /**
   * Calculate estimated cost based on tokens and pricing
   */
  private calculateCost(
    promptTokens: number,
    completionTokens: number,
    pricing: { input: number; output: number }
  ): number {
    const inputCost = (promptTokens / 1_000_000) * pricing.input;
    const outputCost = (completionTokens / 1_000_000) * pricing.output;
    return Math.round((inputCost + outputCost) * 10000) / 10000; // Round to 4 decimal places
  }
}
