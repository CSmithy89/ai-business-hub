import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsObject, Min, Max, IsEnum } from 'class-validator';

/**
 * Confidence level for predictions
 */
export enum ConfidenceLevel {
  LOW = 'LOW',
  MED = 'MED',
  HIGH = 'HIGH',
}

/**
 * Velocity trend direction
 */
export enum VelocityTrend {
  UP = 'UP',
  DOWN = 'DOWN',
  STABLE = 'STABLE',
}

/**
 * Prediction factor affecting forecast accuracy
 */
export interface PredictionFactor {
  name: string;
  value: string;
  impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  description: string;
}

/**
 * Probability distribution for Monte Carlo simulation
 */
export interface ProbabilityDistribution {
  p10: string;
  p25: string;
  p50: string;
  p75: string;
  p90: string;
}

/**
 * Forecast response from Prism agent
 */
export interface PrismForecastDto {
  predictedDate: string;
  confidence: ConfidenceLevel;
  optimisticDate: string;
  pessimisticDate: string;
  reasoning: string;
  factors: string[] | PredictionFactor[];
  velocityAvg: number;
  dataPoints: number;
  probabilityDistribution?: ProbabilityDistribution;
}

/**
 * Velocity metadata
 */
export interface VelocityMetadataDto {
  velocity: number;
  trend: VelocityTrend;
  confidence: ConfidenceLevel;
  sampleSize: number;
  timeRange: string;
}

/**
 * Historical velocity data point
 */
export interface VelocityHistoryDto {
  period: string;
  completedPoints: number;
  totalTasks: number;
  completedTasks: number;
  startDate: string;
  endDate: string;
}

/**
 * What-if scenario for forecast
 */
export class ForecastScenarioDto {
  @ApiProperty({
    description: 'Additional scope (story points to add or remove)',
    required: false,
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(-1000)
  @Max(10000)
  addedScope?: number;

  @ApiProperty({
    description: 'Team size change (positive or negative)',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(-10)
  @Max(10)
  teamSizeChange?: number;

  @ApiProperty({
    description: 'Velocity multiplier (0.5 = 50%, 2.0 = 200%)',
    required: false,
    example: 1.2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(2.0)
  velocityMultiplier?: number;

  @ApiProperty({
    description: 'Additional parameters',
    required: false,
  })
  @IsOptional()
  @IsObject()
  params?: Record<string, any>;
}

/**
 * Request body for forecast endpoint
 */
export class GenerateForecastDto {
  @ApiProperty({
    description: 'What-if scenario to analyze',
    required: false,
    type: ForecastScenarioDto,
  })
  @IsOptional()
  @IsObject()
  scenario?: ForecastScenarioDto;
}

/**
 * Anomaly detection result
 */
export interface AnomalyDto {
  index: number;
  period: string;
  value: number;
  expectedRange: [number, number];
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
}

/**
 * Completion probability analysis
 */
export interface CompletionProbabilityDto {
  targetDate: string;
  probability: number;
  probabilityLabel: 'LOW' | 'MEDIUM' | 'HIGH';
  weeksRemaining: number;
  pointsRemaining: number;
  requiredVelocity: number;
  currentVelocity: number;
  assessment: string;
}

/**
 * Risk category types
 */
export enum RiskCategory {
  SCHEDULE = 'SCHEDULE',
  SCOPE = 'SCOPE',
  RESOURCE = 'RESOURCE',
  BUDGET = 'BUDGET',
}

/**
 * Risk source types
 */
export enum RiskSource {
  PRISM = 'PRISM',
  PULSE = 'PULSE',
  MANUAL = 'MANUAL',
}

/**
 * Risk status types
 */
export enum RiskStatus {
  ACTIVE = 'ACTIVE',
  MITIGATED = 'MITIGATED',
  ACCEPTED = 'ACCEPTED',
  DISMISSED = 'DISMISSED',
}

/**
 * Risk entry DTO (PM-08-3)
 */
export interface PmRiskEntryDto {
  id: string;
  projectId: string;
  source: RiskSource;
  category: RiskCategory;
  probability: number; // 0.0 - 1.0
  impact: number; // 0.0 - 1.0
  description: string;
  mitigation?: string;
  status: RiskStatus;

  // Risk details (optional, category-specific)
  targetDate?: string; // ISO 8601
  predictedDate?: string; // ISO 8601
  delayDays?: number;
  baselineScope?: number;
  currentScope?: number;
  scopeIncrease?: number;
  velocityTrend?: VelocityTrend;
  velocityChange?: number;

  detectedAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Update risk status request
 */
export class UpdateRiskStatusDto {
  @ApiProperty({
    description: 'New risk status',
    enum: RiskStatus,
    example: RiskStatus.MITIGATED,
  })
  @IsEnum(RiskStatus)
  status!: RiskStatus;
}

/**
 * Scenario risk types (PM-08-5)
 */
export type ScenarioRiskType =
  | 'SCOPE_CREEP'
  | 'TEAM_SCALING'
  | 'SCHEDULE_DELAY'
  | 'UNREALISTIC_VELOCITY';

/**
 * Scenario risk entry (PM-08-5)
 */
export interface ScenarioRiskDto {
  type: ScenarioRiskType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  mitigation: string;
}

/**
 * Scenario forecast response with risk assessment (PM-08-5)
 */
export interface ScenarioForecastDto {
  baseline: {
    predictedDate: string;
    confidence: ConfidenceLevel;
  };
  scenario: {
    predictedDate: string;
    confidence: ConfidenceLevel;
    optimisticDate: string;
    pessimisticDate: string;
  };
  delta: {
    days: number;
    weeks: number;
    direction: 'EARLIER' | 'LATER' | 'SAME';
  };
  risks: ScenarioRiskDto[];
  summary: string;
  resourceImpact: {
    teamWeeks: number;
    velocityChange: number;
  };
}

/**
 * Team performance metrics response (PM-08-5)
 */
export interface TeamPerformanceMetricsDto {
  velocity: {
    current: number;
    average: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
    sparkline: number[];
    comparisonToWorkspace: number | null;
  };
  cycleTime: {
    current: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
    sparkline: number[];
    comparisonToWorkspace: number | null;
  };
  throughput: {
    current: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
    sparkline: number[];
    comparisonToWorkspace: number | null;
  };
  completionRate: {
    current: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
    sparkline: number[];
    comparisonToWorkspace: number | null;
  };
  capacityUtilization: {
    current: number;
    status: 'UNDER_UTILIZED' | 'OPTIMAL' | 'OVER_UTILIZED';
  };
}

// ============================================
// PM-08-6: ANALYTICS EXPORT DTOS
// ============================================

/**
 * Export date range query parameters
 */
export class ExportQueryDto {
  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;

  @IsOptional()
  metrics?: string[];
}

/**
 * Trend data point for export
 */
export interface TrendDataPoint {
  date: string;
  velocity: number | null;
  scope: number | null;
  completedPoints: number | null;
  completionRate: number | null;
  teamSize: number | null;
}

/**
 * Aggregated trend data for export
 */
export interface TrendDataExport {
  projectId: string;
  projectName: string;
  exportedAt: string;
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    averageVelocity: number;
    totalScope: number;
    totalCompleted: number;
    overallCompletionRate: number;
    healthScore: number;
  };
  trends: TrendDataPoint[];
  risks: {
    id: string;
    category: string;
    severity: string;
    description: string;
    status: string;
    detectedAt: string;
  }[];
}

/**
 * CSV export row structure
 */
export interface CsvExportRow {
  date: string;
  metric: string;
  value: number | string;
  unit: string;
}
