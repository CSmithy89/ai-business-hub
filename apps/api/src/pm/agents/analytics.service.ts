import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import {
  PrismForecastDto,
  VelocityMetadataDto,
  VelocityHistoryDto,
  ConfidenceLevel,
  VelocityTrend,
  ForecastScenarioDto,
  AnomalyDto,
  CompletionProbabilityDto,
} from './dto/prism-forecast.dto';

/**
 * Analytics Service
 *
 * Provides predictive analytics capabilities via Prism agent.
 * Handles velocity calculation, completion forecasting, and anomaly detection.
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get project completion forecast from Prism agent
   *
   * Generates a statistical forecast using historical velocity data.
   * Falls back to linear projection if agent is unavailable or data is insufficient.
   */
  async getForecast(
    projectId: string,
    workspaceId: string,
    scenario?: ForecastScenarioDto,
  ): Promise<PrismForecastDto> {
    try {
      // Fetch historical velocity data
      const history = await this.getVelocityHistory(projectId, workspaceId, 12);

      // Calculate remaining points
      const remainingPoints = await this.getRemainingPoints(projectId, workspaceId);

      // Check minimum data threshold
      if (history.length < 3) {
        this.logger.warn(
          `Insufficient data for forecast: project=${projectId}, dataPoints=${history.length}`,
        );
        return this.fallbackLinearProjection(history, remainingPoints);
      }

      // TODO: Invoke Prism agent when agent integration is available
      // For now, use fallback linear projection
      // const forecast = await this.agentService.invokePrism('forecast_completion', {
      //   project_id: projectId,
      //   history,
      //   remaining_points: remainingPoints,
      //   scenario,
      // });

      // Log prediction for accuracy tracking
      this.logger.log(
        `Forecast generated: project=${projectId}, remainingPoints=${remainingPoints}, dataPoints=${history.length}`,
      );

      return this.fallbackLinearProjection(history, remainingPoints, scenario);
    } catch (error: any) {
      this.logger.error(
        `Forecast generation failed: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );

      // Graceful degradation to linear projection
      const history = await this.getVelocityHistory(projectId, workspaceId, 12);
      const remainingPoints = await this.getRemainingPoints(projectId, workspaceId);
      return this.fallbackLinearProjection(history, remainingPoints);
    }
  }

  /**
   * Calculate velocity for a project
   *
   * Analyzes completed story points over time to determine team velocity.
   */
  async getVelocity(
    projectId: string,
    workspaceId: string,
    window: string = '4w',
  ): Promise<VelocityMetadataDto> {
    try {
      const periods = this.getPeriodsForWindow(window);
      const history = await this.getVelocityHistory(projectId, workspaceId, periods);

      if (history.length === 0) {
        return {
          velocity: 0,
          trend: VelocityTrend.STABLE,
          confidence: ConfidenceLevel.LOW,
          sampleSize: 0,
          timeRange: window,
        };
      }

      // Calculate average velocity
      const totalPoints = history.reduce((sum, h) => sum + h.completedPoints, 0);
      const velocity = totalPoints / history.length;

      // Determine trend (compare first half vs second half)
      const midpoint = Math.floor(history.length / 2);
      const firstHalf = history.slice(0, midpoint);
      const secondHalf = history.slice(midpoint);

      const firstHalfAvg = firstHalf.length > 0
        ? firstHalf.reduce((sum, h) => sum + h.completedPoints, 0) / firstHalf.length
        : 0;
      const secondHalfAvg = secondHalf.length > 0
        ? secondHalf.reduce((sum, h) => sum + h.completedPoints, 0) / secondHalf.length
        : 0;

      let trend: VelocityTrend = VelocityTrend.STABLE;
      const changePercent = firstHalfAvg > 0 ? (secondHalfAvg - firstHalfAvg) / firstHalfAvg : 0;

      if (changePercent > 0.15) trend = VelocityTrend.UP;
      else if (changePercent < -0.15) trend = VelocityTrend.DOWN;

      // Calculate confidence based on data points and variance
      const confidence = this.calculateConfidence(
        history.length,
        this.calculateVariance(history.map(h => h.completedPoints)),
      );

      return {
        velocity,
        trend,
        confidence,
        sampleSize: history.length,
        timeRange: window,
      };
    } catch (error: any) {
      this.logger.error(`Velocity calculation failed: ${error?.message || 'Unknown error'}`);
      return {
        velocity: 0,
        trend: VelocityTrend.STABLE,
        confidence: ConfidenceLevel.LOW,
        sampleSize: 0,
        timeRange: window,
      };
    }
  }

  /**
   * Get historical velocity data for a project
   */
  async getVelocityHistory(
    projectId: string,
    workspaceId: string,
    periods: number = 12,
  ): Promise<VelocityHistoryDto[]> {
    try {
      // Calculate period boundaries (weekly periods going back)
      const now = new Date();
      const history: VelocityHistoryDto[] = [];

      for (let i = 0; i < periods; i++) {
        const periodEnd = new Date(now);
        periodEnd.setDate(periodEnd.getDate() - (i * 7));
        const periodStart = new Date(periodEnd);
        periodStart.setDate(periodStart.getDate() - 7);

        // Get completed tasks in this period
        const tasks = await this.prisma.task.findMany({
          where: {
            projectId,
            workspaceId,
            status: 'DONE',
            completedAt: {
              gte: periodStart,
              lt: periodEnd,
            },
          },
          select: {
            storyPoints: true,
          },
        });

        const completedPoints = tasks.reduce(
          (sum, task) => sum + (task.storyPoints || 0),
          0,
        );

        const year = periodStart.getFullYear();
        const week = this.getWeekNumber(periodStart);
        const period = `${year}-W${week.toString().padStart(2, '0')}`;

        history.push({
          period,
          completedPoints,
          totalTasks: tasks.length,
          completedTasks: tasks.length,
          startDate: periodStart.toISOString().split('T')[0],
          endDate: periodEnd.toISOString().split('T')[0],
        });
      }

      return history.reverse(); // Return chronological order
    } catch (error: any) {
      this.logger.error(`Failed to get velocity history: ${error?.message || 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Detect anomalies in project metrics
   */
  async detectAnomalies(
    projectId: string,
    workspaceId: string,
    _metricType: string = 'velocity',
    threshold: number = 2.0,
  ): Promise<AnomalyDto[]> {
    try {
      const history = await this.getVelocityHistory(projectId, workspaceId, 12);

      if (history.length < 3) {
        return [];
      }

      const values = history.map(h => h.completedPoints);
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = this.calculateVariance(values);
      const stdDev = Math.sqrt(variance);

      const anomalies: AnomalyDto[] = [];

      history.forEach((point, index) => {
        const value = point.completedPoints;
        const zScore = stdDev > 0 ? Math.abs(value - mean) / stdDev : 0;

        if (zScore > threshold) {
          const deviation = ((value - mean) / mean) * 100;
          const severity: 'LOW' | 'MEDIUM' | 'HIGH' =
            zScore > 3 ? 'HIGH' : zScore > 2.5 ? 'MEDIUM' : 'LOW';

          anomalies.push({
            index,
            period: point.period,
            value,
            expectedRange: [mean - stdDev, mean + stdDev],
            severity,
            description: `Velocity ${deviation > 0 ? 'increased' : 'dropped'} ${Math.abs(deviation).toFixed(0)}% from average`,
          });
        }
      });

      return anomalies;
    } catch (error: any) {
      this.logger.error(`Anomaly detection failed: ${error?.message || 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Analyze completion probability for a target date
   */
  async analyzeCompletionProbability(
    projectId: string,
    workspaceId: string,
    targetDate: string,
  ): Promise<CompletionProbabilityDto> {
    try {
      const target = new Date(targetDate);
      const now = new Date();
      const weeksRemaining = Math.max(0, (target.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000));

      const remainingPoints = await this.getRemainingPoints(projectId, workspaceId);
      const velocity = await this.getVelocity(projectId, workspaceId, '4w');

      const requiredVelocity = weeksRemaining > 0 ? remainingPoints / weeksRemaining : Infinity;

      // Simple probability estimate based on velocity comparison
      let probability = 0.5;
      if (velocity.velocity > 0 && requiredVelocity < Infinity) {
        const ratio = velocity.velocity / requiredVelocity;
        probability = Math.min(0.95, Math.max(0.05, ratio * 0.7));
      }

      const probabilityLabel: 'LOW' | 'MEDIUM' | 'HIGH' =
        probability > 0.7 ? 'HIGH' : probability > 0.4 ? 'MEDIUM' : 'LOW';

      let assessment = 'Insufficient data for accurate probability estimate';
      if (velocity.velocity > 0) {
        if (velocity.velocity >= requiredVelocity) {
          assessment = 'On track - current velocity meets or exceeds requirement';
        } else {
          const deficit = ((requiredVelocity - velocity.velocity) / requiredVelocity) * 100;
          assessment = `At risk - velocity is ${deficit.toFixed(0)}% below requirement`;
        }
      }

      return {
        targetDate,
        probability,
        probabilityLabel,
        weeksRemaining: Math.round(weeksRemaining),
        pointsRemaining: remainingPoints,
        requiredVelocity,
        currentVelocity: velocity.velocity,
        assessment,
      };
    } catch (error: any) {
      this.logger.error(`Completion probability analysis failed: ${error?.message || 'Unknown error'}`);
      return {
        targetDate,
        probability: 0.5,
        probabilityLabel: 'MEDIUM',
        weeksRemaining: 0,
        pointsRemaining: 0,
        requiredVelocity: 0,
        currentVelocity: 0,
        assessment: 'Unable to calculate probability',
      };
    }
  }

  /**
   * Fallback linear projection when Prism is unavailable
   */
  private fallbackLinearProjection(
    history: VelocityHistoryDto[],
    remainingPoints: number,
    scenario?: ForecastScenarioDto,
  ): PrismForecastDto {
    // Apply scenario adjustments
    let adjustedPoints = remainingPoints;
    if (scenario?.addedScope) {
      adjustedPoints += scenario.addedScope;
    }

    // Simple linear calculation
    const avgVelocity = history.length > 0
      ? history.reduce((sum, h) => sum + h.completedPoints, 0) / history.length
      : 10; // default assumption

    // Adjust velocity for team size changes
    let adjustedVelocity = avgVelocity;
    if (scenario?.teamSizeChange) {
      const velocityPerPerson = avgVelocity / Math.max(1, 5); // assume 5-person team
      adjustedVelocity += velocityPerPerson * scenario.teamSizeChange;
    }

    const weeksNeeded = adjustedVelocity > 0
      ? Math.ceil(adjustedPoints / adjustedVelocity)
      : 52; // default to 1 year if no velocity

    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + weeksNeeded * 7);

    const optimisticDate = new Date(predictedDate);
    optimisticDate.setDate(optimisticDate.getDate() - 7);

    const pessimisticDate = new Date(predictedDate);
    pessimisticDate.setDate(pessimisticDate.getDate() + 14);

    const factors = ['Fallback mode', 'Linear calculation'];
    if (history.length < 3) {
      factors.push('Insufficient historical data');
    }
    if (scenario?.addedScope) {
      factors.push(`Added scope: ${scenario.addedScope} points`);
    }
    if (scenario?.teamSizeChange) {
      factors.push(`Team size change: ${scenario.teamSizeChange > 0 ? '+' : ''}${scenario.teamSizeChange}`);
    }

    return {
      predictedDate: predictedDate.toISOString().split('T')[0],
      confidence: history.length >= 6 ? ConfidenceLevel.MED : ConfidenceLevel.LOW,
      optimisticDate: optimisticDate.toISOString().split('T')[0],
      pessimisticDate: pessimisticDate.toISOString().split('T')[0],
      reasoning: history.length > 0
        ? `Linear projection based on ${history.length}-week average velocity of ${avgVelocity.toFixed(1)} points/week. ${adjustedPoints} points remaining suggests ${weeksNeeded} weeks.`
        : 'Linear projection using default velocity assumption (insufficient historical data).',
      factors,
      velocityAvg: avgVelocity,
      dataPoints: history.length,
    };
  }

  /**
   * Calculate remaining story points for a project
   */
  private async getRemainingPoints(
    projectId: string,
    workspaceId: string,
  ): Promise<number> {
    const result = await this.prisma.task.aggregate({
      where: {
        projectId,
        workspaceId,
        status: {
          notIn: ['DONE', 'CANCELLED'],
        },
      },
      _sum: {
        storyPoints: true,
      },
    });

    return result._sum?.storyPoints || 0;
  }

  /**
   * Calculate confidence level based on data points and variance
   */
  private calculateConfidence(dataPoints: number, variance: number): ConfidenceLevel {
    if (dataPoints < 3) return ConfidenceLevel.LOW;

    const coefficientOfVariation = variance > 0 ? Math.sqrt(variance) / dataPoints : 0;

    if (dataPoints < 6) {
      return coefficientOfVariation < 0.3 ? ConfidenceLevel.MED : ConfidenceLevel.LOW;
    }

    return coefficientOfVariation < 0.2 ? ConfidenceLevel.HIGH : ConfidenceLevel.MED;
  }

  /**
   * Calculate variance of a dataset
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Get number of periods for a time window
   */
  private getPeriodsForWindow(window: string): number {
    switch (window) {
      case '1w': return 1;
      case '2w': return 2;
      case '4w': return 4;
      case 'sprint': return 2; // 2-week sprint
      default: return 4;
    }
  }

  /**
   * Get ISO week number for a date
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}
