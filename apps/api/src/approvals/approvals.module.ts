import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { ConfidenceCalculatorService } from './services/confidence-calculator.service';
import { ApprovalRouterService } from './services/approval-router.service';
import { ApprovalEscalationService } from './services/approval-escalation.service';
import { EscalationSchedulerService } from './services/escalation-scheduler.service';
import { EscalationProcessor } from './processors/escalation.processor';
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
 * - ApprovalEscalationService: Escalate overdue approvals (Story 04-8)
 * - EventBusService: Event emission (stub - Epic 05)
 * - AuditLogService: Audit logging (stub - Story 04-9)
 *
 * Processors:
 * - EscalationProcessor: BullMQ processor for scheduled escalation checks (Story 04-8)
 */
@Module({
  imports: [
    // Register BullMQ queue for approval escalation (Story 04-8)
    BullModule.registerQueue({
      name: 'approval-escalation',
    }),
  ],
  controllers: [ApprovalsController],
  providers: [
    ApprovalsService,
    ConfidenceCalculatorService,
    ApprovalRouterService,
    ApprovalEscalationService,
    EscalationSchedulerService,
    EscalationProcessor,
    EventBusService,
    AuditLogService,
  ],
  exports: [
    ApprovalsService,
    ConfidenceCalculatorService,
    ApprovalRouterService,
    ApprovalEscalationService,
  ],
})
export class ApprovalsModule {}
