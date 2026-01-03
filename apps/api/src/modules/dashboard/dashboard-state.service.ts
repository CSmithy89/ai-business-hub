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

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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

    try {
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
      const data = await this.redis.get(key);

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
      const deleted = await this.redis.del(key);
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
