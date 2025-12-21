import { IsString, Matches } from 'class-validator';

// CUID pattern for Prisma-generated IDs
const CUID_PATTERN = /^c[a-z0-9]{24}$/;

/**
 * Validates projectId route parameter
 */
export class ProjectIdParamsDto {
  @IsString()
  @Matches(CUID_PATTERN, { message: 'projectId must be a valid CUID' })
  projectId!: string;
}

/**
 * Validates projectId and riskId route parameters
 */
export class ProjectRiskParamsDto {
  @IsString()
  @Matches(CUID_PATTERN, { message: 'projectId must be a valid CUID' })
  projectId!: string;

  @IsString()
  @Matches(CUID_PATTERN, { message: 'riskId must be a valid CUID' })
  riskId!: string;
}

/**
 * Validates projectId and reportId route parameters
 */
export class ProjectReportParamsDto {
  @IsString()
  @Matches(CUID_PATTERN, { message: 'projectId must be a valid CUID' })
  projectId!: string;

  @IsString()
  @Matches(CUID_PATTERN, { message: 'reportId must be a valid CUID' })
  reportId!: string;
}

/**
 * Validates phaseId route parameter
 */
export class PhaseIdParamsDto {
  @IsString()
  @Matches(CUID_PATTERN, { message: 'phaseId must be a valid CUID' })
  phaseId!: string;
}

/**
 * Validates checkpointId route parameter
 */
export class CheckpointIdParamsDto {
  @IsString()
  @Matches(CUID_PATTERN, { message: 'checkpointId must be a valid CUID' })
  checkpointId!: string;
}

/**
 * Validates schedule id route parameter (uses 'id' in route)
 */
export class ScheduleIdParamsDto {
  @IsString()
  @Matches(CUID_PATTERN, { message: 'id must be a valid CUID' })
  id!: string;
}
