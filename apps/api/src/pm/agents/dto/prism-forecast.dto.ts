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
    description: 'Additional scope (story points)',
    required: false,
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
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
