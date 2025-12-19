import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { CommonModule } from '../../common/common.module';
import { RealtimeModule } from '../../realtime/realtime.module';
import { NotificationsService } from './notifications.service';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { NotificationCenterController } from './notification-center.controller';
import { DigestService } from './digest.service';
import { DigestSchedulerService } from './digest-scheduler.service';
import { DigestUnsubscribeController } from './digest-unsubscribe.controller';
import { DigestProcessor } from './queues/digest.processor';

@Module({
  imports: [
    CommonModule,
    RealtimeModule,
    // BullMQ queue for digest jobs
    BullModule.registerQueue({
      name: 'pm:digest',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    }),
    // JWT for unsubscribe tokens
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'temporary-secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [
    NotificationPreferencesController,
    NotificationCenterController,
    DigestUnsubscribeController,
  ],
  providers: [
    NotificationsService,
    DigestService,
    DigestSchedulerService,
    DigestProcessor,
  ],
  exports: [NotificationsService, DigestService, DigestSchedulerService],
})
export class NotificationsModule {}
