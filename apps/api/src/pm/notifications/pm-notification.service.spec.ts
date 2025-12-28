/**
 * PMNotificationService Unit Tests
 *
 * Tests for PM-specific notification facade including health alerts,
 * risk notifications, and report notifications.
 *
 * @see Story PM-12.3: Notification Integration
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PMNotificationService } from './pm-notification.service';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../common/services/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { HealthLevel, RiskSeverity } from '@prisma/client';
import { PMNotificationType } from '@hyvve/shared';

describe('PMNotificationService', () => {
  let service: PMNotificationService;
  let notificationsService: jest.Mocked<NotificationsService>;
  let prisma: jest.Mocked<PrismaService>;
  let emailService: jest.Mocked<EmailService>;
  let realtimeGateway: jest.Mocked<RealtimeGateway>;

  const mockProject = {
    id: 'project-1',
    name: 'Test Project',
    workspaceId: 'workspace-1',
    team: {
      leadUserId: 'user-lead',
      members: [
        { userId: 'user-1' },
        { userId: 'user-2' },
      ],
    },
  };

  const mockLeadUser = {
    id: 'user-lead',
    name: 'Project Lead',
    email: 'lead@test.com',
  };

  beforeEach(async () => {
    const mockNotificationsService = {
      createNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      shouldSendNotification: jest.fn().mockResolvedValue(true),
    };

    const mockPrisma = {
      project: {
        findUnique: jest.fn().mockResolvedValue(mockProject),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(mockLeadUser),
      },
      riskEntry: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const mockEmailService = {
      sendEmail: jest.fn().mockResolvedValue({ success: true }),
    };

    const mockRealtimeGateway = {
      broadcastPMHealthCritical: jest.fn(),
      broadcastPMHealthWarning: jest.fn(),
      broadcastPMRiskDetected: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PMNotificationService,
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailService, useValue: mockEmailService },
        { provide: RealtimeGateway, useValue: mockRealtimeGateway },
      ],
    }).compile();

    service = module.get<PMNotificationService>(PMNotificationService);
    notificationsService = module.get(NotificationsService);
    prisma = module.get(PrismaService);
    emailService = module.get(EmailService);
    realtimeGateway = module.get(RealtimeGateway);
  });

  describe('sendHealthAlert', () => {
    const healthAlertPayload = {
      projectId: 'project-1',
      projectName: 'Test Project',
      score: 35,
      level: HealthLevel.CRITICAL,
      explanation: 'Project health is critical',
    };

    it('should create in-app notifications for project lead', async () => {
      await service.sendHealthAlert('workspace-1', healthAlertPayload);

      expect(notificationsService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'workspace-1',
          userId: 'user-lead',
          type: PMNotificationType.HEALTH_ALERT,
          title: 'Project health is CRITICAL',
        }),
      );
    });

    it('should notify all team members for CRITICAL level', async () => {
      await service.sendHealthAlert('workspace-1', healthAlertPayload);

      // Lead + 2 team members = 3 notifications
      expect(notificationsService.createNotification).toHaveBeenCalledTimes(3);
    });

    it('should only notify lead for WARNING level', async () => {
      const warningPayload = {
        ...healthAlertPayload,
        level: HealthLevel.WARNING,
        score: 55,
      };

      await service.sendHealthAlert('workspace-1', warningPayload);

      // Only lead for WARNING
      expect(notificationsService.createNotification).toHaveBeenCalledTimes(1);
    });

    it('should broadcast WebSocket event for CRITICAL', async () => {
      await service.sendHealthAlert('workspace-1', healthAlertPayload);

      expect(realtimeGateway.broadcastPMHealthCritical).toHaveBeenCalledWith(
        'workspace-1',
        expect.objectContaining({
          projectId: 'project-1',
          score: 35,
          level: 'CRITICAL',
        }),
      );
    });

    it('should broadcast WebSocket event for WARNING', async () => {
      const warningPayload = {
        ...healthAlertPayload,
        level: HealthLevel.WARNING,
        score: 55,
      };

      await service.sendHealthAlert('workspace-1', warningPayload);

      expect(realtimeGateway.broadcastPMHealthWarning).toHaveBeenCalledWith(
        'workspace-1',
        expect.objectContaining({
          projectId: 'project-1',
          score: 55,
          level: 'WARNING',
        }),
      );
    });

    it('should send email for CRITICAL alerts', async () => {
      await service.sendHealthAlert('workspace-1', healthAlertPayload);

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'lead@test.com',
          subject: expect.stringContaining('CRITICAL'),
        }),
      );
    });

    it('should not send email for WARNING alerts', async () => {
      const warningPayload = {
        ...healthAlertPayload,
        level: HealthLevel.WARNING,
        score: 55,
      };

      await service.sendHealthAlert('workspace-1', warningPayload);

      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should respect user notification preferences', async () => {
      notificationsService.shouldSendNotification.mockResolvedValue(false);

      await service.sendHealthAlert('workspace-1', healthAlertPayload);

      expect(notificationsService.createNotification).not.toHaveBeenCalled();
    });

    it('should not fail if project not found', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.sendHealthAlert('workspace-1', healthAlertPayload),
      ).resolves.not.toThrow();
    });
  });

  describe('sendRiskNotification', () => {
    const riskPayload = {
      projectId: 'project-1',
      projectName: 'Test Project',
      riskId: 'risk-1',
      title: 'Deadline Warning',
      severity: RiskSeverity.HIGH,
      description: '3 tasks due in 48 hours',
      affectedTaskCount: 3,
    };

    const affectedUserIds = ['user-1', 'user-2'];

    it('should create in-app notifications for affected users', async () => {
      await service.sendRiskNotification('workspace-1', riskPayload, affectedUserIds);

      expect(notificationsService.createNotification).toHaveBeenCalledTimes(2);
      expect(notificationsService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          type: PMNotificationType.RISK_DETECTED,
          title: 'Deadline Warning',
        }),
      );
    });

    it('should broadcast WebSocket event', async () => {
      await service.sendRiskNotification('workspace-1', riskPayload, affectedUserIds);

      expect(realtimeGateway.broadcastPMRiskDetected).toHaveBeenCalledWith(
        'workspace-1',
        expect.objectContaining({
          projectId: 'project-1',
          riskId: 'risk-1',
          severity: 'HIGH',
        }),
      );
    });

    it('should set high priority for CRITICAL/HIGH severity', async () => {
      await service.sendRiskNotification('workspace-1', riskPayload, affectedUserIds);

      expect(notificationsService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: 'high',
          }),
        }),
      );
    });

    it('should set medium priority for MEDIUM severity', async () => {
      const mediumRisk = { ...riskPayload, severity: RiskSeverity.MEDIUM };

      await service.sendRiskNotification('workspace-1', mediumRisk, affectedUserIds);

      expect(notificationsService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: 'medium',
          }),
        }),
      );
    });

    it('should not notify if no affected users', async () => {
      await service.sendRiskNotification('workspace-1', riskPayload, []);

      expect(notificationsService.createNotification).not.toHaveBeenCalled();
      // WebSocket should still broadcast
      expect(realtimeGateway.broadcastPMRiskDetected).toHaveBeenCalled();
    });
  });

  describe('sendRiskResolvedNotification', () => {
    const resolvedPayload = {
      projectId: 'project-1',
      projectName: 'Test Project',
      riskId: 'risk-1',
      title: 'Deadline Warning',
      resolvedBy: 'user-resolver',
      resolvedAt: new Date().toISOString(),
    };

    it('should notify the user who acknowledged the risk', async () => {
      await service.sendRiskResolvedNotification('workspace-1', resolvedPayload, 'user-acknowledger');

      expect(notificationsService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-acknowledger',
          type: PMNotificationType.RISK_RESOLVED,
          title: 'Risk resolved: Deadline Warning',
        }),
      );
    });

    it('should not notify if acknowledger is the same as resolver', async () => {
      await service.sendRiskResolvedNotification('workspace-1', resolvedPayload, 'user-resolver');

      expect(notificationsService.createNotification).not.toHaveBeenCalled();
    });

    it('should not notify if no acknowledger', async () => {
      await service.sendRiskResolvedNotification('workspace-1', resolvedPayload, null);

      expect(notificationsService.createNotification).not.toHaveBeenCalled();
    });
  });

  describe('sendReportNotification', () => {
    const reportPayload = {
      projectId: 'project-1',
      projectName: 'Test Project',
      reportId: 'report-1',
      reportType: 'HEALTH_REPORT',
      reportTitle: 'Health Report - Test Project',
      downloadUrl: '/pm/projects/project-1/reports/report-1',
    };

    const recipientIds = ['user-1', 'user-2', 'user-lead'];

    it('should create in-app notifications for all recipients', async () => {
      await service.sendReportNotification('workspace-1', reportPayload, recipientIds);

      expect(notificationsService.createNotification).toHaveBeenCalledTimes(3);
    });

    it('should include report details in notification', async () => {
      await service.sendReportNotification('workspace-1', reportPayload, recipientIds);

      expect(notificationsService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: PMNotificationType.REPORT_GENERATED,
          title: 'Report ready: Health Report - Test Project',
          data: expect.objectContaining({
            reportId: 'report-1',
            reportType: 'HEALTH_REPORT',
          }),
        }),
      );
    });

    it('should respect user notification preferences', async () => {
      notificationsService.shouldSendNotification.mockResolvedValue(false);

      await service.sendReportNotification('workspace-1', reportPayload, recipientIds);

      expect(notificationsService.createNotification).not.toHaveBeenCalled();
    });

    it('should not fail with empty recipient list', async () => {
      await expect(
        service.sendReportNotification('workspace-1', reportPayload, []),
      ).resolves.not.toThrow();

      expect(notificationsService.createNotification).not.toHaveBeenCalled();
    });
  });
});
