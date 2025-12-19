import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { ListNotificationsQuerySchema } from './dto/list-notifications.dto';
import { BulkReadSchema } from './dto/bulk-read.dto';
import {
  NotificationListResponse,
  UnreadCountResponse,
  MarkReadResponse,
  BulkOperationResponse,
} from '@hyvve/shared';
import { ZodError } from 'zod';

/**
 * Notification Center Controller
 *
 * REST API endpoints for notification center functionality.
 * All endpoints require authentication via JWT.
 *
 * @see Story PM-06.5: In-App Notifications
 */
@Controller('pm/notifications')
@UseGuards(AuthGuard)
export class NotificationCenterController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * List notifications (paginated)
   *
   * GET /api/pm/notifications?page=1&limit=20&type=task.assigned&read=false&workspaceId=ws-123
   *
   * Query params:
   * - page: Current page number (default: 1)
   * - limit: Items per page (default: 20, max: 100)
   * - type: Filter by notification type (optional)
   * - read: Filter by read status (optional)
   * - workspaceId: Filter by workspace (optional)
   *
   * Returns:
   * {
   *   data: Notification[],
   *   meta: { total, page, limit, hasMore }
   * }
   */
  @Get()
  async listNotifications(
    @CurrentUser('id') userId: string,
    @Query() rawQuery: unknown,
  ): Promise<NotificationListResponse> {
    try {
      const query = ListNotificationsQuerySchema.parse(rawQuery);
      return this.notificationsService.listNotifications(userId, query);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: error.errors,
        });
      }
      throw error;
    }
  }

  /**
   * Get unread notification count
   *
   * GET /api/pm/notifications/unread-count?workspaceId=ws-123
   *
   * Query params:
   * - workspaceId: Filter by workspace (optional)
   *
   * Returns:
   * {
   *   count: 12,
   *   byType: { "task.assigned": 3, "task.mentioned": 5, ... }
   * }
   */
  @Get('unread-count')
  async getUnreadCount(
    @CurrentUser('id') userId: string,
    @Query('workspaceId') workspaceId?: string,
  ): Promise<UnreadCountResponse> {
    return this.notificationsService.getUnreadCount(userId, workspaceId);
  }

  /**
   * Mark single notification as read
   *
   * POST /api/pm/notifications/:id/read
   *
   * Returns:
   * { id: "notif-123", readAt: "2025-12-20T11:00:00Z" }
   */
  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ): Promise<MarkReadResponse> {
    return this.notificationsService.markAsRead(notificationId, userId);
  }

  /**
   * Mark multiple notifications as read (bulk operation)
   *
   * POST /api/pm/notifications/bulk-read
   * Body: { ids: ["notif-1", "notif-2", "notif-3"] }
   *
   * Returns:
   * { updated: 3 }
   */
  @Post('bulk-read')
  @HttpCode(HttpStatus.OK)
  async bulkMarkAsRead(
    @CurrentUser('id') userId: string,
    @Body() rawBody: unknown,
  ): Promise<BulkOperationResponse> {
    try {
      const body = BulkReadSchema.parse(rawBody);
      return this.notificationsService.markManyAsRead(body.ids, userId);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: error.errors,
        });
      }
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   *
   * POST /api/pm/notifications/read-all?workspaceId=ws-123
   *
   * Query params:
   * - workspaceId: Filter by workspace (optional)
   *
   * Returns:
   * { updated: 12 }
   */
  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(
    @CurrentUser('id') userId: string,
    @Query('workspaceId') workspaceId?: string,
  ): Promise<BulkOperationResponse> {
    return this.notificationsService.markAllAsRead(userId, workspaceId);
  }

  /**
   * Delete notification
   *
   * DELETE /api/pm/notifications/:id
   *
   * Returns:
   * { success: true }
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteNotification(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ): Promise<{ success: boolean }> {
    await this.notificationsService.deleteNotification(notificationId, userId);
    return { success: true };
  }
}
