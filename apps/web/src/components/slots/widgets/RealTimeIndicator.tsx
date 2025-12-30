'use client';

/**
 * Real-Time Update Indicator
 *
 * Shows the current connection/sync status and last update time for
 * real-time dashboard data. Provides visual feedback about data freshness
 * and an optional manual refresh button.
 *
 * Features:
 * - Status dot (green=connected, yellow+pulse=syncing)
 * - Last updated timestamp with relative formatting
 * - Optional refresh button with spinning animation when loading
 *
 * @see docs/modules/bm-dm/stories/dm-04-4-realtime-widget-updates.md
 * Epic: DM-04 | Story: DM-04.4
 *
 * @example
 * // Basic usage
 * <RealTimeIndicator />
 *
 * // With refresh callback
 * <RealTimeIndicator onRefresh={() => triggerDataRefresh()} />
 */

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLastUpdated, useAnyLoading } from '@/hooks/use-dashboard-selectors';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for RealTimeIndicator component
 */
export interface RealTimeIndicatorProps {
  /** Callback when refresh button is clicked */
  onRefresh?: () => void;
  /** Custom class name for styling */
  className?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format last update time to human-readable relative string
 *
 * @param timestamp Unix timestamp in milliseconds
 * @returns Formatted relative time string
 */
function formatLastUpdate(timestamp: number | null): string {
  if (timestamp === null) return 'Not updated';

  const diff = Date.now() - timestamp;

  if (diff < 1000) return 'Just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

  // For older timestamps, show time of day
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Real-Time Update Indicator
 *
 * Displays the current sync status and provides manual refresh capability.
 * Uses the dashboard state store to determine loading status and last update time.
 */
export function RealTimeIndicator({
  onRefresh,
  className = '',
}: RealTimeIndicatorProps) {
  const timestamp = useLastUpdated();
  const isLoading = useAnyLoading();

  // State for forcing re-render to update relative time display
  const [, setTick] = useState(0);

  // Update relative time display every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}
      data-testid="realtime-indicator"
      aria-live="polite"
    >
      {/* Status dot */}
      <span
        className={`h-2 w-2 rounded-full flex-shrink-0 ${
          isLoading
            ? 'bg-yellow-500 animate-pulse'
            : timestamp
              ? 'bg-green-500'
              : 'bg-gray-400'
        }`}
        data-testid="status-dot"
        aria-hidden="true"
      />

      {/* Status text */}
      <span data-testid="last-updated-text">
        {isLoading ? 'Syncing...' : `Last updated: ${formatLastUpdate(timestamp)}`}
      </span>

      {/* Refresh button (optional) */}
      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-6 w-6 p-0 ml-1"
          data-testid="refresh-button"
          aria-label={isLoading ? 'Syncing data...' : 'Refresh dashboard data'}
        >
          <RefreshCw
            className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
        </Button>
      )}
    </div>
  );
}
