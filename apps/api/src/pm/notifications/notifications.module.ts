import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { NotificationsService } from './notifications.service';
import { NotificationPreferencesController } from './notification-preferences.controller';

@Module({
  imports: [CommonModule],
  controllers: [NotificationPreferencesController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
