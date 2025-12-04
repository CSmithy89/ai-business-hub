import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/services/prisma.service';
import { AIProviderFactory } from './ai-provider-factory.service';

/**
 * Health check result for a provider
 */
export interface HealthCheckResult {
  providerId: string;
  provider: string;
  isValid: boolean;
  latency?: number;
  error?: string;
  checkedAt: Date;
}

/**
 * Health status summary for a workspace
 */
export interface HealthSummary {
  total: number;
  healthy: number;
  unhealthy: number;
  providers: Array<{
    id: string;
    provider: string;
    isValid: boolean;
    lastValidatedAt: Date | null;
    validationError: string | null;
    consecutiveFailures: number;
  }>;
}

/**
 * Maximum consecutive failures before marking as critical
 */
const MAX_CONSECUTIVE_FAILURES = 3;

@Injectable()
export class ProviderHealthService {
  private readonly logger = new Logger(ProviderHealthService.name);

  /**
   * Track consecutive failures per provider
   */
  private readonly consecutiveFailures = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: AIProviderFactory,
  ) {}

  /**
   * Run health check for all providers every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async runScheduledHealthChecks(): Promise<void> {
    this.logger.log('Running scheduled health checks for all providers...');

    try {
      const providers = await this.prisma.aIProviderConfig.findMany({
        select: {
          id: true,
          workspaceId: true,
          provider: true,
          apiKeyEncrypted: true,
          defaultModel: true,
        },
      });

      const results: HealthCheckResult[] = [];

      for (const provider of providers) {
        const result = await this.checkProviderHealth(provider.id);
        results.push(result);
      }

      const healthy = results.filter((r) => r.isValid).length;
      const unhealthy = results.filter((r) => !r.isValid).length;

      this.logger.log(
        `Health check complete: ${healthy} healthy, ${unhealthy} unhealthy out of ${results.length} providers`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to run scheduled health checks: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Check health of a specific provider
   */
  async checkProviderHealth(providerId: string): Promise<HealthCheckResult> {
    const startTime = Date.now();

    const provider = await this.prisma.aIProviderConfig.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        provider: true,
        apiKeyEncrypted: true,
        defaultModel: true,
      },
    });

    if (!provider) {
      return {
        providerId,
        provider: 'unknown',
        isValid: false,
        error: 'Provider not found',
        checkedAt: new Date(),
      };
    }

    try {
      // Create provider instance and validate credentials
      const providerInstance = this.providerFactory.create({
        id: provider.id,
        provider: provider.provider,
        apiKeyEncrypted: provider.apiKeyEncrypted,
        defaultModel: provider.defaultModel,
      } as any);

      const validation = await providerInstance.validateCredentials();
      const latency = Date.now() - startTime;

      // Update provider status
      await this.prisma.aIProviderConfig.update({
        where: { id: providerId },
        data: {
          isValid: validation.valid,
          lastValidatedAt: new Date(),
          validationError: validation.error || null,
        },
      });

      // Update consecutive failures tracking
      if (validation.valid) {
        this.consecutiveFailures.delete(providerId);
      } else {
        const failures = (this.consecutiveFailures.get(providerId) || 0) + 1;
        this.consecutiveFailures.set(providerId, failures);

        if (failures >= MAX_CONSECUTIVE_FAILURES) {
          this.logger.warn(
            `Provider ${provider.provider} (${providerId}) has ${failures} consecutive failures`,
          );
        }
      }

      return {
        providerId,
        provider: provider.provider,
        isValid: validation.valid,
        latency,
        error: validation.error,
        checkedAt: new Date(),
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Update provider status as invalid
      await this.prisma.aIProviderConfig.update({
        where: { id: providerId },
        data: {
          isValid: false,
          lastValidatedAt: new Date(),
          validationError: errorMessage,
        },
      });

      // Track consecutive failures
      const failures = (this.consecutiveFailures.get(providerId) || 0) + 1;
      this.consecutiveFailures.set(providerId, failures);

      this.logger.error(
        `Health check failed for ${provider.provider}: ${errorMessage}`,
      );

      return {
        providerId,
        provider: provider.provider,
        isValid: false,
        latency,
        error: errorMessage,
        checkedAt: new Date(),
      };
    }
  }

  /**
   * Get health summary for a workspace
   */
  async getWorkspaceHealth(workspaceId: string): Promise<HealthSummary> {
    const providers = await this.prisma.aIProviderConfig.findMany({
      where: { workspaceId },
      select: {
        id: true,
        provider: true,
        isValid: true,
        lastValidatedAt: true,
        validationError: true,
      },
    });

    const healthy = providers.filter((p) => p.isValid).length;
    const unhealthy = providers.filter((p) => !p.isValid).length;

    return {
      total: providers.length,
      healthy,
      unhealthy,
      providers: providers.map((p) => ({
        id: p.id,
        provider: p.provider,
        isValid: p.isValid,
        lastValidatedAt: p.lastValidatedAt,
        validationError: p.validationError,
        consecutiveFailures: this.consecutiveFailures.get(p.id) || 0,
      })),
    };
  }

  /**
   * Manually trigger health check for a provider
   */
  async triggerHealthCheck(providerId: string): Promise<HealthCheckResult> {
    this.logger.log(`Manually triggering health check for provider ${providerId}`);
    return this.checkProviderHealth(providerId);
  }

  /**
   * Get consecutive failure count for a provider
   */
  getConsecutiveFailures(providerId: string): number {
    return this.consecutiveFailures.get(providerId) || 0;
  }

  /**
   * Reset consecutive failures (used after manual re-validation)
   */
  resetConsecutiveFailures(providerId: string): void {
    this.consecutiveFailures.delete(providerId);
  }
}
