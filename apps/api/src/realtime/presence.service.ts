import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisProvider, RedisClient } from '../events/redis.provider';
import { PrismaService } from '../common/services/prisma.service';
import { PresenceUser, PresenceLocation } from '@hyvve/shared';

/**
 * PresenceService - Real-time presence tracking with Redis
 *
 * Manages user presence across projects using Redis sorted sets and hashes.
 * Presence data auto-expires after configurable TTL (default 5 minutes).
 *
 * Architecture:
 * - Sorted set: presence:project:${projectId} (score = timestamp, member = userId)
 * - Hash: presence:user:${userId}:project:${projectId}:location (page, taskId, timestamp)
 * - TTL: Configurable via PRESENCE_TTL_SECONDS env var (default 300s)
 *
 * @see Story PM-06.2: Presence Indicators
 * @see ADR-PM06-004: Presence Tracking with Redis
 */
@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);
  private redis: RedisClient;

  // Presence TTL configuration (configurable via environment)
  private readonly PRESENCE_TTL_SECONDS: number;
  private readonly PRESENCE_TTL_MS: number;

  constructor(
    private readonly redisProvider: RedisProvider,
    private readonly prisma: PrismaService,
  ) {
    this.redis = this.redisProvider.getClient();
    // Initialize TTL from environment (default: 5 minutes)
    this.PRESENCE_TTL_SECONDS = parseInt(process.env.PRESENCE_TTL_SECONDS || '300', 10);
    this.PRESENCE_TTL_MS = this.PRESENCE_TTL_SECONDS * 1000;
  }

  /**
   * Update user presence in a project
   * Called on heartbeat (every 30 seconds) and on location changes
   *
   * @param userId - User ID
   * @param projectId - Project ID
   * @param location - User location (page, taskId)
   */
  async updatePresence(
    userId: string,
    projectId: string,
    location: PresenceLocation,
  ): Promise<void> {
    try {
      const now = Date.now();
      const presenceKey = `presence:project:${projectId}`;
      const locationKey = `presence:user:${userId}:project:${projectId}:location`;

      // Add user to project presence sorted set (score = timestamp)
      await this.redis.zadd(presenceKey, now, userId);

      // Update user location in hash (project-scoped to support multi-project presence)
      await this.redis.hset(locationKey, {
        page: location.page,
        taskId: location.taskId || '',
        timestamp: new Date().toISOString(),
      });

      // Set TTL on location key (auto-expire if user disconnects)
      await this.redis.expire(locationKey, this.PRESENCE_TTL_SECONDS);

      this.logger.debug(
        `Updated presence: user=${userId} project=${projectId} page=${location.page}`,
      );
    } catch (error) {
      this.logger.error('Failed to update presence in Redis', {
        userId,
        projectId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw - presence is non-critical, graceful degradation
    }
  }

  /**
   * Get active users for a project
   * Returns users who have been active in the last 5 minutes
   *
   * @param projectId - Project ID
   * @returns Array of active users with location data
   */
  async getProjectPresence(projectId: string): Promise<PresenceUser[]> {
    try {
      const now = Date.now();
      const cutoffTime = now - this.PRESENCE_TTL_MS;
      const presenceKey = `presence:project:${projectId}`;

      // Get active users from sorted set (within TTL window)
      const userIds = await this.redis.zrangebyscore(presenceKey, cutoffTime, now);

      if (!userIds || userIds.length === 0) {
        return [];
      }

      // Get locations from Redis for all users (project-scoped keys)
      const locationResults = await Promise.all(
        userIds.map(async (userId) => {
          try {
            const locationKey = `presence:user:${userId}:project:${projectId}:location`;
            const location = await this.redis.hgetall(locationKey);
            return { userId, location };
          } catch (error) {
            this.logger.warn(`Failed to get location for user ${userId}`, {
              error: error instanceof Error ? error.message : String(error),
            });
            return { userId, location: null };
          }
        }),
      );

      // Filter users with valid location data
      const validUserLocations = locationResults.filter(
        (result): result is { userId: string; location: Record<string, string> } =>
          result.location !== null && typeof result.location.page === 'string'
      );

      if (validUserLocations.length === 0) {
        return [];
      }

      // Batch query: Get all user details in a single database call
      const userDetails = await this.prisma.user.findMany({
        where: { id: { in: validUserLocations.map((r) => r.userId) } },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });

      // Create a lookup map for user details
      const userMap = new Map(userDetails.map((u) => [u.id, u]));

      // Map to presence users
      const users: PresenceUser[] = [];
      for (const { userId, location } of validUserLocations) {
        const user = userMap.get(userId);
        if (!user) {
          continue;
        }

        users.push({
          userId: user.id,
          userName: user.name || user.email,
          userAvatar: user.image,
          location: {
            page: location.page as 'overview' | 'tasks' | 'settings' | 'docs',
            ...(location.taskId ? { taskId: location.taskId } : {}),
          },
          lastSeen: location.timestamp,
        });
      }

      return users;
    } catch (error) {
      this.logger.error('Failed to get project presence', {
        projectId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Return empty array on error (graceful degradation)
      return [];
    }
  }

  /**
   * Get active users for a task (optional, for future use)
   *
   * @param taskId - Task ID
   * @returns Array of active users viewing this task
   */
  async getTaskPresence(taskId: string): Promise<PresenceUser[]> {
    try {
      // Get projectId from task
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
        select: { projectId: true },
      });

      if (!task) {
        return [];
      }

      // Get all users in project
      const projectUsers = await this.getProjectPresence(task.projectId);

      // Filter to users viewing this specific task
      return projectUsers.filter((user) => user.location.taskId === taskId);
    } catch (error) {
      this.logger.error('Failed to get task presence', {
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Remove user presence from a project
   * Called when user leaves project page or disconnects
   *
   * @param userId - User ID
   * @param projectId - Project ID
   */
  async removePresence(userId: string, projectId: string): Promise<void> {
    try {
      const presenceKey = `presence:project:${projectId}`;
      const locationKey = `presence:user:${userId}:project:${projectId}:location`;

      // Remove from sorted set
      await this.redis.zrem(presenceKey, userId);

      // Delete location key (only for this project, preserves other project presence)
      await this.redis.del(locationKey);

      this.logger.debug(`Removed presence: user=${userId} project=${projectId}`);
    } catch (error) {
      this.logger.error('Failed to remove presence', {
        userId,
        projectId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw - TTL will handle cleanup
    }
  }

  /**
   * Cleanup stale presence entries for a project
   * Removes entries older than 5 minutes
   *
   * @param projectId - Project ID
   */
  async cleanupStalePresence(projectId: string): Promise<void> {
    try {
      const now = Date.now();
      const cutoffTime = now - this.PRESENCE_TTL_MS;
      const presenceKey = `presence:project:${projectId}`;

      // Remove entries older than TTL
      const removed = await this.redis.zremrangebyscore(presenceKey, 0, cutoffTime);

      if (removed > 0) {
        this.logger.debug(`Cleaned up ${removed} stale presence entries for project ${projectId}`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup stale presence', {
        projectId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Cron job to cleanup stale presence entries across all projects
   * Runs every 5 minutes to remove inactive users from presence tracking
   *
   * Scans Redis for all presence:project:* keys and cleans up each one.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handlePresenceCleanupCron(): Promise<void> {
    try {
      this.logger.debug('Running presence cleanup cron job');

      // Scan for all presence:project:* keys
      const pattern = 'presence:project:*';
      const keys: string[] = [];

      // Use SCAN to iterate through keys (memory-efficient)
      let cursor = '0';
      do {
        const result = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = result[0];
        keys.push(...result[1]);
      } while (cursor !== '0');

      if (keys.length === 0) {
        this.logger.debug('No presence keys found to cleanup');
        return;
      }

      // Extract projectIds and cleanup each
      const now = Date.now();
      const cutoffTime = now - this.PRESENCE_TTL_MS;
      let totalRemoved = 0;

      for (const key of keys) {
        try {
          const removed = await this.redis.zremrangebyscore(key, 0, cutoffTime);
          totalRemoved += removed;
        } catch (error) {
          this.logger.warn(`Failed to cleanup presence key ${key}`, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      if (totalRemoved > 0) {
        this.logger.log(`Presence cleanup: removed ${totalRemoved} stale entries from ${keys.length} projects`);
      }
    } catch (error) {
      this.logger.error('Failed to run presence cleanup cron', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
