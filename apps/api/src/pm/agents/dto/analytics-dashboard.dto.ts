import { AnomalyDto, PmRiskEntryDto } from './prism-forecast.dto';

/**
 * Dashboard overview metrics
 */
export interface DashboardOverviewDto {
  currentVelocity: number;
  completionPercentage: number;
  healthScore: number;
  predictedCompletion: string; // ISO 8601
}

/**
 * Velocity trend data for charting
 */
export interface VelocityTrendDto {
  current: number;
  average: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  dataPoints: VelocityTrendDataPointDto[];
  trendLine: {
    slope: number;
    intercept: number;
  };
}

export interface VelocityTrendDataPointDto {
  period: string;
  value: number;
  trendValue: number;
  isAnomaly: boolean;
  anomalySeverity?: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Scope trend data for charting
 */
export interface ScopeTrendDto {
  current: number;
  baseline: number;
  scopeIncrease: number;
  dataPoints: ScopeTrendDataPointDto[];
}

export interface ScopeTrendDataPointDto {
  period: string;
  totalPoints: number;
  completedPoints: number;
  remainingPoints: number;
  baselinePoints: number;
  scopeChange: number;
  isScopeCreep: boolean;
}

/**
 * Completion trend data for charting
 */
export interface CompletionTrendDto {
  current: number;
  expected: number;
  status: 'AHEAD' | 'ON_TRACK' | 'BEHIND';
  dataPoints: CompletionTrendDataPointDto[];
}

export interface CompletionTrendDataPointDto {
  period: string;
  actual: number;
  expected: number;
  aheadBehind: number;
}

/**
 * Productivity trend data for charting
 */
export interface ProductivityTrendDto {
  current: number;
  average: number;
  dataPoints: ProductivityTrendDataPointDto[];
}

export interface ProductivityTrendDataPointDto {
  period: string;
  pointsPerWeek: number;
  cycleTime: number; // days
  throughput: number; // tasks per week
}

/**
 * AI insights and recommendations
 */
export interface InsightDto {
  id: string;
  type: 'RECOMMENDATION' | 'WARNING' | 'CELEBRATION';
  title: string;
  description: string;
  actionable: boolean;
  action?: {
    label: string;
    url: string;
  };
}

/**
 * Dashboard trends section
 */
export interface DashboardTrendsDto {
  velocity: VelocityTrendDto;
  scope: ScopeTrendDto;
  completion: CompletionTrendDto;
  productivity: ProductivityTrendDto;
}

/**
 * Complete dashboard data response
 */
export interface DashboardDataDto {
  overview: DashboardOverviewDto;
  trends: DashboardTrendsDto;
  anomalies: AnomalyDto[];
  risks: PmRiskEntryDto[];
  insights: InsightDto[];
}

/**
 * Scope snapshot for historical tracking
 */
export interface ScopeSnapshotDto {
  period: string;
  totalPoints: number;
  completedPoints: number;
  completionPercentage: number;
}
