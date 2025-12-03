import { IsDateString, IsOptional, IsArray, IsString } from 'class-validator';

/**
 * DTO for starting an event replay job
 *
 * Story: 05-6 - Implement Event Replay
 */
export class ReplayEventsDto {
  /**
   * Start time for replay range (ISO 8601 format)
   */
  @IsDateString()
  startTime!: string;

  /**
   * End time for replay range (ISO 8601 format)
   */
  @IsDateString()
  endTime!: string;

  /**
   * Optional: Filter by specific event types
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eventTypes?: string[];

  /**
   * Optional: Filter by specific tenant
   */
  @IsOptional()
  @IsString()
  tenantId?: string;
}

/**
 * Response when a replay job is started
 */
export class ReplayJobStartedResponseDto {
  /**
   * Unique job ID for tracking
   */
  jobId!: string;

  /**
   * Initial status
   */
  status!: 'pending' | 'running' | 'completed' | 'failed';

  /**
   * Estimated event count (if available)
   */
  estimatedEvents?: number;
}

/**
 * Response for replay job status
 */
export class ReplayJobStatusResponseDto {
  /**
   * Job ID
   */
  jobId!: string;

  /**
   * Current status
   */
  status!: 'pending' | 'running' | 'completed' | 'failed';

  /**
   * Progress percentage (0-100)
   */
  progress!: number;

  /**
   * Number of events replayed so far
   */
  eventsReplayed!: number;

  /**
   * Total events to replay
   */
  totalEvents!: number;

  /**
   * Number of errors encountered
   */
  errors!: number;

  /**
   * Job start time
   */
  startedAt?: string;

  /**
   * Job completion time
   */
  completedAt?: string;

  /**
   * Error message if failed
   */
  errorMessage?: string;
}
