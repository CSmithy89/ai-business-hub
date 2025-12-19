import { Injectable, Logger } from '@nestjs/common';
import { RedisProvider, RedisClient } from '../events/redis.provider';
import { PrismaService } from '../common/services/prisma.service';
import { PresenceUser, PresenceLocation } from '@hyvve/shared';

/**
 * PresenceService - Real-time presence tracking with Redis
 *
 * Manages user presence across projects using Redis sorted sets and hashes.
 * Presence data auto-expires after 5 minutes of inactivity.
 *
 * Architecture:
 * - Sorted set: presence:project:${projectId} (score = timestamp, member = userId)
 * - Hash: presence:user:${userId}:location (projectId, page, taskId, timestamp)
 * - TTL: 5 minutes on location hash (auto-cleanup on disconnect)
 *
 * @see Story PM-06.2: Presence Indicators
 * @see ADR-PM06-004: Presence Tracking with Redis
 */
@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);
  private redis: RedisClient;

  constructor(
    private readonly redisProvider: RedisProvider,
    private readonly prisma: PrismaService,
  ) {
    this.redis = this.redisProvider.getClient();
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
      const locationKey = `presence:user:${userId}:location`;

      // Add user to project presence sorted set (score = timestamp)
      await this.redis.zadd(presenceKey, now, userId);

      // Update user location in hash
      await this.redis.hset(locationKey, {
        projectId,
        page: location.page,
        taskId: location.taskId || '',
        timestamp: new Date().toISOString(),
      });

      // Set 5-minute TTL on location key (auto-expire if user disconnects)
      await this.redis.expire(locationKey, 300);

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
      const fiveMinutesAgo = now - 300000; // 5 minutes in milliseconds
      const presenceKey = `presence:project:${projectId}`;

      // Get active users from sorted set (last 5 minutes)
      const userIds = await this.redis.zrangebyscore(presenceKey, fiveMinutesAgo, now);

      if (!userIds || userIds.length === 0) {
        return [];
      }

      // Get location and user details for each user
      const users = await Promise.all(
        userIds.map(async (userId) => {
          try {
            // Get location from Redis
            const locationKey = `presence:user:${userId}:location`;
            const location = await this.redis.hgetall(locationKey);

            // Skip if location data is missing (stale entry)
            if (!location || !location.page) {
              return null;
            }

            // Get user details from database
            const user = await this.prisma.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            });

            if (!user) {
              return null;
            }

            const presenceUser: PresenceUser = {
              userId: user.id,
              userName: user.name || user.email,
              userAvatar: user.image,
              location: {
                page: location.page as 'overview' | 'tasks' | 'settings' | 'docs',
                ...(location.taskId ? { taskId: location.taskId } : {}),
              },
              lastSeen: location.timestamp,
            };
            return presenceUser;
          } catch (error) {
            this.logger.warn(`Failed to get presence for user ${userId}`, {
              error: error instanceof Error ? error.message : String(error),
            });
            return null;
          }
        }),
      );

      // Filter out null entries and return
      return users.filter((user): user is PresenceUser => user !== null);
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
      const locationKey = `presence:user:${userId}:location`;

      // Remove from sorted set
      await this.redis.zrem(presenceKey, userId);

      // Delete location key
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
   * Optional: Can be called periodically via cron job
   *
   * @param projectId - Project ID
   */
  async cleanupStalePresence(projectId: string): Promise<void> {
    try {
      const now = Date.now();
      const fiveMinutesAgo = now - 300000;
      const presenceKey = `presence:project:${projectId}`;

      // Remove entries older than 5 minutes
      const removed = await this.redis.zremrangebyscore(presenceKey, 0, fiveMinutesAgo);

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
}
