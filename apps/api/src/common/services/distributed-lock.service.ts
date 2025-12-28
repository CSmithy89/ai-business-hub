import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Options for acquiring a distributed lock
 */
export interface LockOptions {
  /** Lock timeout in milliseconds (default: 30000ms = 30 seconds) */
  ttl?: number;
  /** Time to wait for lock in milliseconds (default: 0 = no wait) */
  waitTimeout?: number;
  /** Retry interval when waiting for lock in milliseconds (default: 100ms) */
  retryInterval?: number;
}

/**
 * Lock result containing the lock key and release function
 */
export interface LockResult {
  /** Whether the lock was acquired */
  acquired: boolean;
  /** Unique lock value (used for safe release) */
  lockValue?: string;
  /** Release the lock */
  release: () => Promise<boolean>;
}

/**
 * Distributed Lock Service using Redis
 *
 * Provides distributed locking for cron jobs and other operations
 * that should only run on a single instance in a multi-instance deployment.
 *
 * Uses Redis SET with NX and EX options for atomic lock acquisition.
 * Implements safe release using Lua script to prevent releasing other instances' locks.
 */
@Injectable()
export class DistributedLockService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DistributedLockService.name);
  private redis: Redis | null = null;
  private readonly PREFIX = 'lock:';
  private readonly DEFAULT_TTL_MS = 30000; // 30 seconds
  private readonly DEFAULT_RETRY_INTERVAL = 100; // 100ms

  // Lua script for safe lock release (only release if we own the lock)
  private readonly RELEASE_SCRIPT = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  // Lua script for lock extension (only extend if we own the lock)
  private readonly EXTEND_SCRIPT = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("pexpire", KEYS[1], ARGV[2])
    else
      return 0
    end
  `;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');

    try {
      this.redis = new Redis({
        host,
        port,
        password: password || undefined,
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) return null; // Stop retrying after 3 attempts
          return Math.min(times * 100, 3000);
        },
      });

      await this.redis.connect();
      this.logger.log('Distributed lock service connected to Redis');
    } catch (error) {
      this.logger.warn(
        `Failed to connect to Redis for distributed locking: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      this.redis = null;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Distributed lock service disconnected from Redis');
    }
  }

  /**
   * Check if distributed locking is available
   */
  isAvailable(): boolean {
    return this.redis !== null && this.redis.status === 'ready';
  }

  /**
   * Acquire a distributed lock
   *
   * @param key - Lock key (will be prefixed with 'lock:')
   * @param options - Lock options
   * @returns Lock result with release function
   */
  async acquireLock(key: string, options: LockOptions = {}): Promise<LockResult> {
    const ttl = options.ttl ?? this.DEFAULT_TTL_MS;
    const waitTimeout = options.waitTimeout ?? 0;
    const retryInterval = options.retryInterval ?? this.DEFAULT_RETRY_INTERVAL;

    const lockKey = this.PREFIX + key;
    const lockValue = this.generateLockValue();

    const startTime = Date.now();

    // Create release function bound to this lock
    const release = async (): Promise<boolean> => {
      return this.releaseLock(lockKey, lockValue);
    };

    // If Redis is not available, return a no-op lock (fail-open strategy)
    if (!this.isAvailable()) {
      this.logger.warn(`Redis unavailable, allowing operation without lock: ${key}`);
      return {
        acquired: true,
        lockValue,
        release: async () => true,
      };
    }

    // Try to acquire lock
    do {
      try {
        // SET key value NX PX ttl
        const result = await this.redis!.set(lockKey, lockValue, 'PX', ttl, 'NX');

        if (result === 'OK') {
          this.logger.debug(`Lock acquired: ${key} (TTL: ${ttl}ms)`);
          return {
            acquired: true,
            lockValue,
            release,
          };
        }
      } catch (error) {
        this.logger.error(`Error acquiring lock ${key}:`, error);
        // Fail-open: allow operation if Redis fails
        return {
          acquired: true,
          lockValue,
          release: async () => true,
        };
      }

      // If we should wait, sleep and retry
      if (waitTimeout > 0 && Date.now() - startTime < waitTimeout) {
        await this.sleep(retryInterval);
      }
    } while (waitTimeout > 0 && Date.now() - startTime < waitTimeout);

    // Lock not acquired
    this.logger.debug(`Lock not acquired (already held): ${key}`);
    return {
      acquired: false,
      release: async () => false,
    };
  }

  /**
   * Release a lock (internal method - use the release function from LockResult)
   */
  private async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return true;
    }

    try {
      const result = await this.redis!.eval(this.RELEASE_SCRIPT, 1, lockKey, lockValue);
      const released = result === 1;

      if (released) {
        this.logger.debug(`Lock released: ${lockKey.replace(this.PREFIX, '')}`);
      }

      return released;
    } catch (error) {
      this.logger.error(`Error releasing lock ${lockKey}:`, error);
      return false;
    }
  }

  /**
   * Extend a lock's TTL
   *
   * @param key - Lock key
   * @param lockValue - Lock value from LockResult
   * @param ttl - New TTL in milliseconds
   * @returns Whether the lock was extended
   */
  async extendLock(key: string, lockValue: string, ttl: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return true;
    }

    const lockKey = this.PREFIX + key;

    try {
      const result = await this.redis!.eval(this.EXTEND_SCRIPT, 1, lockKey, lockValue, ttl);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error extending lock ${key}:`, error);
      return false;
    }
  }

  /**
   * Execute a function with a distributed lock
   *
   * @param key - Lock key
   * @param fn - Function to execute
   * @param options - Lock options
   * @returns Result of the function, or null if lock not acquired
   */
  async withLock<T>(
    key: string,
    fn: () => Promise<T>,
    options: LockOptions = {},
  ): Promise<{ success: boolean; result?: T; error?: Error }> {
    const lock = await this.acquireLock(key, options);

    if (!lock.acquired) {
      return { success: false };
    }

    try {
      const result = await fn();
      return { success: true, result };
    } catch (error) {
      return {
        success: true, // Lock was acquired, but function failed
        error: error instanceof Error ? error : new Error(String(error)),
      };
    } finally {
      await lock.release();
    }
  }

  /**
   * Generate a unique lock value (used to ensure we only release our own locks)
   */
  private generateLockValue(): string {
    // Combine timestamp, random number, and process ID for uniqueness
    return `${Date.now()}-${Math.random().toString(36).slice(2)}-${process.pid}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
