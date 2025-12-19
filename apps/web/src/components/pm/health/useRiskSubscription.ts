/**
 * Risk Subscription Hook
 *
 * Story: PM-05.5 - Pulse Risk Alerts
 *
 * React hook for WebSocket real-time risk updates. Subscribes to
 * project health events and invalidates React Query cache when
 * new risks are detected or health scores change.
 *
 * This hook is optional and gracefully degrades if WebSocket
 * infrastructure is not available (PM-06 not yet implemented).
 */

'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Placeholder type - replace with actual socket type when PM-06 is implemented
type Socket = any;

/**
 * Hook to get socket instance - placeholder until PM-06 is complete
 * Returns undefined if WebSocket not available
 */
function useSocket(): Socket | undefined {
  // TODO: Replace with actual useSocket hook from PM-06
  // For now, return undefined to gracefully degrade
  return undefined;
}

interface HealthUpdateEvent {
  projectId: string;
  healthScore: number;
  riskCount: number;
}

interface HealthAlertEvent {
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  risks: Array<{
    id: string;
    title: string;
    severity: string;
  }>;
}

/**
 * Use Risk Subscription Hook
 *
 * Subscribes to real-time project health and risk events via WebSocket.
 * Automatically invalidates React Query cache and shows toast notifications
 * when new risks are detected.
 *
 * @param projectId - Project ID to subscribe to
 *
 * Usage:
 * ```tsx
 * function ProjectPage({ projectId }) {
 *   useRiskSubscription(projectId);
 *   // ... rest of component
 * }
 * ```
 */
export function useRiskSubscription(projectId: string) {
  const queryClient = useQueryClient();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) {
      // WebSocket not available - gracefully degrade
      // Component will fall back to polling via React Query
      return;
    }

    // Subscribe to project health events
    socket.emit('project:subscribe', { projectId });

    // Listen for health updates
    const handleHealthUpdate = (data: HealthUpdateEvent) => {
      if (data.projectId !== projectId) return;

      // Invalidate queries to refetch latest data
      queryClient.invalidateQueries({ queryKey: ['pm-health', projectId] });
      queryClient.invalidateQueries({ queryKey: ['pm-risks', projectId] });
    };

    // Listen for new risk alerts
    const handleHealthAlert = (data: HealthAlertEvent) => {
      // Invalidate queries to show new risks
      queryClient.invalidateQueries({ queryKey: ['pm-risks', projectId] });

      // Show toast notification
      toast.error('New Risk Detected', {
        description: data.message,
        duration: 5000,
      });
    };

    socket.on('health:updated', handleHealthUpdate);
    socket.on('health:alert', handleHealthAlert);

    // Cleanup on unmount
    return () => {
      socket.off('health:updated', handleHealthUpdate);
      socket.off('health:alert', handleHealthAlert);
      socket.emit('project:unsubscribe', { projectId });
    };
  }, [socket, projectId, queryClient]);
}
