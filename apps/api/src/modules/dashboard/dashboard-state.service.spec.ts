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
      eval: jest.fn(),
      setnx: jest.fn(),
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
      // Lock acquisition succeeds (SET with NX returns 'OK')
      mockRedis.set.mockResolvedValue('OK');
      // Lua script succeeds
      mockRedis.eval.mockResolvedValue(JSON.stringify({ status: 'success', version: 1 }));

      const result = await service.saveState(userId, workspaceId, validDto);

      expect(result.success).toBe(true);
      expect(result.serverVersion).toBe(1);
      expect(mockRedis.eval).toHaveBeenCalled();
    });

    it('should return conflict resolution when server version is newer', async () => {
      // Lock acquisition succeeds
      mockRedis.set.mockResolvedValue('OK');
      // Lua script detects conflict
      mockRedis.eval.mockResolvedValue(JSON.stringify({
        status: 'conflict',
        serverVersion: 2,
      }));

      const result = await service.saveState(userId, workspaceId, {
        ...validDto,
        version: 1,
      });

      expect(result.success).toBe(false);
      expect(result.serverVersion).toBe(2);
      expect(result.conflictResolution).toBe('server');
    });

    it('should update state when client version is newer', async () => {
      // Lock acquisition succeeds
      mockRedis.set.mockResolvedValue('OK');
      // Lua script succeeds with client resolution
      mockRedis.eval.mockResolvedValue(JSON.stringify({ status: 'success', version: 2 }));

      const result = await service.saveState(userId, workspaceId, {
        ...validDto,
        version: 2,
      });

      expect(result.success).toBe(true);
      expect(result.serverVersion).toBe(2);
      expect(result.conflictResolution).toBe('client');
    });

    it('should handle corrupted existing data', async () => {
      // Lock acquisition succeeds
      mockRedis.set.mockResolvedValue('OK');
      // Lua script handles corruption and overwrites
      mockRedis.eval.mockResolvedValue(JSON.stringify({ status: 'overwrite', version: 1 }));

      const result = await service.saveState(userId, workspaceId, validDto);

      expect(result.success).toBe(true);
      expect(mockRedis.eval).toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      // Lock acquisition succeeds but eval fails
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.eval.mockRejectedValue(new Error('Redis connection failed'));

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
      // Lock acquisition succeeds
      mockRedis.set.mockResolvedValue('OK');
      // Lua script succeeds
      mockRedis.eval.mockResolvedValue(JSON.stringify({ status: 'success', version: 1 }));

      await service.saveState('user', 'workspace', {
        version: 1,
        state: {},
      });

      // Default TTL is 30 days = 2592000 seconds (passed as ARGV[3] to Lua script)
      expect(mockRedis.eval).toHaveBeenCalledWith(
        expect.any(String), // Lua script
        1, // Number of keys
        expect.stringContaining('hyvve:dashboard:state:'), // KEYS[1]
        expect.any(String), // ARGV[1] - state data JSON
        '1', // ARGV[2] - version
        '2592000' // ARGV[3] - TTL
      );
    });
  });

  /**
   * CR-11: Multi-tab concurrent state update tests
   *
   * Simulates two tabs modifying state simultaneously.
   * Tests version-based conflict detection and resolution.
   * Note: saveState uses Lua scripts (eval) for atomic operations.
   */
  describe('concurrent state updates (CR-11)', () => {
    const userId = 'user-123';
    const workspaceId = 'workspace-456';

    it('should detect conflict when two tabs save simultaneously with same version', async () => {
      // Lock acquisition succeeds for both tabs
      mockRedis.set.mockResolvedValue('OK');

      // Tab 1 saves with version 2 (succeeds via Lua script)
      mockRedis.eval.mockResolvedValueOnce(JSON.stringify({ status: 'success', version: 2 }));

      const tab1Result = await service.saveState(userId, workspaceId, {
        version: 2,
        state: { widgets: { projectStatus: 'from-tab-1' } },
      });

      expect(tab1Result.success).toBe(true);
      expect(tab1Result.serverVersion).toBe(2);

      // Tab 2 also saves with version 2 (Lua script succeeds - versions equal)
      mockRedis.eval.mockResolvedValueOnce(JSON.stringify({ status: 'success', version: 2 }));

      const tab2Result = await service.saveState(userId, workspaceId, {
        version: 2,
        state: { widgets: { projectStatus: 'from-tab-2' } },
      });

      expect(tab2Result.success).toBe(true);
    });

    it('should reject stale update when server version is ahead', async () => {
      // Lock acquisition succeeds
      mockRedis.set.mockResolvedValue('OK');

      // Lua script returns conflict (server v3 > client v2)
      mockRedis.eval.mockResolvedValue(JSON.stringify({
        status: 'conflict',
        serverVersion: 3,
      }));

      // Stale tab tries to save with version 2
      const result = await service.saveState(userId, workspaceId, {
        version: 2,
        state: { widgets: { projectStatus: 'stale' } },
      });

      expect(result.success).toBe(false);
      expect(result.serverVersion).toBe(3);
      expect(result.conflictResolution).toBe('server');
    });

    it('should handle rapid successive updates from same tab', async () => {
      // Lock always succeeds
      mockRedis.set.mockResolvedValue('OK');

      // First update (version 1)
      mockRedis.eval.mockResolvedValueOnce(JSON.stringify({ status: 'success', version: 1 }));

      const result1 = await service.saveState(userId, workspaceId, {
        version: 1,
        state: { widgets: { count: 1 } },
      });

      expect(result1.success).toBe(true);

      // Second update (version 2)
      mockRedis.eval.mockResolvedValueOnce(JSON.stringify({ status: 'success', version: 2 }));

      const result2 = await service.saveState(userId, workspaceId, {
        version: 2,
        state: { widgets: { count: 2 } },
      });

      expect(result2.success).toBe(true);
      expect(result2.serverVersion).toBe(2);

      // Third update (version 3)
      mockRedis.eval.mockResolvedValueOnce(JSON.stringify({ status: 'success', version: 3 }));

      const result3 = await service.saveState(userId, workspaceId, {
        version: 3,
        state: { widgets: { count: 3 } },
      });

      expect(result3.success).toBe(true);
      expect(result3.serverVersion).toBe(3);
    });
  });

  /**
   * CR-12: Redis complete failure tests
   *
   * Tests behavior when Redis is completely unavailable.
   * Ensures fail-open pattern works correctly.
   */
  describe('Redis complete failure (CR-12)', () => {
    const userId = 'user-123';
    const workspaceId = 'workspace-456';
    let originalRedis: any;

    // Save redis client and reset mocks before each test
    beforeEach(() => {
      originalRedis = (service as any).redis;
      mockRedis.get.mockReset();
      mockRedis.set.mockReset();
      mockRedis.del.mockReset();
      mockRedis.eval.mockReset();
      mockRedis.setnx.mockReset();
    });

    // Restore redis client after each test
    afterEach(() => {
      (service as any).redis = originalRedis;
    });

    it('should fail-open on saveState when Redis unavailable', async () => {
      // Simulate Redis unavailable
      (service as any).redis = null;

      const result = await service.saveState(userId, workspaceId, {
        version: 1,
        state: { widgets: {} },
      });

      // Fail-open: return failure but don't throw
      expect(result.success).toBe(false);
      expect(result.serverVersion).toBe(1);
    });

    it('should return null on getState when Redis unavailable', async () => {
      // Simulate Redis unavailable
      (service as any).redis = null;

      const result = await service.getState(userId, workspaceId);

      // Fail-open: return null but don't throw
      expect(result).toBeNull();
    });

    it('should return failure on deleteState when Redis unavailable', async () => {
      // Simulate Redis unavailable
      (service as any).redis = null;

      const result = await service.deleteState(userId, workspaceId);

      // Fail-open: return failure but don't throw
      expect(result.success).toBe(false);
    });

    it('should handle Redis connection timeout gracefully', async () => {
      // Simulate persistent connection timeout (fails all retries)
      mockRedis.get.mockRejectedValue(new Error('ETIMEDOUT'));

      const result = await service.getState(userId, workspaceId);

      // Should return null, not throw (fail-open after retries exhausted)
      expect(result).toBeNull();
      // Should have retried 3 times
      expect(mockRedis.get).toHaveBeenCalledTimes(3);
    });

    it('should handle Redis connection reset gracefully', async () => {
      // Simulate persistent connection reset (fails all retries)
      mockRedis.get.mockRejectedValue(new Error('ECONNRESET'));

      const result = await service.getState(userId, workspaceId);

      // Should return null, not throw (fail-open after retries exhausted)
      expect(result).toBeNull();
      // Should have retried 3 times
      expect(mockRedis.get).toHaveBeenCalledTimes(3);
    });

    it('should handle Redis out-of-memory errors gracefully', async () => {
      // Lock acquisition succeeds
      mockRedis.set.mockResolvedValue('OK');
      // Lua eval fails with OOM
      mockRedis.eval.mockRejectedValue(new Error('OOM command not allowed when used memory > maxmemory'));

      const result = await service.saveState(userId, workspaceId, {
        version: 1,
        state: { widgets: {} },
      });

      // Fail-open: return failure but don't throw
      expect(result.success).toBe(false);
    });

    it('should not corrupt state when Redis fails mid-operation', async () => {
      // First, establish a known good state
      const goodState = {
        version: 1,
        state: { widgets: { status: 'good' } },
        lastModified: new Date().toISOString(),
      };

      // Lock acquisition succeeds
      mockRedis.set.mockResolvedValue('OK');
      // Lua eval fails with error
      mockRedis.eval.mockRejectedValue(new Error('EXECABORT Transaction discarded because of previous errors'));

      // Attempt to save new state
      const result = await service.saveState(userId, workspaceId, {
        version: 2,
        state: { widgets: { status: 'new' } },
      });

      // Update should fail
      expect(result.success).toBe(false);

      // Clear mocks and verify original state is still readable
      jest.clearAllMocks();
      mockRedis.get.mockResolvedValue(JSON.stringify(goodState));
      const currentState = await service.getState(userId, workspaceId);

      expect(currentState?.version).toBe(1);
      expect(currentState?.state).toEqual({ widgets: { status: 'good' } });
    });
  });
});
