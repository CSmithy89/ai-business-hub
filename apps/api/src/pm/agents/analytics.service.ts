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
  PmRiskEntryDto,
  RiskCategory,
  RiskSource,
  RiskStatus,
} from './dto/prism-forecast.dto';
import {
  DashboardDataDto,
  DashboardOverviewDto,
  VelocityTrendDto,
  VelocityTrendDataPointDto,
  ScopeTrendDto,
  ScopeTrendDataPointDto,
  CompletionTrendDto,
  CompletionTrendDataPointDto,
  ProductivityTrendDto,
  ProductivityTrendDataPointDto,
  InsightDto,
  ScopeSnapshotDto,
} from './dto/analytics-dashboard.dto';

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

  // ============================================
  // RISK DETECTION (PM-08-3)
  // ============================================

  /**
   * Detect project risks based on forecast and historical data
   */
  async detectRisks(
    projectId: string,
    workspaceId: string,
  ): Promise<PmRiskEntryDto[]> {
    try {
      // Get latest forecast
      const forecast = await this.getForecast(projectId, workspaceId);

      // Get project details
      const project = await this.prisma.project.findUnique({
        where: {
          id: projectId,
          workspaceId
        },
        select: {
          targetDate: true,
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Get baseline scope for scope risk detection
      const baselineScope = await this.getBaselineScope(projectId, workspaceId);

      // Detect different risk types
      const risks: any[] = [];

      // 1. Schedule Risk Detection
      if (project.targetDate) {
        const scheduleRisk = this.detectScheduleRisk(
          forecast,
          project.targetDate,
        );
        if (scheduleRisk) {
          risks.push(scheduleRisk);
        }
      }

      // 2. Scope Risk Detection
      const scopeRisk = await this.detectScopeRisk(
        projectId,
        workspaceId,
        baselineScope,
      );
      if (scopeRisk) {
        risks.push(scopeRisk);
      }

      // 3. Resource Risk Detection
      const resourceRisk = this.detectResourceRisk(forecast);
      if (resourceRisk) {
        risks.push(resourceRisk);
      }

      // Persist risks to database
      const riskEntries: PmRiskEntryDto[] = [];
      for (const risk of risks) {
        const entry = await this.createRiskEntry(
          projectId,
          workspaceId,
          risk,
        );
        riskEntries.push(this.mapRiskToDto(entry));
      }

      return riskEntries;
    } catch (error: any) {
      this.logger.error(
        `Risk detection failed: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Get risk entries for a project
   */
  async getRiskEntries(
    projectId: string,
    workspaceId: string,
    status?: RiskStatus,
  ): Promise<PmRiskEntryDto[]> {
    const where: any = {
      projectId,
      tenantId: workspaceId,
    };

    if (status) {
      where.status = status;
    }

    const risks = await this.prisma.pmRiskEntry.findMany({
      where,
      orderBy: {
        detectedAt: 'desc',
      },
    });

    return risks.map(risk => this.mapRiskToDto(risk));
  }

  /**
   * Update risk status
   */
  async updateRiskStatus(
    riskId: string,
    projectId: string,
    workspaceId: string,
    status: RiskStatus,
  ): Promise<PmRiskEntryDto> {
    const risk = await this.prisma.pmRiskEntry.update({
      where: {
        id: riskId,
        tenantId: workspaceId,
        projectId: projectId,
      },
      data: {
        status,
      },
    });

    return this.mapRiskToDto(risk);
  }

  /**
   * Detect schedule risk (predicted date > target date)
   */
  private detectScheduleRisk(
    forecast: PrismForecastDto,
    targetDate: Date,
  ): any | null {
    const target = new Date(targetDate);
    const predicted = new Date(forecast.predictedDate);

    // Calculate delay
    const delayDays = Math.ceil(
      (predicted.getTime() - target.getTime()) / (1000 * 60 * 60 * 24),
    );

    // No risk if predicted date is before target
    if (delayDays <= 0) {
      return null;
    }

    // Calculate probability from distribution
    let probability = 0.5;
    if (forecast.probabilityDistribution) {
      const p25Date = new Date(forecast.probabilityDistribution.p25);
      const p50Date = new Date(forecast.probabilityDistribution.p50);
      const p75Date = new Date(forecast.probabilityDistribution.p75);

      if (p25Date > target) {
        probability = 0.85; // Even optimistic scenario misses deadline
      } else if (p50Date > target) {
        probability = 0.65; // Median scenario misses deadline
      } else if (p75Date > target) {
        probability = 0.40; // Pessimistic scenario misses deadline
      } else {
        probability = 0.20; // Only extreme scenarios miss deadline
      }
    }

    // Calculate impact (normalize delay to 0-1 scale)
    // 1 week = 0.3, 2 weeks = 0.5, 4 weeks = 0.7, 8+ weeks = 1.0
    const impact = Math.min(1.0, delayDays / 56.0 + 0.3);

    // Generate mitigation suggestions
    const mitigation = this.generateScheduleMitigation(delayDays, forecast);

    return {
      category: RiskCategory.SCHEDULE,
      probability,
      impact,
      description: `Project is at risk of missing deadline by ~${Math.floor(delayDays / 7)} weeks (${delayDays} days)`,
      mitigation,
      details: {
        targetDate: targetDate.toISOString(),
        predictedDate: forecast.predictedDate,
        delayDays,
      },
    };
  }

  /**
   * Detect scope risk (scope increase >10% mid-phase)
   */
  private async detectScopeRisk(
    projectId: string,
    workspaceId: string,
    baselineScope: number,
  ): Promise<any | null> {
    // Get current scope
    const currentScopeResult = await this.prisma.task.aggregate({
      where: {
        projectId,
        workspaceId,
      },
      _sum: {
        storyPoints: true,
      },
    });

    const currentScope = currentScopeResult._sum.storyPoints || 0;

    // Calculate scope increase
    const scopeIncrease = baselineScope > 0
      ? (currentScope - baselineScope) / baselineScope
      : 0;

    // Only trigger risk if increase >10%
    if (scopeIncrease <= 0.10) {
      return null;
    }

    // Calculate probability (higher increase = higher probability)
    // 10% = 0.4, 20% = 0.6, 30%+ = 0.8
    const probability = Math.min(0.8, 0.3 + scopeIncrease * 2.0);

    // Calculate impact (normalize to 0-1 scale)
    // 10% = 0.4, 20% = 0.6, 40%+ = 1.0
    const impact = Math.min(1.0, 0.2 + scopeIncrease * 2.0);

    // Generate mitigation
    const mitigation = this.generateScopeMitigation(
      scopeIncrease,
      currentScope,
      baselineScope,
    );

    return {
      category: RiskCategory.SCOPE,
      probability,
      impact,
      description: `Scope has increased ${Math.round(scopeIncrease * 100)}% from baseline (${baselineScope} → ${currentScope} points)`,
      mitigation,
      details: {
        baselineScope,
        currentScope,
        scopeIncrease,
      },
    };
  }

  /**
   * Detect resource risk (declining velocity >15%)
   */
  private detectResourceRisk(forecast: PrismForecastDto): any | null {
    // Extract velocity trend from factors
    const velocityFactor = forecast.factors.find(
      (f: any) => f.name === 'Velocity Trend',
    );

    if (!velocityFactor || (velocityFactor as any).value !== 'DECREASING') {
      return null;
    }

    // Approximate velocity change (from factor or assume -20% for DECREASING)
    const velocityChange = -0.20; // Negative indicates decline

    // Calculate probability (steeper decline = higher probability)
    const probability = Math.min(0.9, Math.abs(velocityChange) * 3.0);

    // Calculate impact
    const impact = Math.min(1.0, Math.abs(velocityChange) * 2.5);

    // Generate mitigation
    const mitigation = this.generateResourceMitigation(velocityChange);

    return {
      category: RiskCategory.RESOURCE,
      probability,
      impact,
      description: 'Team velocity is declining, indicating potential resource constraints',
      mitigation,
      details: {
        velocityTrend: 'DOWN',
        velocityChange,
      },
    };
  }

  /**
   * Generate schedule mitigation suggestions
   */
  private generateScheduleMitigation(
    delayDays: number,
    _forecast: PrismForecastDto,
  ): string {
    const weeksDelayed = Math.floor(delayDays / 7);

    if (weeksDelayed <= 1) {
      return 'Minor delay expected. Monitor velocity closely and adjust sprint planning.';
    } else if (weeksDelayed <= 4) {
      return `Consider reducing scope by ~${weeksDelayed * 10}% or adding 1 team member to maintain timeline.`;
    } else {
      return `Significant delay (${weeksDelayed} weeks). Options: (1) Extend deadline, (2) Reduce scope by ~30%, (3) Expand team by 2+ members.`;
    }
  }

  /**
   * Generate scope mitigation suggestions
   */
  private generateScopeMitigation(
    increase: number,
    current: number,
    baseline: number,
  ): string {
    const increasePct = Math.round(increase * 100);
    const addedPoints = current - baseline;

    return `Scope has grown ${increasePct}% (+${addedPoints} points). Review backlog and defer low-priority items. Consider moving ${Math.floor(addedPoints / 2)} points to Phase 2.`;
  }

  /**
   * Generate resource mitigation suggestions
   */
  private generateResourceMitigation(velocityChange: number): string {
    const declinePct = Math.round(Math.abs(velocityChange) * 100);

    return `Velocity declining ${declinePct}%. Investigate: (1) Team capacity issues, (2) Technical blockers, (3) Scope complexity. Consider capacity adjustments or backlog refinement.`;
  }

  /**
   * Create or update risk entry in database
   */
  private async createRiskEntry(
    projectId: string,
    workspaceId: string,
    risk: any,
  ): Promise<any> {
    // Check if risk already exists (same category + active)
    const existing = await this.prisma.pmRiskEntry.findFirst({
      where: {
        projectId,
        tenantId: workspaceId,
        category: risk.category,
        status: RiskStatus.ACTIVE,
      },
    });

    if (existing) {
      // Update existing risk
      return this.prisma.pmRiskEntry.update({
        where: { id: existing.id },
        data: {
          probability: risk.probability,
          impact: risk.impact,
          description: risk.description,
          mitigation: risk.mitigation,
          targetDate: risk.details?.targetDate
            ? new Date(risk.details.targetDate)
            : null,
          predictedDate: risk.details?.predictedDate
            ? new Date(risk.details.predictedDate)
            : null,
          delayDays: risk.details?.delayDays,
          baselineScope: risk.details?.baselineScope,
          currentScope: risk.details?.currentScope,
          scopeIncrease: risk.details?.scopeIncrease,
          velocityTrend: risk.details?.velocityTrend,
          velocityChange: risk.details?.velocityChange,
          updatedAt: new Date(),
        },
      });
    }

    // Create new risk entry
    return this.prisma.pmRiskEntry.create({
      data: {
        projectId,
        tenantId: workspaceId,
        source: RiskSource.PRISM,
        category: risk.category,
        probability: risk.probability,
        impact: risk.impact,
        description: risk.description,
        mitigation: risk.mitigation,
        status: RiskStatus.ACTIVE,
        targetDate: risk.details?.targetDate
          ? new Date(risk.details.targetDate)
          : null,
        predictedDate: risk.details?.predictedDate
          ? new Date(risk.details.predictedDate)
          : null,
        delayDays: risk.details?.delayDays,
        baselineScope: risk.details?.baselineScope,
        currentScope: risk.details?.currentScope,
        scopeIncrease: risk.details?.scopeIncrease,
        velocityTrend: risk.details?.velocityTrend,
        velocityChange: risk.details?.velocityChange,
      },
    });
  }

  /**
   * Get baseline scope for scope risk calculation
   */
  private async getBaselineScope(
    projectId: string,
    workspaceId: string,
  ): Promise<number> {
    // For MVP, use current total as baseline
    // TODO: Track baseline scope in project metadata or prediction log
    const allTasks = await this.prisma.task.aggregate({
      where: {
        projectId,
        workspaceId,
      },
      _sum: {
        storyPoints: true,
      },
    });

    return allTasks._sum.storyPoints || 0;
  }

  /**
   * Map Prisma risk entry to DTO
   */
  private mapRiskToDto(risk: any): PmRiskEntryDto {
    return {
      id: risk.id,
      projectId: risk.projectId,
      source: risk.source as RiskSource,
      category: risk.category as RiskCategory,
      probability: risk.probability,
      impact: risk.impact,
      description: risk.description,
      mitigation: risk.mitigation,
      status: risk.status as RiskStatus,
      targetDate: risk.targetDate?.toISOString(),
      predictedDate: risk.predictedDate?.toISOString(),
      delayDays: risk.delayDays,
      baselineScope: risk.baselineScope,
      currentScope: risk.currentScope,
      scopeIncrease: risk.scopeIncrease,
      velocityTrend: risk.velocityTrend as VelocityTrend,
      velocityChange: risk.velocityChange,
      detectedAt: risk.detectedAt.toISOString(),
      updatedAt: risk.updatedAt.toISOString(),
    };
  }

  // ============================================
  // DASHBOARD ANALYTICS (PM-08-4)
  // ============================================

  /**
   * Get comprehensive dashboard data for a project
   *
   * Returns all trend data, overview metrics, anomalies, risks, and insights
   * in a single aggregated call for optimal performance.
   *
   * @param projectId - Project ID
   * @param workspaceId - Workspace ID (for RLS)
   * @param dateRange - Date range for trend analysis
   * @returns Complete dashboard data
   */
  async getDashboardData(
    projectId: string,
    workspaceId: string,
    dateRange: { start: Date; end: Date },
  ): Promise<DashboardDataDto> {
    try {
      // Fetch data in parallel for performance
      const [
        velocityTrend,
        scopeTrend,
        completionTrend,
        productivityTrend,
        forecast,
        risks,
        insights,
      ] = await Promise.all([
        this.getVelocityTrend(projectId, workspaceId, dateRange),
        this.getScopeTrend(projectId, workspaceId, dateRange),
        this.getCompletionTrend(projectId, workspaceId, dateRange),
        this.getProductivityTrend(projectId, workspaceId, dateRange),
        this.getForecast(projectId, workspaceId),
        this.getRiskEntries(projectId, workspaceId, RiskStatus.ACTIVE),
        this.getInsights(projectId, workspaceId),
      ]);

      // Calculate anomalies across all trends
      const anomalies = this.detectAnomaliesInTrends({
        velocityTrend,
        scopeTrend,
        completionTrend,
        productivityTrend,
      });

      // Calculate health score
      const healthScore = this.calculateHealthScore(velocityTrend, scopeTrend, completionTrend, risks);

      // Build overview
      const overview: DashboardOverviewDto = {
        currentVelocity: velocityTrend.current,
        completionPercentage: completionTrend.current,
        healthScore,
        predictedCompletion: forecast.predictedDate,
      };

      return {
        overview,
        trends: {
          velocity: velocityTrend,
          scope: scopeTrend,
          completion: completionTrend,
          productivity: productivityTrend,
        },
        anomalies,
        risks,
        insights,
      };
    } catch (error: any) {
      this.logger.error(
        `Dashboard data fetch failed: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Get velocity trend data for charting
   *
   * @param projectId - Project ID
   * @param workspaceId - Workspace ID
   * @param dateRange - Date range for analysis
   * @returns Velocity trend with data points, trend line, and anomalies
   */
  async getVelocityTrend(
    projectId: string,
    workspaceId: string,
    dateRange: { start: Date; end: Date },
  ): Promise<VelocityTrendDto> {
    try {
      // Calculate periods from date range (weekly periods)
      const periods = Math.ceil(
        (dateRange.end.getTime() - dateRange.start.getTime()) / (7 * 24 * 60 * 60 * 1000),
      );

      // Fetch historical velocity
      const history = await this.getVelocityHistory(projectId, workspaceId, periods);

      if (history.length === 0) {
        return {
          current: 0,
          average: 0,
          trend: 'STABLE',
          dataPoints: [],
          trendLine: { slope: 0, intercept: 0 },
        };
      }

      // Calculate trend line (linear regression)
      const velocityValues = history.map(h => h.completedPoints);
      const trendLine = this.calculateTrendLine(velocityValues);

      // Calculate average velocity
      const average = velocityValues.reduce((sum, v) => sum + v, 0) / velocityValues.length;

      // Detect anomalies
      const anomalies = await this.detectAnomalies(projectId, workspaceId, 'velocity', 2.0);
      const anomalyMap = new Map(anomalies.map(a => [a.index, a]));

      // Determine trend direction
      const trend: 'INCREASING' | 'DECREASING' | 'STABLE' =
        trendLine.slope > 0.1 ? 'INCREASING' :
        trendLine.slope < -0.1 ? 'DECREASING' :
        'STABLE';

      // Build data points
      const dataPoints: VelocityTrendDataPointDto[] = history.map((h, index) => {
        const anomaly = anomalyMap.get(index);
        return {
          period: h.period,
          value: h.completedPoints,
          trendValue: trendLine.values[index],
          isAnomaly: !!anomaly,
          anomalySeverity: anomaly?.severity,
        };
      });

      return {
        current: history[history.length - 1]?.completedPoints || 0,
        average,
        trend,
        dataPoints,
        trendLine: {
          slope: trendLine.slope,
          intercept: trendLine.intercept,
        },
      };
    } catch (error: any) {
      this.logger.error(`Velocity trend calculation failed: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Get scope trend data for charting
   *
   * @param projectId - Project ID
   * @param workspaceId - Workspace ID
   * @param dateRange - Date range for analysis
   * @returns Scope trend with total/completed/remaining points over time
   */
  async getScopeTrend(
    projectId: string,
    workspaceId: string,
    dateRange: { start: Date; end: Date },
  ): Promise<ScopeTrendDto> {
    try {
      // Get historical scope snapshots
      const snapshots = await this.getScopeSnapshots(projectId, workspaceId, dateRange);

      if (snapshots.length === 0) {
        return {
          current: 0,
          baseline: 0,
          scopeIncrease: 0,
          dataPoints: [],
        };
      }

      // Calculate baseline scope (first snapshot)
      const baselineScope = snapshots[0].totalPoints;

      // Build data points with scope creep detection
      const dataPoints: ScopeTrendDataPointDto[] = snapshots.map((snapshot, _index) => {
        const scopeChange = baselineScope > 0
          ? (snapshot.totalPoints - baselineScope) / baselineScope
          : 0;
        const isScopeCreep = scopeChange > 0.10; // >10% increase

        return {
          period: snapshot.period,
          totalPoints: snapshot.totalPoints,
          completedPoints: snapshot.completedPoints,
          remainingPoints: snapshot.totalPoints - snapshot.completedPoints,
          baselinePoints: baselineScope,
          scopeChange,
          isScopeCreep,
        };
      });

      const currentSnapshot = snapshots[snapshots.length - 1];
      const scopeIncrease = baselineScope > 0
        ? (currentSnapshot.totalPoints - baselineScope) / baselineScope
        : 0;

      return {
        current: currentSnapshot.totalPoints,
        baseline: baselineScope,
        scopeIncrease,
        dataPoints,
      };
    } catch (error: any) {
      this.logger.error(`Scope trend calculation failed: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Get completion rate trend data for charting
   *
   * @param projectId - Project ID
   * @param workspaceId - Workspace ID
   * @param dateRange - Date range for analysis
   * @returns Completion trend with actual vs expected completion
   */
  async getCompletionTrend(
    projectId: string,
    workspaceId: string,
    dateRange: { start: Date; end: Date },
  ): Promise<CompletionTrendDto> {
    try {
      const snapshots = await this.getScopeSnapshots(projectId, workspaceId, dateRange);

      if (snapshots.length === 0) {
        return {
          current: 0,
          expected: 0,
          status: 'ON_TRACK',
          dataPoints: [],
        };
      }

      // Calculate expected completion (linear projection from start)
      const dataPoints: CompletionTrendDataPointDto[] = snapshots.map((snapshot, index) => {
        // Linear expected completion
        const expectedRate = 1.0 / snapshots.length;
        const expected = Math.min(1.0, (index + 1) * expectedRate);
        const actual = snapshot.completionPercentage;
        const aheadBehind = actual - expected;

        return {
          period: snapshot.period,
          actual,
          expected,
          aheadBehind,
        };
      });

      const currentDataPoint = dataPoints[dataPoints.length - 1];
      const status = this.calculateCompletionStatus(
        currentDataPoint.actual,
        currentDataPoint.expected,
      );

      return {
        current: currentDataPoint.actual,
        expected: currentDataPoint.expected,
        status,
        dataPoints,
      };
    } catch (error: any) {
      this.logger.error(`Completion trend calculation failed: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Get team productivity trend data
   *
   * @param projectId - Project ID
   * @param workspaceId - Workspace ID
   * @param dateRange - Date range for analysis
   * @returns Productivity metrics over time
   */
  async getProductivityTrend(
    projectId: string,
    workspaceId: string,
    dateRange: { start: Date; end: Date },
  ): Promise<ProductivityTrendDto> {
    try {
      // Calculate periods from date range (weekly periods)
      const periods = Math.ceil(
        (dateRange.end.getTime() - dateRange.start.getTime()) / (7 * 24 * 60 * 60 * 1000),
      );

      const dataPoints: ProductivityTrendDataPointDto[] = [];

      // Calculate productivity metrics for each period
      for (let i = 0; i < periods; i++) {
        const periodEnd = new Date(dateRange.end);
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
            startedAt: true,
            completedAt: true,
          },
        });

        // Calculate metrics
        const pointsPerWeek = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        const throughput = tasks.length;

        // Calculate average cycle time
        const cycleTimes = tasks
          .filter(t => t.startedAt && t.completedAt)
          .map(t => {
            const start = new Date(t.startedAt!);
            const end = new Date(t.completedAt!);
            return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24); // days
          });

        const cycleTime = cycleTimes.length > 0
          ? cycleTimes.reduce((sum, ct) => sum + ct, 0) / cycleTimes.length
          : 0;

        const year = periodStart.getFullYear();
        const week = this.getWeekNumber(periodStart);
        const period = `${year}-W${week.toString().padStart(2, '0')}`;

        dataPoints.push({
          period,
          pointsPerWeek,
          cycleTime,
          throughput,
        });
      }

      // Reverse to chronological order
      dataPoints.reverse();

      // Calculate averages
      const average = dataPoints.length > 0
        ? dataPoints.reduce((sum, dp) => sum + dp.pointsPerWeek, 0) / dataPoints.length
        : 0;

      const current = dataPoints[dataPoints.length - 1]?.pointsPerWeek || 0;

      return {
        current,
        average,
        dataPoints,
      };
    } catch (error: any) {
      this.logger.error(`Productivity trend calculation failed: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Get scope snapshots for historical scope tracking
   *
   * Calculates total and completed scope at different time periods
   * based on task creation and completion timestamps.
   *
   * @param projectId - Project ID
   * @param workspaceId - Workspace ID
   * @param dateRange - Date range for snapshots
   * @returns Array of scope snapshots
   */
  private async getScopeSnapshots(
    projectId: string,
    workspaceId: string,
    dateRange: { start: Date; end: Date },
  ): Promise<ScopeSnapshotDto[]> {
    try {
      // Calculate periods from date range (weekly periods)
      const periods = Math.ceil(
        (dateRange.end.getTime() - dateRange.start.getTime()) / (7 * 24 * 60 * 60 * 1000),
      );

      const snapshots: ScopeSnapshotDto[] = [];

      for (let i = 0; i < periods; i++) {
        const snapshotDate = new Date(dateRange.end);
        snapshotDate.setDate(snapshotDate.getDate() - (i * 7));

        // Get all tasks created before this snapshot date
        const allTasks = await this.prisma.task.findMany({
          where: {
            projectId,
            workspaceId,
            createdAt: {
              lte: snapshotDate,
            },
          },
          select: {
            storyPoints: true,
            completedAt: true,
          },
        });

        // Calculate total scope
        const totalPoints = allTasks.reduce(
          (sum, task) => sum + (task.storyPoints || 0),
          0,
        );

        // Calculate completed scope (tasks completed before snapshot date)
        const completedPoints = allTasks
          .filter(task => task.completedAt && new Date(task.completedAt) <= snapshotDate)
          .reduce((sum, task) => sum + (task.storyPoints || 0), 0);

        const completionPercentage = totalPoints > 0
          ? completedPoints / totalPoints
          : 0;

        const year = snapshotDate.getFullYear();
        const week = this.getWeekNumber(snapshotDate);
        const period = `${year}-W${week.toString().padStart(2, '0')}`;

        snapshots.push({
          period,
          totalPoints,
          completedPoints,
          completionPercentage,
        });
      }

      return snapshots.reverse(); // Return chronological order
    } catch (error: any) {
      this.logger.error(`Scope snapshots calculation failed: ${error?.message}`);
      return [];
    }
  }

  /**
   * Detect anomalies across all trend data
   *
   * Consolidates anomaly detection from velocity, scope, and completion trends.
   *
   * @param trends - All trend data
   * @returns Array of detected anomalies
   */
  private detectAnomaliesInTrends(trends: {
    velocityTrend: VelocityTrendDto;
    scopeTrend: ScopeTrendDto;
    completionTrend: CompletionTrendDto;
    productivityTrend: ProductivityTrendDto;
  }): AnomalyDto[] {
    const anomalies: AnomalyDto[] = [];
    let anomalyIndex = 0;

    // Velocity anomalies
    trends.velocityTrend.dataPoints.forEach((dp) => {
      if (dp.isAnomaly) {
        anomalies.push({
          index: anomalyIndex++,
          period: dp.period,
          value: dp.value,
          expectedRange: [dp.trendValue - 5, dp.trendValue + 5],
          severity: dp.anomalySeverity || 'MEDIUM',
          description: `Velocity ${dp.value > dp.trendValue ? 'spiked' : 'dropped'} ${Math.abs(dp.value - dp.trendValue).toFixed(1)} points from trend`,
        });
      }
    });

    // Scope creep anomalies
    trends.scopeTrend.dataPoints.forEach(dp => {
      if (dp.isScopeCreep) {
        const severity: 'LOW' | 'MEDIUM' | 'HIGH' = dp.scopeChange > 0.20 ? 'HIGH' : 'MEDIUM';
        anomalies.push({
          index: anomalyIndex++,
          period: dp.period,
          value: dp.totalPoints,
          expectedRange: [dp.baselinePoints, dp.baselinePoints * 1.1],
          severity,
          description: `Scope increased ${(dp.scopeChange * 100).toFixed(0)}% from baseline`,
        });
      }
    });

    // Completion delay anomalies
    trends.completionTrend.dataPoints.forEach(dp => {
      if (dp.aheadBehind < -0.10) {
        // >10% behind
        const severity: 'LOW' | 'MEDIUM' | 'HIGH' = dp.aheadBehind < -0.20 ? 'HIGH' : 'MEDIUM';
        anomalies.push({
          index: anomalyIndex++,
          period: dp.period,
          value: dp.actual,
          expectedRange: [dp.expected - 0.05, dp.expected + 0.05],
          severity,
          description: `Completion ${Math.abs(dp.aheadBehind * 100).toFixed(0)}% behind schedule`,
        });
      }
    });

    return anomalies;
  }

  /**
   * Calculate overall project health score (0-10 scale)
   *
   * Formula: (velocityTrendScore * 0.3 + completionRateScore * 0.3 + scopeStabilityScore * 0.2 + riskScore * 0.2) * 10
   *
   * @param velocityTrend - Velocity trend data
   * @param scopeTrend - Scope trend data
   * @param completionTrend - Completion trend data
   * @param risks - Active risks
   * @returns Health score (0-10)
   */
  private calculateHealthScore(
    velocityTrend: VelocityTrendDto,
    scopeTrend: ScopeTrendDto,
    completionTrend: CompletionTrendDto,
    risks: PmRiskEntryDto[],
  ): number {
    // Velocity trend score
    const velocityTrendScore =
      velocityTrend.trend === 'INCREASING' ? 1.0 :
      velocityTrend.trend === 'STABLE' ? 0.5 :
      0.2;

    // Completion rate score
    const completionRateScore =
      completionTrend.status === 'AHEAD' ? 1.0 :
      completionTrend.status === 'ON_TRACK' ? 0.5 :
      0.2;

    // Scope stability score (penalize scope creep)
    const scopeStabilityScore = Math.max(0, 1.0 - Math.abs(scopeTrend.scopeIncrease));

    // Risk score (penalize high-severity active risks)
    const highSeverityRisks = risks.filter(r => r.probability * r.impact > 0.5).length;
    const riskScore = Math.max(0, 1.0 - (highSeverityRisks * 0.2));

    // Calculate weighted health score
    const healthScore = (
      velocityTrendScore * 0.3 +
      completionRateScore * 0.3 +
      scopeStabilityScore * 0.2 +
      riskScore * 0.2
    ) * 10;

    return Math.round(healthScore * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Get AI insights and recommendations
   *
   * Placeholder for Prism agent insights.
   * Future enhancement: Call Prism agent for AI-generated recommendations.
   *
   * @param projectId - Project ID
   * @param workspaceId - Workspace ID
   * @returns Array of insights
   */
  private async getInsights(
    _projectId: string,
    _workspaceId: string,
  ): Promise<InsightDto[]> {
    // TODO: Implement Prism agent insights generation
    return [];
  }

  /**
   * Calculate linear regression trend line
   *
   * Uses least squares method to fit a line: y = mx + b
   *
   * @param values - Array of values
   * @returns Trend line parameters and fitted values
   */
  private calculateTrendLine(values: number[]): {
    slope: number;
    intercept: number;
    values: number[];
  } {
    if (values.length < 2) {
      return {
        slope: 0,
        intercept: values[0] || 0,
        values: values.slice(),
      };
    }

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);

    // Calculate sums for linear regression
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

    // Calculate slope and intercept
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate fitted values
    const fittedValues = x.map(xi => slope * xi + intercept);

    return {
      slope,
      intercept,
      values: fittedValues,
    };
  }

  /**
   * Calculate completion status based on actual vs expected completion
   *
   * @param actual - Actual completion percentage (0-1)
   * @param expected - Expected completion percentage (0-1)
   * @returns Status: AHEAD, ON_TRACK, or BEHIND
   */
  private calculateCompletionStatus(
    actual: number,
    expected: number,
  ): 'AHEAD' | 'ON_TRACK' | 'BEHIND' {
    const diff = actual - expected;

    if (diff > 0.05) return 'AHEAD'; // >5% ahead
    if (diff < -0.05) return 'BEHIND'; // >5% behind
    return 'ON_TRACK';
  }
}
