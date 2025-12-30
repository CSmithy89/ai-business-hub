/**
 * HITL (Human-in-the-Loop) Components Module Exports
 *
 * Central export file for all HITL React components.
 *
 * @see docs/modules/bm-dm/stories/dm-05-2-frontend-hitl-handlers.md
 * Epic: DM-05 | Story: DM-05.2
 */

// =============================================================================
// APPROVAL CARD COMPONENTS
// =============================================================================

export { HITLApprovalCard, default as HITLApprovalCardDefault } from './HITLApprovalCard';
export { ContractApprovalCard, default as ContractApprovalCardDefault } from './ContractApprovalCard';
export { DeleteConfirmCard, default as DeleteConfirmCardDefault } from './DeleteConfirmCard';

// =============================================================================
// ACTION REGISTRATION
// =============================================================================

export { HITLActionRegistration, default as HITLActionRegistrationDefault } from './HITLActionRegistration';

// =============================================================================
// RE-EXPORT TYPES FROM LIB
// =============================================================================

export type {
  // Component props
  HITLApprovalCardProps,
  ContractApprovalCardProps,
  DeleteConfirmCardProps,
  // Action types
  HITLActionArgs,
  HITLResponse,
  HITLRenderProps,
  HITLConfig,
  ApprovalLevel,
  RiskLevel,
} from '@/lib/hitl/types';

// =============================================================================
// RE-EXPORT UTILITIES FROM LIB
// =============================================================================

export {
  formatToolName,
  formatConfidence,
  formatCurrency,
  formatKey,
  formatValue,
  getRiskBadgeVariant,
  getRiskColorClasses,
  getConfidenceLevel,
} from '@/lib/hitl/utils';

// =============================================================================
// RE-EXPORT HOOKS FROM LIB
// =============================================================================

export { useHITLAction, useGenericHITLAction } from '@/lib/hitl/use-hitl-action';

// =============================================================================
// RE-EXPORT STORE HOOKS
// =============================================================================

export {
  useHITLStore,
  usePendingRequests,
  usePendingCount,
  useActiveRequest,
  useHasPending,
  useHITLActions,
} from '@/stores/hitl-store';
