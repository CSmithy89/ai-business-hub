import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { NotificationChannel, PMNotificationType } from '@hyvve/shared';
import { DateTime } from 'luxon';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user's notification preferences
   * Auto-creates with defaults if not exists
   */
  async getUserPreferences(userId: string) {
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Auto-create if not exists
    if (!preferences) {
      this.logger.log(`Creating default notification preferences for user ${userId}`);
      preferences = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return preferences;
  }

  /**
   * Update user's notification preferences
   * Supports partial updates
   */
  async updateUserPreferences(userId: string, data: UpdatePreferencesDto) {
    // Ensure preferences exist
    await this.getUserPreferences(userId);

    const updated = await this.prisma.notificationPreference.update({
      where: { userId },
      data,
    });

    this.logger.log(`Updated notification preferences for user ${userId}`);
    return updated;
  }

  /**
   * Reset user's preferences to defaults
   */
  async resetToDefaults(userId: string) {
    // Delete existing preferences
    await this.prisma.notificationPreference.deleteMany({
      where: { userId },
    });

    // Create new with defaults
    const preferences = await this.prisma.notificationPreference.create({
      data: { userId },
    });

    this.logger.log(`Reset notification preferences to defaults for user ${userId}`);
    return preferences;
  }

  /**
   * Check if notification should be sent based on user preferences
   */
  async shouldSendNotification(
    userId: string,
    notificationType: PMNotificationType,
    channel: NotificationChannel
  ): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId);

    // Map notification type + channel to preference field
    const preferenceField = this.getPreferenceField(notificationType, channel);
    if (!preferenceField) {
      this.logger.warn(`Unknown notification type/channel: ${notificationType}/${channel}`);
      return true; // Default to sending if unknown
    }

    // Check if user has disabled this notification type
    const isEnabled = (preferences as any)[preferenceField];
    if (!isEnabled) {
      this.logger.debug(
        `Notification ${notificationType}/${channel} disabled for user ${userId}`
      );
      return false;
    }

    // Check quiet hours (only applies to non-critical notifications)
    if (this.isInQuietHours(preferences, new Date())) {
      this.logger.debug(`User ${userId} is in quiet hours, suppressing notification`);
      return false;
    }

    return true;
  }

  /**
   * Check if current time is within user's quiet hours
   */
  isInQuietHours(
    preferences: {
      quietHoursStart: string | null;
      quietHoursEnd: string | null;
      quietHoursTimezone: string;
    },
    timestamp: Date
  ): boolean {
    // No quiet hours configured
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    try {
      // Convert timestamp to user's timezone
      const userTime = DateTime.fromJSDate(timestamp, {
        zone: preferences.quietHoursTimezone,
      });

      // Parse quiet hours start/end times
      const [startHour, startMinute] = preferences.quietHoursStart.split(':').map(Number);
      const [endHour, endMinute] = preferences.quietHoursEnd.split(':').map(Number);

      // Create DateTime objects for start and end times
      const start = userTime.set({ hour: startHour, minute: startMinute, second: 0, millisecond: 0 });
      const end = userTime.set({ hour: endHour, minute: endMinute, second: 0, millisecond: 0 });

      // Handle overnight ranges (e.g., 22:00 to 08:00)
      if (start > end) {
        // Quiet hours span midnight
        return userTime >= start || userTime <= end;
      } else {
        // Quiet hours within same day
        return userTime >= start && userTime <= end;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error checking quiet hours for user: ${errorMessage}`, errorStack);
      return false; // Fail open - send notification if quiet hours check fails
    }
  }

  /**
   * Map notification type + channel to preference field name
   */
  private getPreferenceField(
    notificationType: PMNotificationType,
    channel: NotificationChannel
  ): string | null {
    const typeMap: Record<PMNotificationType, string> = {
      [PMNotificationType.TASK_ASSIGNED]: 'TaskAssigned',
      [PMNotificationType.TASK_MENTIONED]: 'TaskMentioned',
      [PMNotificationType.DUE_DATE_REMINDER]: 'DueDateReminder',
      [PMNotificationType.AGENT_COMPLETION]: 'AgentCompletion',
      [PMNotificationType.HEALTH_ALERT]: 'HealthAlert',
    };

    const channelPrefix = channel === NotificationChannel.EMAIL ? 'email' : 'inApp';
    const typeSuffix = typeMap[notificationType];

    if (!typeSuffix) {
      return null;
    }

    return `${channelPrefix}${typeSuffix}`;
  }
}
