import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { RealtimeModule } from '../../realtime/realtime.module';
import { NotificationsService } from './notifications.service';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { NotificationCenterController } from './notification-center.controller';

@Module({
  imports: [CommonModule, RealtimeModule],
  controllers: [NotificationPreferencesController, NotificationCenterController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
