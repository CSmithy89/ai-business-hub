import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

type RedisClient = Awaited<Queue['client']>;

/**
 * RedisLockService
 *
 * Provides distributed locking using Redis SET NX PX pattern.
 * Used to prevent race conditions when multiple API instances
 * execute the same scheduled workflow.
 *
 * Story: PM-10.2 - Trigger Conditions (Race condition fix)
 */
@Injectable()
export class RedisLockService implements OnModuleInit {
  private readonly logger = new Logger(RedisLockService.name);
  private redis: RedisClient | null = null;
  private readonly lockPrefix = 'hyvve:lock:';

  constructor(
    @InjectQueue('workflow-scheduler') private schedulerQueue: Queue,
  ) {}

  async onModuleInit() {
    try {
      this.redis = await this.schedulerQueue.client;
      this.logger.log('Redis lock service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Redis lock service', error);
      throw error;
    }
  }

  /**
   * Acquire a distributed lock
   *
   * @param key - Lock key (will be prefixed with 'hyvve:lock:')
   * @param ttlMs - Lock time-to-live in milliseconds (default: 60000 = 1 minute)
   * @returns Lock token if acquired, null if lock is already held
   */
  async acquireLock(key: string, ttlMs: number = 60000): Promise<string | null> {
    if (!this.redis) {
      this.logger.error('Redis client not initialized');
      return null;
    }

    const lockKey = `${this.lockPrefix}${key}`;
    const lockToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      // SET key value NX PX milliseconds
      // NX = only set if not exists
      // PX = set expiry in milliseconds
      const result = await this.redis.set(lockKey, lockToken, 'PX', ttlMs, 'NX');

      if (result === 'OK') {
        this.logger.debug(`Lock acquired: ${lockKey}`);
        return lockToken;
      }

      this.logger.debug(`Lock already held: ${lockKey}`);
      return null;
    } catch (error) {
      this.logger.error({
        message: 'Failed to acquire lock',
        key: lockKey,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Release a distributed lock
   *
   * Uses a Lua script to ensure we only release our own lock
   * (prevents releasing a lock that was acquired by another process
   * after our lock expired).
   *
   * @param key - Lock key (will be prefixed with 'hyvve:lock:')
   * @param token - Lock token returned by acquireLock
   * @returns true if lock was released, false otherwise
   */
  async releaseLock(key: string, token: string): Promise<boolean> {
    if (!this.redis) {
      this.logger.error('Redis client not initialized');
      return false;
    }

    const lockKey = `${this.lockPrefix}${key}`;

    // Lua script to atomically check and delete lock
    // Only deletes if the token matches (our lock)
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    try {
      const result = await this.redis.eval(luaScript, 1, lockKey, token);

      if (result === 1) {
        this.logger.debug(`Lock released: ${lockKey}`);
        return true;
      }

      this.logger.debug(`Lock not held or token mismatch: ${lockKey}`);
      return false;
    } catch (error) {
      this.logger.error({
        message: 'Failed to release lock',
        key: lockKey,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Execute a function with a distributed lock
   *
   * Acquires the lock, executes the function, and releases the lock.
   * If the lock cannot be acquired, returns null.
   *
   * @param key - Lock key
   * @param fn - Function to execute with lock held
   * @param ttlMs - Lock time-to-live in milliseconds
   * @returns Result of function or null if lock not acquired
   */
  async withLock<T>(
    key: string,
    fn: () => Promise<T>,
    ttlMs: number = 60000,
  ): Promise<T | null> {
    const token = await this.acquireLock(key, ttlMs);

    if (!token) {
      return null;
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(key, token);
    }
  }
}
