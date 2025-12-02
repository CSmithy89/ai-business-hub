import { Module } from '@nestjs/common';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { ConfidenceCalculatorService } from './services/confidence-calculator.service';
import { EventBusService } from './stubs/event-bus.stub';
import { AuditLogService } from './stubs/audit-logger.stub';

/**
 * ApprovalsModule - Approval Queue System
 *
 * Provides confidence-based approval routing and queue management.
 * Core services:
 * - ConfidenceCalculatorService: Calculate confidence scores and routing recommendations
 * - ApprovalsService: Create and manage approval items
 * - EventBusService: Event emission (stub - Epic 05)
 * - AuditLogService: Audit logging (stub - Story 04-9)
 *
 * Future additions:
 * - ApprovalRouterService: Route items based on confidence
 */
@Module({
  controllers: [ApprovalsController],
  providers: [
    ApprovalsService,
    ConfidenceCalculatorService,
    EventBusService,
    AuditLogService,
  ],
  exports: [ApprovalsService, ConfidenceCalculatorService],
})
export class ApprovalsModule {}
