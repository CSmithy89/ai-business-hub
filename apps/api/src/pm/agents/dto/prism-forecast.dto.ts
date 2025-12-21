import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsObject, Min, Max } from 'class-validator';

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
 * Forecast response from Prism agent
 */
export interface PrismForecastDto {
  predictedDate: string;
  confidence: ConfidenceLevel;
  optimisticDate: string;
  pessimisticDate: string;
  reasoning: string;
  factors: string[];
  velocityAvg: number;
  dataPoints: number;
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
