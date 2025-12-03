import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for storing event subscriber information
 */
export const EVENT_SUBSCRIBER_METADATA = 'EVENT_SUBSCRIBER_METADATA';

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
 * @param pattern - Event type pattern to match (supports wildcards)
 *   - Exact match: 'approval.item.approved'
 *   - Wildcard suffix: 'approval.*' (matches all approval events)
 *   - Match all: '*' (matches all events)
 *
 * @param options - Additional handler configuration
 *   - priority: Execution order (lower = higher priority, default: 100)
 *   - maxRetries: Max retry attempts for failed events (default: 3)
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class NotificationHandler {
 *   @EventSubscriber('approval.item.approved')
 *   async handleApprovalApproved(event: BaseEvent<ApprovalDecisionPayload>) {
 *     // Send notification
 *   }
 *
 *   @EventSubscriber('approval.*', { priority: 1 })
 *   async logAllApprovalEvents(event: BaseEvent) {
 *     // Log all approval events with high priority
 *   }
 *
 *   @EventSubscriber('*', { priority: 999 })
 *   async analyticsTracker(event: BaseEvent) {
 *     // Track all events for analytics (low priority)
 *   }
 * }
 * ```
 */
export const EventSubscriber = (
  pattern: string,
  options?: Omit<EventSubscriberOptions, 'pattern'>,
): MethodDecorator => {
  return SetMetadata(EVENT_SUBSCRIBER_METADATA, {
    pattern,
    priority: options?.priority ?? 100,
    maxRetries: options?.maxRetries ?? 3,
  } as EventSubscriberOptions);
};
