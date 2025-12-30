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
 *
 * @see docs/modules/bm-dm/stories/dm-05-2-frontend-hitl-handlers.md
 * Epic: DM-05 | Story: DM-05.2
 */
'use client';

import { toast } from 'sonner';
import { useHITLAction } from '@/lib/hitl/use-hitl-action';
import { HITLApprovalCard } from './HITLApprovalCard';
import { ContractApprovalCard } from './ContractApprovalCard';
import { DeleteConfirmCard } from './DeleteConfirmCard';

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
        isExecuting={status !== 'executing'}
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
        isExecuting={status !== 'executing'}
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
        isExecuting={status !== 'executing'}
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
        isExecuting={status !== 'executing'}
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
        isExecuting={status !== 'executing'}
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
// MAIN COMPONENT
// =============================================================================

/**
 * HITLActionRegistration Component
 *
 * Registers all HITL action handlers with CopilotKit.
 * Renders nothing - just uses hooks for registration.
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

  // This component renders nothing
  return null;
}

export default HITLActionRegistration;
