import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../common/services/prisma.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { DigestSchedulerService } from './digest-scheduler.service';
import { NotificationChannel, PMNotificationType } from '@hyvve/shared';
import { DateTime } from 'luxon';

type PrismaMock = {
  notificationPreference: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    deleteMany: jest.Mock;
  };
  notification: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
};

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaMock;
  let realtimeGateway: { broadcastNotification: jest.Mock };
  let digestScheduler: {
    rescheduleUserDigest: jest.Mock;
    removeUserDigest: jest.Mock;
  };

  const mockPreferences = {
    userId: 'user-1',
    emailTaskAssigned: true,
    inAppTaskAssigned: true,
    emailTaskMentioned: true,
    inAppTaskMentioned: true,
    emailDueDateReminder: true,
    inAppDueDateReminder: true,
    emailAgentCompletion: true,
    inAppAgentCompletion: true,
    emailHealthAlert: true,
    inAppHealthAlert: true,
    quietHoursStart: null,
    quietHoursEnd: null,
    quietHoursTimezone: 'UTC',
    digestEnabled: false,
    digestFrequency: 'daily',
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: {
            notificationPreference: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              deleteMany: jest.fn(),
            },
            notification: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: RealtimeGateway,
          useValue: {
            broadcastNotification: jest.fn(),
          },
        },
        {
          provide: DigestSchedulerService,
          useValue: {
            rescheduleUserDigest: jest.fn(),
            removeUserDigest: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(NotificationsService);
    prisma = moduleRef.get(PrismaService) as unknown as PrismaMock;
    realtimeGateway = moduleRef.get(RealtimeGateway) as unknown as {
      broadcastNotification: jest.Mock;
    };
    digestScheduler = moduleRef.get(DigestSchedulerService) as unknown as {
      rescheduleUserDigest: jest.Mock;
      removeUserDigest: jest.Mock;
    };
  });

  describe('getUserPreferences', () => {
    it('returns existing preferences', async () => {
      prisma.notificationPreference.findUnique.mockResolvedValueOnce(mockPreferences);

      const result = await service.getUserPreferences('user-1');

      expect(result).toEqual(mockPreferences);
      expect(prisma.notificationPreference.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('creates default preferences if not exists', async () => {
      prisma.notificationPreference.findUnique.mockResolvedValueOnce(null);
      prisma.notificationPreference.create.mockResolvedValueOnce(mockPreferences);

      const result = await service.getUserPreferences('user-1');

      expect(result).toEqual(mockPreferences);
      expect(prisma.notificationPreference.create).toHaveBeenCalledWith({
        data: { userId: 'user-1' },
      });
    });
  });

  describe('updateUserPreferences', () => {
    it('updates preferences successfully', async () => {
      prisma.notificationPreference.findUnique.mockResolvedValueOnce(mockPreferences);
      const updated = { ...mockPreferences, emailTaskAssigned: false };
      prisma.notificationPreference.update.mockResolvedValueOnce(updated);

      const result = await service.updateUserPreferences('user-1', {
        emailTaskAssigned: false,
      });

      expect(result).toEqual(updated);
    });

    it('reschedules digest when digest preferences change', async () => {
      const prefsWithDigest = { ...mockPreferences, digestEnabled: false };
      prisma.notificationPreference.findUnique.mockResolvedValueOnce(prefsWithDigest);
      prisma.notificationPreference.update.mockResolvedValueOnce({
        ...prefsWithDigest,
        digestEnabled: true,
      });

      await service.updateUserPreferences('user-1', { digestEnabled: true });

      expect(digestScheduler.rescheduleUserDigest).toHaveBeenCalledWith(
        'user-1',
        'UTC',
        'daily'
      );
    });

    it('removes digest when disabled', async () => {
      const prefsWithDigest = { ...mockPreferences, digestEnabled: true };
      prisma.notificationPreference.findUnique.mockResolvedValueOnce(prefsWithDigest);
      prisma.notificationPreference.update.mockResolvedValueOnce({
        ...prefsWithDigest,
        digestEnabled: false,
      });

      await service.updateUserPreferences('user-1', { digestEnabled: false });

      expect(digestScheduler.removeUserDigest).toHaveBeenCalledWith('user-1');
    });
  });

  describe('resetToDefaults', () => {
    it('removes digest job and recreates preferences', async () => {
      prisma.notificationPreference.deleteMany.mockResolvedValueOnce({ count: 1 });
      prisma.notificationPreference.create.mockResolvedValueOnce(mockPreferences);

      const result = await service.resetToDefaults('user-1');

      expect(digestScheduler.removeUserDigest).toHaveBeenCalledWith('user-1');
      expect(prisma.notificationPreference.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(prisma.notificationPreference.create).toHaveBeenCalledWith({
        data: { userId: 'user-1' },
      });
      expect(result).toEqual(mockPreferences);
    });
  });

  describe('shouldSendNotification', () => {
    it('returns true when notification is enabled', async () => {
      prisma.notificationPreference.findUnique.mockResolvedValueOnce(mockPreferences);

      const result = await service.shouldSendNotification(
        'user-1',
        PMNotificationType.TASK_ASSIGNED,
        NotificationChannel.EMAIL
      );

      expect(result).toBe(true);
    });

    it('returns false when notification is disabled', async () => {
      prisma.notificationPreference.findUnique.mockResolvedValueOnce({
        ...mockPreferences,
        emailTaskAssigned: false,
      });

      const result = await service.shouldSendNotification(
        'user-1',
        PMNotificationType.TASK_ASSIGNED,
        NotificationChannel.EMAIL
      );

      expect(result).toBe(false);
    });

    it('returns false during quiet hours', async () => {
      const now = DateTime.now().setZone('UTC');
      const quietStart = now.minus({ hours: 1 }).toFormat('HH:mm');
      const quietEnd = now.plus({ hours: 1 }).toFormat('HH:mm');

      prisma.notificationPreference.findUnique.mockResolvedValueOnce({
        ...mockPreferences,
        quietHoursStart: quietStart,
        quietHoursEnd: quietEnd,
        quietHoursTimezone: 'UTC',
      });

      const result = await service.shouldSendNotification(
        'user-1',
        PMNotificationType.TASK_ASSIGNED,
        NotificationChannel.EMAIL
      );

      expect(result).toBe(false);
    });

    it('HEALTH_ALERT bypasses quiet hours', async () => {
      const now = DateTime.now().setZone('UTC');
      const quietStart = now.minus({ hours: 1 }).toFormat('HH:mm');
      const quietEnd = now.plus({ hours: 1 }).toFormat('HH:mm');

      prisma.notificationPreference.findUnique.mockResolvedValueOnce({
        ...mockPreferences,
        quietHoursStart: quietStart,
        quietHoursEnd: quietEnd,
        quietHoursTimezone: 'UTC',
      });

      const result = await service.shouldSendNotification(
        'user-1',
        PMNotificationType.HEALTH_ALERT,
        NotificationChannel.EMAIL
      );

      expect(result).toBe(true);
    });
  });

  describe('isInQuietHours', () => {
    it('returns false when no quiet hours configured', () => {
      const result = service.isInQuietHours(
        {
          quietHoursStart: null,
          quietHoursEnd: null,
          quietHoursTimezone: 'UTC',
        },
        new Date()
      );

      expect(result).toBe(false);
    });

    it('returns true when within quiet hours', () => {
      const now = DateTime.now().setZone('UTC');
      const quietStart = now.minus({ hours: 1 }).toFormat('HH:mm');
      const quietEnd = now.plus({ hours: 1 }).toFormat('HH:mm');

      const result = service.isInQuietHours(
        {
          quietHoursStart: quietStart,
          quietHoursEnd: quietEnd,
          quietHoursTimezone: 'UTC',
        },
        new Date()
      );

      expect(result).toBe(true);
    });

    it('handles overnight quiet hours (e.g., 22:00 to 08:00)', () => {
      // Create a time at 23:00 UTC
      const testDate = new Date();
      testDate.setUTCHours(23, 0, 0, 0);

      const result = service.isInQuietHours(
        {
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
          quietHoursTimezone: 'UTC',
        },
        testDate
      );

      expect(result).toBe(true);
    });
  });

  describe('listNotifications', () => {
    it('returns paginated notifications for user', async () => {
      const notifications = [
        { id: 'n-1', userId: 'user-1', type: 'task_assigned', title: 'Test', createdAt: new Date() },
      ];
      prisma.notification.findMany.mockResolvedValueOnce(notifications);
      prisma.notification.count.mockResolvedValueOnce(1);

      const result = await service.listNotifications('user-1', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        })
      );
    });

    it('filters by read status', async () => {
      prisma.notification.findMany.mockResolvedValueOnce([]);
      prisma.notification.count.mockResolvedValueOnce(0);

      await service.listNotifications('user-1', { page: 1, limit: 20, read: false });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            readAt: null,
          }),
        })
      );
    });
  });

  describe('getUnreadCount', () => {
    it('returns unread count for user', async () => {
      prisma.notification.count.mockResolvedValueOnce(5);
      prisma.notification.findMany.mockResolvedValueOnce([
        { type: 'task_assigned' },
        { type: 'task_assigned' },
        { type: 'health_alert' },
      ]);

      const result = await service.getUnreadCount('user-1');

      expect(result.count).toBe(5);
      expect(result.byType).toEqual({
        task_assigned: 2,
        health_alert: 1,
      });
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read', async () => {
      const notification = { id: 'n-1', userId: 'user-1' };
      prisma.notification.findUnique.mockResolvedValueOnce(notification);
      prisma.notification.update.mockResolvedValueOnce({
        ...notification,
        readAt: new Date(),
      });

      const result = await service.markAsRead('n-1', 'user-1');

      expect(result.id).toBe('n-1');
      expect(result.readAt).toBeDefined();
    });

    it('throws NotFoundException for non-existent notification', async () => {
      prisma.notification.findUnique.mockResolvedValueOnce(null);

      await expect(service.markAsRead('n-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for notification owned by another user', async () => {
      prisma.notification.findUnique.mockResolvedValueOnce({
        id: 'n-1',
        userId: 'other-user',
      });

      await expect(service.markAsRead('n-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all unread notifications as read', async () => {
      prisma.notification.updateMany.mockResolvedValueOnce({ count: 10 });

      const result = await service.markAllAsRead('user-1');

      expect(result.updated).toBe(10);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          readAt: null,
        },
        data: { readAt: expect.any(Date) },
      });
    });
  });

  describe('deleteNotification', () => {
    it('deletes notification successfully', async () => {
      const notification = { id: 'n-1', userId: 'user-1' };
      prisma.notification.findUnique.mockResolvedValueOnce(notification);
      prisma.notification.delete.mockResolvedValueOnce(notification);

      await service.deleteNotification('n-1', 'user-1');

      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: 'n-1' },
      });
    });

    it('throws ForbiddenException for notification owned by another user', async () => {
      prisma.notification.findUnique.mockResolvedValueOnce({
        id: 'n-1',
        userId: 'other-user',
      });

      await expect(service.deleteNotification('n-1', 'user-1')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('createNotification', () => {
    it('creates notification and broadcasts via WebSocket', async () => {
      const notification = {
        id: 'n-1',
        userId: 'user-1',
        workspaceId: 'ws-1',
        type: 'task_assigned',
        title: 'New task',
        message: 'You have been assigned a task',
        link: '/tasks/1',
        data: null,
        readAt: null,
        createdAt: new Date(),
      };
      prisma.notification.create.mockResolvedValueOnce(notification);

      const result = await service.createNotification({
        userId: 'user-1',
        workspaceId: 'ws-1',
        type: 'task_assigned',
        title: 'New task',
        message: 'You have been assigned a task',
        link: '/tasks/1',
      });

      expect(result.id).toBe('n-1');
      expect(realtimeGateway.broadcastNotification).toHaveBeenCalledWith(
        'ws-1',
        expect.objectContaining({
          id: 'n-1',
          type: 'task_assigned',
          title: 'New task',
        }),
        'user-1'
      );
    });
  });
});
