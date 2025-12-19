import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsDateString,
  MaxLength,
} from 'class-validator';

/**
 * Validation constants for time tracking
 */
export const TIME_TRACKING_CONSTANTS = {
  MIN_HOURS: 0.25, // 15 minutes minimum
  MAX_HOURS: 24, // 24 hours maximum per entry
  MAX_DESCRIPTION_LENGTH: 500,
} as const;

export class StartTimerDto {
  @ApiProperty({ description: 'Task ID to start timer for' })
  @IsString()
  taskId!: string;

  @ApiPropertyOptional({ description: 'Description of work being done' })
  @IsOptional()
  @IsString()
  @MaxLength(TIME_TRACKING_CONSTANTS.MAX_DESCRIPTION_LENGTH)
  description?: string;
}

export class StopTimerDto {
  @ApiProperty({ description: 'Task ID to stop timer for' })
  @IsString()
  taskId!: string;
}

export class LogTimeDto {
  @ApiProperty({ description: 'Task ID to log time for' })
  @IsString()
  taskId!: string;

  @ApiProperty({
    description: 'Hours to log (minimum 0.25h, maximum 24h)',
    minimum: TIME_TRACKING_CONSTANTS.MIN_HOURS,
    maximum: TIME_TRACKING_CONSTANTS.MAX_HOURS,
  })
  @IsNumber()
  @Min(TIME_TRACKING_CONSTANTS.MIN_HOURS, {
    message: 'Minimum time is 0.25 hours (15 minutes)',
  })
  @Max(TIME_TRACKING_CONSTANTS.MAX_HOURS, {
    message: 'Maximum time per entry is 24 hours',
  })
  hours!: number;

  @ApiPropertyOptional({ description: 'Description of work done' })
  @IsOptional()
  @IsString()
  @MaxLength(TIME_TRACKING_CONSTANTS.MAX_DESCRIPTION_LENGTH)
  description?: string;

  @ApiPropertyOptional({
    description: 'Date for the entry (ISO format YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class SuggestTimeEntriesDto {
  @ApiProperty({ description: 'Project ID to analyze' })
  @IsString()
  projectId!: string;

  @ApiProperty({ description: 'User ID to analyze activity for' })
  @IsString()
  userId!: string;
}

export class TimeEntryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  taskId!: string;

  @ApiProperty()
  userId!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  startTime!: Date;

  @ApiPropertyOptional()
  endTime?: Date;

  @ApiProperty()
  duration!: number;

  @ApiProperty()
  isTimer!: boolean;

  @ApiProperty()
  createdAt!: Date;
}
