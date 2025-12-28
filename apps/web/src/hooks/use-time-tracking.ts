/**
 * Time Tracking Hook
 *
 * Story: PM-12.1 - Agent UI Components
 *
 * React hook for managing time tracking state with localStorage persistence.
 * Handles timer start/stop, manual time entry, and syncing with backend.
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSessionToken, useSession } from '@/lib/auth-client';
import { NESTJS_API_URL } from '@/lib/api-config';
import { safeJson } from '@/lib/utils/safe-json';
import { TIME_TRACKER_STORAGE_KEY } from '@/components/pm/agents/constants';

// ============================================================================
// Types
// ============================================================================

export interface TimeEntry {
  id: string;
  projectId: string;
  taskId?: string;
  userId: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  description?: string;
  createdAt: string;
}

export interface ActiveTimer {
  projectId: string;
  taskId?: string;
  taskTitle?: string;
  startTime: string;
  description?: string;
}

interface LogTimeRequest {
  projectId: string;
  taskId?: string;
  startTime: string;
  endTime: string;
  duration: number;
  description?: string;
}

interface LogTimeResponse {
  success: boolean;
  entry: TimeEntry;
}

// ============================================================================
// API Functions
// ============================================================================

function getBaseUrl(): string {
  if (!NESTJS_API_URL) throw new Error('NESTJS_API_URL is not configured');
  return NESTJS_API_URL.replace(/\/$/, '');
}

async function logTimeEntry(params: LogTimeRequest & { token?: string }): Promise<TimeEntry> {
  const url = `${getBaseUrl()}/pm/agents/time/log`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(params.token && { Authorization: `Bearer ${params.token}` }),
    },
    body: JSON.stringify({
      projectId: params.projectId,
      taskId: params.taskId,
      startTime: params.startTime,
      endTime: params.endTime,
      duration: params.duration,
      description: params.description,
    }),
  });

  if (!response.ok) {
    const body = await safeJson<unknown>(response);
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : `Failed to log time: ${response.statusText}`;
    throw new Error(message);
  }

  const data = await safeJson<LogTimeResponse | TimeEntry>(response);
  if (!data) throw new Error('Invalid response from server');

  // Handle both wrapped and unwrapped response formats
  return 'entry' in data ? data.entry : data;
}

// ============================================================================
// Storage Functions
// ============================================================================

function getStorageKey(projectId: string): string {
  return `${TIME_TRACKER_STORAGE_KEY}-${projectId}`;
}

function loadActiveTimer(projectId: string): ActiveTimer | null {
  if (typeof window === 'undefined') return null;

  try {
    const key = getStorageKey(projectId);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load active timer:', error);
  }
  return null;
}

function saveActiveTimer(projectId: string, timer: ActiveTimer | null): void {
  if (typeof window === 'undefined') return;

  try {
    const key = getStorageKey(projectId);
    if (timer) {
      localStorage.setItem(key, JSON.stringify(timer));
    } else {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Failed to save active timer:', error);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate elapsed time in seconds from start time to now
 */
function calculateElapsedSeconds(startTime: string): number {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  return Math.floor((now - start) / 1000);
}

/**
 * Format seconds into HH:MM:SS display
 */
export function formatElapsedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format minutes into human-readable duration
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Parse duration string (e.g., "1h 30m", "45m", "2h") to minutes
 */
export function parseDurationToMinutes(input: string): number | null {
  const trimmed = input.trim().toLowerCase();

  // Try HH:MM format
  const colonMatch = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    const hours = parseInt(colonMatch[1], 10);
    const mins = parseInt(colonMatch[2], 10);
    if (mins < 60) {
      return hours * 60 + mins;
    }
  }

  // Try "Xh Ym" or "Xh" or "Ym" formats
  let totalMinutes = 0;
  let hasMatch = false;

  const hourMatch = trimmed.match(/(\d+)\s*h/);
  if (hourMatch) {
    totalMinutes += parseInt(hourMatch[1], 10) * 60;
    hasMatch = true;
  }

  const minMatch = trimmed.match(/(\d+)\s*m/);
  if (minMatch) {
    totalMinutes += parseInt(minMatch[1], 10);
    hasMatch = true;
  }

  // Try plain number (assume minutes)
  if (!hasMatch) {
    const plainNumber = parseInt(trimmed, 10);
    if (!isNaN(plainNumber) && plainNumber > 0) {
      return plainNumber;
    }
  }

  return hasMatch ? totalMinutes : null;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing time tracking state.
 *
 * Provides:
 * - `activeTimer` - Current active timer (if any)
 * - `elapsedSeconds` - Elapsed time in seconds (updates every second)
 * - `elapsedFormatted` - Formatted elapsed time string
 * - `isRunning` - Whether timer is currently running
 * - `startTimer` - Start a new timer
 * - `stopTimer` - Stop timer and log time entry
 * - `cancelTimer` - Cancel timer without logging
 * - `logManualTime` - Log time without using timer
 *
 * Timer state persists to localStorage to survive page refreshes.
 *
 * @param projectId - Project ID for context
 *
 * @example
 * ```tsx
 * const {
 *   isRunning,
 *   elapsedFormatted,
 *   startTimer,
 *   stopTimer,
 * } = useTimeTracking('proj_123');
 *
 * // Start timer
 * startTimer({ taskId: 'task_456', description: 'Working on feature' });
 *
 * // Display elapsed time
 * <span>{elapsedFormatted}</span>
 *
 * // Stop and log
 * await stopTimer();
 * ```
 */
export function useTimeTracking(projectId: string) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = getSessionToken(session);

  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load active timer on mount
  useEffect(() => {
    const timer = loadActiveTimer(projectId);
    if (timer) {
      setActiveTimer(timer);
      setElapsedSeconds(calculateElapsedSeconds(timer.startTime));
    }
  }, [projectId]);

  // Update elapsed time every second when timer is running
  useEffect(() => {
    if (activeTimer) {
      // Set initial elapsed
      setElapsedSeconds(calculateElapsedSeconds(activeTimer.startTime));

      // Start interval
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(calculateElapsedSeconds(activeTimer.startTime));
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      setElapsedSeconds(0);
      return undefined;
    }
  }, [activeTimer]);

  // Log time mutation
  const logMutation = useMutation({
    mutationFn: (params: LogTimeRequest) => logTimeEntry({ ...params, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-time-entries', projectId] });
      toast.success('Time logged successfully');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Failed to log time';
      toast.error('Failed to log time', { description: message });
    },
  });

  /**
   * Start a new timer
   */
  const startTimer = useCallback(
    (options?: { taskId?: string; taskTitle?: string; description?: string }) => {
      if (activeTimer) {
        toast.error('Timer already running');
        return;
      }

      const timer: ActiveTimer = {
        projectId,
        taskId: options?.taskId,
        taskTitle: options?.taskTitle,
        startTime: new Date().toISOString(),
        description: options?.description,
      };

      setActiveTimer(timer);
      saveActiveTimer(projectId, timer);
      toast.success('Timer started');
    },
    [activeTimer, projectId]
  );

  /**
   * Stop timer and log the time entry
   */
  const stopTimer = useCallback(async (): Promise<TimeEntry | null> => {
    if (!activeTimer) {
      toast.error('No active timer');
      return null;
    }

    const endTime = new Date().toISOString();
    const durationMs = new Date(endTime).getTime() - new Date(activeTimer.startTime).getTime();
    const durationMinutes = Math.max(1, Math.round(durationMs / 60000)); // At least 1 minute

    try {
      const entry = await logMutation.mutateAsync({
        projectId: activeTimer.projectId,
        taskId: activeTimer.taskId,
        startTime: activeTimer.startTime,
        endTime,
        duration: durationMinutes,
        description: activeTimer.description,
      });

      // Clear timer state
      setActiveTimer(null);
      saveActiveTimer(projectId, null);

      return entry;
    } catch {
      // Error already handled by mutation
      return null;
    }
  }, [activeTimer, logMutation, projectId]);

  /**
   * Cancel timer without logging
   */
  const cancelTimer = useCallback(() => {
    if (!activeTimer) return;

    setActiveTimer(null);
    saveActiveTimer(projectId, null);
    toast.info('Timer cancelled');
  }, [activeTimer, projectId]);

  /**
   * Log manual time entry (without using timer)
   */
  const logManualTime = useCallback(
    async (params: {
      taskId?: string;
      duration: number; // in minutes
      description?: string;
      date?: Date; // defaults to now
    }): Promise<TimeEntry | null> => {
      const endTime = params.date ? params.date.toISOString() : new Date().toISOString();
      const startTime = new Date(
        new Date(endTime).getTime() - params.duration * 60000
      ).toISOString();

      try {
        const entry = await logMutation.mutateAsync({
          projectId,
          taskId: params.taskId,
          startTime,
          endTime,
          duration: params.duration,
          description: params.description,
        });
        return entry;
      } catch {
        // Error already handled by mutation
        return null;
      }
    },
    [logMutation, projectId]
  );

  /**
   * Update timer description while running
   */
  const updateDescription = useCallback(
    (description: string) => {
      if (!activeTimer) return;

      const updated = { ...activeTimer, description };
      setActiveTimer(updated);
      saveActiveTimer(projectId, updated);
    },
    [activeTimer, projectId]
  );

  return {
    activeTimer,
    elapsedSeconds,
    elapsedFormatted: formatElapsedTime(elapsedSeconds),
    isRunning: !!activeTimer,
    isLogging: logMutation.isPending,
    startTimer,
    stopTimer,
    cancelTimer,
    logManualTime,
    updateDescription,
  };
}
