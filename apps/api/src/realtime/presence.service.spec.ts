import { Test } from '@nestjs/testing';
import { PresenceService } from './presence.service';
import { RedisProvider } from '../events/redis.provider';
import { PrismaService } from '../common/services/prisma.service';

type RedisMock = {
  zadd: jest.Mock;
  zrangebyscore: jest.Mock;
  zrem: jest.Mock;
  zremrangebyscore: jest.Mock;
  hset: jest.Mock;
  hgetall: jest.Mock;
  expire: jest.Mock;
  del: jest.Mock;
};

describe('PresenceService', () => {
  let service: PresenceService;
  let redis: RedisMock;
  let prisma: any;

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    image: 'https://example.com/avatar.png',
  };

  beforeEach(async () => {
    const mockRedis: RedisMock = {
      zadd: jest.fn().mockResolvedValue(1),
      zrangebyscore: jest.fn().mockResolvedValue([]),
      zrem: jest.fn().mockResolvedValue(1),
      zremrangebyscore: jest.fn().mockResolvedValue(0),
      hset: jest.fn().mockResolvedValue('OK'),
      hgetall: jest.fn().mockResolvedValue({}),
      expire: jest.fn().mockResolvedValue(1),
      del: jest.fn().mockResolvedValue(1),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PresenceService,
        {
          provide: RedisProvider,
          useValue: {
            getClient: () => mockRedis,
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn(),
            },
            task: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = moduleRef.get(PresenceService);
    redis = mockRedis;
    prisma = moduleRef.get(PrismaService);
  });

  describe('updatePresence', () => {
    it('adds user to project presence sorted set', async () => {
      await service.updatePresence('user-1', 'proj-1', { page: 'overview' });

      expect(redis.zadd).toHaveBeenCalledWith(
        'presence:project:proj-1',
        expect.any(Number),
        'user-1'
      );
    });

    it('stores location in project-scoped hash', async () => {
      await service.updatePresence('user-1', 'proj-1', { page: 'tasks', taskId: 'task-1' });

      expect(redis.hset).toHaveBeenCalledWith(
        'presence:user:user-1:project:proj-1:location',
        expect.objectContaining({
          page: 'tasks',
          taskId: 'task-1',
          timestamp: expect.any(String),
        })
      );
    });

    it('sets TTL on location key', async () => {
      await service.updatePresence('user-1', 'proj-1', { page: 'overview' });

      expect(redis.expire).toHaveBeenCalledWith(
        'presence:user:user-1:project:proj-1:location',
        300 // Default TTL
      );
    });

    it('handles Redis errors gracefully', async () => {
      redis.zadd.mockRejectedValueOnce(new Error('Redis connection error'));

      // Should not throw
      await expect(
        service.updatePresence('user-1', 'proj-1', { page: 'overview' })
      ).resolves.toBeUndefined();
    });
  });

  describe('getProjectPresence', () => {
    it('returns empty array when no users present', async () => {
      redis.zrangebyscore.mockResolvedValueOnce([]);

      const result = await service.getProjectPresence('proj-1');

      expect(result).toEqual([]);
    });

    it('returns presence users with location data', async () => {
      redis.zrangebyscore.mockResolvedValueOnce(['user-1']);
      redis.hgetall.mockResolvedValueOnce({
        page: 'tasks',
        taskId: 'task-1',
        timestamp: new Date().toISOString(),
      });
      prisma.user.findMany.mockResolvedValueOnce([mockUser]);

      const result = await service.getProjectPresence('proj-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          userId: 'user-1',
          userName: 'Test User',
          location: expect.objectContaining({
            page: 'tasks',
            taskId: 'task-1',
          }),
        })
      );
    });

    it('queries user locations with project-scoped keys', async () => {
      redis.zrangebyscore.mockResolvedValueOnce(['user-1', 'user-2']);
      redis.hgetall.mockResolvedValue({
        page: 'overview',
        timestamp: new Date().toISOString(),
      });
      prisma.user.findMany.mockResolvedValueOnce([
        mockUser,
        { ...mockUser, id: 'user-2', name: 'User 2' },
      ]);

      await service.getProjectPresence('proj-1');

      expect(redis.hgetall).toHaveBeenCalledWith('presence:user:user-1:project:proj-1:location');
      expect(redis.hgetall).toHaveBeenCalledWith('presence:user:user-2:project:proj-1:location');
    });

    it('batches user lookup in single database query', async () => {
      redis.zrangebyscore.mockResolvedValueOnce(['user-1', 'user-2', 'user-3']);
      redis.hgetall.mockResolvedValue({
        page: 'overview',
        timestamp: new Date().toISOString(),
      });
      prisma.user.findMany.mockResolvedValueOnce([
        mockUser,
        { ...mockUser, id: 'user-2', name: 'User 2' },
        { ...mockUser, id: 'user-3', name: 'User 3' },
      ]);

      await service.getProjectPresence('proj-1');

      // Should call findMany once with all user IDs
      expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['user-1', 'user-2', 'user-3'] } },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });
    });

    it('filters out users with missing location data', async () => {
      redis.zrangebyscore.mockResolvedValueOnce(['user-1', 'user-2']);
      redis.hgetall
        .mockResolvedValueOnce({
          page: 'overview',
          timestamp: new Date().toISOString(),
        })
        .mockResolvedValueOnce({}); // User 2 has no valid location
      prisma.user.findMany.mockResolvedValueOnce([mockUser]);

      const result = await service.getProjectPresence('proj-1');

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-1');
    });

    it('handles Redis errors gracefully', async () => {
      redis.zrangebyscore.mockRejectedValueOnce(new Error('Redis error'));

      const result = await service.getProjectPresence('proj-1');

      expect(result).toEqual([]);
    });
  });

  describe('getTaskPresence', () => {
    it('returns users viewing specific task', async () => {
      prisma.task.findUnique.mockResolvedValueOnce({ projectId: 'proj-1' });
      redis.zrangebyscore.mockResolvedValueOnce(['user-1', 'user-2']);
      redis.hgetall
        .mockResolvedValueOnce({
          page: 'tasks',
          taskId: 'task-1',
          timestamp: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          page: 'tasks',
          taskId: 'task-2', // Different task
          timestamp: new Date().toISOString(),
        });
      prisma.user.findMany.mockResolvedValueOnce([
        mockUser,
        { ...mockUser, id: 'user-2', name: 'User 2' },
      ]);

      const result = await service.getTaskPresence('task-1');

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-1');
    });

    it('returns empty array when task not found', async () => {
      prisma.task.findUnique.mockResolvedValueOnce(null);

      const result = await service.getTaskPresence('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('removePresence', () => {
    it('removes user from project sorted set', async () => {
      await service.removePresence('user-1', 'proj-1');

      expect(redis.zrem).toHaveBeenCalledWith('presence:project:proj-1', 'user-1');
    });

    it('deletes project-scoped location key', async () => {
      await service.removePresence('user-1', 'proj-1');

      expect(redis.del).toHaveBeenCalledWith('presence:user:user-1:project:proj-1:location');
    });

    it('preserves other project presence when removing from one project', async () => {
      // Remove from proj-1
      await service.removePresence('user-1', 'proj-1');

      // Should only delete proj-1 location, not proj-2
      expect(redis.del).toHaveBeenCalledWith('presence:user:user-1:project:proj-1:location');
      expect(redis.del).not.toHaveBeenCalledWith(
        expect.stringContaining('project:proj-2')
      );
    });

    it('handles Redis errors gracefully', async () => {
      redis.zrem.mockRejectedValueOnce(new Error('Redis error'));

      // Should not throw
      await expect(
        service.removePresence('user-1', 'proj-1')
      ).resolves.toBeUndefined();
    });
  });

  describe('cleanupStalePresence', () => {
    it('removes entries older than TTL', async () => {
      redis.zremrangebyscore.mockResolvedValueOnce(5);

      await service.cleanupStalePresence('proj-1');

      expect(redis.zremrangebyscore).toHaveBeenCalledWith(
        'presence:project:proj-1',
        0,
        expect.any(Number) // Cutoff time
      );
    });

    it('handles Redis errors gracefully', async () => {
      redis.zremrangebyscore.mockRejectedValueOnce(new Error('Redis error'));

      // Should not throw
      await expect(
        service.cleanupStalePresence('proj-1')
      ).resolves.toBeUndefined();
    });
  });

  describe('TTL configuration', () => {
    it('uses default TTL of 300 seconds', async () => {
      await service.updatePresence('user-1', 'proj-1', { page: 'overview' });

      expect(redis.expire).toHaveBeenCalledWith(
        expect.any(String),
        300
      );
    });
  });
});
