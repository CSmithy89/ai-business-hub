import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { ListNotificationsQueryDto } from './dto/list-notifications.dto';
import {
  NotificationChannel,
  PMNotificationType,
  NotificationListResponse,
  UnreadCountResponse,
  MarkReadResponse,
  BulkOperationResponse,
  NotificationDto,
} from '@hyvve/shared';
import { DateTime } from 'luxon';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { NotificationPayload } from '../../realtime/realtime.types';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

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

  // ============================================
  // Notification Center Methods
  // ============================================

  /**
   * List notifications with pagination and filters
   * SECURITY: Only returns notifications for the authenticated user
   */
  async listNotifications(
    userId: string,
    query: ListNotificationsQueryDto,
  ): Promise<NotificationListResponse> {
    const { page = 1, limit = 20, type, read, workspaceId } = query;
    const skip = (page - 1) * limit;

    // Build where clause for user isolation and filters
    const where: {
      userId: string;
      type?: string;
      readAt?: { not: null } | null;
      workspaceId?: string;
    } = {
      userId, // SECURITY: Always filter by userId
    };

    if (type) {
      where.type = type;
    }

    if (read !== undefined) {
      where.readAt = read ? { not: null } : null;
    }

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    // Execute query with pagination
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    // Transform to DTOs
    const data: NotificationDto[] = notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      workspaceId: n.workspaceId,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      data: n.data as Record<string, unknown> | null,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        hasMore: skip + notifications.length < total,
      },
    };
  }

  /**
   * Get unread notification count
   * SECURITY: Only counts notifications for the authenticated user
   */
  async getUnreadCount(userId: string, workspaceId?: string): Promise<UnreadCountResponse> {
    const where: {
      userId: string;
      readAt: null;
      workspaceId?: string;
    } = {
      userId, // SECURITY: Always filter by userId
      readAt: null,
    };

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    // Get total count and count by type
    const [totalCount, notifications] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        select: { type: true },
      }),
    ]);

    // Count by type
    const byType: Record<string, number> = {};
    for (const notification of notifications) {
      byType[notification.type] = (byType[notification.type] || 0) + 1;
    }

    return {
      count: totalCount,
      byType,
    };
  }

  /**
   * Mark single notification as read
   * SECURITY: Only allows marking user's own notifications
   */
  async markAsRead(notificationId: string, userId: string): Promise<MarkReadResponse> {
    // Check if notification exists and belongs to user
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this notification');
    }

    // Update notification
    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });

    return {
      id: updated.id,
      readAt: updated.readAt!.toISOString(),
    };
  }

  /**
   * Mark multiple notifications as read (bulk operation)
   * SECURITY: Only updates user's own notifications
   */
  async markManyAsRead(notificationIds: string[], userId: string): Promise<BulkOperationResponse> {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId, // SECURITY: Only update user's own notifications
      },
      data: { readAt: new Date() },
    });

    return { updated: result.count };
  }

  /**
   * Mark all notifications as read
   * SECURITY: Only updates user's own notifications
   */
  async markAllAsRead(userId: string, workspaceId?: string): Promise<BulkOperationResponse> {
    const where: Parameters<typeof this.prisma.notification.updateMany>[0]['where'] = {
      userId, // SECURITY: Always filter by userId
      readAt: null,
    };

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    const result = await this.prisma.notification.updateMany({
      where,
      data: { readAt: new Date() },
    });

    return { updated: result.count };
  }

  /**
   * Delete notification
   * SECURITY: Only allows deleting user's own notifications
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    // Check if notification exists and belongs to user
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this notification');
    }

    // Delete notification
    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    this.logger.log(`Deleted notification ${notificationId} for user ${userId}`);
  }

  /**
   * Create notification and emit WebSocket event
   * This method is used by other services to create notifications
   */
  async createNotification(data: {
    userId: string;
    workspaceId: string;
    type: string;
    title: string;
    message?: string;
    link?: string;
    data?: Record<string, unknown>;
  }): Promise<NotificationDto> {
    // Save to database
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        workspaceId: data.workspaceId,
        type: data.type,
        title: data.title,
        message: data.message || null,
        link: data.link || null,
        data: (data.data as Prisma.InputJsonValue) || undefined,
      },
    });

    // Emit WebSocket event to user
    const payload: NotificationPayload = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message || '',
      severity: this.getNotificationSeverity(notification.type),
      actionUrl: notification.link || undefined,
      createdAt: notification.createdAt.toISOString(),
      read: false,
    };

    this.realtimeGateway.broadcastNotification(data.workspaceId, payload, data.userId);

    this.logger.log(`Created notification ${notification.id} for user ${data.userId}`);

    // Return DTO
    return {
      id: notification.id,
      userId: notification.userId,
      workspaceId: notification.workspaceId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      data: notification.data as Record<string, unknown> | null,
      readAt: null,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  /**
   * Map notification type to severity level for UI
   */
  private getNotificationSeverity(
    type: string,
  ): 'info' | 'success' | 'warning' | 'error' {
    if (type.includes('error') || type.includes('alert')) return 'error';
    if (type.includes('warning')) return 'warning';
    if (type.includes('success') || type.includes('completed')) return 'success';
    return 'info';
  }
}
