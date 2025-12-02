import { Injectable, Logger } from '@nestjs/common';

/**
 * EventBusService Stub - Placeholder for Epic 05
 *
 * This is a temporary stub implementation for event emission.
 * The full event bus infrastructure will be implemented in Epic 05 (Story 05-2).
 *
 * TODO (Epic 05):
 * - Replace with full EventBusService implementation
 * - Add Redis pub/sub or message queue backend
 * - Add event persistence and replay
 * - Add event subscriptions and handlers
 */
@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  /**
   * Emit an event (stub - logs to console)
   *
   * @param event - Event name (e.g., 'approval.approved')
   * @param payload - Event payload
   */
  async emit(event: string, payload: any): Promise<void> {
    this.logger.log({
      message: '[STUB] Event emitted',
      event,
      payload,
      note: 'Full event bus implementation coming in Epic 05',
    });
  }
}
