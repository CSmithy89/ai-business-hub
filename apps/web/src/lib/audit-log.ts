/**
 * Audit Logging Utility
 * Story 09-3: Security audit logging for 2FA events
 */

export type AuditEventType =
  | '2fa.setup.started'
  | '2fa.setup.completed'
  | '2fa.setup.failed'
  | '2fa.enabled'
  | '2fa.disabled'
  | '2fa.disable_failed'
  | '2fa.verification.success'
  | '2fa.verification.failed'
  | '2fa.backup_code.used'
  | '2fa.backup_code.regenerated'
  | '2fa.backup_code.regenerate_failed'
  | 'account.linked'
  | 'account.unlinked'
  | 'account.link_failed'
  | 'account.unlink_failed'

export interface AuditLogData {
  userId: string
  eventType: AuditEventType
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    // For now, just log to console
    // In production, this should write to a dedicated audit log table
    console.log('[AUDIT]', {
      timestamp: new Date().toISOString(),
      ...data,
    })

    // Future: Write to database audit_logs table
    // await prisma.auditLog.create({
    //   data: {
    //     userId: data.userId,
    //     eventType: data.eventType,
    //     ipAddress: data.ipAddress,
    //     userAgent: data.userAgent,
    //     metadata: data.metadata,
    //   },
    // })
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error('[AUDIT] Failed to create audit log:', error)
  }
}

/**
 * Get client IP address from request
 */
export function getClientIp(headers: Headers): string | undefined {
  return (
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('x-real-ip') ||
    undefined
  )
}

/**
 * Get user agent from request
 */
export function getUserAgent(headers: Headers): string | undefined {
  return headers.get('user-agent') || undefined
}
