import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for storing event subscriber information
 * Using Symbol to prevent collisions with other metadata keys
 */
export const EVENT_SUBSCRIBER_METADATA = Symbol('EVENT_SUBSCRIBER_METADATA');

/**
 * Event subscriber options
 */
export interface EventSubscriberOptions {
  /** Event type pattern to subscribe to (e.g., 'approval.*', 'approval.item.approved', '*') */
  pattern: string;
  /** Handler priority - lower number = higher priority (default: 100) */
  priority?: number;
  /** Maximum retry attempts for failed events (default: 3) */
  maxRetries?: number;
}

/**
 * EventSubscriber Decorator
 *
 * Marks a method as an event handler that will be invoked when matching events are consumed
 * from Redis Streams. The consumer service automatically discovers all decorated methods
 * on startup and registers them as event handlers.
 *
 * ## Pattern Matching Rules
 *
 * Supports three pattern types:
 *
 * 1. **Exact Match**: `'approval.item.approved'`
 *    - Matches only events with type exactly equal to 'approval.item.approved'
 *    - Case-sensitive comparison
 *
 * 2. **Wildcard Suffix**: `'approval.*'`
 *    - Matches all events starting with 'approval.'
 *    - The `.*` MUST be at the end of the pattern
 *    - Examples: 'approval.item.approved', 'approval.item.rejected', 'approval.queue.updated'
 *    - Does NOT match 'approval' (without suffix) or 'approvalItem' (no dot separator)
 *
 * 3. **Match All**: `'*'`
 *    - Matches every event type
 *    - Use sparingly as it receives all events
 *
 * ## Pattern Matching Limitations
 *
 * - **No middle wildcards**: Patterns like 'approval.*.approved' are NOT supported
 * - **No regex support**: Only the three pattern types above are supported
 * - **No negation**: Cannot exclude specific event types
 * - **Case-sensitive**: 'Approval.*' will NOT match 'approval.item.created'
 * - **Single wildcard only**: 'module.*.*' will be treated as exact match, not nested wildcard
 *
 * If you need more complex matching, use the match-all pattern ('*') and filter in handler code.
 *
 * ## Handler Execution
 *
 * - Multiple handlers can match the same event
 * - Handlers execute in priority order (lower number = higher priority)
 * - Handler failures don't affect other handlers for the same event
 * - Failed handlers trigger retry logic based on maxRetries setting
 *
 * @param pattern - Event type pattern to match (see rules above)
 * @param options - Additional handler configuration
 *   - priority: Execution order (lower = higher priority, default: 100)
 *   - maxRetries: Max retry attempts for failed events (default: 3)
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class NotificationHandler {
 *   // Exact match - only this specific event type
 *   @EventSubscriber('approval.item.approved')
 *   async handleApprovalApproved(event: BaseEvent<ApprovalDecisionPayload>) {
 *     // Send notification
 *   }
 *
 *   // Wildcard suffix - all events starting with 'approval.'
 *   @EventSubscriber('approval.*', { priority: 1 })
 *   async logAllApprovalEvents(event: BaseEvent) {
 *     // Log all approval events with high priority
 *   }
 *
 *   // Match all - every event (use sparingly)
 *   @EventSubscriber('*', { priority: 999 })
 *   async analyticsTracker(event: BaseEvent) {
 *     // Track all events for analytics (low priority)
 *   }
 *
 *   // Complex filtering - use match-all and filter in handler
 *   @EventSubscriber('*', { priority: 500 })
 *   async customFilter(event: BaseEvent) {
 *     if (!event.type.includes('.created') && !event.type.includes('.updated')) {
 *       return; // Skip non-CRUD events
 *     }
 *     // Handle only create/update events
 *   }
 * }
 * ```
 */
export const EventSubscriber = (
  pattern: string,
  options?: Omit<EventSubscriberOptions, 'pattern'>,
): MethodDecorator => {
  // Validate pattern at decorator application time
  if (typeof pattern !== 'string' || pattern.trim() === '') {
    throw new Error('EventSubscriber pattern must be a non-empty string');
  }

  const metadata: EventSubscriberOptions = {
    pattern,
    priority: options?.priority ?? 100,
    maxRetries: options?.maxRetries ?? 3,
  };

  return SetMetadata(EVENT_SUBSCRIBER_METADATA, metadata);
};
