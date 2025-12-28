import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/services/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { NotificationsService } from './notifications.service';
import {
  DigestNotificationGroup,
  DigestTypeGroup,
  DigestEmailData,
  NotificationDto,
  PMNotificationType,
} from '@hyvve/shared';
import { DateTime } from 'luxon';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as Handlebars from 'handlebars';

/**
 * DigestService handles email digest generation and sending
 *
 * This service aggregates unread notifications and sends them as a single summary email
 * based on user preferences (daily or weekly).
 */
@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);
  private readonly htmlTemplate: HandlebarsTemplateDelegate;
  private readonly textTemplate: HandlebarsTemplateDelegate;

  // Priority order for notification types in digest
  private readonly TYPE_PRIORITY: Record<PMNotificationType, number> = {
    [PMNotificationType.TASK_ASSIGNED]: 1,
    [PMNotificationType.TASK_MENTIONED]: 2,
    [PMNotificationType.DUE_DATE_REMINDER]: 3,
    [PMNotificationType.AGENT_COMPLETION]: 4,
    [PMNotificationType.HEALTH_ALERT]: 5,
    // PM-12.3: Additional notification types
    [PMNotificationType.RISK_DETECTED]: 6,
    [PMNotificationType.RISK_RESOLVED]: 7,
    [PMNotificationType.REPORT_GENERATED]: 8,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
  ) {
    // Validate JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required for digest unsubscribe tokens');
    }

    // Load and compile email templates with robust path resolution
    const templatesPath = this.resolveTemplatesPath();
    const htmlTemplateContent = readFileSync(join(templatesPath, 'digest-email.hbs'), 'utf-8');
    const textTemplateContent = readFileSync(join(templatesPath, 'digest-email.text.hbs'), 'utf-8');

    this.htmlTemplate = Handlebars.compile(htmlTemplateContent);
    this.textTemplate = Handlebars.compile(textTemplateContent);

    // Register Handlebars helpers
    this.registerHandlebarsHelpers();
  }

  /**
   * Resolve templates path with fallback for different build environments
   * Handles: development, webpack/esbuild builds, and custom paths
   */
  private resolveTemplatesPath(): string {
    // 1. Check environment variable (explicit override)
    if (process.env.EMAIL_TEMPLATES_PATH) {
      const envPath = process.env.EMAIL_TEMPLATES_PATH;
      if (existsSync(envPath)) {
        this.logger.debug(`Using templates path from env: ${envPath}`);
        return envPath;
      }
      this.logger.warn(`EMAIL_TEMPLATES_PATH ${envPath} does not exist, falling back`);
    }

    // 2. Try __dirname (works in development and some builds)
    const dirnamePath = join(__dirname, 'templates');
    if (existsSync(dirnamePath)) {
      this.logger.debug(`Using templates path from __dirname: ${dirnamePath}`);
      return dirnamePath;
    }

    // 3. Try relative to cwd (for bundled builds)
    const cwdPath = join(process.cwd(), 'apps/api/src/pm/notifications/templates');
    if (existsSync(cwdPath)) {
      this.logger.debug(`Using templates path from cwd: ${cwdPath}`);
      return cwdPath;
    }

    // 4. Try dist folder (for compiled builds)
    const distPath = join(process.cwd(), 'dist/apps/api/pm/notifications/templates');
    if (existsSync(distPath)) {
      this.logger.debug(`Using templates path from dist: ${distPath}`);
      return distPath;
    }

    // 5. Fail with helpful error
    throw new Error(
      `Email templates not found. Tried: ${dirnamePath}, ${cwdPath}, ${distPath}. ` +
      `Set EMAIL_TEMPLATES_PATH environment variable to specify the correct path.`
    );
  }

  /**
   * Process digest for a single user
   * This is called by the BullMQ job processor
   */
  async processUserDigest(userId: string): Promise<void> {
    try {
      this.logger.log(`Processing digest for user ${userId}`);

      // Get user preferences
      const preferences = await this.notificationsService.getUserPreferences(userId);

      // Check if digest is enabled
      if (!preferences.digestEnabled) {
        this.logger.debug(`Digest disabled for user ${userId}, skipping`);
        return;
      }

      // Check if user is in quiet hours
      if (this.notificationsService.isInQuietHours(preferences, new Date())) {
        this.logger.debug(`User ${userId} in quiet hours, skipping digest`);
        return;
      }

      // Get unread notifications since last digest
      const notifications = await this.getUnreadNotificationsSinceLastDigest(userId);

      // Skip if no unread notifications
      if (notifications.length === 0) {
        this.logger.debug(`No unread notifications for user ${userId}, skipping digest`);
        return;
      }

      // Group notifications by project and type
      const projectGroups = this.groupNotificationsByProject(notifications);

      // Generate digest content
      const digestData = await this.generateDigestContent(userId, projectGroups);

      // Send digest email
      await this.sendDigestEmail(userId, digestData);

      // Update lastDigestSentAt timestamp
      await this.updateLastDigestSentAt(userId);

      this.logger.log(
        `Digest sent successfully to user ${userId} (${notifications.length} notifications)`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error processing digest for user ${userId}: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Get unread notifications since last digest sent
   */
  async getUnreadNotificationsSinceLastDigest(userId: string): Promise<NotificationDto[]> {
    const preferences = await this.notificationsService.getUserPreferences(userId);

    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        readAt: null, // Unread only
        createdAt: {
          gt: preferences.lastDigestSentAt || new Date(0), // Since last digest or all time
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notifications.map((n) => ({
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
  }

  /**
   * Group notifications by project and then by type
   */
  groupNotificationsByProject(notifications: NotificationDto[]): DigestNotificationGroup[] {
    // Group by projectId (extract from link or data)
    const byProject = new Map<string, NotificationDto[]>();

    for (const notif of notifications) {
      const projectId = this.extractProjectId(notif);
      if (!byProject.has(projectId)) {
        byProject.set(projectId, []);
      }
      byProject.get(projectId)!.push(notif);
    }

    // For each project, group by type
    const result: DigestNotificationGroup[] = [];
    for (const [projectId, notifs] of byProject.entries()) {
      const byType = new Map<string, NotificationDto[]>();

      for (const notif of notifs) {
        if (!byType.has(notif.type)) {
          byType.set(notif.type, []);
        }
        byType.get(notif.type)!.push(notif);
      }

      const groups: DigestTypeGroup[] = Array.from(byType.entries())
        .map(([type, typeNotifications]) => ({
          type: type as PMNotificationType,
          count: typeNotifications.length,
          notifications: typeNotifications.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
        }))
        .sort((a, b) => {
          const priorityA = this.TYPE_PRIORITY[a.type] || 999;
          const priorityB = this.TYPE_PRIORITY[b.type] || 999;
          return priorityA - priorityB;
        });

      result.push({
        projectId,
        projectName: this.extractProjectName(notifs[0]),
        groups,
      });
    }

    // Sort projects by name
    return result.sort((a, b) => a.projectName.localeCompare(b.projectName));
  }

  /**
   * Generate digest content data for email template
   */
  async generateDigestContent(
    userId: string,
    projectGroups: DigestNotificationGroup[]
  ): Promise<DigestEmailData> {
    // Get user info (for display name)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    // Calculate total notification count
    const totalCount = projectGroups.reduce(
      (sum, group) => sum + group.groups.reduce((typeSum, typeGroup) => typeSum + typeGroup.count, 0),
      0
    );

    // Get date range
    const preferences = await this.notificationsService.getUserPreferences(userId);
    const fromDate = preferences.lastDigestSentAt || new Date(0);
    const toDate = new Date();

    // Generate URLs
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const unsubscribeToken = this.generateUnsubscribeToken(userId);

    return {
      userName: user?.email || 'User',
      totalCount,
      dateRange: {
        from: DateTime.fromJSDate(fromDate).toFormat('MMMM d, yyyy'),
        to: DateTime.fromJSDate(toDate).toFormat('MMMM d, yyyy'),
      },
      projectGroups,
      viewAllUrl: `${appUrl}/notifications`,
      managePreferencesUrl: `${appUrl}/settings/notifications`,
      unsubscribeUrl: `${appUrl}/digest/unsubscribe/${unsubscribeToken}`,
    };
  }

  /**
   * Send digest email to user
   */
  async sendDigestEmail(userId: string, digestData: DigestEmailData): Promise<void> {
    // Get user email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user || !user.email) {
      this.logger.warn(`Cannot send digest to user ${userId}: no email address`);
      return;
    }

    // Render email templates
    const html = this.htmlTemplate(digestData);
    const text = this.textTemplate(digestData);

    // Send email
    await this.emailService.sendEmail({
      to: user.email,
      subject: `Your Digest - ${digestData.totalCount} unread notifications`,
      html,
      text,
    });
  }

  /**
   * Update lastDigestSentAt timestamp after sending digest
   */
  async updateLastDigestSentAt(userId: string): Promise<void> {
    await this.prisma.notificationPreference.update({
      where: { userId },
      data: {
        lastDigestSentAt: new Date(),
      },
    });
  }

  /**
   * Generate unsubscribe token (JWT)
   */
  generateUnsubscribeToken(userId: string): string {
    return this.jwtService.sign(
      {
        userId,
        type: 'digest_unsubscribe',
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '7d',
      }
    );
  }

  /**
   * Verify unsubscribe token and validate userId exists
   */
  async verifyUnsubscribeToken(token: string): Promise<{ userId: string }> {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      if (decoded.type !== 'digest_unsubscribe') {
        throw new Error('Invalid token type');
      }

      const userId = decoded.userId;
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid userId in token');
      }

      // Verify user exists in database
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return { userId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Invalid unsubscribe token: ${errorMessage}`);
      throw new Error('Invalid or expired unsubscribe token');
    }
  }

  /**
   * Extract project ID from notification
   */
  private extractProjectId(notification: NotificationDto): string {
    // Try to extract from data
    if (notification.data && typeof notification.data === 'object') {
      const data = notification.data as { projectId?: string };
      if (data.projectId) {
        return data.projectId;
      }
    }

    // Try to extract from link (e.g., "/projects/proj-123/tasks/task-456")
    if (notification.link) {
      const match = notification.link.match(/\/projects\/([^/]+)/);
      if (match) {
        return match[1];
      }
    }

    // Fallback to "unknown"
    return 'unknown';
  }

  /**
   * Extract project name from notification
   */
  private extractProjectName(notification: NotificationDto): string {
    // Try to extract from data
    if (notification.data && typeof notification.data === 'object') {
      const data = notification.data as { projectName?: string };
      if (data.projectName) {
        return data.projectName;
      }
    }

    // Fallback
    return 'Unknown Project';
  }

  /**
   * Register Handlebars helpers
   */
  private registerHandlebarsHelpers(): void {
    // Format date helper
    Handlebars.registerHelper('formatDate', (date: string) => {
      return DateTime.fromISO(date).toFormat('MMM d, yyyy h:mm a');
    });

    // Format time ago helper
    Handlebars.registerHelper('timeAgo', (date: string) => {
      const dt = DateTime.fromISO(date);
      const diff = DateTime.now().diff(dt, ['days', 'hours', 'minutes']);

      if (diff.days >= 1) {
        return `${Math.floor(diff.days)} day${Math.floor(diff.days) !== 1 ? 's' : ''} ago`;
      } else if (diff.hours >= 1) {
        return `${Math.floor(diff.hours)} hour${Math.floor(diff.hours) !== 1 ? 's' : ''} ago`;
      } else {
        return `${Math.floor(diff.minutes)} minute${Math.floor(diff.minutes) !== 1 ? 's' : ''} ago`;
      }
    });

    // Format notification type helper
    Handlebars.registerHelper('formatType', (type: string) => {
      const typeLabels: Record<string, string> = {
        'task.assigned': 'Task Assigned',
        'task.mentioned': 'Mentioned in Comments',
        'task.due_date_reminder': 'Due Date Reminders',
        'agent.task_completed': 'Agent Completed',
        'project.health_alert': 'Health Alerts',
      };
      return typeLabels[type] || type;
    });
  }
}
