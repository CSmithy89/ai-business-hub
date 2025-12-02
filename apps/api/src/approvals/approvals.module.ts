import { Module } from '@nestjs/common';
import { ConfidenceCalculatorService } from './services/confidence-calculator.service';

/**
 * ApprovalsModule - Approval Queue System
 *
 * Provides confidence-based approval routing and queue management.
 * Core services:
 * - ConfidenceCalculatorService: Calculate confidence scores and routing recommendations
 *
 * Future additions:
 * - ApprovalsService: Create and manage approval items
 * - ApprovalRouterService: Route items based on confidence
 */
@Module({
  providers: [ConfidenceCalculatorService],
  exports: [ConfidenceCalculatorService],
})
export class ApprovalsModule {}
