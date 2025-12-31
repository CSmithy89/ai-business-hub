/**
 * Dashboard Module
 *
 * Provides dashboard state persistence functionality.
 * Uses Redis for state storage via BullMQ queue connection.
 *
 * Features:
 * - Dashboard state save/get/delete endpoints
 * - Redis-backed persistence with configurable TTL
 * - Cross-device state synchronization support
 *
 * Story: DM-11.1 - Redis State Persistence
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { DashboardStateController } from './dashboard-state.controller';
import { DashboardStateService } from './dashboard-state.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    ConfigModule,
    CommonModule, // Required for guards
    // Register the event-retry queue to access Redis client
    // This follows the pattern from EventsModule and RateLimitService
    BullModule.registerQueue({
      name: 'event-retry',
    }),
  ],
  controllers: [DashboardStateController],
  providers: [DashboardStateService],
  exports: [DashboardStateService],
})
export class DashboardModule {}
