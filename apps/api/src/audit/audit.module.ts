import { Module } from '@nestjs/common'
import { AuditService } from './audit.service'
import { AuditController } from './audit.controller'
import { CommonModule } from '../common/common.module'

/**
 * AuditModule - Provides audit logging functionality
 *
 * Exports AuditService for use in other modules to log
 * permission-related changes and provides API endpoints
 * for viewing audit logs.
 */
@Module({
  imports: [CommonModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
