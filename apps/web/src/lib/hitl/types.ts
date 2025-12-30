/**
 * HITL (Human-in-the-Loop) TypeScript Types
 *
 * TypeScript interfaces matching the backend HITL models from DM-05.1.
 * These types are used by the frontend HITL handlers to render approval UIs
 * and process user decisions via CopilotKit's renderAndWaitForResponse pattern.
 *
 * @see agents/hitl/decorators.py - Backend models
 * @see docs/modules/bm-dm/stories/dm-05-2-frontend-hitl-handlers.md
 * Epic: DM-05 | Story: DM-05.2
 */

// =============================================================================
// ENUMS AND BASIC TYPES
// =============================================================================

/**
 * Approval requirement levels based on confidence thresholds.
 *
 * These levels determine how a tool invocation is handled:
 * - AUTO: Immediate execution with audit logging (confidence >= autoThreshold)
 * - QUICK: Inline HITL via CopilotKit 1-click approval (confidence >= quickThreshold)
 * - FULL: Queue to Foundation approval system for full review (confidence < quickThreshold)
 */
export type ApprovalLevel = 'auto' | 'quick' | 'full';

/**
 * Risk level classification for HITL tools.
 * Determines UI styling and urgency indicators.
 */
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Request status for tracking HITL requests in the store.
 */
export type HITLRequestStatus = 'pending' | 'approved' | 'rejected';

// =============================================================================
// HITL CONFIGURATION
// =============================================================================

/**
 * Configuration for HITL tool behavior.
 * Matches backend HITLConfig Pydantic model from DM-05.1.
 *
 * This model defines all settings for a tool's HITL behavior,
 * including confidence thresholds, risk classification, and UI hints.
 */
export interface HITLConfig {
  /** Minimum confidence for auto-execution (>= this = auto, default 85) */
  autoThreshold: number;
  /** Minimum confidence for quick approval (>= this = quick, else full, default 60) */
  quickThreshold: number;
  /** Type of approval (e.g., 'contract', 'financial', 'deletion', 'communication', 'general') */
  approvalType: string;
  /** Risk level: low, medium, high */
  riskLevel: RiskLevel;
  /** Whether rejection requires a reason */
  requiresReason: boolean;
  /** Timeout for approval in seconds (default 300) */
  timeoutSeconds?: number;
  /** Label for approve button (default 'Approve') */
  approveLabel: string;
  /** Label for reject button (default 'Reject') */
  rejectLabel: string;
  /** Template for generating approval description (uses {key} placeholders) */
  descriptionTemplate?: string;
}

// =============================================================================
// HITL TOOL RESULT (FROM BACKEND)
// =============================================================================

/**
 * Result from HITL tool evaluation returned by the backend.
 *
 * This is the full model returned when a tool requires approval.
 * It contains all information needed for the frontend to render
 * the approval UI and for the approval system to process the request.
 */
export interface HITLToolResult {
  /** Whether approval is required */
  requiresApproval: boolean;
  /** The type of approval needed */
  approvalLevel: ApprovalLevel;
  /** Calculated confidence score (0-100) */
  confidenceScore: number;
  /** Name of the tool requiring approval */
  toolName: string;
  /** Arguments passed to the tool */
  toolArgs: Record<string, unknown>;
  /** HITL configuration for this tool */
  config: HITLConfig;
  /** ID if queued to Foundation approval (for FULL level) */
  approvalId?: string;
  /** Unique identifier for this HITL request */
  requestId: string;
}

// =============================================================================
// HITL ACTION INTERFACES (FOR FRONTEND)
// =============================================================================

/**
 * Arguments passed to HITL action render function.
 * Used by useHITLAction hook and approval card components.
 */
export interface HITLActionArgs {
  /** Name of the tool requiring approval */
  toolName: string;
  /** Arguments passed to the tool */
  toolArgs: Record<string, unknown>;
  /** Calculated confidence score (0-100) */
  confidenceScore: number;
  /** Determined approval level */
  approvalLevel: ApprovalLevel;
  /** HITL configuration for the tool */
  config: HITLConfig;
  /** Unique request ID for tracking */
  requestId?: string;
}

/**
 * Response from user approval/rejection action.
 * Sent back to CopilotKit via the respond() callback.
 */
export interface HITLResponse {
  /** Whether the action was approved */
  approved: boolean;
  /** Reason for rejection (if rejected and requiresReason=true) */
  reason?: string;
  /** Additional metadata from approval (e.g., notes, modifications) */
  metadata?: Record<string, unknown>;
}

/**
 * Props passed to the renderApproval function in useHITLAction.
 */
export interface HITLRenderProps {
  /** HITL action arguments */
  args: HITLActionArgs;
  /** Current execution status from CopilotKit */
  status: 'executing' | 'complete';
  /** Callback to respond with approval/rejection (undefined when status is 'complete') */
  respond?: (response: HITLResponse) => void;
}

// =============bourbon=========================================================
// HITL STORE TYPES
// =============================================================================

/**
 * Pending HITL request tracked in Zustand store.
 * Used to track state of active HITL requests.
 */
export interface HITLPendingRequest {
  /** Unique request ID */
  requestId: string;
  /** Tool name */
  toolName: string;
  /** Tool arguments */
  toolArgs: Record<string, unknown>;
  /** Confidence score (0-100) */
  confidenceScore: number;
  /** Approval level */
  approvalLevel: ApprovalLevel;
  /** HITL configuration */
  config: HITLConfig;
  /** Request status */
  status: HITLRequestStatus;
  /** Timestamp when request was created */
  createdAt: number;
}

// =============================================================================
// HITL MARKER RESPONSE (FROM BACKEND)
// =============================================================================

/**
 * Backend HITL marker response structure.
 * The backend wraps HITLToolResult in this format for frontend detection.
 *
 * Example:
 * {
 *   "__hitl_pending__": true,
 *   "hitl_result": { ... HITLToolResult ... }
 * }
 */
export interface HITLMarkerResponse {
  /** Marker flag indicating HITL approval is pending */
  __hitl_pending__: true;
  /** The HITL tool result with snake_case keys from backend */
  hitl_result: {
    requires_approval: boolean;
    approval_level: string;
    confidence_score: number;
    tool_name: string;
    tool_args: Record<string, unknown>;
    config: {
      auto_threshold: number;
      quick_threshold: number;
      approval_type: string;
      risk_level: string;
      requires_reason: boolean;
      timeout_seconds?: number;
      approve_label: string;
      reject_label: string;
      description_template?: string;
    };
    approval_id?: string;
    request_id: string;
  };
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

/**
 * Props for HITLApprovalCard component.
 */
export interface HITLApprovalCardProps {
  /** HITL action arguments */
  args: HITLActionArgs;
  /** Whether the action is currently executing */
  isExecuting?: boolean;
  /** Callback when user approves */
  onApprove: (metadata?: Record<string, unknown>) => void;
  /** Callback when user rejects */
  onReject: (reason?: string) => void;
  /** Override default title */
  title?: string;
  /** Override default description */
  description?: string;
  /** Additional content to render in the card */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for ContractApprovalCard component.
 */
export interface ContractApprovalCardProps extends Omit<HITLApprovalCardProps, 'children'> {
  /** Contract ID */
  contractId?: string;
  /** Contract amount */
  amount?: number;
  /** Signatory name */
  signatoryName?: string;
  /** Contract terms summary */
  termsSummary?: string;
}

/**
 * Props for DeleteConfirmCard component.
 */
export interface DeleteConfirmCardProps extends Omit<HITLApprovalCardProps, 'children'> {
  /** Name of item being deleted (for confirmation) */
  itemName?: string;
  /** Type of item being deleted (project, file, etc.) */
  itemType?: string;
  /** Whether to require typing the name to confirm */
  requireNameConfirmation?: boolean;
}
