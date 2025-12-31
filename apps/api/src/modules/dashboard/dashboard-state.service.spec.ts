/**
 * Dashboard State Service Tests
 *
 * Unit tests for Redis-backed dashboard state persistence.
 *
 * Story: DM-11.1 - Redis State Persistence
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import { DashboardStateService } from './dashboard-state.service';
import { SaveDashboardStateDto } from './dto/dashboard-state.dto';

describe('DashboardStateService', () => {
  let service: DashboardStateService;
  let mockRedis: any;

  const mockQueue = {
    client: Promise.resolve({
      ping: jest.fn().mockResolvedValue('PONG'),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    }),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(undefined),
  };

  beforeEach(async () => {
    // Get the mock Redis client
    mockRedis = await mockQueue.client;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardStateService,
        {
          provide: getQueueToken('event-retry'),
          useValue: mockQueue,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<DashboardStateService>(DashboardStateService);
    await service.onModuleInit();

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveState', () => {
    const userId = 'user-123';
    const workspaceId = 'workspace-456';

    const validDto: SaveDashboardStateDto = {
      version: 1,
      state: {
        widgets: { projectStatus: null },
        activeProject: null,
      },
      checksum: 'abc123',
    };

    it('should save state to Redis successfully', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');

      const result = await service.saveState(userId, workspaceId, validDto);

      expect(result.success).toBe(true);
      expect(result.serverVersion).toBe(1);
      expect(mockRedis.set).toHaveBeenCalledWith(
        `hyvve:dashboard:state:${userId}:${workspaceId}`,
        expect.any(String),
        'EX',
        expect.any(Number)
      );
    });

    it('should return conflict resolution when server version is newer', async () => {
      const existingState = {
        version: 2,
        state: { widgets: {} },
        lastModified: new Date().toISOString(),
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(existingState));

      const result = await service.saveState(userId, workspaceId, {
        ...validDto,
        version: 1,
      });

      expect(result.success).toBe(false);
      expect(result.serverVersion).toBe(2);
      expect(result.conflictResolution).toBe('server');
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('should update state when client version is newer', async () => {
      const existingState = {
        version: 1,
        state: { widgets: {} },
        lastModified: new Date().toISOString(),
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(existingState));
      mockRedis.set.mockResolvedValue('OK');

      const result = await service.saveState(userId, workspaceId, {
        ...validDto,
        version: 2,
      });

      expect(result.success).toBe(true);
      expect(result.serverVersion).toBe(2);
      expect(result.conflictResolution).toBe('client');
    });

    it('should handle corrupted existing data', async () => {
      mockRedis.get.mockResolvedValue('invalid json');
      mockRedis.set.mockResolvedValue('OK');

      const result = await service.saveState(userId, workspaceId, validDto);

      expect(result.success).toBe(true);
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await service.saveState(userId, workspaceId, validDto);

      expect(result.success).toBe(false);
      expect(result.serverVersion).toBe(validDto.version);
    });
  });

  describe('getState', () => {
    const userId = 'user-123';
    const workspaceId = 'workspace-456';

    it('should retrieve state from Redis', async () => {
      const storedState = {
        version: 1,
        state: { widgets: { projectStatus: null } },
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(storedState));

      const result = await service.getState(userId, workspaceId);

      expect(result).toEqual({
        version: 1,
        state: storedState.state,
        lastModified: storedState.lastModified,
      });
    });

    it('should return null when no state exists', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.getState(userId, workspaceId);

      expect(result).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await service.getState(userId, workspaceId);

      expect(result).toBeNull();
    });

    it('should handle corrupted data gracefully', async () => {
      mockRedis.get.mockResolvedValue('invalid json');

      const result = await service.getState(userId, workspaceId);

      expect(result).toBeNull();
    });
  });

  describe('deleteState', () => {
    const userId = 'user-123';
    const workspaceId = 'workspace-456';

    it('should delete state from Redis', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await service.deleteState(userId, workspaceId);

      expect(result.success).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith(
        `hyvve:dashboard:state:${userId}:${workspaceId}`
      );
    });

    it('should return false when nothing to delete', async () => {
      mockRedis.del.mockResolvedValue(0);

      const result = await service.deleteState(userId, workspaceId);

      expect(result.success).toBe(false);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis connection failed'));

      const result = await service.deleteState(userId, workspaceId);

      expect(result.success).toBe(false);
    });
  });

  describe('resolveConflict', () => {
    it('should return server when server version is higher', () => {
      const serverState = {
        version: 2,
        state: {},
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      const result = service.resolveConflict(serverState, 1);

      expect(result).toBe('server');
    });

    it('should return client when client version is higher', () => {
      const serverState = {
        version: 1,
        state: {},
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      const result = service.resolveConflict(serverState, 2);

      expect(result).toBe('client');
    });

    it('should return server when versions equal and server is newer', () => {
      const serverState = {
        version: 1,
        state: {},
        lastModified: '2024-01-02T00:00:00.000Z',
      };

      const result = service.resolveConflict(
        serverState,
        1,
        '2024-01-01T00:00:00.000Z'
      );

      expect(result).toBe('server');
    });

    it('should return client when versions equal and client is newer', () => {
      const serverState = {
        version: 1,
        state: {},
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      const result = service.resolveConflict(
        serverState,
        1,
        '2024-01-02T00:00:00.000Z'
      );

      expect(result).toBe('client');
    });

    it('should return client when versions equal and no client timestamp', () => {
      const serverState = {
        version: 1,
        state: {},
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      const result = service.resolveConflict(serverState, 1);

      expect(result).toBe('client');
    });
  });

  describe('TTL configuration', () => {
    it('should use default TTL when env var not set', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');

      await service.saveState('user', 'workspace', {
        version: 1,
        state: {},
      });

      // Default TTL is 30 days = 2592000 seconds
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'EX',
        2592000
      );
    });
  });
});
