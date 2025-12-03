import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Body,
  Logger,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BaseEvent } from '@hyvve/shared';
import { RedisProvider } from './redis.provider';
import { EventRetryService } from './event-retry.service';
import { EventReplayService } from './event-replay.service';
import { PrismaService } from '../common/services/prisma.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { STREAMS, CONSUMER_GROUP } from './constants/streams.constants';
import { PaginationDto } from './dto/pagination.dto';
import { ReplayEventsDto } from './dto/replay-events.dto';

/**
 * Response structure for event bus health check
 */
interface EventHealthResponse {
  healthy: boolean;
  timestamp: string;
  streams: {
    main: StreamHealth;
    dlq: StreamHealth;
  };
}

interface StreamHealth {
  exists: boolean;
  consumerGroup?: {
    name: string;
    consumers: number;
    pending: number;
    lastDeliveredId: string;
  };
  length?: number;
  error?: string;
}

/**
 * EventsController - Health check and admin endpoints for event bus
 *
 * Provides:
 * - Health check endpoints to verify Redis Streams status
 * - Dead letter queue (DLQ) management for admin users
 */
@ApiTags('events')
@Controller()
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(
    private readonly redisProvider: RedisProvider,
    private readonly eventRetryService: EventRetryService,
    private readonly eventReplayService: EventReplayService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Health check endpoint for event bus
   *
   * Returns detailed information about:
   * - Stream existence and length
   * - Consumer group status
   * - Pending event counts
   *
   * @returns Event bus health status
   */
  @Get('health/events')
  @ApiOperation({ summary: 'Event bus health check' })
  @ApiResponse({
    status: 200,
    description: 'Event bus is healthy',
    schema: {
      type: 'object',
      properties: {
        healthy: { type: 'boolean' },
        timestamp: { type: 'string' },
        streams: {
          type: 'object',
          properties: {
            main: { type: 'object' },
            dlq: { type: 'object' },
          },
        },
      },
    },
  })
  async checkEventsHealth(): Promise<EventHealthResponse> {
    const redis = this.redisProvider.getClient();

    try {
      // Check main event stream
      const mainHealth = await this.checkStreamHealth(
        redis,
        STREAMS.MAIN,
        CONSUMER_GROUP,
      );

      // Check DLQ stream
      const dlqHealth = await this.checkStreamHealth(
        redis,
        STREAMS.DLQ,
        CONSUMER_GROUP,
      );

      const isHealthy = mainHealth.exists && dlqHealth.exists;

      return {
        healthy: isHealthy,
        timestamp: new Date().toISOString(),
        streams: {
          main: mainHealth,
          dlq: dlqHealth,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error checking event bus health', error);
      return {
        healthy: false,
        timestamp: new Date().toISOString(),
        streams: {
          main: { exists: false, error: errorMessage },
          dlq: { exists: false, error: errorMessage },
        },
      };
    }
  }

  /**
   * Check health of a specific stream and its consumer group
   * @private
   */
  private async checkStreamHealth(
    redis: any,
    streamName: string,
    consumerGroup: string,
  ): Promise<StreamHealth> {
    try {
      // Check if stream exists
      const exists = await redis.exists(streamName);
      if (!exists) {
        return { exists: false };
      }

      // Get stream length
      const length = await redis.xlen(streamName);

      // Get consumer group info
      const groupsInfo = (await redis.xinfo(
        'GROUPS',
        streamName,
      )) as unknown as any[][];

      // Parse consumer group info
      // XINFO GROUPS returns: [[name, group-name, consumers, N, pending, N, ...], ...]
      let consumerGroupInfo = null;
      for (let i = 0; i < groupsInfo.length; i++) {
        const group = groupsInfo[i];
        const groupData: Record<string, any> = {};

        // Convert flat array to object
        for (let j = 0; j < group.length; j += 2) {
          groupData[group[j] as string] = group[j + 1];
        }

        if (groupData.name === consumerGroup) {
          consumerGroupInfo = {
            name: groupData.name,
            consumers: groupData.consumers || 0,
            pending: groupData.pending || 0,
            lastDeliveredId: groupData['last-delivered-id'] || '0-0',
          };
          break;
        }
      }

      return {
        exists: true,
        length,
        consumerGroup: consumerGroupInfo || undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error checking stream health for ${streamName}`,
        error,
      );
      return {
        exists: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get dead letter queue events
   *
   * Returns paginated list of failed events in the DLQ with error details.
   * Admin-only endpoint for monitoring and troubleshooting.
   *
   * @param query - Pagination parameters
   * @returns List of DLQ events with metadata
   */
  @Get('admin/events/dlq')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dead letter queue events' })
  @ApiResponse({
    status: 200,
    description: 'List of DLQ events',
    schema: {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              streamId: { type: 'string' },
              event: { type: 'object' },
              error: { type: 'string' },
              errorStack: { type: 'string' },
              movedAt: { type: 'string' },
              attempts: { type: 'number' },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async getDLQEvents(@Query() query: PaginationDto) {
    const redis = this.redisProvider.getClient();

    try {
      // Read from DLQ stream with pagination
      const events = await redis.xrange(
        STREAMS.DLQ,
        '-',
        '+',
        'COUNT',
        query.limit ?? 50,
      );

      return {
        events: events.map(([id, fields]: [string, string[]]) => ({
          streamId: id,
          event: JSON.parse(fields[1]),
          error: fields[3],
          errorStack: fields[5],
          movedAt: fields[7],
          attempts: parseInt(fields[9], 10),
        })),
        total: await redis.xlen(STREAMS.DLQ),
        page: query.page ?? 1,
        limit: query.limit ?? 50,
      };
    } catch (error) {
      this.logger.error('Error reading DLQ events', error);
      throw error;
    }
  }

  /**
   * Retry an event from DLQ
   *
   * Manually retry a failed event from the dead letter queue.
   * Creates a new event with a fresh retry cycle and removes from DLQ.
   * Admin-only operation for intervention after issues are resolved.
   *
   * @param eventId - The event ID to retry
   * @returns Success response with new event ID
   */
  @Post('admin/events/dlq/:eventId/retry')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retry an event from DLQ' })
  @ApiResponse({
    status: 200,
    description: 'Event moved back to main stream',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        newEventId: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found in DLQ',
  })
  async retryDLQEvent(@Param('eventId') eventId: string) {
    try {
      const newEventId = await this.eventRetryService.retryFromDLQ(eventId);
      return {
        success: true,
        newEventId,
        message: 'Event moved back to main stream for reprocessing',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error retrying event from DLQ', error);
      throw error;
    }
  }

  /**
   * Permanently delete an event from DLQ
   *
   * Remove an event from the dead letter queue permanently.
   * Use this when the event is no longer needed or cannot be fixed.
   * Admin-only operation for cleanup.
   *
   * @param eventId - The event ID to delete
   * @returns Success response
   */
  @Delete('admin/events/dlq/:eventId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Permanently delete an event from DLQ' })
  @ApiResponse({
    status: 200,
    description: 'Event deleted from DLQ',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found in DLQ',
  })
  async deleteDLQEvent(@Param('eventId') eventId: string) {
    const redis = this.redisProvider.getClient();

    try {
      // Find event in DLQ stream
      const events = await redis.xrange(STREAMS.DLQ, '-', '+');
      const eventEntry = events.find(([_, fields]: [string, string[]]) => {
        try {
          const event = JSON.parse(fields[1]) as BaseEvent;
          return event.id === eventId;
        } catch {
          return false;
        }
      });

      if (!eventEntry) {
        throw new NotFoundException(`Event ${eventId} not found in DLQ`);
      }

      // Delete from Redis
      await redis.xdel(STREAMS.DLQ, eventEntry[0]);

      // Update metadata
      await this.prisma.eventMetadata.update({
        where: { eventId },
        data: {
          status: 'FAILED',
          lastError: 'Manually deleted from DLQ',
        },
      });

      this.logger.log({
        message: 'Event deleted from DLQ',
        eventId,
      });

      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error deleting event from DLQ', error);
      throw error;
    }
  }

  // ============================================
  // Event Replay Endpoints (Story 05-6)
  // ============================================

  /**
   * Start an event replay job
   *
   * Replays historical events from a specified time range.
   * Events can be filtered by type and tenant.
   * Replayed events are marked with __replay: true flag.
   *
   * @param body - Replay options
   * @returns Job ID for tracking
   */
  @Post('admin/events/replay')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start event replay job' })
  @ApiResponse({
    status: 201,
    description: 'Replay job started',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        status: { type: 'string' },
        estimatedEvents: { type: 'number' },
      },
    },
  })
  async startReplay(@Body() body: ReplayEventsDto) {
    this.logger.log({
      message: 'Starting event replay',
      startTime: body.startTime,
      endTime: body.endTime,
      eventTypes: body.eventTypes,
      tenantId: body.tenantId,
    });

    return this.eventReplayService.startReplay(body);
  }

  /**
   * Get replay job status
   *
   * Returns the current status and progress of a replay job.
   *
   * @param jobId - The job ID to check
   * @returns Job status and progress
   */
  @Get('admin/events/replay/:jobId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get replay job status' })
  @ApiResponse({
    status: 200,
    description: 'Replay job status',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        status: { type: 'string' },
        progress: { type: 'number' },
        eventsReplayed: { type: 'number' },
        totalEvents: { type: 'number' },
        errors: { type: 'number' },
        startedAt: { type: 'string' },
        completedAt: { type: 'string' },
        errorMessage: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Replay job not found',
  })
  async getReplayStatus(@Param('jobId') jobId: string) {
    return this.eventReplayService.getReplayStatus(jobId);
  }
}
