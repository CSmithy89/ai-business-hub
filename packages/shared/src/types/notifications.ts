/**
 * Notification preference types for PM module
 */

/**
 * PM notification types
 */
export enum PMNotificationType {
  TASK_ASSIGNED = 'task.assigned',
  TASK_MENTIONED = 'task.mentioned',
  DUE_DATE_REMINDER = 'task.due_date_reminder',
  AGENT_COMPLETION = 'agent.task_completed',
  HEALTH_ALERT = 'project.health_alert',
}

/**
 * Notification delivery channels
 */
export enum NotificationChannel {
  EMAIL = 'email',
  IN_APP = 'in_app',
  PUSH = 'push', // Future support
}

/**
 * Email digest frequency options
 */
export type DigestFrequency = 'daily' | 'weekly';

/**
 * Quiet hours configuration
 */
export interface QuietHoursConfig {
  start: string; // HH:MM format
  end: string; // HH:MM format
  timezone: string; // IANA timezone (e.g., "America/Los_Angeles")
}

/**
 * Full notification preference DTO
 */
export interface NotificationPreferenceDto {
  id: string;
  userId: string;

  // Platform notification preferences
  emailApprovals: boolean;
  emailWorkspaceInvites: boolean;
  emailAgentErrors: boolean;
  emailDigest: string;

  inAppApprovals: boolean;
  inAppWorkspaceInvites: boolean;
  inAppAgentUpdates: boolean;

  // PM-specific email preferences
  emailTaskAssigned: boolean;
  emailTaskMentioned: boolean;
  emailDueDateReminder: boolean;
  emailAgentCompletion: boolean;
  emailHealthAlert: boolean;

  // PM-specific in-app preferences
  inAppTaskAssigned: boolean;
  inAppTaskMentioned: boolean;
  inAppDueDateReminder: boolean;
  inAppAgentCompletion: boolean;
  inAppHealthAlert: boolean;

  // Quiet hours
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  quietHoursTimezone: string;

  // Digest settings
  digestEnabled: boolean;
  digestFrequency: DigestFrequency;

  createdAt: string;
  updatedAt: string;
}

/**
 * Partial update DTO for notification preferences
 */
export type UpdateNotificationPreferenceDto = Partial<
  Omit<NotificationPreferenceDto, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;
