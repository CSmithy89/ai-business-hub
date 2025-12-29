/**
 * CopilotKit Type Definitions
 *
 * Extended types for CopilotKit integration with HYVVE.
 * This file provides type definitions for the Dynamic Module System.
 *
 * Widget types are canonically defined in @/components/slots/types.ts
 * and re-exported here for convenience.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-01-tech-spec.md
 */

// Re-export CopilotKit types for convenience
export type { CopilotKitProps } from '@copilotkit/react-core';

// Re-export widget types from canonical source to avoid duplication
export type {
  WidgetType,
  WidgetData,
  RenderWidgetArgs,
  ProjectStatusData as ProjectStatusWidgetData,
  TaskListData as TaskListWidgetData,
  MetricsData as MetricsWidgetData,
  AlertData as AlertWidgetData,
} from '@/components/slots/types';

/**
 * HYVVE-specific CopilotKit configuration
 */
export interface HYVVECopilotConfig {
  /** Runtime URL for AG-UI connection */
  runtimeUrl: string;
  /** Optional public API key for CopilotKit Cloud */
  publicApiKey?: string;
  /** Whether the connection is in mock mode */
  isMockMode: boolean;
}

/**
 * CCR (Claude Code Router) status types (DM-01.7)
 */
export interface CCRProviderStatus {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
}

export interface CCRStatus {
  connected: boolean;
  mode: 'auto' | 'manual';
  providers: CCRProviderStatus[];
  lastChecked: string;
}

/**
 * CCR quota types (DM-01.8)
 */
export interface CCRQuota {
  provider: string;
  used: number;
  limit: number;
  resetDate: string;
}
