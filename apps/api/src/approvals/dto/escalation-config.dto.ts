import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * EscalationConfigDto - Escalation configuration for a workspace
 *
 * Story 04-8: Implement Approval Escalation
 *
 * Configuration controls:
 * - enableEscalation: Master switch for escalation feature
 * - escalationCheckIntervalMinutes: How often to check for overdue approvals
 * - escalationTargetUserId: Default user to escalate to (fallback to admin/owner)
 * - enableEscalationNotifications: Whether to send notifications on escalation
 */
export class EscalationConfigDto {
  @IsBoolean()
  enableEscalation: boolean;

  @IsInt()
  @Min(5)
  escalationCheckIntervalMinutes: number;

  @IsOptional()
  @IsString()
  escalationTargetUserId?: string;

  @IsBoolean()
  enableEscalationNotifications: boolean;
}

/**
 * UpdateEscalationConfigDto - Partial update for escalation config
 */
export class UpdateEscalationConfigDto {
  @IsOptional()
  @IsBoolean()
  enableEscalation?: boolean;

  @IsOptional()
  @IsInt()
  @Min(5)
  escalationCheckIntervalMinutes?: number;

  @IsOptional()
  @IsString()
  escalationTargetUserId?: string | null;

  @IsOptional()
  @IsBoolean()
  enableEscalationNotifications?: boolean;
}
