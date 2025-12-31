import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RealtimeGateway } from './realtime.gateway';
import { Socket, Server } from 'socket.io';
import { PrismaService } from '../common/services/prisma.service';
import { PresenceService } from './presence.service';
import {
  ApprovalEventPayload,
  AgentStatusPayload,
  getWorkspaceRoom,
  getUserRoom,
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

  const mockPresenceService = {
    trackUserOnline: jest.fn(),
    trackUserOffline: jest.fn(),
    getOnlineUsers: jest.fn().mockResolvedValue([]),
    isUserOnline: jest.fn().mockResolvedValue(false),
  };

  beforeEach(async () => {
    // Mock the Socket.io server
    mockServer = {
      to: jest.fn().mockReturnThis(),
    };
    (mockServer as { emit: jest.Mock }).emit = jest.fn();

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
});
