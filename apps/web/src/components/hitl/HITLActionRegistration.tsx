/**
 * HITLActionRegistration Component
 *
 * Registers HITL action handlers for all supported HITL tools.
 * This component renders nothing but uses hooks to register CopilotKit actions.
 *
 * Must be placed within a CopilotKit provider context.
 *
 * Registered actions:
 * - hitl_sign_contract: Contract signing approval
 * - hitl_delete_project: Project deletion confirmation
 * - hitl_approve_expense: Expense approval
 * - hitl_send_bulk_notification: Bulk notification approval
 * - hitl_generic: Fallback for any unknown HITL tool
 * - hitl_queue: Handler for FULL approval level routing (DM-05.3)
 *
 * Approval Routing:
 * - AUTO (>= 85%): Execute immediately (handled by backend)
 * - QUICK (60-84%): Inline approval cards (above handlers)
 * - FULL (< 60%): Route to Foundation approval queue (hitl_queue)
 *
 * @see docs/modules/bm-dm/stories/dm-05-2-frontend-hitl-handlers.md
 * @see docs/modules/bm-dm/stories/dm-05-3-approval-workflow-integration.md
 * Epic: DM-05 | Stories: DM-05.2, DM-05.3
 */
'use client';

import React from 'react';
import { toast } from 'sonner';
import { useHITLAction } from '@/lib/hitl/use-hitl-action';
import { useApprovalQueue } from '@/lib/hitl/use-approval-queue';
import { useApprovalEvents } from '@/lib/hitl/use-approval-events';
import { HITLApprovalCard } from './HITLApprovalCard';
import { ContractApprovalCard } from './ContractApprovalCard';
import { DeleteConfirmCard } from './DeleteConfirmCard';
import { ApprovalPendingCard } from './ApprovalPendingCard';

// =============================================================================
// CONTRACT SIGNING HANDLER
// =============================================================================

/**
 * Register handler for sign_contract HITL action.
 */
function useSignContractAction() {
  useHITLAction({
    name: 'sign_contract',
    description: 'Human-in-the-loop approval for contract signing',
    renderApproval: ({ args, respond, status }) => (
      <ContractApprovalCard
        args={args}
        isExecuting={status === 'executing'}
        onApprove={() => respond?.({ approved: true })}
        onReject={(reason) => respond?.({ approved: false, reason })}
      />
    ),
    onExecute: () => {
      toast.success('Contract signed successfully', {
        description: 'The contract has been signed and recorded.',
      });
    },
    onReject: (reason) => {
      toast.info('Contract signing cancelled', {
        description: reason || 'The contract was not signed.',
      });
    },
  });
}

// =============================================================================
// DELETE PROJECT HANDLER
// =============================================================================

/**
 * Register handler for delete_project HITL action.
 */
function useDeleteProjectAction() {
  useHITLAction({
    name: 'delete_project',
    description: 'Human-in-the-loop confirmation for project deletion',
    renderApproval: ({ args, respond, status }) => (
      <DeleteConfirmCard
        args={args}
        itemType="project"
        requireNameConfirmation={true}
        isExecuting={status === 'executing'}
        onApprove={() => respond?.({ approved: true })}
        onReject={(reason) => respond?.({ approved: false, reason })}
      />
    ),
    onExecute: () => {
      toast.success('Project deleted', {
        description: 'The project and all associated data have been removed.',
      });
    },
    onReject: (reason) => {
      toast.info('Deletion cancelled', {
        description: reason || 'The project was not deleted.',
      });
    },
  });
}

// =============================================================================
// APPROVE EXPENSE HANDLER
// =============================================================================

/**
 * Register handler for approve_expense HITL action.
 */
function useApproveExpenseAction() {
  useHITLAction({
    name: 'approve_expense',
    description: 'Human-in-the-loop approval for expense requests',
    renderApproval: ({ args, respond, status }) => (
      <HITLApprovalCard
        args={args}
        title="Expense Approval"
        isExecuting={status === 'executing'}
        onApprove={() => respond?.({ approved: true })}
        onReject={(reason) => respond?.({ approved: false, reason })}
      />
    ),
    onExecute: () => {
      toast.success('Expense approved', {
        description: 'The expense request has been approved for payment.',
      });
    },
    onReject: (reason) => {
      toast.info('Expense rejected', {
        description: reason || 'The expense request was not approved.',
      });
    },
  });
}

// =============================================================================
// SEND BULK NOTIFICATION HANDLER
// =============================================================================

/**
 * Register handler for send_bulk_notification HITL action.
 */
function useSendBulkNotificationAction() {
  useHITLAction({
    name: 'send_bulk_notification',
    description: 'Human-in-the-loop approval for bulk notifications',
    renderApproval: ({ args, respond, status }) => (
      <HITLApprovalCard
        args={args}
        title="Bulk Notification"
        description={`Send notification to ${
          Array.isArray(args.toolArgs.recipient_ids)
            ? args.toolArgs.recipient_ids.length
            : Array.isArray(args.toolArgs.recipientIds)
              ? args.toolArgs.recipientIds.length
              : 'multiple'
        } recipients`}
        isExecuting={status === 'executing'}
        onApprove={() => respond?.({ approved: true })}
        onReject={(reason) => respond?.({ approved: false, reason })}
      />
    ),
    onExecute: () => {
      toast.success('Notifications sent', {
        description: 'The notifications have been delivered to all recipients.',
      });
    },
    onReject: (reason) => {
      toast.info('Notifications cancelled', {
        description: reason || 'The notifications were not sent.',
      });
    },
  });
}

// =============================================================================
// GENERIC FALLBACK HANDLER
// =============================================================================

/**
 * Register generic fallback handler for any unknown HITL tool.
 */
function useGenericAction() {
  useHITLAction({
    name: 'generic',
    description: 'Generic human-in-the-loop approval handler',
    renderApproval: ({ args, respond, status }) => (
      <HITLApprovalCard
        args={args}
        isExecuting={status === 'executing'}
        onApprove={() => respond?.({ approved: true })}
        onReject={(reason) => respond?.({ approved: false, reason })}
      />
    ),
    onExecute: () => {
      toast.success('Action approved', {
        description: 'The action has been executed successfully.',
      });
    },
    onReject: (reason) => {
      toast.info('Action cancelled', {
        description: reason || 'The action was not executed.',
      });
    },
  });
}

// =============================================================================
// QUEUE HANDLER FOR FULL APPROVAL LEVEL (DM-05.3)
// =============================================================================

/**
 * Register handler for FULL approval level routing.
 *
 * When a tool has confidence < 60%, it is routed to the Foundation
 * approval queue instead of showing inline approval UI.
 */
function useQueueAction() {
  const { createApproval, isCreating } = useApprovalQueue();

  useHITLAction({
    name: 'queue',
    description: 'Route low-confidence actions to Foundation approval queue',
    renderApproval: ({ args, respond }) => {
      // Immediately queue to approval system
      const handleQueue = async () => {
        const approval = await createApproval({
          toolName: args.toolName,
          toolArgs: args.toolArgs,
          confidenceScore: args.confidenceScore,
          config: {
            approvalType: args.config.approvalType,
            riskLevel: args.config.riskLevel,
            requiresReason: args.config.requiresReason,
            descriptionTemplate: args.config.descriptionTemplate,
          },
          requestId: args.requestId,
        });

        if (approval) {
          // Return the approval ID to the agent so it can track the result
          respond?.({
            approved: false, // Not immediately approved
            metadata: {
              queued: true,
              approvalId: approval.id,
              status: 'pending',
            },
          });
        } else {
          // Queue failed, reject the action
          respond?.({
            approved: false,
            reason: 'Failed to queue for approval',
          });
        }
      };

      // Trigger queueing on mount and show pending card
      // Note: We use a key to ensure this effect runs once
      return (
        <QueueingHandler
          args={args}
          onQueue={handleQueue}
          isCreating={isCreating}
        />
      );
    },
    onExecute: () => {
      // This shouldn't be called since we respond with approved: false
    },
    onReject: (reason) => {
      if (reason !== 'Failed to queue for approval') {
        // Queued successfully, no toast needed (useApprovalQueue shows one)
      } else {
        toast.error('Failed to queue for approval', {
          description: 'The action could not be added to the approval queue.',
        });
      }
    },
  });
}

/**
 * Helper component to handle the queueing effect.
 */
function QueueingHandler({
  args,
  onQueue,
  isCreating,
}: {
  args: {
    toolName: string;
    confidenceScore: number;
  };
  onQueue: () => Promise<void>;
  isCreating: boolean;
}) {
  // Trigger queueing on mount
  // Using a state-based approach to ensure it only runs once
  const hasQueued = React.useRef(false);

  React.useEffect(() => {
    if (!hasQueued.current) {
      hasQueued.current = true;
      onQueue();
    }
  }, [onQueue]);

  // Show a loading state while queueing
  return (
    <ApprovalPendingCard
      approvalId="pending"
      toolName={args.toolName}
      confidenceScore={args.confidenceScore}
      createdAt={Date.now()}
      status="pending"
      isCancelling={isCreating}
    />
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * HITLActionRegistration Component
 *
 * Registers all HITL action handlers with CopilotKit.
 * Renders nothing - just uses hooks for registration.
 *
 * Approval Routing:
 * - For QUICK level (60-84%): Shows inline approval cards
 * - For FULL level (<60%): Routes to Foundation approval queue
 *
 * Usage:
 * Place inside CopilotKitProvider to register all HITL handlers.
 *
 * @example
 * ```tsx
 * <CopilotKit runtimeUrl={...}>
 *   <HITLActionRegistration />
 *   {children}
 * </CopilotKit>
 * ```
 */
export function HITLActionRegistration() {
  // Register all HITL action handlers
  useSignContractAction();
  useDeleteProjectAction();
  useApproveExpenseAction();
  useSendBulkNotificationAction();
  useGenericAction();

  // Register queue handler for FULL level (DM-05.3)
  useQueueAction();

  // Subscribe to approval events for real-time updates (DM-05.3)
  useApprovalEvents();

  // This component renders nothing
  return null;
}

export default HITLActionRegistration;
