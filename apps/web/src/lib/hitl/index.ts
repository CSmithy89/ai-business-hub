/**
 * HITL (Human-in-the-Loop) Module Exports
 *
 * Central export file for all HITL types, utilities, and hooks.
 *
 * @see docs/modules/bm-dm/stories/dm-05-2-frontend-hitl-handlers.md
 * Epic: DM-05 | Story: DM-05.2
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Enums and basic types
  ApprovalLevel,
  RiskLevel,
  HITLRequestStatus,
  // Configuration
  HITLConfig,
  // Tool result from backend
  HITLToolResult,
  // Action interfaces
  HITLActionArgs,
  HITLResponse,
  HITLRenderProps,
  // Store types
  HITLPendingRequest,
  // Marker response
  HITLMarkerResponse,
  // Component props
  HITLApprovalCardProps,
  ContractApprovalCardProps,
  DeleteConfirmCardProps,
} from './types';

// =============================================================================
// UTILITIES
// =============================================================================

export {
  // HITL marker detection
  isHITLPending,
  parseHITLResult,
  // Confidence formatting
  getConfidenceLevel,
  formatConfidence,
  // Risk level formatting
  getRiskBadgeVariant,
  getRiskColorClasses,
  // Description formatting
  formatDescriptionTemplate,
  formatKey,
  formatValue,
  formatCurrency,
  // Tool name formatting
  formatToolName,
  getToolIcon,
  // Approval level helpers
  requiresUserApproval,
  getApprovalLevelDescription,
} from './utils';

// =============================================================================
// HOOKS
// =============================================================================

export {
  useHITLAction,
  useGenericHITLAction,
  type UseHITLActionOptions,
  type GenericHITLOptions,
} from './use-hitl-action';
