import { Injectable, Logger } from '@nestjs/common';

/**
 * Parameters for logging approval decisions
 */
export interface AuditLogParams {
  workspaceId: string;
  userId: string;
  action: string;
  approvalId: string;
  metadata?: Record<string, any>;
}

/**
 * AuditLogService Stub - Placeholder for Story 04-9
 *
 * This is a temporary stub implementation for audit logging.
 * The full audit logging system will be enhanced in Story 04-9.
 *
 * TODO (Story 04-9):
 * - Replace with full AuditLogService implementation
 * - Add structured audit log persistence to audit_logs table
 * - Add audit log querying and reporting
 * - Add retention policies
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  /**
   * Log an approval decision (stub - logs to console)
   *
   * @param params - Audit log parameters
   */
  async logApprovalDecision(params: AuditLogParams): Promise<void> {
    this.logger.log({
      message: '[STUB] Audit log created',
      ...params,
      note: 'Full audit logging implementation coming in Story 04-9',
    });
  }
}
