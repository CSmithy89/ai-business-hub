/**
 * useApprovalQueue Hook
 *
 * React hook for creating approval items in the Foundation approval queue
 * when HITL tools have low confidence (<60%) requiring full review.
 *
 * This hook:
 * - Creates approval items via the Foundation API
 * - Tracks pending approvals in the HITL store
 * - Provides loading and error states
 *
 * @see docs/modules/bm-dm/stories/dm-05-3-approval-workflow-integration.md
 * Epic: DM-05 | Story: DM-05.3
 */
'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useHITLStore } from '@/stores/hitl-store';
import { NESTJS_API_URL } from '@/lib/api-config';
import { safeJson } from '@/lib/utils/safe-json';
import type { CreateQueuedApprovalParams, QueuedApproval, RiskLevel } from './types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Approval item response from Foundation API.
 */
export interface ApprovalItemResponse {
  id: string;
  type: string;
  title: string;
  description?: string;
  confidenceScore: number;
  status: string;
  priority: string;
  dueAt: string;
  createdAt: string;
  sourceModule?: string;
  sourceId?: string;
}

/**
 * Return type for useApprovalQueue hook.
 */
export interface UseApprovalQueueReturn {
  /** Create an approval item in the queue */
  createApproval: (params: CreateQueuedApprovalParams) => Promise<ApprovalItemResponse | null>;
  /** Check status of a pending approval */
  checkApprovalStatus: (approvalId: string) => Promise<ApprovalItemResponse | null>;
  /** Whether approval creation is in progress */
  isCreating: boolean;
  /** Current error (if any) */
  error: Error | null;
  /** Clear the current error */
  clearError: () => void;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a human-readable title for the approval.
 */
function generateTitle(params: CreateQueuedApprovalParams): string {
  const formattedName = params.toolName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  // Use description template if available
  if (params.config.descriptionTemplate) {
    let title = params.config.descriptionTemplate;
    for (const [key, value] of Object.entries(params.toolArgs)) {
      // Escape regex metacharacters in the key to avoid SyntaxError
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      title = title.replace(new RegExp(`\\{${escapedKey}\\}`, 'g'), String(value));
    }
    return title;
  }

  return `Approve: ${formattedName}`;
}

/**
 * Generate a description for the approval.
 */
function generateDescription(params: CreateQueuedApprovalParams): string {
  const formattedName = params.toolName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const riskLabel = params.config.riskLevel.toUpperCase();

  const lines = [
    `**Agent Action:** ${formattedName}`,
    `**Risk Level:** ${riskLabel}`,
    `**Confidence Score:** ${params.confidenceScore}%`,
    '',
  ];

  // Add safe parameters (filter out sensitive data)
  const safeArgs = filterSensitiveArgs(params.toolArgs);
  const argEntries = Object.entries(safeArgs);

  if (argEntries.length > 0) {
    lines.push('**Parameters:**');
    for (const [key, value] of argEntries) {
      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      lines.push(`- ${formattedKey}: ${value}`);
    }
  }

  // Add risk warning for high risk
  if (params.config.riskLevel === 'high') {
    lines.push('');
    lines.push('**Warning:** This action has been flagged as high-risk and requires careful review.');
  }

  return lines.join('\n');
}

/**
 * Filter sensitive arguments from display.
 */
function filterSensitiveArgs(args: Record<string, unknown>): Record<string, unknown> {
  const sensitivePatterns = /password|secret|token|api[_-]?key|credential|auth/i;
  return Object.fromEntries(
    Object.entries(args).filter(([key]) => !sensitivePatterns.test(key))
  );
}

/**
 * Calculate priority based on risk level and confidence score.
 */
function calculatePriority(riskLevel: RiskLevel, confidenceScore: number): string {
  // High risk is always urgent
  if (riskLevel === 'high') {
    return 'urgent';
  }

  // Very low confidence is urgent
  if (confidenceScore < 30) {
    return 'urgent';
  }

  // Medium risk with low confidence is high priority
  if (riskLevel === 'medium') {
    return 'high';
  }

  // Low risk with low confidence is medium priority
  return 'medium';
}

/**
 * Generate confidence factors for the approval.
 */
function generateFactors(params: CreateQueuedApprovalParams): Array<{
  name: string;
  score: number;
  weight: number;
  reasoning: string;
}> {
  const riskScores: Record<RiskLevel, number> = { low: 80, medium: 60, high: 30 };
  const paramCount = Object.keys(params.toolArgs).length;

  return [
    {
      name: 'Tool Type',
      score: params.confidenceScore,
      weight: 0.4,
      reasoning: `Base confidence for ${params.toolName.replace(/_/g, ' ')} operations`,
    },
    {
      name: 'Risk Assessment',
      score: riskScores[params.config.riskLevel],
      weight: 0.3,
      reasoning: `Risk level classified as ${params.config.riskLevel}`,
    },
    {
      name: 'Parameter Complexity',
      score: Math.max(40, 100 - paramCount * 10),
      weight: 0.2,
      reasoning: `Action involves ${paramCount} parameters`,
    },
    {
      name: 'Context Verification',
      score: params.confidenceScore,
      weight: 0.1,
      reasoning: 'Requires human verification of context',
    },
  ];
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Hook to create and track approval items in the Foundation queue.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { createApproval, isCreating, error } = useApprovalQueue();
 *
 *   const handleQueueApproval = async () => {
 *     const approval = await createApproval({
 *       toolName: 'sign_contract',
 *       toolArgs: { contractId: 'C001', amount: 5000 },
 *       confidenceScore: 45,
 *       config: {
 *         approvalType: 'contract',
 *         riskLevel: 'high',
 *         requiresReason: true,
 *       },
 *     });
 *
 *     if (approval) {
 *       console.log('Approval queued:', approval.id);
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleQueueApproval} disabled={isCreating}>
 *       Queue for Approval
 *     </button>
 *   );
 * }
 * ```
 */
export function useApprovalQueue(): UseApprovalQueueReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addQueuedApproval = useHITLStore((s) => s.addQueuedApproval);

  /**
   * Create an approval item in the Foundation queue.
   */
  const createApproval = useCallback(
    async (params: CreateQueuedApprovalParams): Promise<ApprovalItemResponse | null> => {
      setIsCreating(true);
      setError(null);

      try {
        // Build the approval DTO
        const approvalDto = {
          type: params.config.approvalType,
          title: generateTitle(params),
          description: generateDescription(params),
          previewData: {
            toolName: params.toolName,
            toolArgs: filterSensitiveArgs(params.toolArgs),
            confidenceScore: params.confidenceScore,
            riskLevel: params.config.riskLevel,
            approvalType: params.config.approvalType,
            requestId: params.requestId,
          },
          sourceModule: 'hitl',
          sourceId: params.toolName,
          priority: calculatePriority(params.config.riskLevel, params.confidenceScore),
          factors: generateFactors(params),
        };

        // Make API request
        const response = await fetch(`${NESTJS_API_URL}/api/approvals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(approvalDto),
        });

        const body = await safeJson<unknown>(response);

        if (!response.ok) {
          const message =
            body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
              ? body.message
              : 'Failed to create approval';
          throw new Error(message);
        }

        // Parse response
        const approvalData = body as { data?: ApprovalItemResponse } | ApprovalItemResponse;
        const approval = 'data' in approvalData && approvalData.data
          ? approvalData.data
          : approvalData as ApprovalItemResponse;

        // Track in HITL store
        const queuedApproval: QueuedApproval = {
          approvalId: approval.id,
          toolName: params.toolName,
          toolArgs: params.toolArgs,
          confidenceScore: params.confidenceScore,
          status: 'pending',
          createdAt: Date.now(),
        };
        addQueuedApproval(queuedApproval);

        // Show toast notification
        toast.info('Action queued for approval', {
          description: 'This action requires review in the approval queue.',
          action: {
            label: 'View Queue',
            onClick: () => {
              window.location.href = '/approvals';
            },
          },
        });

        return approval;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        toast.error('Failed to queue approval', {
          description: error.message,
        });
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [addQueuedApproval]
  );

  /**
   * Check the status of a pending approval.
   */
  const checkApprovalStatus = useCallback(
    async (approvalId: string): Promise<ApprovalItemResponse | null> => {
      try {
        const response = await fetch(
          `${NESTJS_API_URL}/api/approvals/${encodeURIComponent(approvalId)}`,
          {
            credentials: 'include',
          }
        );

        const body = await safeJson<unknown>(response);

        if (!response.ok) {
          const message =
            body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
              ? body.message
              : 'Failed to check approval status';
          throw new Error(message);
        }

        const approvalData = body as { data?: ApprovalItemResponse } | ApprovalItemResponse;
        return 'data' in approvalData && approvalData.data
          ? approvalData.data
          : approvalData as ApprovalItemResponse;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('Failed to check approval status:', error);
        return null;
      }
    },
    []
  );

  /**
   * Clear the current error.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createApproval,
    checkApprovalStatus,
    isCreating,
    error,
    clearError,
  };
}

export default useApprovalQueue;
