import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

type RedisClient = Awaited<Queue['client']>;

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
  isLimited: boolean;
}

/**
 * RateLimitService
 *
 * Provides sliding window rate limiting using Redis.
 * Tracks API requests per API key and enforces configurable rate limits.
 *
 * Story: PM-11.5 - API Rate Limiting & Governance
 */
@Injectable()
export class RateLimitService implements OnModuleInit {
  private readonly logger = new Logger(RateLimitService.name);
  private redis: RedisClient | null = null;
  private readonly keyPrefix = 'hyvve:ratelimit:';

  constructor(@InjectQueue('event-retry') private eventRetryQueue: Queue) {}

  async onModuleInit() {
    try {
      this.redis = await this.eventRetryQueue.client;
      this.logger.log('Rate limit service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize rate limit service', error);
      throw error;
    }
  }

  /**
   * Check and increment rate limit for an API key
   *
   * Uses sliding window algorithm with Redis sorted sets:
   * - Store timestamps of requests in a sorted set
   * - Remove expired entries
   * - Count remaining entries
   * - Add new entry if under limit
   *
   * @param apiKeyId - API key ID
   * @param limit - Maximum requests per hour
   * @returns Rate limit information
   */
  async checkRateLimit(apiKeyId: string, limit: number): Promise<RateLimitInfo> {
    if (!this.redis) {
      this.logger.error('Redis client not initialized');
      // Fail open - allow request but log error
      return {
        limit,
        remaining: limit,
        reset: this.getNextHourTimestamp(),
        isLimited: false,
      };
    }

    const now = Date.now();
    const windowStart = now - 3600000; // 1 hour ago in milliseconds
    const key = `${this.keyPrefix}${apiKeyId}`;

    try {
      // Lua script for atomic rate limit check and increment
      // This prevents race conditions when multiple requests arrive simultaneously
      const luaScript = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local window_start = tonumber(ARGV[2])
        local limit = tonumber(ARGV[3])
        local ttl = tonumber(ARGV[4])

        -- Remove expired entries
        redis.call('ZREMRANGEBYSCORE', key, 0, window_start)

        -- Count current requests in window
        local current = redis.call('ZCARD', key)

        -- Calculate reset time (next hour boundary)
        local reset = math.ceil(now / 3600000) * 3600000

        if current < limit then
          -- Add new request timestamp
          redis.call('ZADD', key, now, now)
          -- Set expiry on the key (2 hours to be safe)
          redis.call('EXPIRE', key, ttl)
          return {limit, limit - current - 1, reset, 0}
        else
          -- Rate limit exceeded
          return {limit, 0, reset, 1}
        end
      `;

      const result = await this.redis.eval(
        luaScript,
        1,
        key,
        now.toString(),
        windowStart.toString(),
        limit.toString(),
        '7200', // 2 hours in seconds
      ) as number[];

      return {
        limit: result[0],
        remaining: result[1],
        reset: Math.floor(result[2] / 1000), // Convert to seconds
        isLimited: result[3] === 1,
      };
    } catch (error) {
      this.logger.error({
        message: 'Failed to check rate limit',
        apiKeyId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Fail open - allow request but log error
      return {
        limit,
        remaining: limit,
        reset: this.getNextHourTimestamp(),
        isLimited: false,
      };
    }
  }

  /**
   * Get current usage count for an API key
   *
   * @param apiKeyId - API key ID
   * @returns Number of requests in current window
   */
  async getCurrentUsage(apiKeyId: string): Promise<number> {
    if (!this.redis) {
      return 0;
    }

    const now = Date.now();
    const windowStart = now - 3600000; // 1 hour ago
    const key = `${this.keyPrefix}${apiKeyId}`;

    try {
      // Remove expired entries
      await this.redis.zremrangebyscore(key, 0, windowStart);

      // Count current requests
      return await this.redis.zcard(key);
    } catch (error) {
      this.logger.error({
        message: 'Failed to get current usage',
        apiKeyId,
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  /**
   * Reset rate limit for an API key (admin function)
   *
   * @param apiKeyId - API key ID
   */
  async resetRateLimit(apiKeyId: string): Promise<void> {
    if (!this.redis) {
      return;
    }

    const key = `${this.keyPrefix}${apiKeyId}`;

    try {
      await this.redis.del(key);
      this.logger.log(`Rate limit reset for API key: ${apiKeyId}`);
    } catch (error) {
      this.logger.error({
        message: 'Failed to reset rate limit',
        apiKeyId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get the next hour boundary as Unix timestamp in seconds
   */
  private getNextHourTimestamp(): number {
    const now = Date.now();
    const nextHour = Math.ceil(now / 3600000) * 3600000;
    return Math.floor(nextHour / 1000);
  }
}
