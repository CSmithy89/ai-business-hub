import { Module } from '@nestjs/common';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { ConfidenceCalculatorService } from './services/confidence-calculator.service';
import { ApprovalRouterService } from './services/approval-router.service';
import { EventBusService } from './stubs/event-bus.stub';
import { AuditLogService } from './stubs/audit-logger.stub';

/**
 * ApprovalsModule - Approval Queue System
 *
 * Provides confidence-based approval routing and queue management.
 * Core services:
 * - ConfidenceCalculatorService: Calculate confidence scores and routing recommendations
 * - ApprovalRouterService: Route items based on confidence (Story 04-3)
 * - ApprovalsService: Create and manage approval items
 * - EventBusService: Event emission (stub - Epic 05)
 * - AuditLogService: Audit logging (stub - Story 04-9)
 */
@Module({
  controllers: [ApprovalsController],
  providers: [
    ApprovalsService,
    ConfidenceCalculatorService,
    ApprovalRouterService,
    EventBusService,
    AuditLogService,
  ],
  exports: [
    ApprovalsService,
    ConfidenceCalculatorService,
    ApprovalRouterService,
  ],
})
export class ApprovalsModule {}
