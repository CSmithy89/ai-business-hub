import { ConfidenceFactor } from '@hyvve/shared';

/**
 * Response DTO for a single approval item
 *
 * Maps Prisma model fields to API response format.
 * Note: Maps resolvedBy -> decidedBy and resolvedAt -> decidedAt for API consistency.
 */
export interface ApprovalResponseDto {
  id: string;
  workspaceId: string;
  type: string;
  title: string;
  description?: string;
  previewData?: any;
  confidenceScore: number;
  factors: ConfidenceFactor[];
  aiReasoning?: string;
  status: string;
  recommendation: string;
  reviewType: string;
  priority: string;
  assignedToId?: string;
  assignedAt?: Date;
  dueAt: Date;
  escalatedAt?: Date;
  escalatedToId?: string;
  decidedById?: string;
  decidedAt?: Date;
  decisionNotes?: string;
  agentId?: string;
  agentRunId?: string;
  sourceModule?: string;
  sourceId?: string;
  createdAt: Date;
  updatedAt: Date;
  // Related entities (populated by service)
  assignedTo?: { id: string; name: string; email: string };
  decidedBy?: { id: string; name: string; email: string };
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Bulk action result summary
 */
export interface BulkActionResult {
  successes: string[];
  failures: { id: string; error: string }[];
  totalProcessed: number;
}
