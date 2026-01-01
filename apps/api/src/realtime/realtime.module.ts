import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeEventHandler } from './realtime-event.handler';
import { PresenceService } from './presence.service';
import { EventsModule } from '../events/events.module';
import { CommonModule } from '../common/common.module';
import { DashboardModule } from '../modules/dashboard/dashboard.module';

/**
 * RealtimeModule - WebSocket Real-Time Updates
 *
 * Provides WebSocket-based real-time updates for the HYVVE platform.
 * Integrates with the Event Bus (EPIC-05) to broadcast events to connected clients.
 *
 * Key Components:
 * - RealtimeGateway: Socket.io WebSocket gateway with JWT auth and workspace rooms
 * - RealtimeEventHandler: Event Bus subscriber that broadcasts events to WebSocket
 *
 * Room Architecture:
 * - workspace:${workspaceId} - All users in a workspace (multi-tenant isolation)
 * - user:${userId} - User-specific events (notifications, etc.)
 *
 * Event Flow:
 * 1. Service publishes event to Event Bus (Redis Streams)
 * 2. RealtimeEventHandler receives event via @EventSubscriber
 * 3. Handler maps event to WebSocket payload
 * 4. RealtimeGateway broadcasts to appropriate room
 * 5. Connected clients receive real-time update
 *
 * @see Story 16-15: Implement WebSocket Real-Time Updates
 */
@Module({
  imports: [
    ConfigModule,
    EventsModule, // Required for Event Bus integration
    CommonModule, // Required for PrismaService (JWT validation)
    DashboardModule, // DM-11.2: Required for DashboardStateService (WebSocket state sync)
  ],
  providers: [RealtimeGateway, RealtimeEventHandler, PresenceService],
  exports: [RealtimeGateway, PresenceService],
})
export class RealtimeModule {}
