/**
 * Zod schemas for event payload validation
 * Used for runtime validation of events in the consumer
 *
 * Uses Zod v4 top-level validators (e.g., z.iso.datetime() instead of z.string().datetime())
 */
import { z } from 'zod';

// ============================================
// Base Event Schema
// ============================================

export const BaseEventSchema = z.object({
  id: z.string().min(1, 'Event ID is required'),
  type: z.string().min(1, 'Event type is required'),
  source: z.string().min(1, 'Event source is required'),
  timestamp: z.iso.datetime(),
  correlationId: z.string().optional(),
  tenantId: z.string().min(1, 'Tenant ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  version: z.string().min(1, 'Version is required'),
  data: z.record(z.string(), z.unknown()),
});

export type BaseEventInput = z.infer<typeof BaseEventSchema>;

// ============================================
// Approval Event Schemas
// ============================================

export const ApprovalRequestedPayloadSchema = z.object({
  approvalId: z.string().min(1, 'Approval ID is required'),
  type: z.string().min(1, 'Type is required'),
  title: z.string().min(1, 'Title is required'),
  confidenceScore: z.number().min(0).max(100),
  recommendation: z.enum(['approve', 'review', 'full_review']),
  assignedToId: z.string().optional(),
  dueAt: z.iso.datetime(),
  sourceModule: z.string().optional(),
  sourceId: z.string().optional(),
});

export const ApprovalDecisionPayloadSchema = z.object({
  approvalId: z.string().min(1, 'Approval ID is required'),
  type: z.string().min(1, 'Type is required'),
  title: z.string().min(1, 'Title is required'),
  decision: z.enum(['approved', 'rejected', 'auto_approved']),
  decidedById: z.string().optional(),
  decisionNotes: z.string().optional(),
  confidenceScore: z.number().min(0).max(100),
});

export const ApprovalEscalatedPayloadSchema = z.object({
  approvalId: z.string().min(1, 'Approval ID is required'),
  type: z.string().min(1, 'Type is required'),
  title: z.string().min(1, 'Title is required'),
  escalatedFromId: z.string().optional(),
  escalatedToId: z.string().min(1, 'Escalated to ID is required'),
  reason: z.string().min(1, 'Reason is required'),
  originalDueAt: z.iso.datetime(),
  newDueAt: z.iso.datetime(),
});

export const ApprovalExpiredPayloadSchema = z.object({
  approvalId: z.string().min(1, 'Approval ID is required'),
  type: z.string().min(1, 'Type is required'),
  title: z.string().min(1, 'Title is required'),
  dueAt: z.iso.datetime(),
  assignedToId: z.string().optional(),
});

// ============================================
// Agent Event Schemas
// ============================================

export const AgentRunStartedPayloadSchema = z.object({
  runId: z.string().min(1, 'Run ID is required'),
  agentId: z.string().min(1, 'Agent ID is required'),
  agentName: z.string().min(1, 'Agent name is required'),
  input: z.record(z.string(), z.unknown()),
  triggeredBy: z.enum(['user', 'system', 'schedule']),
});

export const AgentRunCompletedPayloadSchema = z.object({
  runId: z.string().min(1, 'Run ID is required'),
  agentId: z.string().min(1, 'Agent ID is required'),
  agentName: z.string().min(1, 'Agent name is required'),
  output: z.record(z.string(), z.unknown()),
  durationMs: z.number().nonnegative(),
  tokensUsed: z.number().nonnegative().optional(),
});

export const AgentRunFailedPayloadSchema = z.object({
  runId: z.string().min(1, 'Run ID is required'),
  agentId: z.string().min(1, 'Agent ID is required'),
  agentName: z.string().min(1, 'Agent name is required'),
  error: z.string().min(1, 'Error is required'),
  errorCode: z.string().optional(),
  durationMs: z.number().nonnegative(),
});

export const AgentConfirmationPayloadSchema = z.object({
  runId: z.string().min(1, 'Run ID is required'),
  agentId: z.string().min(1, 'Agent ID is required'),
  confirmationId: z.string().min(1, 'Confirmation ID is required'),
  toolName: z.string().min(1, 'Tool name is required'),
  toolArgs: z.record(z.string(), z.unknown()),
  message: z.string().min(1, 'Message is required'),
});

// ============================================
// Event Payload Schema Map
// ============================================

/**
 * Map of event types to their Zod schemas
 * Used for dynamic validation based on event type
 */
export const EventPayloadSchemas: Record<string, z.ZodType> = {
  // Approval events
  'approval.item.requested': ApprovalRequestedPayloadSchema,
  'approval.item.created': ApprovalRequestedPayloadSchema,
  'approval.item.approved': ApprovalDecisionPayloadSchema,
  'approval.item.rejected': ApprovalDecisionPayloadSchema,
  'approval.item.auto_approved': ApprovalDecisionPayloadSchema,
  'approval.item.escalated': ApprovalEscalatedPayloadSchema,
  'approval.item.expired': ApprovalExpiredPayloadSchema,

  // Agent events
  'agent.run.started': AgentRunStartedPayloadSchema,
  'agent.run.completed': AgentRunCompletedPayloadSchema,
  'agent.run.failed': AgentRunFailedPayloadSchema,
  'agent.confirmation.requested': AgentConfirmationPayloadSchema,
  'agent.confirmation.granted': AgentConfirmationPayloadSchema,
  'agent.confirmation.denied': AgentConfirmationPayloadSchema,
};

/**
 * Validate an event's payload against its schema
 *
 * @param eventType - The event type (e.g., 'approval.item.approved')
 * @param data - The event payload to validate
 * @returns Validated data if schema exists, original data if no schema
 * @throws ZodError if validation fails and schema exists
 */
export function validateEventPayload<T extends Record<string, unknown>>(
  eventType: string,
  data: T,
): T {
  const schema = EventPayloadSchemas[eventType];

  if (!schema) {
    // No schema defined for this event type, return as-is
    return data;
  }

  // Validate and return parsed data
  return schema.parse(data) as T;
}

/**
 * Safe validation that returns a result object instead of throwing
 *
 * @param eventType - The event type
 * @param data - The event payload to validate
 * @returns Object with success boolean, data, and optional error
 */
export function safeValidateEventPayload<T extends Record<string, unknown>>(
  eventType: string,
  data: T,
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const schema = EventPayloadSchemas[eventType];

  if (!schema) {
    return { success: true, data };
  }

  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data as T };
  }

  return { success: false, error: result.error };
}
