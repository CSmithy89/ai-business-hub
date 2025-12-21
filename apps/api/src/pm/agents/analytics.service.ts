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
  PredictionFactor,
  ProbabilityDistribution,
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

      // Calculate remaining points (with scenario adjustments)
      let remainingPoints = await this.getRemainingPoints(projectId, workspaceId);
      if (scenario?.addedScope) {
        remainingPoints += scenario.addedScope;
      }

      // Check minimum data threshold
      if (history.length < 3) {
        this.logger.warn(
          `Insufficient data for forecast: project=${projectId}, dataPoints=${history.length}`,
        );
        return this.fallbackLinearProjection(history, remainingPoints, scenario);
      }

      // Extract velocity values for Monte Carlo simulation
      let velocityValues = history.map(h => h.completedPoints);

      // Adjust velocity for team size changes
      if (scenario?.teamSizeChange) {
        const avgVelocity = velocityValues.reduce((sum, v) => sum + v, 0) / velocityValues.length;
        const velocityPerPerson = avgVelocity / Math.max(1, 5); // assume 5-person team
        const velocityAdjustment = velocityPerPerson * scenario.teamSizeChange;
        velocityValues = velocityValues.map(v => Math.max(1, v + velocityAdjustment));
      }

      // Run Monte Carlo simulation
      const monteCarlo = this.runMonteCarloSimulation(velocityValues, remainingPoints, 1000);

      // Calculate confidence level
      const confidence = this.calculateConfidence(history.length, monteCarlo.velocityStd * monteCarlo.velocityStd);

      // Analyze prediction factors
      const factors = this.analyzePredictionFactors(history, monteCarlo.trendSlope, confidence, scenario);

      // Generate reasoning
      const reasoning = this.generateMonteCarloReasoning(
        monteCarlo,
        remainingPoints,
        history.length,
        confidence,
      );

      // Log prediction for accuracy tracking
      this.logger.log(
        `Monte Carlo forecast generated: project=${projectId}, remainingPoints=${remainingPoints}, ` +
        `dataPoints=${history.length}, confidence=${confidence}, predictedDate=${monteCarlo.dates.p50}`,
      );

      // TODO: Store prediction in database for accuracy tracking
      // await this.logPrediction(projectId, { ... });

      return {
        predictedDate: monteCarlo.dates.p50,
        confidence,
        optimisticDate: monteCarlo.dates.p25,
        pessimisticDate: monteCarlo.dates.p75,
        reasoning,
        factors,
        velocityAvg: monteCarlo.velocityMean,
        dataPoints: history.length,
        probabilityDistribution: monteCarlo.dates,
      };
    } catch (error: any) {
      this.logger.error(
        `Forecast generation failed: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );

      // Graceful degradation to linear projection
      const history = await this.getVelocityHistory(projectId, workspaceId, 12);
      const remainingPoints = await this.getRemainingPoints(projectId, workspaceId);
      return this.fallbackLinearProjection(history, remainingPoints, scenario);
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
   * Run Monte Carlo simulation to predict completion date range
   *
   * @param velocityHistory - Array of historical velocity values (story points)
   * @param remainingPoints - Story points remaining
   * @param numSimulations - Number of Monte Carlo iterations (default 1000)
   * @returns Monte Carlo simulation results with percentiles
   */
  private runMonteCarloSimulation(
    velocityHistory: number[],
    remainingPoints: number,
    numSimulations: number = 1000,
  ): {
    dates: ProbabilityDistribution;
    velocityMean: number;
    velocityStd: number;
    trendSlope: number;
    simulationRuns: number;
  } {
    if (velocityHistory.length === 0) {
      // No data - return default values
      const now = new Date();
      const defaultDate = new Date(now);
      defaultDate.setDate(defaultDate.getDate() + 365);
      const defaultDateStr = defaultDate.toISOString().split('T')[0];

      return {
        dates: {
          p10: defaultDateStr,
          p25: defaultDateStr,
          p50: defaultDateStr,
          p75: defaultDateStr,
          p90: defaultDateStr,
        },
        velocityMean: 0,
        velocityStd: 0,
        trendSlope: 0,
        simulationRuns: 0,
      };
    }

    // Calculate base statistics
    const velocityMean = velocityHistory.reduce((sum, v) => sum + v, 0) / velocityHistory.length;
    const variance = this.calculateVariance(velocityHistory);
    const velocityStd = Math.sqrt(variance);

    // Detect trend using linear regression (only with 4+ data points)
    let trendSlope = 0;
    if (velocityHistory.length >= 4) {
      // Simple linear regression: y = mx + b
      const n = velocityHistory.length;
      const x = Array.from({ length: n }, (_, i) => i);
      const sumX = x.reduce((sum, val) => sum + val, 0);
      const sumY = velocityHistory.reduce((sum, val) => sum + val, 0);
      const sumXY = x.reduce((sum, val, i) => sum + val * velocityHistory[i], 0);
      const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

      trendSlope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    }

    // Run Monte Carlo simulation
    const completionWeeks: number[] = [];

    for (let i = 0; i < numSimulations; i++) {
      // Use Box-Muller transform for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

      // Sample velocity from normal distribution
      let sampledVelocity = velocityMean + z * velocityStd;

      // Apply trend adjustment (assumes trend continues)
      const projectedVelocity = Math.max(1, sampledVelocity + trendSlope);

      // Calculate weeks to completion
      const weeksNeeded = remainingPoints / projectedVelocity;
      completionWeeks.push(weeksNeeded);
    }

    // Sort for percentile calculation
    completionWeeks.sort((a, b) => a - b);

    // Calculate percentiles
    const getPercentile = (arr: number[], p: number): number => {
      const index = Math.ceil(arr.length * (p / 100)) - 1;
      return arr[Math.max(0, Math.min(index, arr.length - 1))];
    };

    const today = new Date();
    const percentiles = {
      p10: getPercentile(completionWeeks, 10),
      p25: getPercentile(completionWeeks, 25),
      p50: getPercentile(completionWeeks, 50),
      p75: getPercentile(completionWeeks, 75),
      p90: getPercentile(completionWeeks, 90),
    };

    // Convert weeks to dates
    const dates: ProbabilityDistribution = {
      p10: this.addWeeksToDate(today, percentiles.p10),
      p25: this.addWeeksToDate(today, percentiles.p25),
      p50: this.addWeeksToDate(today, percentiles.p50),
      p75: this.addWeeksToDate(today, percentiles.p75),
      p90: this.addWeeksToDate(today, percentiles.p90),
    };

    return {
      dates,
      velocityMean,
      velocityStd,
      trendSlope,
      simulationRuns: numSimulations,
    };
  }

  /**
   * Analyze factors affecting prediction accuracy
   *
   * @param history - Historical velocity data
   * @param trendSlope - Trend slope from linear regression
   * @param confidence - Calculated confidence level
   * @param scenario - Optional scenario adjustments
   * @returns Array of prediction factors
   */
  private analyzePredictionFactors(
    history: VelocityHistoryDto[],
    trendSlope: number,
    confidence: ConfidenceLevel,
    scenario?: ForecastScenarioDto,
  ): PredictionFactor[] {
    const factors: PredictionFactor[] = [];

    // Factor 1: Historical Data Quality
    if (history.length < 3) {
      factors.push({
        name: 'Historical Data',
        value: `${history.length} periods`,
        impact: 'NEGATIVE',
        description: 'Insufficient historical data for reliable prediction',
      });
    } else if (history.length < 6) {
      factors.push({
        name: 'Historical Data',
        value: `${history.length} periods`,
        impact: 'NEUTRAL',
        description: 'Limited historical data - use prediction with caution',
      });
    } else {
      factors.push({
        name: 'Historical Data',
        value: `${history.length} periods`,
        impact: 'POSITIVE',
        description: 'Sufficient historical data for reliable prediction',
      });
    }

    // Factor 2: Velocity Trend
    const trendThreshold = 0.1; // 0.1 points per week
    if (trendSlope > trendThreshold) {
      factors.push({
        name: 'Velocity Trend',
        value: 'INCREASING',
        impact: 'POSITIVE',
        description: 'Team velocity is improving over time',
      });
    } else if (trendSlope < -trendThreshold) {
      factors.push({
        name: 'Velocity Trend',
        value: 'DECREASING',
        impact: 'NEGATIVE',
        description: 'Team velocity is declining - completion may be delayed',
      });
    } else {
      factors.push({
        name: 'Velocity Trend',
        value: 'STABLE',
        impact: 'NEUTRAL',
        description: 'Team velocity is consistent',
      });
    }

    // Factor 3: Prediction Confidence
    const confidenceImpact =
      confidence === ConfidenceLevel.HIGH ? 'POSITIVE' :
      confidence === ConfidenceLevel.LOW ? 'NEGATIVE' :
      'NEUTRAL';

    factors.push({
      name: 'Prediction Confidence',
      value: confidence,
      impact: confidenceImpact,
      description: `Based on data quality and variance, confidence is ${confidence.toLowerCase()}`,
    });

    // Factor 4: Scope Changes (if scenario provided)
    if (scenario?.addedScope) {
      const impact = scenario.addedScope > 0 ? 'NEGATIVE' : 'POSITIVE';
      factors.push({
        name: 'Scope Change',
        value: `${scenario.addedScope > 0 ? '+' : ''}${scenario.addedScope} points`,
        impact,
        description: scenario.addedScope > 0
          ? 'Additional scope will delay completion'
          : 'Reduced scope will accelerate completion',
      });
    }

    // Factor 5: Team Capacity Changes (if scenario provided)
    if (scenario?.teamSizeChange) {
      const impact = scenario.teamSizeChange > 0 ? 'POSITIVE' : 'NEGATIVE';
      factors.push({
        name: 'Team Capacity',
        value: `${scenario.teamSizeChange > 0 ? '+' : ''}${scenario.teamSizeChange} members`,
        impact,
        description: scenario.teamSizeChange > 0
          ? 'Additional team members will accelerate completion'
          : 'Reduced team size will delay completion',
      });
    }

    return factors;
  }

  /**
   * Generate natural language reasoning for Monte Carlo forecast
   */
  private generateMonteCarloReasoning(
    monteCarlo: {
      dates: ProbabilityDistribution;
      velocityMean: number;
      velocityStd: number;
      trendSlope: number;
      simulationRuns: number;
    },
    remainingPoints: number,
    dataPoints: number,
    confidence: ConfidenceLevel,
  ): string {
    const weeksToCompletion = remainingPoints / monteCarlo.velocityMean;
    const trendDirection =
      monteCarlo.trendSlope > 0.1 ? 'improving' :
      monteCarlo.trendSlope < -0.1 ? 'declining' :
      'stable';

    let reasoning = `Based on Monte Carlo simulation of ${monteCarlo.simulationRuns} scenarios using ${dataPoints} weeks of velocity history. `;
    reasoning += `Current average velocity is ${monteCarlo.velocityMean.toFixed(1)} points/week with ${trendDirection} trend. `;
    reasoning += `Remaining backlog of ${remainingPoints} points suggests approximately ${Math.round(weeksToCompletion)} weeks to completion. `;

    if (confidence === ConfidenceLevel.HIGH) {
      reasoning += `High confidence prediction based on consistent velocity data.`;
    } else if (confidence === ConfidenceLevel.MED) {
      reasoning += `Medium confidence - velocity shows some variance, use prediction with caution.`;
    } else {
      reasoning += `Low confidence - limited historical data or high variance, treat as rough estimate.`;
    }

    return reasoning;
  }

  /**
   * Add weeks to a date and return ISO 8601 date string
   */
  private addWeeksToDate(date: Date, weeks: number): string {
    const result = new Date(date);
    result.setDate(result.getDate() + Math.round(weeks * 7));
    return result.toISOString().split('T')[0];
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
