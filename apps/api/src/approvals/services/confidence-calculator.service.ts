import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import {
  ConfidenceFactor,
  ConfidenceResult,
  ConfidenceRecommendation,
  DEFAULT_CONFIDENCE_THRESHOLDS,
} from '@hyvve/shared';

/**
 * Confidence thresholds configuration
 */
interface ConfidenceThresholds {
  autoApprove: number;
  quickReview: number;
}

/**
 * ConfidenceCalculatorService - Core confidence scoring system
 *
 * Calculates confidence scores from weighted factors and returns routing recommendations.
 * This service is stateless - it calculates confidence from provided factors without
 * determining which factors to use (that's the responsibility of calling services).
 *
 * Confidence routing:
 * - score >= 85% = Auto-approve (immediate execution)
 * - score 60-84% = Quick review (1-click approval)
 * - score < 60% = Full review (with AI reasoning)
 *
 * Features:
 * - Weighted average calculation with validation
 * - Workspace-specific threshold configuration
 * - AI reasoning generation for low confidence
 * - Comprehensive logging for debugging
 */
@Injectable()
export class ConfidenceCalculatorService {
  private readonly logger = new Logger(ConfidenceCalculatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate confidence score from weighted factors
   *
   * @param factors - Array of confidence factors with scores and weights
   * @param workspaceId - Workspace ID for threshold lookup
   * @returns Confidence result with score, recommendation, and optional reasoning
   * @throws BadRequestException if validation fails
   */
  async calculate(
    factors: ConfidenceFactor[],
    workspaceId: string,
  ): Promise<ConfidenceResult> {
    // 1. Validate factors
    this.validateFactors(factors);

    // 2. Calculate weighted average
    const overallScore = this.calculateWeightedAverage(factors);

    // 3. Get thresholds (workspace-specific or default)
    const thresholds = await this.getThresholds(workspaceId);

    // 4. Determine recommendation
    const recommendation = this.getRecommendation(overallScore, thresholds);

    // 5. Generate AI reasoning for low confidence
    const aiReasoning =
      recommendation === 'full_review'
        ? this.generateReasoning(factors, overallScore)
        : undefined;

    // 6. Log calculation
    this.logger.log({
      message: 'Confidence calculated',
      workspaceId,
      overallScore,
      recommendation,
      factorCount: factors.length,
    });

    return {
      overallScore,
      factors,
      recommendation,
      aiReasoning,
    };
  }

  /**
   * Validate that factors have valid weights that sum to 1.0
   *
   * @param factors - Factors to validate
   * @throws BadRequestException if validation fails
   */
  private validateFactors(factors: ConfidenceFactor[]): void {
    if (!factors || factors.length === 0) {
      throw new BadRequestException(
        'At least one confidence factor is required',
      );
    }

    // Validate individual factor values first
    for (const factor of factors) {
      if (factor.score < 0 || factor.score > 100) {
        throw new BadRequestException(
          `Factor score must be between 0 and 100 (got ${factor.score} for ${factor.factor})`,
        );
      }
      if (factor.weight < 0 || factor.weight > 1) {
        throw new BadRequestException(
          `Factor weight must be between 0 and 1 (got ${factor.weight} for ${factor.factor})`,
        );
      }
    }

    // Then validate that weights sum to 1.0
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const tolerance = 0.001;

    if (Math.abs(totalWeight - 1.0) > tolerance) {
      throw new BadRequestException(
        `Factor weights must sum to 1.0 (got ${totalWeight.toFixed(3)})`,
      );
    }
  }

  /**
   * Calculate weighted average of factor scores
   *
   * @param factors - Factors with scores and weights
   * @returns Weighted average score (0-100) rounded to 2 decimal places
   */
  private calculateWeightedAverage(factors: ConfidenceFactor[]): number {
    const weightedSum = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
    return Math.round(weightedSum * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get confidence thresholds for workspace (or defaults)
   *
   * @param workspaceId - Workspace ID
   * @returns Confidence thresholds from workspace settings or defaults
   */
  private async getThresholds(
    workspaceId: string,
  ): Promise<ConfidenceThresholds> {
    try {
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: {
          settings: {
            select: {
              autoApproveThreshold: true,
              quickReviewThreshold: true,
            },
          },
        },
      });

      if (workspace?.settings) {
        return {
          autoApprove:
            workspace.settings.autoApproveThreshold ??
            DEFAULT_CONFIDENCE_THRESHOLDS.autoApprove,
          quickReview:
            workspace.settings.quickReviewThreshold ??
            DEFAULT_CONFIDENCE_THRESHOLDS.quickReview,
        };
      }
    } catch (error) {
      this.logger.warn({
        message: 'Failed to fetch workspace thresholds, using defaults',
        workspaceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return DEFAULT_CONFIDENCE_THRESHOLDS;
  }

  /**
   * Determine recommendation based on score and thresholds
   *
   * @param score - Overall confidence score (0-100)
   * @param thresholds - Confidence thresholds
   * @returns Routing recommendation
   */
  private getRecommendation(
    score: number,
    thresholds: ConfidenceThresholds,
  ): ConfidenceRecommendation {
    if (score >= thresholds.autoApprove) {
      return 'approve';
    }
    if (score >= thresholds.quickReview) {
      return 'review';
    }
    return 'full_review';
  }

  /**
   * Generate AI reasoning for low confidence scores
   *
   * @param factors - All confidence factors
   * @param overallScore - Overall confidence score
   * @returns Human-readable reasoning explaining low confidence
   */
  private generateReasoning(
    factors: ConfidenceFactor[],
    overallScore: number,
  ): string {
    const lowFactors = factors.filter((f) => f.score < 60);
    const concerningFactors = factors.filter((f) => f.concerning);

    const parts: string[] = [
      `Overall confidence score: ${overallScore.toFixed(1)}%`,
    ];

    if (lowFactors.length > 0) {
      parts.push(
        `Low confidence factors: ${lowFactors
          .map((f) => `${f.factor} (${f.score}%)`)
          .join(', ')}`,
      );
    }

    if (concerningFactors.length > 0) {
      parts.push(
        `Concerning factors: ${concerningFactors.map((f) => f.explanation).join('; ')}`,
      );
    }

    parts.push('Manual review recommended due to low confidence.');

    return parts.join('\n');
  }
}
