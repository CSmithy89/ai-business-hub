import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RealtimeGateway } from './realtime.gateway';
import { Socket, Server } from 'socket.io';
import { PrismaService } from '../common/services/prisma.service';
import { DashboardStateService } from '../modules/dashboard/dashboard-state.service';
import { PresenceService } from './presence.service';
import {
  ApprovalEventPayload,
  AgentStatusPayload,
  getWorkspaceRoom,
  getUserRoom,
  getDashboardStateRoom,
  WS_EVENTS,
} from './realtime.types';

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;
  let mockServer: Partial<Server>;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: string) => {
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      return defaultValue;
    }),
  };

  const mockPrismaService = {
    session: {
      findUnique: jest.fn(),
    },
  };

  const mockDashboardStateService = {
    saveState: jest.fn(),
    getState: jest.fn(),
  };

  const mockPresenceService = {
    updatePresence: jest.fn(),
    getPresence: jest.fn(),
    removeUserFromWorkspace: jest.fn(),
  };

  beforeEach(async () => {
    // Mock the Socket.io server with proper type-safe emit method
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeGateway,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: DashboardStateService,
          useValue: mockDashboardStateService,
        },
        {
          provide: PresenceService,
          useValue: mockPresenceService,
        },
      ],
    }).compile();

    gateway = module.get<RealtimeGateway>(RealtimeGateway);
    // Inject mock server
    (gateway as { server: typeof mockServer }).server = mockServer as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('afterInit', () => {
    it('should log initialization message', () => {
      const logSpy = jest.spyOn((gateway as unknown as { logger: { log: jest.Mock } }).logger, 'log');
      gateway.afterInit();
      expect(logSpy).toHaveBeenCalledWith('WebSocket Gateway initialized');
    });
  });

  describe('handleConnection', () => {
    it('should reject connection without auth data', async () => {
      const mockClient = {
        id: 'test-socket-id',
        handshake: {
          auth: {},
          query: {},
        },
        data: {},
        emit: jest.fn(),
        join: jest.fn(),
        disconnect: jest.fn(),
      } as unknown as Socket;

      await gateway.handleConnection(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('connection.status', {
        status: 'disconnected',
        message: 'Authentication token required',
      });
      expect(mockClient.disconnect).toHaveBeenCalledWith(true);
    });

    it('should accept connection with valid auth data', async () => {
      mockPrismaService.session.findUnique.mockResolvedValue({
        id: 'session-123',
        token: 'token-abc',
        activeWorkspaceId: 'workspace-456',
        expiresAt: new Date(Date.now() + 60_000),
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
      });

      const mockClient = {
        id: 'test-socket-id',
        handshake: {
          auth: {
            token: 'token-abc',
          },
          query: {},
          headers: {},
        },
        data: {},
        emit: jest.fn(),
        join: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn(),
      } as unknown as Socket;

      await gateway.handleConnection(mockClient);

      expect(mockClient.join).toHaveBeenCalledWith(getWorkspaceRoom('workspace-456'));
      expect(mockClient.join).toHaveBeenCalledWith(getUserRoom('user-123'));
      expect(mockClient.emit).toHaveBeenCalledWith('connection.status', {
        status: 'connected',
        message: 'Connected to real-time updates',
      });
      expect(mockClient.data.userId).toBe('user-123');
      expect(mockClient.data.workspaceId).toBe('workspace-456');
    });

    it('should accept connection with token from cookie fallback', async () => {
      const previous = process.env.WS_ALLOW_COOKIE_FALLBACK;
      process.env.WS_ALLOW_COOKIE_FALLBACK = 'true';

      mockPrismaService.session.findUnique.mockResolvedValue({
        id: 'session-cookie',
        token: 'cookie-token',
        activeWorkspaceId: 'workspace-from-cookie',
        expiresAt: new Date(Date.now() + 60_000),
        user: {
          id: 'user-from-cookie',
          email: 'cookie@example.com',
          name: 'Cookie User',
        },
      });

      const mockClient = {
        id: 'test-socket-id',
        handshake: {
          auth: {},
          query: {},
          headers: {
            cookie: 'hyvve.session_token=cookie-token',
          },
        },
        data: {},
        emit: jest.fn(),
        join: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn(),
      } as unknown as Socket;

      try {
        await gateway.handleConnection(mockClient);
      } finally {
        if (previous === undefined) {
          delete process.env.WS_ALLOW_COOKIE_FALLBACK;
        } else {
          process.env.WS_ALLOW_COOKIE_FALLBACK = previous;
        }
      }

      expect(mockClient.data.userId).toBe('user-from-cookie');
      expect(mockClient.data.workspaceId).toBe('workspace-from-cookie');
    });

    it('should reject cookie token when cookie fallback is not explicitly enabled', async () => {
      const previous = process.env.WS_ALLOW_COOKIE_FALLBACK;
      delete process.env.WS_ALLOW_COOKIE_FALLBACK;

      mockPrismaService.session.findUnique.mockResolvedValue({
        id: 'session-cookie',
        token: 'cookie-token',
        activeWorkspaceId: 'workspace-from-cookie',
        expiresAt: new Date(Date.now() + 60_000),
        user: {
          id: 'user-from-cookie',
          email: 'cookie@example.com',
          name: 'Cookie User',
        },
      });

      const mockClient = {
        id: 'test-socket-id',
        handshake: {
          auth: {},
          query: {},
          headers: {
            cookie: 'hyvve.session_token=cookie-token',
          },
        },
        data: {},
        emit: jest.fn(),
        join: jest.fn(),
        disconnect: jest.fn(),
      } as unknown as Socket;

      try {
        await gateway.handleConnection(mockClient);
      } finally {
        if (previous !== undefined) {
          process.env.WS_ALLOW_COOKIE_FALLBACK = previous;
        }
      }

      expect(mockClient.disconnect).toHaveBeenCalledWith(true);
      expect(mockClient.emit).toHaveBeenCalledWith('connection.status', {
        status: 'disconnected',
        message: 'Authentication token required',
      });
    });
  });

  describe('handleDisconnect', () => {
    it('should log disconnection and untrack client', () => {
      const mockClient = {
        id: 'test-socket-id',
        data: {
          userId: 'user-123',
          workspaceId: 'workspace-456',
        },
      } as unknown as Socket;

      // First track the connection
      (gateway as unknown as { trackConnection: (w: string, s: string) => void }).trackConnection(
        'workspace-456',
        'test-socket-id'
      );

      expect(gateway.getWorkspaceClientCount('workspace-456')).toBe(1);

      gateway.handleDisconnect(mockClient);

      expect(gateway.getWorkspaceClientCount('workspace-456')).toBe(0);
    });
  });

  describe('broadcast methods', () => {
    beforeEach(() => {
      // Reset mock server for broadcast tests
      mockServer.to = jest.fn().mockReturnValue({
        emit: jest.fn(),
      });
    });

    it('should broadcast approval created to workspace room', () => {
      const approval: ApprovalEventPayload = {
        id: 'approval-1',
        type: 'content_review',
        title: 'Test Approval',
        confidenceScore: 0.85,
        recommendation: 'approve',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      gateway.broadcastApprovalCreated('workspace-123', approval);

      expect(mockServer.to).toHaveBeenCalledWith('workspace:workspace-123');
    });

    it('should broadcast agent status changed to workspace room', () => {
      const status: AgentStatusPayload = {
        agentId: 'agent-1',
        agentName: 'Content Writer',
        status: 'running',
        lastActiveAt: new Date().toISOString(),
      };

      gateway.broadcastAgentStatusChanged('workspace-123', status);

      expect(mockServer.to).toHaveBeenCalledWith('workspace:workspace-123');
    });

    it('should broadcast notification to specific user', () => {
      const notification = {
        id: 'notif-1',
        type: 'alert',
        title: 'Test Notification',
        message: 'Test message',
        createdAt: new Date().toISOString(),
        read: false,
      };

      gateway.broadcastNotification('workspace-123', notification, 'user-456');

      expect(mockServer.to).toHaveBeenCalledWith('user:user-456');
    });

    it('should broadcast notification to workspace when no user specified', () => {
      const notification = {
        id: 'notif-1',
        type: 'alert',
        title: 'Test Notification',
        message: 'Test message',
        createdAt: new Date().toISOString(),
        read: false,
      };

      gateway.broadcastNotification('workspace-123', notification);

      expect(mockServer.to).toHaveBeenCalledWith('workspace:workspace-123');
    });
  });

  describe('client tracking', () => {
    it('should track and count clients per workspace', () => {
      const trackConnection = (gateway as unknown as { trackConnection: (w: string, s: string) => void }).trackConnection.bind(gateway);
      const untrackConnection = (gateway as unknown as { untrackConnection: (w: string, s: string) => void }).untrackConnection.bind(gateway);

      trackConnection('workspace-1', 'socket-1');
      trackConnection('workspace-1', 'socket-2');
      trackConnection('workspace-2', 'socket-3');

      expect(gateway.getWorkspaceClientCount('workspace-1')).toBe(2);
      expect(gateway.getWorkspaceClientCount('workspace-2')).toBe(1);
      expect(gateway.getTotalClientCount()).toBe(3);

      untrackConnection('workspace-1', 'socket-1');

      expect(gateway.getWorkspaceClientCount('workspace-1')).toBe(1);
      expect(gateway.getTotalClientCount()).toBe(2);
    });
  });
});

describe('Room Helper Functions', () => {
  it('should generate correct workspace room name', () => {
    expect(getWorkspaceRoom('workspace-123')).toBe('workspace:workspace-123');
  });

  it('should generate correct user room name', () => {
    expect(getUserRoom('user-456')).toBe('user:user-456');
  });

  it('should generate correct dashboard state room name', () => {
    expect(getDashboardStateRoom('user-789')).toBe('dashboard:state:user-789');
  });
});

describe('RealtimeGateway - Dashboard State Sync (DM-11.2)', () => {
  let gateway: RealtimeGateway;
  let mockServer: Partial<Server>;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: string) => {
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      return defaultValue;
    }),
  };

  const mockPrismaService = {
    session: {
      findUnique: jest.fn(),
    },
    approvalItem: {
      count: jest.fn().mockResolvedValue(0),
    },
    notification: {
      count: jest.fn().mockResolvedValue(0),
    },
  };

  const mockDashboardStateService = {
    saveState: jest.fn().mockResolvedValue({ success: true }),
    getState: jest.fn(),
  };

  const mockPresenceService = {
    updatePresence: jest.fn(),
    getPresence: jest.fn(),
    removeUserFromWorkspace: jest.fn(),
  };

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeGateway,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: DashboardStateService,
          useValue: mockDashboardStateService,
        },
        {
          provide: PresenceService,
          useValue: mockPresenceService,
        },
      ],
    }).compile();

    gateway = module.get<RealtimeGateway>(RealtimeGateway);
    (gateway as { server: typeof mockServer }).server = mockServer as Server;

    jest.clearAllMocks();
  });

  describe('handleDashboardStateUpdate', () => {
    it('should reject update from unauthenticated client', async () => {
      const mockClient = {
        id: 'test-socket-id',
        data: {},
      } as unknown as Socket;

      await gateway.handleDashboardStateUpdate(mockClient, {
        path: 'widgets.test',
        value: { status: 'active' },
        version: 1,
        timestamp: new Date().toISOString(),
        sourceTabId: 'tab-1',
      });

      // Should not emit or save
      expect(mockServer.to).not.toHaveBeenCalled();
      expect(mockDashboardStateService.saveState).not.toHaveBeenCalled();
    });

    it('should reject invalid payload', async () => {
      const mockClient = {
        id: 'test-socket-id',
        data: { userId: 'user-1', workspaceId: 'ws-1' },
      } as unknown as Socket;

      await gateway.handleDashboardStateUpdate(mockClient, {
        // Missing required fields
        path: '',
        value: null,
      });

      expect(mockServer.to).not.toHaveBeenCalled();
      expect(mockDashboardStateService.saveState).not.toHaveBeenCalled();
    });

    it('should broadcast valid update to dashboard state room', async () => {
      const mockClient = {
        id: 'test-socket-id',
        data: { userId: 'user-1', workspaceId: 'ws-1' },
      } as unknown as Socket;

      const payload = {
        path: 'widgets.projectStatus',
        value: { status: 'active' },
        version: 1,
        timestamp: new Date().toISOString(),
        sourceTabId: 'tab-1',
      };

      await gateway.handleDashboardStateUpdate(mockClient, payload);

      // Should broadcast to dashboard state room
      expect(mockServer.to).toHaveBeenCalledWith('dashboard:state:user-1');
      const toResult = mockServer.to!('dashboard:state:user-1') as unknown as { emit: jest.Mock };
      expect(toResult.emit).toHaveBeenCalledWith(
        WS_EVENTS.DASHBOARD_STATE_SYNC,
        {
          path: payload.path,
          value: payload.value,
          version: payload.version,
          sourceTabId: payload.sourceTabId,
        }
      );

      // Should persist to Redis
      expect(mockDashboardStateService.saveState).toHaveBeenCalledWith(
        'user-1',
        'ws-1',
        expect.objectContaining({
          version: payload.version,
          state: { [payload.path]: payload.value },
        })
      );
    });

    it('should reject payload exceeding size limit', async () => {
      const mockClient = {
        id: 'test-socket-id',
        data: { userId: 'user-1', workspaceId: 'ws-1' },
      } as unknown as Socket;

      // Create a payload that exceeds 64KB
      const largeValue = 'x'.repeat(70000);

      await gateway.handleDashboardStateUpdate(mockClient, {
        path: 'widgets.large',
        value: largeValue,
        version: 1,
        timestamp: new Date().toISOString(),
        sourceTabId: 'tab-1',
      });

      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });

  describe('handleDashboardStateRequest', () => {
    it('should reject request from unauthenticated client', async () => {
      const mockClient = {
        id: 'test-socket-id',
        data: {},
        emit: jest.fn(),
      } as unknown as Socket;

      await gateway.handleDashboardStateRequest(mockClient, {
        lastKnownVersion: 0,
      });

      expect(mockClient.emit).not.toHaveBeenCalled();
      expect(mockDashboardStateService.getState).not.toHaveBeenCalled();
    });

    it('should return full state when server version is newer', async () => {
      const mockClient = {
        id: 'test-socket-id',
        data: { userId: 'user-1', workspaceId: 'ws-1' },
        emit: jest.fn(),
      } as unknown as Socket;

      const serverState = {
        version: 5,
        state: { widgets: { test: 'value' } },
        lastModified: new Date().toISOString(),
      };
      mockDashboardStateService.getState.mockResolvedValue(serverState);

      await gateway.handleDashboardStateRequest(mockClient, {
        lastKnownVersion: 2,
      });

      expect(mockDashboardStateService.getState).toHaveBeenCalledWith('user-1', 'ws-1');
      expect(mockClient.emit).toHaveBeenCalledWith(
        WS_EVENTS.DASHBOARD_STATE_FULL,
        {
          state: serverState.state,
          version: serverState.version,
        }
      );
    });

    it('should not return state when client is up to date', async () => {
      const mockClient = {
        id: 'test-socket-id',
        data: { userId: 'user-1', workspaceId: 'ws-1' },
        emit: jest.fn(),
      } as unknown as Socket;

      mockDashboardStateService.getState.mockResolvedValue({
        version: 5,
        state: { widgets: {} },
        lastModified: new Date().toISOString(),
      });

      await gateway.handleDashboardStateRequest(mockClient, {
        lastKnownVersion: 5,
      });

      expect(mockClient.emit).not.toHaveBeenCalled();
    });

    it('should return empty state when no state exists', async () => {
      const mockClient = {
        id: 'test-socket-id',
        data: { userId: 'user-1', workspaceId: 'ws-1' },
        emit: jest.fn(),
      } as unknown as Socket;

      mockDashboardStateService.getState.mockResolvedValue(null);

      await gateway.handleDashboardStateRequest(mockClient, {
        lastKnownVersion: 0,
      });

      expect(mockClient.emit).toHaveBeenCalledWith(
        WS_EVENTS.DASHBOARD_STATE_FULL,
        {
          state: {},
          version: 0,
        }
      );
    });
  });

  describe('rate limiting', () => {
    it('should allow updates within rate limit', async () => {
      const mockClient = {
        id: 'test-socket-id',
        data: { userId: 'rate-test-user', workspaceId: 'ws-1' },
      } as unknown as Socket;

      const payload = {
        path: 'widgets.test',
        value: 'value',
        version: 1,
        timestamp: new Date().toISOString(),
        sourceTabId: 'tab-1',
      };

      // First update should succeed
      await gateway.handleDashboardStateUpdate(mockClient, payload);
      expect(mockServer.to).toHaveBeenCalled();
    });
  });
});
