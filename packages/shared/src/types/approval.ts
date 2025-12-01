/**
 * Approval system type definitions
 * Used for confidence-based routing and approval queue
 */

/**
 * Approval status enum
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'auto_approved';

/**
 * Confidence level for AI decision routing
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Approval action type
 */
export type ApprovalAction = 'approve' | 'reject' | 'request_changes';

/**
 * Approval item in the queue
 */
export interface ApprovalItem {
  /** Approval item ID */
  id: string;
  /** Workspace ID (tenant context) */
  workspaceId: string;
  /** Item type (e.g., 'email', 'social_post', 'invoice') */
  type: string;
  /** Item title */
  title: string;
  /** Item description */
  description?: string;
  /** AI confidence score (0-100) */
  confidenceScore: number;
  /** Confidence level category */
  confidenceLevel: ConfidenceLevel;
  /** Approval status */
  status: ApprovalStatus;
  /** Item payload/data */
  data: Record<string, unknown>;
  /** AI agent that created the item */
  createdBy: string;
  /** User who approved/rejected */
  reviewedBy?: string;
  /** Created timestamp */
  createdAt: Date;
  /** Reviewed timestamp */
  reviewedAt?: Date;
  /** Due date for review */
  dueAt?: Date;
  /** Priority level */
  priority: number;
}

/**
 * Approval decision
 */
export interface ApprovalDecision {
  /** Approval item ID */
  itemId: string;
  /** Action taken */
  action: ApprovalAction;
  /** User ID who made decision */
  userId: string;
  /** Decision notes */
  notes?: string;
  /** Decision timestamp */
  timestamp: Date;
}

/**
 * Confidence threshold configuration
 */
export interface ConfidenceThresholds {
  /** Auto-approve threshold (e.g., 85) */
  autoApprove: number;
  /** Quick approval threshold (e.g., 60) */
  quickApproval: number;
  /** Full review threshold (below this value) */
  fullReview: number;
}
