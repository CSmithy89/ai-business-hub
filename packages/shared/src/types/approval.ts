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
  /** Confidence factors breakdown */
  factors?: ConfidenceFactor[];
  /** AI recommendation (approve/review/full_review) */
  aiRecommendation?: string;
  /** AI reasoning for low confidence scores */
  aiReasoning?: string;
  /** Approval status */
  status: ApprovalStatus;
  /** Item payload/data */
  data: Record<string, unknown>;
  /** Source module that created the item */
  sourceModule?: string;
  /** Source entity ID for context link */
  sourceId?: string;
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

/**
 * Confidence scoring types for the Approval Queue System
 */

/**
 * A single confidence factor with its score, weight, and explanation
 */
export interface ConfidenceFactor {
  /** Factor identifier (e.g., 'historical_accuracy', 'data_completeness') */
  factor: string;
  /** Score from 0-100 */
  score: number;
  /** Weight from 0-1 (all weights must sum to 1.0) */
  weight: number;
  /** Human-readable explanation of this factor's score */
  explanation: string;
  /** Flag if this factor is concerning and should be highlighted */
  concerning?: boolean;
}

/**
 * Routing recommendation based on confidence score
 */
export type ConfidenceRecommendation = 'approve' | 'review' | 'full_review';

/**
 * Result of confidence calculation
 */
export interface ConfidenceResult {
  /** Weighted average score (0-100) */
  overallScore: number;
  /** All factors used in the calculation */
  factors: ConfidenceFactor[];
  /** Routing recommendation based on thresholds */
  recommendation: ConfidenceRecommendation;
  /** AI-generated reasoning for low confidence scores (<60%) */
  aiReasoning?: string;
}

/**
 * Default confidence thresholds
 */
export const DEFAULT_CONFIDENCE_THRESHOLDS = {
  autoApprove: 85,
  quickReview: 60,
} as const;

/**
 * Confidence factor category constants
 */
export const CONFIDENCE_FACTORS = {
  HISTORICAL_ACCURACY: 'historical_accuracy',
  DATA_COMPLETENESS: 'data_completeness',
  BUSINESS_RULES: 'business_rules',
  TIME_SENSITIVITY: 'time_sensitivity',
  VALUE_IMPACT: 'value_impact',
  PATTERN_MATCH: 'pattern_match',
} as const;
