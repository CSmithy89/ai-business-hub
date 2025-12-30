/**
 * useHITLAction Hook
 *
 * React hook for registering Human-in-the-Loop (HITL) action handlers
 * with CopilotKit. Wraps CopilotKit's useCopilotAction with HITL-specific
 * behavior using the renderAndWaitForResponse pattern.
 *
 * @see https://docs.copilotkit.ai/concepts/human-in-the-loop
 * @see docs/modules/bm-dm/stories/dm-05-2-frontend-hitl-handlers.md
 * Epic: DM-05 | Story: DM-05.2
 */
'use client';

import { type ReactElement, useCallback, useRef } from 'react';
import { useCopilotAction } from '@copilotkit/react-core';
import { useHITLStore } from '@/stores/hitl-store';
import type {
  HITLActionArgs,
  HITLConfig,
  HITLResponse,
  HITLRenderProps,
  ApprovalLevel,
} from './types';

// =============================================================================
// HOOK OPTIONS INTERFACE
// =============================================================================

/**
 * Options for useHITLAction hook.
 */
export interface UseHITLActionOptions {
  /**
   * Unique name for this HITL action.
   * Will be prefixed with "hitl_" for CopilotKit registration.
   */
  name: string;

  /**
   * Render function for the approval UI.
   * Called by CopilotKit when the action is triggered.
   * MUST return a ReactElement (not null or undefined).
   *
   * @param props - Render props including args, status, and respond callback
   * @returns React element to render
   */
  renderApproval: (props: HITLRenderProps) => ReactElement;

  /**
   * Callback when the action is approved and executed.
   * Called after user approves and the action completes.
   *
   * @param result - Result from action execution
   */
  onExecute?: (result: unknown) => void;

  /**
   * Callback when the action is rejected.
   * Called immediately after user rejects.
   *
   * @param reason - Optional rejection reason
   */
  onReject?: (reason?: string) => void;

  /**
   * Optional description for the action.
   * Displayed in CopilotKit UI.
   */
  description?: string;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Hook to register a HITL action handler with CopilotKit.
 *
 * Uses CopilotKit's `renderAndWaitForResponse` to display an approval UI
 * inline in the chat and wait for user approval/rejection before proceeding.
 *
 * @param options - Hook configuration options
 *
 * @example
 * ```typescript
 * useHITLAction({
 *   name: 'sign_contract',
 *   renderApproval: ({ args, respond, status }) => (
 *     <ContractApprovalCard
 *       args={args}
 *       isExecuting={status !== 'executing'}
 *       onApprove={() => respond?.({ approved: true })}
 *       onReject={(reason) => respond?.({ approved: false, reason })}
 *     />
 *   ),
 *   onExecute: (result) => {
 *     toast.success('Contract signed successfully');
 *   },
 *   onReject: (reason) => {
 *     toast.info('Contract signing cancelled');
 *   },
 * });
 * ```
 */
export function useHITLAction({
  name,
  renderApproval,
  onExecute,
  onReject,
  description,
}: UseHITLActionOptions): void {
  // Get store actions for tracking pending requests
  const addPendingRequest = useHITLStore((s) => s.addPendingRequest);
  const updateRequestStatus = useHITLStore((s) => s.updateRequestStatus);
  const removePendingRequest = useHITLStore((s) => s.removePendingRequest);

  // Track if we've already added this request to store (avoid duplicates on re-render)
  const addedRequestsRef = useRef<Set<string>>(new Set());

  // Memoize response handler callbacks
  const handleApproved = useCallback(
    (requestId: string, result: unknown) => {
      updateRequestStatus(requestId, 'approved');
      // Remove from pending after a short delay to allow UI update
      setTimeout(() => {
        removePendingRequest(requestId);
        addedRequestsRef.current.delete(requestId);
      }, 500);
      onExecute?.(result);
    },
    [updateRequestStatus, removePendingRequest, onExecute]
  );

  const handleRejected = useCallback(
    (requestId: string, reason?: string) => {
      updateRequestStatus(requestId, 'rejected');
      // Remove from pending after a short delay to allow UI update
      setTimeout(() => {
        removePendingRequest(requestId);
        addedRequestsRef.current.delete(requestId);
      }, 500);
      onReject?.(reason);
    },
    [updateRequestStatus, removePendingRequest, onReject]
  );

  // Register the action with CopilotKit
  // When using renderAndWaitForResponse, we cannot use handler (it's typed as never)
  // The response handling happens through the respond callback wrapper
  useCopilotAction({
    name: `hitl_${name}`,
    description: description || `Human-in-the-loop approval for ${name}`,
    parameters: [
      {
        name: 'toolName',
        type: 'string',
        description: 'Name of the tool requiring approval',
        required: true,
      },
      {
        name: 'toolArgs',
        type: 'object',
        description: 'Arguments passed to the tool',
        required: true,
      },
      {
        name: 'confidenceScore',
        type: 'number',
        description: 'Calculated confidence score (0-100)',
        required: true,
      },
      {
        name: 'approvalLevel',
        type: 'string',
        description: 'Approval level: auto, quick, or full',
        required: true,
      },
      {
        name: 'config',
        type: 'object',
        description: 'HITL configuration for the tool',
        required: true,
      },
      {
        name: 'requestId',
        type: 'string',
        description: 'Unique identifier for this request',
        required: false,
      },
    ],
    // Use renderAndWaitForResponse to show approval UI and block until user responds
    // The response is passed back to the AI agent automatically
    renderAndWaitForResponse: ({ args, respond, status }) => {
      // Parse args from CopilotKit format to our typed format
      const requestId = (args.requestId as string) || crypto.randomUUID();
      const hitlArgs: HITLActionArgs = {
        toolName: (args.toolName as string) || name,
        toolArgs: (args.toolArgs as Record<string, unknown>) || {},
        confidenceScore: (args.confidenceScore as number) || 0,
        approvalLevel: (args.approvalLevel as ApprovalLevel) || 'quick',
        config: (args.config as HITLConfig) || {
          autoThreshold: 85,
          quickThreshold: 60,
          approvalType: 'general',
          riskLevel: 'medium',
          requiresReason: false,
          approveLabel: 'Approve',
          rejectLabel: 'Reject',
        },
        requestId,
      };

      // Track request in store when first rendered (only once per request)
      if (status === 'executing' && !addedRequestsRef.current.has(requestId)) {
        addedRequestsRef.current.add(requestId);
        addPendingRequest({
          requestId,
          toolName: hitlArgs.toolName,
          toolArgs: hitlArgs.toolArgs,
          confidenceScore: hitlArgs.confidenceScore,
          approvalLevel: hitlArgs.approvalLevel,
          config: hitlArgs.config,
          status: 'pending',
          createdAt: Date.now(),
        });
      }

      // Map CopilotKit status to our status type
      const mappedStatus: 'executing' | 'complete' =
        status === 'inProgress' || status === 'executing' ? 'executing' : 'complete';

      // Wrap the respond callback to handle our callbacks
      const wrappedRespond = respond
        ? (response: HITLResponse) => {
            // Process the response through our handlers before passing to CopilotKit
            if (response.approved) {
              handleApproved(requestId, {
                status: 'approved',
                metadata: response.metadata,
              });
            } else {
              handleRejected(requestId, response.reason);
            }
            // Pass the response to CopilotKit to continue the flow
            respond(response);
          }
        : undefined;

      // Call the user's render function with typed props
      return renderApproval({
        args: hitlArgs,
        status: mappedStatus,
        respond: wrappedRespond,
      });
    },
  });
}

// =============================================================================
// GENERIC HITL ACTION REGISTRATION
// =============================================================================

/**
 * Options for registering a generic HITL handler.
 */
export interface GenericHITLOptions {
  /**
   * Function to render the approval component.
   * If not provided, a default HITLApprovalCard will be used.
   */
  renderComponent?: (props: HITLRenderProps) => ReactElement;

  /**
   * Callback when action is executed.
   */
  onExecute?: (result: unknown) => void;

  /**
   * Callback when action is rejected.
   */
  onReject?: (reason?: string) => void;
}

/**
 * Register a generic HITL handler for any tool.
 *
 * This is useful as a fallback handler for tools that don't have
 * specialized approval cards.
 *
 * @param options - Generic handler options
 */
export function useGenericHITLAction(options: GenericHITLOptions = {}): void {
  const { renderComponent, onExecute, onReject } = options;

  useHITLAction({
    name: 'generic',
    description: 'Generic human-in-the-loop approval handler',
    renderApproval:
      renderComponent ||
      (() => {
        // Default implementation - should be overridden
        // This will be replaced by HITLApprovalCard in HITLActionRegistration
        return <div>Loading approval UI...</div>;
      }),
    onExecute,
    onReject,
  });
}
