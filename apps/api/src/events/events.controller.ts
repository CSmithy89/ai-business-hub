import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RedisProvider } from './redis.provider';
import { STREAMS, CONSUMER_GROUP } from './constants/streams.constants';

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
 * EventsController - Health check endpoints for event bus infrastructure
 *
 * Provides monitoring endpoints to verify Redis Streams health and status.
 */
@ApiTags('events')
@Controller('health')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(private readonly redisProvider: RedisProvider) {}

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
  @Get('events')
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
}
