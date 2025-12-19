import { Module } from '@nestjs/common';
import { PresenceController } from './presence.controller';
import { PresenceService } from '../../realtime/presence.service';
import { CommonModule } from '../../common/common.module';
import { EventsModule } from '../../events/events.module';

/**
 * PresenceModule - Presence tracking module
 *
 * Provides presence tracking services and REST API endpoints.
 * Integrates with RealtimeGateway for WebSocket presence updates.
 *
 * @see Story PM-06.2: Presence Indicators
 */
@Module({
  imports: [CommonModule, EventsModule],
  controllers: [PresenceController],
  providers: [PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {}
