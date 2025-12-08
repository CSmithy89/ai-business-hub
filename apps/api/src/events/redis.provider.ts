import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

/**
 * RedisProvider - Provides direct access to Redis client for stream operations
 *
 * Reuses the Redis connection established by BullMQ to avoid creating
 * duplicate connections. This provider gives access to the underlying
 * ioredis client for Redis Streams commands (XADD, XREADGROUP, XINFO, etc.)
 *
 * @example
 * ```typescript
 * constructor(private readonly redisProvider: RedisProvider) {}
 *
 * async publishEvent() {
 *   const redis = this.redisProvider.getClient();
 *   await redis.xadd('hyvve:events:main', '*', 'data', JSON.stringify(event));
 * }
 * ```
 */
@Injectable()
export class RedisProvider implements OnModuleInit {
  private readonly logger = new Logger(RedisProvider.name);
  private redis: any;

  constructor(@InjectQueue('event-retry') private eventRetryQueue: Queue) {}

  async onModuleInit() {
    // Verify Redis connection on startup
    try {
      // BullMQ exposes a lazily created ioredis client as a Promise
      this.redis = await this.eventRetryQueue.client;
      await this.redis.ping();
      this.logger.log('Redis connection verified for event streams');
    } catch (error) {
      this.logger.error('Failed to connect to Redis for event streams', error);
      throw error;
    }
  }

  /**
   * Get the Redis client for stream operations
   * @returns Redis client instance (ioredis)
   * @throws Error if client is not initialized
   */
  getClient(): any {
    if (!this.redis) {
      throw new Error(
        'Redis client is not initialized. Ensure RedisProvider.onModuleInit() has completed before calling getClient().',
      );
    }
    return this.redis;
  }
}
