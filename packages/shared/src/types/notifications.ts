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
  // PM-12.3: Additional notification types for Pulse and Herald agents
  RISK_DETECTED = 'project.risk_detected',
  RISK_RESOLVED = 'project.risk_resolved',
  REPORT_GENERATED = 'project.report_generated',
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

/**
 * Notification DTO - individual notification response
 */
export interface NotificationDto {
  id: string;
  userId: string;
  workspaceId: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Notification list response (paginated)
 */
export interface NotificationListResponse {
  data: NotificationDto[];
  meta: PaginationMeta;
}

/**
 * Unread count response
 */
export interface UnreadCountResponse {
  count: number;
  byType: Record<string, number>;
}

/**
 * Mark as read response
 */
export interface MarkReadResponse {
  id: string;
  readAt: string;
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse {
  updated: number;
}

/**
 * Notification filters for list query
 */
export interface NotificationFilters {
  type?: string;
  read?: boolean;
  workspaceId?: string;
}

/**
 * Digest notification group - notifications grouped by type within a project
 */
export interface DigestTypeGroup {
  type: PMNotificationType;
  count: number;
  notifications: NotificationDto[];
}

/**
 * Digest notification group - grouped notifications by project and type
 */
export interface DigestNotificationGroup {
  projectId: string;
  projectName: string;
  groups: DigestTypeGroup[];
}

/**
 * Digest email data - data passed to email template
 */
export interface DigestEmailData {
  userName: string;
  totalCount: number;
  dateRange: {
    from: string;
    to: string;
  };
  projectGroups: DigestNotificationGroup[];
  viewAllUrl: string;
  managePreferencesUrl: string;
  unsubscribeUrl: string;
}
