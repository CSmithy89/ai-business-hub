/**
 * CCR Quota Hook
 *
 * Fetches and manages CCR subscription quota data including
 * usage limits, current usage, and reset dates.
 *
 * @module hooks
 * @story DM-01.8
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { DM_CONSTANTS } from '@/lib/dm-constants';

/**
 * Quota status based on usage percentage
 */
export type QuotaStatus = 'normal' | 'warning' | 'critical';

/**
 * Individual provider quota
 */
export interface ProviderQuota {
  providerId: string;
  providerName: string;
  provider: string;
  used: number;
  limit: number;
  resetDate: string;
  billingCycle: 'monthly' | 'daily' | 'per-request';
}

/**
 * CCR Quota summary
 */
export interface CCRQuotaSummary {
  quotas: ProviderQuota[];
  lastUpdated: string;
}

// Query key
const CCR_QUOTA_KEY = ['ccr-quota'];

/**
 * Mock fetch for CCR quota (will be replaced with real API)
 */
async function fetchCCRQuota(): Promise<CCRQuotaSummary> {
  // TODO: Replace with actual API call when DM-02 backend is ready
  await new Promise((resolve) => setTimeout(resolve, 400));

  return {
    quotas: [
      {
        providerId: 'anthropic-sub',
        providerName: 'Claude (Anthropic)',
        provider: 'anthropic',
        used: 850000,
        limit: 1000000,
        resetDate: getNextResetDate(),
        billingCycle: 'monthly',
      },
      {
        providerId: 'openai-sub',
        providerName: 'OpenAI',
        provider: 'openai',
        used: 150000,
        limit: 500000,
        resetDate: getNextResetDate(),
        billingCycle: 'monthly',
      },
      {
        providerId: 'deepseek-sub',
        providerName: 'DeepSeek',
        provider: 'deepseek',
        used: 5000,
        limit: 100000,
        resetDate: getNextResetDate(),
        billingCycle: 'monthly',
      },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get next reset date (first of next month)
 */
function getNextResetDate(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString();
}

/**
 * Hook for fetching CCR quota data
 */
export function useCCRQuota() {
  return useQuery({
    queryKey: CCR_QUOTA_KEY,
    queryFn: fetchCCRQuota,
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
  });
}

/**
 * Calculate usage percentage
 */
export function getUsagePercentage(used: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min(100, (used / limit) * 100);
}

/**
 * Get quota status based on usage percentage
 */
export function getQuotaStatus(used: number, limit: number): QuotaStatus {
  const percentage = getUsagePercentage(used, limit) / 100;

  if (percentage >= DM_CONSTANTS.CCR.DEFAULT_QUOTA_CRITICAL_THRESHOLD) {
    return 'critical';
  }
  if (percentage >= DM_CONSTANTS.CCR.DEFAULT_QUOTA_WARNING_THRESHOLD) {
    return 'warning';
  }
  return 'normal';
}

/**
 * Get progress bar color based on status
 */
export function getProgressColor(status: QuotaStatus): string {
  const colors: Record<QuotaStatus, string> = {
    normal: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500',
  };
  return colors[status];
}

/**
 * Get text color based on status
 */
export function getStatusTextColor(status: QuotaStatus): string {
  const colors: Record<QuotaStatus, string> = {
    normal: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600',
  };
  return colors[status];
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Format reset date for display
 */
export function formatResetDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `In ${diffDays} days`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get remaining quota
 */
export function getRemainingQuota(used: number, limit: number): number {
  return Math.max(0, limit - used);
}
