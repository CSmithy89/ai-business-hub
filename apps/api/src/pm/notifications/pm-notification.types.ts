/**
 * PM Notification Types
 *
 * Type definitions for PM-specific notifications including
 * health alerts, risk notifications, and report notifications.
 *
 * @see Story PM-12.3: Notification Integration
 */

import { HealthLevel, RiskSeverity } from '@prisma/client';

/**
 * Health alert notification payload
 */
export interface HealthAlertPayload {
  projectId: string;
  projectName: string;
  score: number;
  level: HealthLevel;
  previousLevel?: HealthLevel;
  previousScore?: number;
  explanation: string;
  topRisks?: Array<{
    title: string;
    severity: RiskSeverity;
  }>;
}

/**
 * Risk notification payload
 */
export interface RiskNotificationPayload {
  projectId: string;
  projectName: string;
  riskId: string;
  title: string;
  severity: RiskSeverity;
  description: string;
  affectedTaskCount: number;
}

/**
 * Risk resolved notification payload
 */
export interface RiskResolvedPayload {
  projectId: string;
  projectName: string;
  riskId: string;
  title: string;
  resolvedBy: string;
  resolvedAt: string;
}

/**
 * Report notification payload
 */
export interface ReportNotificationPayload {
  projectId: string;
  projectName: string;
  reportId: string;
  reportType: string;
  reportTitle: string;
  downloadUrl?: string;
}

/**
 * Critical health email data
 */
export interface CriticalHealthEmailData {
  userName: string;
  projectName: string;
  projectUrl: string;
  healthScore: number;
  healthLevel: string;
  explanation: string;
  topRisks: Array<{ title: string; severity: string }>;
  managePreferencesUrl: string;
}
