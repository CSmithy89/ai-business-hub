/**
 * Dashboard State Service
 *
 * Provides Redis-based persistence for dashboard state.
 * Enables cross-device state synchronization and recovery.
 *
 * Key Features:
 * - Save/get/delete dashboard state to Redis
 * - Conflict resolution for multi-device scenarios
 * - Configurable TTL (default 30 days)
 * - Fail-open pattern for Redis errors
 *
 * Story: DM-11.1 - Redis State Persistence
 */

import { Injectable, Logger, OnModuleInit, BadRequestException } from '@nestjs/common';
import { randomUUID, createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  SaveDashboardStateDto,
  SaveStateResponseDto,
  GetStateResponseDto,
  DeleteStateResponseDto,
  StoredStateData,
  ConflictResolution,
} from './dto/dashboard-state.dto';

type RedisClient = Awaited<Queue['client']>;

/** Default TTL: 30 days in seconds */
const DEFAULT_STATE_TTL_SECONDS = 30 * 24 * 60 * 60; // 2592000

/** Redis key prefix for dashboard state */
const KEY_PREFIX = 'hyvve:dashboard:state:';

/** Lock key prefix for distributed locking */
const LOCK_PREFIX = 'hyvve:dashboard:lock:';

/** Lock TTL in seconds (auto-expire to prevent deadlocks) */
const LOCK_TTL_SECONDS = 5;

/** Max lock acquisition attempts */
const LOCK_MAX_ATTEMPTS = 3;

/** Delay between lock attempts in ms */
const LOCK_RETRY_DELAY_MS = 100;

/**
 * CR-09: Redis retry configuration
 * Retry transient Redis failures with exponential backoff
 */
const REDIS_MAX_RETRIES = 3;
const REDIS_RETRY_BASE_DELAY_MS = 50;
const REDIS_RETRY_MAX_DELAY_MS = 500;

/**
 * Lua script for atomic check-and-set operation
 * Prevents TOCTOU race conditions in multi-device scenarios
 *
 * KEYS[1] = state key
 * ARGV[1] = new state JSON
 * ARGV[2] = client version
 * ARGV[3] = TTL in seconds
 *
 * Returns: JSON with result status
 * - { status: "success", version: N } - State saved
 * - { status: "conflict", serverVersion: N } - Server has newer version
 * - { status: "overwrite" } - Corrupted data was overwritten
 */
const ATOMIC_SAVE_SCRIPT = `
local key = KEYS[1]
local newStateJson = ARGV[1]
local clientVersion = tonumber(ARGV[2])
local ttlSeconds = tonumber(ARGV[3])

-- Get existing state
local existingJson = redis.call('GET', key)

if existingJson then
  -- Parse existing state
  local ok, existing = pcall(cjson.decode, existingJson)
  if ok and existing and existing.version then
    local serverVersion = tonumber(existing.version)
    -- Conflict: server version is newer
    if serverVersion > clientVersion then
      return cjson.encode({ status = 'conflict', serverVersion = serverVersion })
    end
  else
    -- Corrupted data, will overwrite
    redis.call('SET', key, newStateJson, 'EX', ttlSeconds)
    return cjson.encode({ status = 'overwrite' })
  end
end

-- Save new state with TTL
redis.call('SET', key, newStateJson, 'EX', ttlSeconds)
return cjson.encode({ status = 'success', version = clientVersion })
`;

/**
 * Lua script for safe lock release
 * Only releases lock if we still own it (prevents releasing another client's lock)
 *
 * KEYS[1] = lock key
 * ARGV[1] = lock ID (owner identifier)
 *
 * Returns: 1 if released, 0 if not owned
 */
const RELEASE_LOCK_SCRIPT = `
local key = KEYS[1]
local lockId = ARGV[1]

if redis.call('GET', key) == lockId then
  return redis.call('DEL', key)
else
  return 0
end
`;

@Injectable()
export class DashboardStateService implements OnModuleInit {
  private readonly logger = new Logger(DashboardStateService.name);
  private redis: RedisClient | null = null;
  private readonly stateTtlSeconds: number;

  constructor(
    @InjectQueue('event-retry') private eventRetryQueue: Queue,
    private readonly configService: ConfigService,
  ) {
    // Read TTL from environment variable (per DM-08 retrospective recommendation)
    const ttlEnv = this.configService.get<string>('REDIS_STATE_TTL');
    const parsedTtl = ttlEnv ? parseInt(ttlEnv, 10) : DEFAULT_STATE_TTL_SECONDS;

    // Reset to default if TTL is invalid (NaN or <= 0)
    if (Number.isNaN(parsedTtl) || parsedTtl <= 0) {
      this.logger.warn(
        `Invalid REDIS_STATE_TTL value '${ttlEnv}', using default: ${DEFAULT_STATE_TTL_SECONDS}`,
      );
      this.stateTtlSeconds = DEFAULT_STATE_TTL_SECONDS;
    } else {
      this.stateTtlSeconds = parsedTtl;
    }
  }

  async onModuleInit() {
    try {
      this.redis = await this.eventRetryQueue.client;
      await this.redis.ping();
      this.logger.log('Dashboard state service initialized with Redis');
    } catch (error) {
      this.logger.error('Failed to initialize Redis for dashboard state', error);
      // Don't throw - allow fail-open pattern
    }
  }

  /**
   * Generate Redis key for dashboard state
   * Pattern: hyvve:dashboard:state:{userId}:{workspaceId}
   */
  private getStateKey(userId: string, workspaceId: string): string {
    return `${KEY_PREFIX}${userId}:${workspaceId}`;
  }

  /**
   * Save dashboard state to Redis
   *
   * Implements conflict resolution:
   * - If serverVersion > clientVersion: return server state (conflict detected)
   * - If clientVersion >= serverVersion: save client state
   *
   * @param userId - User ID
   * @param workspaceId - Workspace ID
   * @param dto - State data to save
   * @returns Save result with conflict resolution info
   */
  async saveState(
    userId: string,
    workspaceId: string,
    dto: SaveDashboardStateDto,
  ): Promise<SaveStateResponseDto> {
    if (!this.redis) {
      this.logger.warn('Redis not available, state not persisted');
      return {
        success: false,
        serverVersion: dto.version,
      };
    }

    const key = this.getStateKey(userId, workspaceId);
    const lockKey = this.getLockKey(key);

    // Acquire distributed lock to prevent concurrent updates
    const lockId = await this.acquireLock(lockKey);
    if (!lockId) {
      this.logger.warn(`Could not acquire lock for ${key}, returning conflict`);
      return {
        success: false,
        serverVersion: dto.version,
        conflictResolution: 'server',
      };
    }

    try {
      // SECURITY: Validate checksum if provided to detect data corruption
      if (dto.checksum) {
        const expectedChecksum = this.computeChecksum(dto.state);
        if (dto.checksum !== expectedChecksum) {
          this.logger.warn({
            message: 'Checksum mismatch in dashboard state',
            userId,
            workspaceId,
            providedChecksum: dto.checksum,
            expectedChecksum,
          });
          throw new BadRequestException(
            'State checksum mismatch - data may be corrupted',
          );
        }
      }

      // Prepare state data
      const stateData: StoredStateData = {
        version: dto.version,
        state: dto.state,
        lastModified: new Date().toISOString(),
        checksum: dto.checksum,
      };

      // Use Lua script for atomic check-and-set (prevents TOCTOU race condition)
      const result = await this.redis.eval(
        ATOMIC_SAVE_SCRIPT,
        1, // Number of keys
        key, // KEYS[1]
        JSON.stringify(stateData), // ARGV[1]
        String(dto.version), // ARGV[2]
        String(this.stateTtlSeconds), // ARGV[3]
      );

      // Parse Lua script result
      interface LuaResult {
        status: 'success' | 'conflict' | 'overwrite';
        version?: number;
        serverVersion?: number;
      }
      const luaResult: LuaResult = JSON.parse(result as string);

      if (luaResult.status === 'conflict') {
        // Server version is newer - client should restore from server
        this.logger.debug(
          `Conflict detected for ${key}: server v${luaResult.serverVersion} > client v${dto.version}`,
        );
        return {
          success: false,
          serverVersion: luaResult.serverVersion ?? dto.version,
          conflictResolution: 'server',
        };
      }

      if (luaResult.status === 'overwrite') {
        this.logger.warn(`Corrupted state data for ${key}, overwrote`);
      }

      this.logger.debug(`Saved dashboard state for ${key} v${dto.version}`);

      return {
        success: true,
        serverVersion: dto.version,
        conflictResolution: luaResult.status === 'overwrite' ? undefined : 'client',
      };
    } catch (error) {
      this.logger.error({
        message: 'Failed to save dashboard state',
        userId,
        workspaceId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Fail open - report failure but don't break the app
      return {
        success: false,
        serverVersion: dto.version,
      };
    } finally {
      // Always release lock
      await this.releaseLock(lockKey, lockId);
    }
  }

  /**
   * Get dashboard state from Redis
   *
   * @param userId - User ID
   * @param workspaceId - Workspace ID
   * @returns State data or null if not found
   */
  async getState(
    userId: string,
    workspaceId: string,
  ): Promise<GetStateResponseDto | null> {
    if (!this.redis) {
      this.logger.warn('Redis not available, cannot retrieve state');
      return null;
    }

    const key = this.getStateKey(userId, workspaceId);

    try {
      // CR-09: Use retry logic for Redis GET
      const data = await this.withRedisRetry('getState', () =>
        this.redis!.get(key),
      );

      if (!data) {
        this.logger.debug(`No dashboard state found for ${key}`);
        return null;
      }

      const parsed: StoredStateData = JSON.parse(data);

      return {
        version: parsed.version,
        state: parsed.state,
        lastModified: parsed.lastModified,
      };
    } catch (error) {
      this.logger.error({
        message: 'Failed to get dashboard state',
        userId,
        workspaceId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Fail open - return null on error
      return null;
    }
  }

  /**
   * Delete dashboard state from Redis
   *
   * @param userId - User ID
   * @param workspaceId - Workspace ID
   * @returns Success status
   */
  async deleteState(
    userId: string,
    workspaceId: string,
  ): Promise<DeleteStateResponseDto> {
    if (!this.redis) {
      this.logger.warn('Redis not available, cannot delete state');
      return { success: false };
    }

    const key = this.getStateKey(userId, workspaceId);

    try {
      // CR-09: Use retry logic for Redis DEL
      const deleted = await this.withRedisRetry('deleteState', () =>
        this.redis!.del(key),
      );
      this.logger.debug(`Deleted dashboard state for ${key}: ${deleted > 0}`);

      return { success: deleted > 0 };
    } catch (error) {
      this.logger.error({
        message: 'Failed to delete dashboard state',
        userId,
        workspaceId,
        error: error instanceof Error ? error.message : String(error),
      });

      return { success: false };
    }
  }

  /**
   * Generate lock key for a state key
   */
  private getLockKey(stateKey: string): string {
    return `${LOCK_PREFIX}${stateKey}`;
  }

  /**
   * Acquire a distributed lock with retry
   *
   * Uses SETNX (SET if Not eXists) with TTL to prevent deadlocks.
   * Retries with exponential backoff if lock is held.
   *
   * @param lockKey - The lock key
   * @returns Lock ID if acquired, null if failed
   */
  private async acquireLock(lockKey: string): Promise<string | null> {
    if (!this.redis) {
      return null;
    }

    const lockId = randomUUID();

    for (let attempt = 1; attempt <= LOCK_MAX_ATTEMPTS; attempt++) {
      try {
        // SET key value NX EX seconds - atomic set-if-not-exists with expiry
        const result = await this.redis.set(
          lockKey,
          lockId,
          'EX',
          LOCK_TTL_SECONDS,
          'NX',
        );

        if (result === 'OK') {
          this.logger.debug(`Lock acquired: ${lockKey} (attempt ${attempt})`);
          return lockId;
        }

        // Lock is held by someone else, wait and retry
        if (attempt < LOCK_MAX_ATTEMPTS) {
          const delay = LOCK_RETRY_DELAY_MS * attempt; // Simple linear backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        this.logger.warn(`Lock acquisition error on attempt ${attempt}:`, error);
      }
    }

    this.logger.warn(`Failed to acquire lock after ${LOCK_MAX_ATTEMPTS} attempts: ${lockKey}`);
    return null;
  }

  /**
   * Release a distributed lock safely
   *
   * Uses Lua script to only release if we still own the lock.
   * This prevents releasing a lock that expired and was acquired by another client.
   *
   * @param lockKey - The lock key
   * @param lockId - Our lock ID
   */
  private async releaseLock(lockKey: string, lockId: string): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      const released = await this.redis.eval(
        RELEASE_LOCK_SCRIPT,
        1,
        lockKey,
        lockId,
      );

      if (released === 1) {
        this.logger.debug(`Lock released: ${lockKey}`);
      } else {
        this.logger.warn(`Lock already released or stolen: ${lockKey}`);
      }
    } catch (error) {
      this.logger.error(`Failed to release lock ${lockKey}:`, error);
    }
  }

  /**
   * Execute a Redis operation with retry logic (CR-09)
   *
   * Retries transient failures with exponential backoff.
   * Used to improve resilience against brief network issues or Redis hiccups.
   *
   * @param operation - Name for logging
   * @param fn - The Redis operation to execute
   * @returns The operation result, or throws after max retries
   */
  private async withRedisRetry<T>(
    operation: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= REDIS_MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if this is a retryable error (connection issues, timeouts)
        const isRetryable = this.isRetryableError(lastError);

        if (!isRetryable || attempt === REDIS_MAX_RETRIES) {
          this.logger.error({
            message: `Redis ${operation} failed after ${attempt} attempts`,
            error: lastError.message,
            retryable: isRetryable,
          });
          throw lastError;
        }

        // Exponential backoff with jitter
        const delay = Math.min(
          REDIS_RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 50,
          REDIS_RETRY_MAX_DELAY_MS,
        );

        this.logger.warn({
          message: `Redis ${operation} failed, retrying`,
          attempt,
          nextRetryMs: delay,
          error: lastError.message,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Should not reach here, but TypeScript needs this
    throw lastError ?? new Error(`Redis ${operation} failed`);
  }

  /**
   * Determine if a Redis error is retryable (CR-09)
   *
   * Retryable errors include:
   * - Connection errors (ECONNRESET, ETIMEDOUT, ECONNREFUSED)
   * - Cluster redirect errors (MOVED, ASK)
   * - Temporary server errors
   *
   * Non-retryable errors include:
   * - Invalid command errors
   * - Script errors (NOSCRIPT, WRONGTYPE)
   * - OOM errors
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    const name = error.name?.toLowerCase() ?? '';

    // Connection errors - retryable
    if (
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('etimedout') ||
      message.includes('epipe') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('socket')
    ) {
      return true;
    }

    // Redis cluster redirects - retryable
    if (message.includes('moved') || message.includes('ask')) {
      return true;
    }

    // Temporary errors - retryable
    if (
      message.includes('busy') ||
      message.includes('loading') ||
      message.includes('tryagain')
    ) {
      return true;
    }

    // Network/abort errors - retryable
    if (name.includes('abort') || name.includes('network')) {
      return true;
    }

    // Default: not retryable (script errors, invalid commands, OOM, etc.)
    return false;
  }

  /**
   * Compute SHA-256 checksum of state object
   *
   * Uses deterministic JSON stringification (sorted keys) to ensure
   * consistent checksums regardless of property order.
   *
   * @param state - State object to hash
   * @returns SHA-256 hash in hex format
   */
  private computeChecksum(state: Record<string, unknown>): string {
    // Sort keys for deterministic serialization
    const sortedJson = JSON.stringify(state, Object.keys(state).sort());
    return createHash('sha256').update(sortedJson).digest('hex');
  }

  /**
   * Resolve conflict between server and client state
   *
   * Resolution strategy:
   * 1. Higher version wins
   * 2. If versions equal, compare timestamps (newer wins)
   *
   * @param serverState - State from Redis
   * @param clientVersion - Client's version number
   * @param clientModifiedAt - Client's last modified timestamp
   * @returns Winner ('server' or 'client')
   */
  resolveConflict(
    serverState: StoredStateData,
    clientVersion: number,
    clientModifiedAt?: string,
  ): ConflictResolution {
    // Version-based resolution
    if (serverState.version > clientVersion) {
      return 'server';
    }
    if (clientVersion > serverState.version) {
      return 'client';
    }

    // Same version - timestamp comparison
    if (clientModifiedAt && serverState.lastModified) {
      const serverTime = new Date(serverState.lastModified).getTime();
      const clientTime = new Date(clientModifiedAt).getTime();

      if (serverTime > clientTime) {
        return 'server';
      }
    }

    // Default to client if timestamps equal or missing
    return 'client';
  }
}
