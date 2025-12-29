/**
 * CopilotKit Type Definitions
 *
 * Extended types for CopilotKit integration with HYVVE.
 * This file provides type definitions for the Dynamic Module System.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-01-tech-spec.md
 */

// Re-export CopilotKit types for convenience
export type { CopilotKitProps } from '@copilotkit/react-core';

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
 * Widget types for the Slot System (DM-01.2+)
 * These correspond to the widget components that can be rendered by agents.
 */
export type WidgetType = 'ProjectStatus' | 'TaskList' | 'Metrics' | 'Alert';

/**
 * Arguments passed to widget render functions via useRenderToolCall
 */
export interface WidgetRenderArgs {
  /** Type identifier for the widget */
  type: WidgetType;
  /** Widget-specific data payload */
  data: Record<string, unknown>;
}

/**
 * Base interface for all widget data
 */
export interface WidgetData {
  /** Optional unique identifier */
  id?: string;
  /** Optional display title */
  title?: string;
  /** Additional widget-specific properties */
  [key: string]: unknown;
}

/**
 * Project status widget data (DM-01.3)
 */
export interface ProjectStatusWidgetData extends WidgetData {
  projectId: string;
  projectName: string;
  status: 'on_track' | 'at_risk' | 'behind';
  progress: number; // 0-100
  dueDate?: string;
  tasksCompleted: number;
  tasksTotal: number;
}

/**
 * Task list widget data (DM-01.3)
 */
export interface TaskListWidgetData extends WidgetData {
  tasks: Array<{
    id: string;
    title: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    assignee?: string;
  }>;
  limit?: number;
}

/**
 * Metrics widget data (DM-01.3)
 */
export interface MetricsWidgetData extends WidgetData {
  metrics: Array<{
    label: string;
    value: number | string;
    change?: { value: number; direction: 'up' | 'down' };
    icon?: string;
  }>;
}

/**
 * Alert widget data (DM-01.3)
 */
export interface AlertWidgetData extends WidgetData {
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action?: { label: string; href: string };
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
