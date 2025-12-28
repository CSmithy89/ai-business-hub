/**
 * PM Notification Service
 *
 * PM-specific notification facade that provides helper methods for health alerts,
 * risk notifications, and report notifications. Delegates to NotificationsService
 * for actual notification creation and uses RealtimeGateway for WebSocket broadcasts.
 *
 * @see Story PM-12.3: Notification Integration
 */

import { Injectable, Logger } from '@nestjs/common';
import { HealthLevel, RiskSeverity } from '@prisma/client';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

import { PrismaService } from '../../common/services/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { NotificationsService } from './notifications.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { PMNotificationType, NotificationChannel } from '@hyvve/shared';
import {
  HealthAlertPayload,
  RiskNotificationPayload,
  RiskResolvedPayload,
  ReportNotificationPayload,
  CriticalHealthEmailData,
} from './pm-notification.types';

@Injectable()
export class PMNotificationService {
  private readonly logger = new Logger(PMNotificationService.name);
  private criticalHealthTemplate: Handlebars.TemplateDelegate | null = null;
  private criticalHealthTextTemplate: Handlebars.TemplateDelegate | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly emailService: EmailService,
  ) {
    this.loadEmailTemplates();
  }

  /**
   * Load email templates on service initialization
   */
  private loadEmailTemplates(): void {
    try {
      // Register custom Handlebars helpers
      Handlebars.registerHelper('lowercase', (str: string) => str?.toLowerCase() ?? '');

      const templateDir = path.join(__dirname, 'templates');
      const htmlPath = path.join(templateDir, 'critical-health-alert.hbs');
      const textPath = path.join(templateDir, 'critical-health-alert.text.hbs');

      if (fs.existsSync(htmlPath)) {
        const htmlSource = fs.readFileSync(htmlPath, 'utf-8');
        this.criticalHealthTemplate = Handlebars.compile(htmlSource);
      }

      if (fs.existsSync(textPath)) {
        const textSource = fs.readFileSync(textPath, 'utf-8');
        this.criticalHealthTextTemplate = Handlebars.compile(textSource);
      }

      this.logger.log('PM notification email templates loaded');
    } catch (error) {
      this.logger.warn('Failed to load PM notification email templates', error);
    }
  }

  /**
   * Send health alert notification when project health drops to CRITICAL or WARNING
   *
   * Recipients:
   * - Project lead (always)
   * - All team members (for CRITICAL only)
   *
   * Also sends email to project lead for CRITICAL alerts and broadcasts WebSocket event.
   */
  async sendHealthAlert(
    workspaceId: string,
    payload: HealthAlertPayload,
  ): Promise<void> {
    this.logger.log(`Sending health alert for project ${payload.projectId}`);

    try {
      // Get project with team (scoped to workspace for tenant isolation)
      const project = await this.prisma.project.findFirst({
        where: {
          id: payload.projectId,
          workspaceId, // Enforce workspace scoping
        },
        select: {
          id: true,
          name: true,
          team: {
            select: {
              leadUserId: true,
              members: {
                where: { isActive: true },
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      });

      if (!project) {
        this.logger.warn(`Project ${payload.projectId} not found in workspace ${workspaceId} for health alert`);
        return;
      }

      // Determine recipients
      const recipients = this.getHealthAlertRecipients(project, payload.level);

      // Determine priority
      const priority = payload.level === HealthLevel.CRITICAL ? 'high' : 'medium';

      // Create in-app notifications for each recipient
      const notificationPromises = recipients.map(async (userId) => {
        // Check user preferences
        const shouldNotify = await this.notificationsService.shouldSendNotification(
          userId,
          PMNotificationType.HEALTH_ALERT,
          NotificationChannel.IN_APP,
        );

        if (!shouldNotify) {
          this.logger.debug(`Skipping health alert for user ${userId} due to preferences`);
          return;
        }

        return this.notificationsService.createNotification({
          workspaceId,
          userId,
          type: PMNotificationType.HEALTH_ALERT,
          title: `Project health is ${payload.level}`,
          message: payload.explanation,
          link: `/pm/projects/${payload.projectId}`,
          data: {
            projectId: payload.projectId,
            projectName: payload.projectName,
            score: payload.score,
            level: payload.level,
            previousLevel: payload.previousLevel,
            previousScore: payload.previousScore,
            priority,
          },
        });
      });

      await Promise.allSettled(notificationPromises);

      // Broadcast WebSocket event
      const wsPayload = {
        projectId: payload.projectId,
        projectName: payload.projectName,
        score: payload.score,
        level: payload.level as 'CRITICAL' | 'WARNING',
        explanation: payload.explanation,
        timestamp: new Date().toISOString(),
      };

      if (payload.level === HealthLevel.CRITICAL) {
        this.realtimeGateway.broadcastPMHealthCritical(workspaceId, wsPayload);
      } else if (payload.level === HealthLevel.WARNING) {
        this.realtimeGateway.broadcastPMHealthWarning(workspaceId, wsPayload);
      }

      // Send email for CRITICAL alerts to project lead
      if (payload.level === HealthLevel.CRITICAL) {
        await this.sendCriticalHealthEmail(workspaceId, project, payload);
      }

      this.logger.log(
        `Health alert sent to ${recipients.length} recipients for project ${payload.projectId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send health alert for project ${payload.projectId}`, error);
    }
  }

  /**
   * Send risk detected notification to affected users
   */
  async sendRiskNotification(
    workspaceId: string,
    payload: RiskNotificationPayload,
    affectedUserIds: string[],
  ): Promise<void> {
    this.logger.log(`Sending risk notification for risk ${payload.riskId}`);

    try {
      // Determine priority based on severity
      const priority =
        payload.severity === RiskSeverity.CRITICAL || payload.severity === RiskSeverity.HIGH
          ? 'high'
          : 'medium';

      // Create notifications for affected users
      const notificationPromises = affectedUserIds.map(async (userId) => {
        // Check user preferences (use HEALTH_ALERT type for risk alerts as they're related)
        const shouldNotify = await this.notificationsService.shouldSendNotification(
          userId,
          PMNotificationType.RISK_DETECTED,
          NotificationChannel.IN_APP,
        );

        if (!shouldNotify) {
          this.logger.debug(`Skipping risk notification for user ${userId} due to preferences`);
          return;
        }

        return this.notificationsService.createNotification({
          workspaceId,
          userId,
          type: PMNotificationType.RISK_DETECTED,
          title: payload.title,
          message: payload.description,
          link: `/pm/projects/${payload.projectId}`,
          data: {
            projectId: payload.projectId,
            projectName: payload.projectName,
            riskId: payload.riskId,
            severity: payload.severity,
            affectedTaskCount: payload.affectedTaskCount,
            priority,
          },
        });
      });

      await Promise.allSettled(notificationPromises);

      // Broadcast WebSocket event
      this.realtimeGateway.broadcastPMRiskDetected(workspaceId, {
        projectId: payload.projectId,
        projectName: payload.projectName,
        riskId: payload.riskId,
        title: payload.title,
        severity: payload.severity,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `Risk notification sent to ${affectedUserIds.length} users for risk ${payload.riskId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send risk notification for risk ${payload.riskId}`, error);
    }
  }

  /**
   * Send risk resolved notification to the user who acknowledged it
   */
  async sendRiskResolvedNotification(
    workspaceId: string,
    payload: RiskResolvedPayload,
    acknowledgedBy: string | null,
  ): Promise<void> {
    // Only notify if risk was acknowledged by a different user than who resolved it
    if (!acknowledgedBy || acknowledgedBy === payload.resolvedBy) {
      return;
    }

    this.logger.log(`Sending risk resolved notification for risk ${payload.riskId}`);

    try {
      // Check user preferences
      const shouldNotify = await this.notificationsService.shouldSendNotification(
        acknowledgedBy,
        PMNotificationType.RISK_RESOLVED,
        NotificationChannel.IN_APP,
      );

      if (!shouldNotify) {
        this.logger.debug(`Skipping risk resolved notification for user ${acknowledgedBy}`);
        return;
      }

      await this.notificationsService.createNotification({
        workspaceId,
        userId: acknowledgedBy,
        type: PMNotificationType.RISK_RESOLVED,
        title: `Risk resolved: ${payload.title}`,
        message: 'The risk you acknowledged has been resolved.',
        link: `/pm/projects/${payload.projectId}`,
        data: {
          projectId: payload.projectId,
          projectName: payload.projectName,
          riskId: payload.riskId,
          resolvedBy: payload.resolvedBy,
          resolvedAt: payload.resolvedAt,
          priority: 'low',
        },
      });

      this.logger.log(`Risk resolved notification sent to user ${acknowledgedBy}`);
    } catch (error) {
      this.logger.error(`Failed to send risk resolved notification for risk ${payload.riskId}`, error);
    }
  }

  /**
   * Send report generated notification to recipients
   */
  async sendReportNotification(
    workspaceId: string,
    payload: ReportNotificationPayload,
    recipientIds: string[],
  ): Promise<void> {
    this.logger.log(`Sending report notification for report ${payload.reportId}`);

    try {
      // Create notifications for all recipients
      const notificationPromises = recipientIds.map(async (userId) => {
        // Check user preferences
        const shouldNotify = await this.notificationsService.shouldSendNotification(
          userId,
          PMNotificationType.REPORT_GENERATED,
          NotificationChannel.IN_APP,
        );

        if (!shouldNotify) {
          this.logger.debug(`Skipping report notification for user ${userId} due to preferences`);
          return;
        }

        return this.notificationsService.createNotification({
          workspaceId,
          userId,
          type: PMNotificationType.REPORT_GENERATED,
          title: `Report ready: ${payload.reportTitle}`,
          message: `${payload.reportType} report for ${payload.projectName} is ready.`,
          link: `/pm/projects/${payload.projectId}/reports/${payload.reportId}`,
          data: {
            projectId: payload.projectId,
            projectName: payload.projectName,
            reportId: payload.reportId,
            reportType: payload.reportType,
            downloadUrl: payload.downloadUrl,
            priority: 'medium',
          },
        });
      });

      await Promise.allSettled(notificationPromises);

      this.logger.log(
        `Report notification sent to ${recipientIds.length} recipients for report ${payload.reportId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send report notification for report ${payload.reportId}`, error);
    }
  }

  /**
   * Get recipients for health alerts based on severity level
   */
  private getHealthAlertRecipients(
    project: {
      team?: {
        leadUserId?: string | null;
        members: Array<{ userId: string }>;
      } | null;
    },
    level: HealthLevel,
  ): string[] {
    const recipients: string[] = [];

    // Always notify project lead
    if (project.team?.leadUserId) {
      recipients.push(project.team.leadUserId);
    }

    // For CRITICAL, notify all team members
    if (level === HealthLevel.CRITICAL && project.team?.members) {
      for (const member of project.team.members) {
        if (!recipients.includes(member.userId)) {
          recipients.push(member.userId);
        }
      }
    }

    return recipients;
  }

  /**
   * Send critical health email to project lead
   */
  private async sendCriticalHealthEmail(
    _workspaceId: string,
    project: {
      id: string;
      name: string;
      team?: {
        leadUserId?: string | null;
      } | null;
    },
    payload: HealthAlertPayload,
  ): Promise<void> {
    const leadUserId = project.team?.leadUserId;
    if (!leadUserId) {
      this.logger.debug('No project lead to send critical health email');
      return;
    }

    // Check email preference
    const shouldSendEmail = await this.notificationsService.shouldSendNotification(
      leadUserId,
      PMNotificationType.HEALTH_ALERT,
      NotificationChannel.EMAIL,
    );

    if (!shouldSendEmail) {
      this.logger.debug(`Skipping critical health email for user ${leadUserId}`);
      return;
    }

    // Get user details
    const user = await this.prisma.user.findUnique({
      where: { id: leadUserId },
      select: { email: true, name: true },
    });

    if (!user?.email) {
      this.logger.warn(`No email address for project lead ${leadUserId}`);
      return;
    }

    // Get top risks for the email
    const topRisks = await this.prisma.riskEntry.findMany({
      where: {
        projectId: payload.projectId,
        status: { in: ['IDENTIFIED', 'ANALYZING', 'MITIGATING'] },
      },
      orderBy: { severity: 'desc' },
      take: 3,
      select: { title: true, severity: true },
    });

    // Build email data
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const emailData: CriticalHealthEmailData = {
      userName: user.name || 'Project Lead',
      projectName: project.name,
      projectUrl: `${appUrl}/pm/projects/${project.id}`,
      healthScore: payload.score,
      healthLevel: payload.level,
      explanation: payload.explanation,
      topRisks: topRisks.map((r) => ({
        title: r.title,
        severity: r.severity,
      })),
      managePreferencesUrl: `${appUrl}/settings/notifications`,
    };

    // Render email templates
    let html = '';
    let text = '';

    if (this.criticalHealthTemplate) {
      html = this.criticalHealthTemplate(emailData);
    } else {
      // Fallback HTML
      html = this.buildFallbackCriticalHealthEmail(emailData);
    }

    if (this.criticalHealthTextTemplate) {
      text = this.criticalHealthTextTemplate(emailData);
    }

    // Send email
    try {
      await this.emailService.sendEmail({
        to: user.email,
        subject: `[CRITICAL] Project Health Alert: ${project.name}`,
        html,
        text,
      });

      this.logger.log(`Critical health email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send critical health email to ${user.email}`, error);
    }
  }

  /**
   * Build fallback HTML email if template is not available
   */
  private buildFallbackCriticalHealthEmail(data: CriticalHealthEmailData): string {
    const risksHtml = data.topRisks.length > 0
      ? data.topRisks.map((r) => `<li><strong>[${r.severity}]</strong> ${r.title}</li>`).join('')
      : '<li>No active risks</li>';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Critical Health Alert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .alert { background: #fee2e2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #dc2626; }
    .alert h2 { color: #dc2626; margin: 0 0 8px 0; }
    .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <h1>Critical Health Alert</h1>
  <p>Hello ${data.userName},</p>
  <p>The project <strong>${data.projectName}</strong> has dropped to CRITICAL health status.</p>

  <div class="alert">
    <h2>Health Score: ${data.healthScore}/100</h2>
    <p>${data.explanation}</p>
  </div>

  <h3>Top Risks:</h3>
  <ul>${risksHtml}</ul>

  <p>Please review the project and address any blocking issues.</p>

  <a href="${data.projectUrl}" class="btn">View Project</a>

  <div class="footer">
    <p>You're receiving this because you're the project lead. <a href="${data.managePreferencesUrl}">Manage notification preferences</a></p>
  </div>
</body>
</html>
    `;
  }
}
