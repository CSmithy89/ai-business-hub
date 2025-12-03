import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { createId } from '@paralleldrive/cuid2';
import { PrismaService } from '../common/services/prisma.service';
import {
  ReplayEventsDto,
  ReplayJobStartedResponseDto,
  ReplayJobStatusResponseDto,
} from './dto/replay-events.dto';
import { QUEUE_EVENT_REPLAY } from './constants/streams.constants';

/**
 * Replay job data stored in Redis
 */
interface ReplayJobData {
  jobId: string;
  startTime: string;
  endTime: string;
  eventTypes?: string[];
  tenantId?: string;
}

/**
 * Replay job status stored in database
 */
interface ReplayJobRecord {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  eventsReplayed: number;
  totalEvents: number;
  errors: number;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  options: Record<string, unknown>;
}

/**
 * Event Replay Service
 *
 * Manages event replay jobs for re-processing historical events.
 * Uses BullMQ for async job processing.
 *
 * Story: 05-6 - Implement Event Replay
 */
@Injectable()
export class EventReplayService {
  private readonly logger = new Logger(EventReplayService.name);

  constructor(
    @InjectQueue(QUEUE_EVENT_REPLAY) private readonly replayQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Start a new event replay job
   *
   * @param options - Replay options (time range, filters)
   * @returns Job ID and initial status
   */
  async startReplay(
    options: ReplayEventsDto,
  ): Promise<ReplayJobStartedResponseDto> {
    const jobId = createId();

    this.logger.log({
      message: 'Starting event replay job',
      jobId,
      startTime: options.startTime,
      endTime: options.endTime,
      eventTypes: options.eventTypes,
      tenantId: options.tenantId,
    });

    // Create job record in database for tracking
    await this.prisma.$executeRaw`
      INSERT INTO "ReplayJob" (
        id, status, progress, "eventsReplayed", "totalEvents", errors,
        "startedAt", "completedAt", "errorMessage", options, "createdAt", "updatedAt"
      ) VALUES (
        ${jobId}, 'pending', 0, 0, 0, 0,
        NULL, NULL, NULL, ${JSON.stringify(options)}::jsonb, NOW(), NOW()
      )
    `;

    // Add job to BullMQ queue
    const jobData: ReplayJobData = {
      jobId,
      startTime: options.startTime,
      endTime: options.endTime,
      eventTypes: options.eventTypes,
      tenantId: options.tenantId,
    };

    await this.replayQueue.add('replay-events', jobData, {
      jobId,
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    return {
      jobId,
      status: 'pending',
    };
  }

  /**
   * Get the status of a replay job
   *
   * @param jobId - The job ID to check
   * @returns Current job status
   */
  async getReplayStatus(jobId: string): Promise<ReplayJobStatusResponseDto> {
    // Try to get from database first
    const result = await this.prisma.$queryRaw<ReplayJobRecord[]>`
      SELECT
        id, status, progress, "eventsReplayed", "totalEvents", errors,
        "startedAt", "completedAt", "errorMessage", options
      FROM "ReplayJob"
      WHERE id = ${jobId}
    `;

    if (!result || result.length === 0) {
      throw new NotFoundException(`Replay job ${jobId} not found`);
    }

    const job = result[0];

    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      eventsReplayed: job.eventsReplayed,
      totalEvents: job.totalEvents,
      errors: job.errors,
      startedAt: job.startedAt?.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      errorMessage: job.errorMessage ?? undefined,
    };
  }

  /**
   * Update replay job status (called by processor)
   */
  async updateJobStatus(
    jobId: string,
    update: Partial<{
      status: 'pending' | 'running' | 'completed' | 'failed';
      progress: number;
      eventsReplayed: number;
      totalEvents: number;
      errors: number;
      startedAt: Date;
      completedAt: Date;
      errorMessage: string;
    }>,
  ): Promise<void> {
    const setClauses: string[] = ['"updatedAt" = NOW()'];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (update.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(update.status);
    }
    if (update.progress !== undefined) {
      setClauses.push(`progress = $${paramIndex++}`);
      values.push(update.progress);
    }
    if (update.eventsReplayed !== undefined) {
      setClauses.push(`"eventsReplayed" = $${paramIndex++}`);
      values.push(update.eventsReplayed);
    }
    if (update.totalEvents !== undefined) {
      setClauses.push(`"totalEvents" = $${paramIndex++}`);
      values.push(update.totalEvents);
    }
    if (update.errors !== undefined) {
      setClauses.push(`errors = $${paramIndex++}`);
      values.push(update.errors);
    }
    if (update.startedAt !== undefined) {
      setClauses.push(`"startedAt" = $${paramIndex++}`);
      values.push(update.startedAt);
    }
    if (update.completedAt !== undefined) {
      setClauses.push(`"completedAt" = $${paramIndex++}`);
      values.push(update.completedAt);
    }
    if (update.errorMessage !== undefined) {
      setClauses.push(`"errorMessage" = $${paramIndex++}`);
      values.push(update.errorMessage);
    }

    values.push(jobId);

    await this.prisma.$executeRawUnsafe(
      `UPDATE "ReplayJob" SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      ...values,
    );
  }
}
