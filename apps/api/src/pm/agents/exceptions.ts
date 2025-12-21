/**
 * PM Agent Exceptions
 *
 * Structured exception types for PM agent services.
 * Provides specific error types for better error handling and debugging.
 */

import {
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Base exception for PM agent errors
 */
export class PmAgentException extends HttpException {
  constructor(
    message: string,
    public readonly code: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(
      {
        statusCode: status,
        message,
        error: code,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}

/**
 * Project not found exception
 */
export class ProjectNotFoundException extends NotFoundException {
  constructor(projectId: string) {
    super({
      statusCode: HttpStatus.NOT_FOUND,
      message: `Project not found: ${projectId}`,
      error: 'PROJECT_NOT_FOUND',
    });
  }
}

/**
 * Risk not found exception
 */
export class RiskNotFoundException extends NotFoundException {
  constructor(riskId: string) {
    super({
      statusCode: HttpStatus.NOT_FOUND,
      message: `Risk not found: ${riskId}`,
      error: 'RISK_NOT_FOUND',
    });
  }
}

/**
 * Report not found exception
 */
export class ReportNotFoundException extends NotFoundException {
  constructor(reportId: string) {
    super({
      statusCode: HttpStatus.NOT_FOUND,
      message: `Report not found: ${reportId}`,
      error: 'REPORT_NOT_FOUND',
    });
  }
}

/**
 * Schedule not found exception
 */
export class ScheduleNotFoundException extends NotFoundException {
  constructor(scheduleId: string) {
    super({
      statusCode: HttpStatus.NOT_FOUND,
      message: `Schedule not found: ${scheduleId}`,
      error: 'SCHEDULE_NOT_FOUND',
    });
  }
}

/**
 * Health check failed exception
 */
export class HealthCheckFailedException extends PmAgentException {
  constructor(projectId: string, reason: string) {
    super(
      `Health check failed for project ${projectId}: ${reason}`,
      'HEALTH_CHECK_FAILED',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Report generation failed exception
 */
export class ReportGenerationFailedException extends PmAgentException {
  constructor(projectId: string, reason: string) {
    super(
      `Report generation failed for project ${projectId}: ${reason}`,
      'REPORT_GENERATION_FAILED',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Invalid report type exception
 */
export class InvalidReportTypeException extends BadRequestException {
  constructor(reportType: string) {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message: `Invalid report type: ${reportType}`,
      error: 'INVALID_REPORT_TYPE',
    });
  }
}

/**
 * Invalid stakeholder type exception
 */
export class InvalidStakeholderTypeException extends BadRequestException {
  constructor(stakeholderType: string) {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message: `Invalid stakeholder type: ${stakeholderType}`,
      error: 'INVALID_STAKEHOLDER_TYPE',
    });
  }
}

/**
 * Risk already resolved exception
 */
export class RiskAlreadyResolvedException extends BadRequestException {
  constructor(riskId: string) {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message: `Risk is already resolved: ${riskId}`,
      error: 'RISK_ALREADY_RESOLVED',
    });
  }
}

/**
 * Workspace access denied exception
 */
export class WorkspaceAccessDeniedException extends ForbiddenException {
  constructor(workspaceId: string) {
    super({
      statusCode: HttpStatus.FORBIDDEN,
      message: `Access denied to workspace: ${workspaceId}`,
      error: 'WORKSPACE_ACCESS_DENIED',
    });
  }
}

/**
 * Project access denied exception
 */
export class ProjectAccessDeniedException extends ForbiddenException {
  constructor(projectId: string) {
    super({
      statusCode: HttpStatus.FORBIDDEN,
      message: `Access denied to project: ${projectId}`,
      error: 'PROJECT_ACCESS_DENIED',
    });
  }
}

/**
 * AI service unavailable exception
 */
export class AiServiceUnavailableException extends PmAgentException {
  constructor(service: string, reason?: string) {
    super(
      `AI service unavailable: ${service}${reason ? ` - ${reason}` : ''}`,
      'AI_SERVICE_UNAVAILABLE',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

/**
 * Invalid schedule configuration exception
 */
export class InvalidScheduleConfigException extends BadRequestException {
  constructor(reason: string) {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message: `Invalid schedule configuration: ${reason}`,
      error: 'INVALID_SCHEDULE_CONFIG',
    });
  }
}
