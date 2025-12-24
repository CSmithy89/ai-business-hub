import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  Min,
  Max,
  ValidateNested,
  Matches,
} from 'class-validator';
import { WorkflowTriggerType } from '@prisma/client';
import { Type } from 'class-transformer';

/**
 * Trigger filter configuration
 * Defines conditions that must match for a workflow to trigger
 */
export class TriggerFiltersDto {
  /**
   * Filter by task status
   * Can be single value or array of values
   */
  @IsOptional()
  @IsString({ each: true })
  status?: string | string[];

  /**
   * Filter by specific phase ID
   */
  @IsOptional()
  @IsString()
  phaseId?: string;

  /**
   * Filter by specific assignee ID
   */
  @IsOptional()
  @IsString()
  assigneeId?: string;

  /**
   * Filter by task priority
   * Can be single value or array of values
   */
  @IsOptional()
  @IsString({ each: true })
  priority?: string | string[];

  /**
   * Filter by task type
   * Can be single value or array of values
   */
  @IsOptional()
  @IsString({ each: true })
  type?: string | string[];
}

/**
 * Complete trigger configuration
 * Includes trigger type, filters, and schedule settings
 */
export class TriggerConfigDto {
  /**
   * Type of trigger event
   */
  @IsEnum(WorkflowTriggerType)
  eventType!: WorkflowTriggerType;

  /**
   * Optional filter conditions
   * Only triggers when task matches these conditions
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => TriggerFiltersDto)
  filters?: TriggerFiltersDto;

  /**
   * Cron expression for CUSTOM_SCHEDULE triggers
   * Example: "0 9 * * *" (daily at 9am)
   * Validates basic cron format: minute hour day-of-month month day-of-week
   */
  @IsOptional()
  @IsString()
  @Matches(/^(\*|[0-9,\-/]+)\s+(\*|[0-9,\-/]+)\s+(\*|[0-9,\-/]+)\s+(\*|[0-9,\-/]+)\s+(\*|[0-9,\-/]+)$/, {
    message: 'schedule must be a valid cron expression (minute hour day month weekday)',
  })
  schedule?: string;

  /**
   * Days before due date for DUE_DATE_APPROACHING triggers
   * Default: 1 day
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  daysBeforeDue?: number;
}
