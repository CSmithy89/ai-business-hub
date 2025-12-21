/**
 * PM Health Module Constants
 *
 * Shared configuration for risk severity styling and risk type labels.
 * Used by RiskCard, RiskAlertBanner, and other health-related components.
 */

export type RiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type RiskStatus = 'IDENTIFIED' | 'ANALYZING' | 'RESOLVED' | 'MITIGATED';

/**
 * Severity-based styling configuration.
 *
 * Each severity level has:
 * - bg: Background and border colors for cards/banners
 * - badge: Badge background and text colors
 * - icon: Icon color class
 * - text: Text color for descriptions
 */
export const severityConfig = {
  CRITICAL: {
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-600 text-white',
    icon: 'text-red-600',
    text: 'text-red-900',
  },
  HIGH: {
    bg: 'bg-orange-50 border-orange-200',
    badge: 'bg-orange-600 text-white',
    icon: 'text-orange-600',
    text: 'text-orange-900',
  },
  MEDIUM: {
    bg: 'bg-yellow-50 border-yellow-200',
    badge: 'bg-yellow-600 text-white',
    icon: 'text-yellow-600',
    text: 'text-yellow-900',
  },
  LOW: {
    bg: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-600 text-white',
    icon: 'text-blue-600',
    text: 'text-blue-900',
  },
} as const;

/**
 * Human-readable labels for risk types.
 */
export const riskTypeLabels: Record<string, string> = {
  DEADLINE_WARNING: 'Deadline Warning',
  BLOCKER_CHAIN: 'Blocker Chain',
  CAPACITY_OVERLOAD: 'Capacity Overload',
  VELOCITY_DROP: 'Velocity Drop',
  SCOPE_CREEP: 'Scope Creep',
};

/**
 * Get severity config with fallback to MEDIUM if unknown severity.
 */
export function getSeverityConfig(severity: RiskSeverity | string) {
  return severityConfig[severity as RiskSeverity] || severityConfig.MEDIUM;
}
