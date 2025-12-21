import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { DigestService } from './digest.service';
import { PrismaService } from '../../common/services/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { NotificationsService } from './notifications.service';
import { NotificationDto, PMNotificationType } from '@hyvve/shared';

// Mock fs.readFileSync to avoid reading actual template files
// Use spyOn instead of jest.mock to preserve other fs functions
jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(
  '{{userName}} - {{totalCount}} notifications'
);

describe('DigestService', () => {
  let service: DigestService;
  let prisma: any;
  let emailService: { sendEmail: jest.Mock };
  let notificationsService: {
    getUserPreferences: jest.Mock;
    isInQuietHours: jest.Mock;
  };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };

  const mockPreferences = {
    userId: 'user-1',
    digestEnabled: true,
    digestFrequency: 'daily',
    quietHoursStart: null,
    quietHoursEnd: null,
    quietHoursTimezone: 'UTC',
    lastDigestSentAt: null,
  };

  const mockNotifications: NotificationDto[] = [
    {
      id: 'n-1',
      userId: 'user-1',
      workspaceId: 'ws-1',
      type: PMNotificationType.TASK_ASSIGNED,
      title: 'Task assigned to you',
      message: 'Project Alpha task',
      link: '/projects/proj-1/tasks/task-1',
      data: { projectId: 'proj-1', projectName: 'Project Alpha' },
      readAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'n-2',
      userId: 'user-1',
      workspaceId: 'ws-1',
      type: PMNotificationType.TASK_MENTIONED,
      title: 'You were mentioned',
      message: 'Comment mention',
      link: '/projects/proj-1/tasks/task-2',
      data: { projectId: 'proj-1', projectName: 'Project Alpha' },
      readAt: null,
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DigestService,
        {
          provide: PrismaService,
          useValue: {
            notification: {
              findMany: jest.fn(),
            },
            notificationPreference: {
              update: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            getUserPreferences: jest.fn(),
            isInQuietHours: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(DigestService);
    prisma = moduleRef.get(PrismaService);
    emailService = moduleRef.get(EmailService) as unknown as { sendEmail: jest.Mock };
    notificationsService = moduleRef.get(NotificationsService) as unknown as {
      getUserPreferences: jest.Mock;
      isInQuietHours: jest.Mock;
    };
    jwtService = moduleRef.get(JwtService) as unknown as {
      sign: jest.Mock;
      verify: jest.Mock;
    };
  });

  describe('processUserDigest', () => {
    it('skips when digest is disabled', async () => {
      notificationsService.getUserPreferences.mockResolvedValueOnce({
        ...mockPreferences,
        digestEnabled: false,
      });

      await service.processUserDigest('user-1');

      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it('skips when user is in quiet hours', async () => {
      notificationsService.getUserPreferences.mockResolvedValueOnce(mockPreferences);
      notificationsService.isInQuietHours.mockReturnValueOnce(true);

      await service.processUserDigest('user-1');

      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it('skips when no unread notifications', async () => {
      notificationsService.getUserPreferences.mockResolvedValue(mockPreferences);
      notificationsService.isInQuietHours.mockReturnValueOnce(false);
      prisma.notification.findMany.mockResolvedValueOnce([]);

      await service.processUserDigest('user-1');

      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it('sends digest email when notifications exist', async () => {
      notificationsService.getUserPreferences.mockResolvedValue(mockPreferences);
      notificationsService.isInQuietHours.mockReturnValue(false);
      prisma.notification.findMany.mockResolvedValueOnce(
        mockNotifications.map((n) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          readAt: null,
        }))
      );
      prisma.user.findUnique.mockResolvedValue({ email: 'user@example.com' });
      jwtService.sign.mockReturnValueOnce('unsubscribe-token');
      prisma.notificationPreference.update.mockResolvedValueOnce({});

      await service.processUserDigest('user-1');

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('unread notifications'),
        })
      );
      expect(prisma.notificationPreference.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { lastDigestSentAt: expect.any(Date) },
      });
    });
  });

  describe('groupNotificationsByProject', () => {
    it('groups notifications by project', () => {
      const notifications: NotificationDto[] = [
        {
          id: 'n-1',
          userId: 'user-1',
          workspaceId: 'ws-1',
          type: PMNotificationType.TASK_ASSIGNED,
          title: 'Task 1',
          message: null,
          link: '/projects/proj-1/tasks/task-1',
          data: { projectId: 'proj-1', projectName: 'Project Alpha' },
          readAt: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'n-2',
          userId: 'user-1',
          workspaceId: 'ws-1',
          type: PMNotificationType.TASK_ASSIGNED,
          title: 'Task 2',
          message: null,
          link: '/projects/proj-2/tasks/task-2',
          data: { projectId: 'proj-2', projectName: 'Project Beta' },
          readAt: null,
          createdAt: new Date().toISOString(),
        },
      ];

      const result = service.groupNotificationsByProject(notifications);

      expect(result).toHaveLength(2);
      expect(result.find((g) => g.projectId === 'proj-1')).toBeDefined();
      expect(result.find((g) => g.projectId === 'proj-2')).toBeDefined();
    });

    it('groups notifications by type within project', () => {
      const result = service.groupNotificationsByProject(mockNotifications);

      expect(result).toHaveLength(1);
      expect(result[0].groups).toHaveLength(2);
      expect(result[0].groups.find((g) => g.type === PMNotificationType.TASK_ASSIGNED)).toBeDefined();
      expect(result[0].groups.find((g) => g.type === PMNotificationType.TASK_MENTIONED)).toBeDefined();
    });

    it('sorts type groups by priority', () => {
      const result = service.groupNotificationsByProject(mockNotifications);

      // TASK_ASSIGNED (priority 1) should come before TASK_MENTIONED (priority 2)
      expect(result[0].groups[0].type).toBe(PMNotificationType.TASK_ASSIGNED);
      expect(result[0].groups[1].type).toBe(PMNotificationType.TASK_MENTIONED);
    });
  });

  describe('generateUnsubscribeToken', () => {
    it('generates a JWT token with userId and type', () => {
      jwtService.sign.mockReturnValueOnce('test-token');

      const token = service.generateUnsubscribeToken('user-1');

      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          userId: 'user-1',
          type: 'digest_unsubscribe',
        },
        expect.objectContaining({
          expiresIn: '7d',
        })
      );
      expect(token).toBe('test-token');
    });
  });

  describe('verifyUnsubscribeToken', () => {
    it('verifies valid token and returns userId', async () => {
      jwtService.verify.mockReturnValueOnce({
        userId: 'user-1',
        type: 'digest_unsubscribe',
      });
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'user-1' });

      const result = await service.verifyUnsubscribeToken('valid-token');

      expect(result.userId).toBe('user-1');
    });

    it('throws for invalid token type', async () => {
      jwtService.verify.mockReturnValueOnce({
        userId: 'user-1',
        type: 'other_type',
      });

      await expect(service.verifyUnsubscribeToken('invalid-token')).rejects.toThrow(
        'Invalid or expired unsubscribe token'
      );
    });

    it('throws when user not found', async () => {
      jwtService.verify.mockReturnValueOnce({
        userId: 'user-1',
        type: 'digest_unsubscribe',
      });
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.verifyUnsubscribeToken('valid-token')).rejects.toThrow(
        'Invalid or expired unsubscribe token'
      );
    });

    it('throws for expired token', async () => {
      jwtService.verify.mockImplementationOnce(() => {
        throw new Error('jwt expired');
      });

      await expect(service.verifyUnsubscribeToken('expired-token')).rejects.toThrow(
        'Invalid or expired unsubscribe token'
      );
    });
  });

  describe('sendDigestEmail', () => {
    it('skips when user has no email', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await service.sendDigestEmail('user-1', {
        userName: 'User',
        totalCount: 5,
        dateRange: { from: '2024-01-01', to: '2024-01-07' },
        projectGroups: [],
        viewAllUrl: '/notifications',
        managePreferencesUrl: '/settings/notifications',
        unsubscribeUrl: '/unsubscribe/token',
      });

      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it('sends email when user has valid email', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ email: 'user@example.com' });

      await service.sendDigestEmail('user-1', {
        userName: 'User',
        totalCount: 5,
        dateRange: { from: '2024-01-01', to: '2024-01-07' },
        projectGroups: [],
        viewAllUrl: '/notifications',
        managePreferencesUrl: '/settings/notifications',
        unsubscribeUrl: '/unsubscribe/token',
      });

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('5 unread notifications'),
        })
      );
    });
  });

  describe('updateLastDigestSentAt', () => {
    it('updates the lastDigestSentAt timestamp', async () => {
      prisma.notificationPreference.update.mockResolvedValueOnce({});

      await service.updateLastDigestSentAt('user-1');

      expect(prisma.notificationPreference.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { lastDigestSentAt: expect.any(Date) },
      });
    });
  });
});
