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
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentWorkspace } from '../common/decorators/current-workspace.decorator';
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
 * Parsed DLQ event structure
 */
interface ParsedDLQEvent {
  streamId: string;
  event: unknown;
  error: string | null;
  errorStack: string | null;
  movedAt: string | null;
  attempts: number;
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
  @UseGuards(AuthGuard, TenantGuard, RolesGuard)
  @Roles('admin', 'owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dead letter queue events for current workspace' })
  @ApiResponse({
    status: 200,
    description: 'List of DLQ events filtered by tenant',
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
  async getDLQEvents(
    @Query() query: PaginationDto,
    @CurrentWorkspace() workspaceId: string,
  ) {
    const redis = this.redisProvider.getClient();

    try {
      const limit = query.limit ?? 50;
      const page = query.page ?? 1;

      // Fetch all DLQ events (we filter by tenant, so can't pre-paginate efficiently)
      // Note: For large DLQs, consider adding tenant-specific DLQ streams in future
      const allEvents = await redis.xrange(STREAMS.DLQ, '-', '+');

      // Parse and filter by tenant
      const tenantEvents: ParsedDLQEvent[] = [];
      for (const [id, fields] of allEvents as [string, string[]][]) {
        try {
          // Convert flat field array to key-value map
          const fieldMap: Record<string, string> = {};
          for (let i = 0; i < fields.length; i += 2) {
            fieldMap[fields[i]] = fields[i + 1];
          }

          const event = JSON.parse(fieldMap.event || '{}') as BaseEvent;

          // Filter by tenant (workspaceId)
          if (event.tenantId !== workspaceId) {
            continue;
          }

          tenantEvents.push({
            streamId: id,
            event,
            error: fieldMap.error || null,
            errorStack: fieldMap.errorStack || fieldMap.error_stack || null,
            movedAt: fieldMap.movedAt || fieldMap.moved_at || null,
            attempts: fieldMap.attempts ? parseInt(fieldMap.attempts, 10) : 0,
          });
        } catch (err) {
          this.logger.warn(`Failed to parse DLQ event ${id}: ${err}`);
        }
      }

      // Apply pagination to filtered results
      const total = tenantEvents.length;
      const skipCount = (page - 1) * limit;
      const paginatedEvents = tenantEvents.slice(skipCount, skipCount + limit);

      return {
        events: paginatedEvents,
        total,
        page,
        limit,
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
  @UseGuards(AuthGuard, TenantGuard, RolesGuard)
  @Roles('admin', 'owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retry an event from DLQ (tenant-scoped)' })
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
  async retryDLQEvent(
    @Param('eventId') eventId: string,
    @CurrentWorkspace() workspaceId: string,
  ) {
    try {
      // Verify event belongs to current tenant before retrying
      await this.verifyEventTenantOwnership(eventId, workspaceId);

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
  @UseGuards(AuthGuard, TenantGuard, RolesGuard)
  @Roles('admin', 'owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Permanently delete an event from DLQ (tenant-scoped)' })
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
  async deleteDLQEvent(
    @Param('eventId') eventId: string,
    @CurrentWorkspace() workspaceId: string,
  ) {
    const redis = this.redisProvider.getClient();

    try {
      // Verify event belongs to current tenant before deleting
      await this.verifyEventTenantOwnership(eventId, workspaceId);

      // Find event in DLQ stream
      const events = await redis.xrange(STREAMS.DLQ, '-', '+');
      const eventEntry = events.find(([_, fields]: [string, string[]]) => {
        try {
          // Parse fields safely
          const fieldMap: Record<string, string> = {};
          for (let i = 0; i < fields.length; i += 2) {
            fieldMap[fields[i]] = fields[i + 1];
          }
          const event = JSON.parse(fieldMap.event || '{}') as BaseEvent;
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
        tenantId: workspaceId,
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

  /**
   * Verify that an event belongs to the current tenant
   *
   * Checks EventMetadata to ensure the event's tenantId matches
   * the current workspace context.
   *
   * @param eventId - The event ID to verify
   * @param workspaceId - The current workspace (tenant) ID
   * @throws NotFoundException if event not found
   * @throws ForbiddenException if event belongs to different tenant
   */
  private async verifyEventTenantOwnership(
    eventId: string,
    workspaceId: string,
  ): Promise<void> {
    const metadata = await this.prisma.eventMetadata.findUnique({
      where: { eventId },
      select: { tenantId: true },
    });

    if (!metadata) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    if (metadata.tenantId !== workspaceId) {
      throw new NotFoundException(`Event ${eventId} not found in DLQ`);
      // Note: We throw NotFoundException instead of ForbiddenException
      // to avoid leaking information about events from other tenants
    }
  }

  // ============================================
  // Event Stats Endpoint (Story 05-7)
  // ============================================

  /**
   * Get event bus statistics
   *
   * Returns throughput metrics, DLQ size, and consumer group lag
   * for the event bus monitoring dashboard.
   *
   * @returns Event bus statistics
   */
  @Get('admin/events/stats')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get event bus statistics' })
  @ApiResponse({
    status: 200,
    description: 'Event bus statistics',
    schema: {
      type: 'object',
      properties: {
        mainStream: {
          type: 'object',
          properties: {
            length: { type: 'number' },
            firstEntryId: { type: 'string' },
            lastEntryId: { type: 'string' },
          },
        },
        dlq: {
          type: 'object',
          properties: {
            length: { type: 'number' },
          },
        },
        consumerGroup: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            pending: { type: 'number' },
            consumers: { type: 'number' },
            lag: { type: 'number' },
          },
        },
        throughput: {
          type: 'object',
          properties: {
            last24h: { type: 'number' },
            lastHour: { type: 'number' },
          },
        },
      },
    },
  })
  async getEventStats() {
    const redis = this.redisProvider.getClient();

    try {
      // Get main stream info
      let mainStreamInfo = {
        length: 0,
        firstEntryId: null as string | null,
        lastEntryId: null as string | null,
      };

      const mainExists = await redis.exists(STREAMS.MAIN);
      if (mainExists) {
        const streamInfo = (await redis.xinfo(
          'STREAM',
          STREAMS.MAIN,
        )) as Array<string | number | unknown>;
        // Parse stream info (flat array format)
        const infoObj: Record<string, unknown> = {};
        for (let i = 0; i < streamInfo.length; i += 2) {
          infoObj[String(streamInfo[i])] = streamInfo[i + 1];
        }
        mainStreamInfo = {
          length: infoObj.length as number,
          firstEntryId: infoObj['first-entry']
            ? (infoObj['first-entry'] as unknown[])[0] as string
            : null,
          lastEntryId: infoObj['last-entry']
            ? (infoObj['last-entry'] as unknown[])[0] as string
            : null,
        };
      }

      // Get DLQ length
      let dlqLength = 0;
      const dlqExists = await redis.exists(STREAMS.DLQ);
      if (dlqExists) {
        dlqLength = await redis.xlen(STREAMS.DLQ);
      }

      // Get consumer group info
      let consumerGroupInfo = {
        name: CONSUMER_GROUP,
        pending: 0,
        consumers: 0,
        lag: 0,
      };

      if (mainExists) {
        try {
          const groupsInfo = (await redis.xinfo(
            'GROUPS',
            STREAMS.MAIN,
          )) as unknown[][];
          for (const group of groupsInfo ?? []) {
            const groupData: Record<string, unknown> = {};
            for (let j = 0; j < group.length; j += 2) {
                groupData[String(group[j])] = group[j + 1];
            }
            if (groupData.name === CONSUMER_GROUP) {
              consumerGroupInfo = {
                name: CONSUMER_GROUP,
                pending: groupData.pending as number || 0,
                consumers: groupData.consumers as number || 0,
                lag: groupData.lag as number || 0,
              };
              break;
            }
          }
        } catch {
          // Consumer group may not exist yet
        }
      }

      // Calculate throughput from EventMetadata
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const [last24hCount, lastHourCount] = await Promise.all([
        this.prisma.eventMetadata.count({
          where: { createdAt: { gte: oneDayAgo } },
        }),
        this.prisma.eventMetadata.count({
          where: { createdAt: { gte: oneHourAgo } },
        }),
      ]);

      return {
        mainStream: mainStreamInfo,
        dlq: {
          length: dlqLength,
        },
        consumerGroup: consumerGroupInfo,
        throughput: {
          last24h: last24hCount,
          lastHour: lastHourCount,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching event stats', error);
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
