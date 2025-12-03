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
import { QUEUE_EVENT_REPLAY, BULLMQ_CONFIG } from './constants/streams.constants';

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
    await this.prisma.replayJob.create({
      data: {
        id: jobId,
        status: 'PENDING',
        progress: 0,
        eventsReplayed: 0,
        totalEvents: 0,
        errors: 0,
        options: JSON.parse(JSON.stringify(options)),
      },
    });

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
      removeOnComplete: BULLMQ_CONFIG.JOBS_RETAIN_COMPLETED,
      removeOnFail: BULLMQ_CONFIG.JOBS_RETAIN_FAILED,
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
    const job = await this.prisma.replayJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Replay job ${jobId} not found`);
    }

    return {
      jobId: job.id,
      status: job.status.toLowerCase() as 'pending' | 'running' | 'completed' | 'failed',
      progress: job.progress,
      eventsReplayed: job.eventsReplayed,
      totalEvents: job.totalEvents,
      errors: job.errors,
      startedAt: job.startedAt ? new Date(job.startedAt).toISOString() : undefined,
      completedAt: job.completedAt ? new Date(job.completedAt).toISOString() : undefined,
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
    // Convert status to uppercase enum value if provided
    const data: Record<string, unknown> = {};

    if (update.status !== undefined) {
      data.status = update.status.toUpperCase();
    }
    if (update.progress !== undefined) {
      data.progress = update.progress;
    }
    if (update.eventsReplayed !== undefined) {
      data.eventsReplayed = update.eventsReplayed;
    }
    if (update.totalEvents !== undefined) {
      data.totalEvents = update.totalEvents;
    }
    if (update.errors !== undefined) {
      data.errors = update.errors;
    }
    if (update.startedAt !== undefined) {
      data.startedAt = update.startedAt;
    }
    if (update.completedAt !== undefined) {
      data.completedAt = update.completedAt;
    }
    if (update.errorMessage !== undefined) {
      data.errorMessage = update.errorMessage;
    }

    await this.prisma.replayJob.update({
      where: { id: jobId },
      data,
    });
  }
}
