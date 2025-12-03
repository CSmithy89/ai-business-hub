import { BaseEvent } from '@hyvve/shared';

/**
 * Event handler information
 *
 * Represents a registered event handler with metadata about its pattern,
 * priority, retry configuration, and execution function.
 */
export interface EventHandlerInfo {
  /** Event type pattern this handler subscribes to */
  pattern: string;

  /** Handler execution priority (lower number = higher priority) */
  priority: number;

  /** Maximum retry attempts for failed events */
  maxRetries: number;

  /** The service/controller instance that owns the handler method */
  instanceRef: any;

  /** The method name on the instance */
  methodName: string;

  /** The bound handler function to execute */
  execute: (event: BaseEvent) => Promise<void>;
}
