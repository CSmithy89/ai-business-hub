import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { PrismaService } from '../common/services/prisma.service';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  ApprovalEventPayload,
  ApprovalUpdatePayload,
  AgentStatusPayload,
  AgentRunPayload,
  AgentRunFailedPayload,
  NotificationPayload,
  ChatMessagePayload,
  SyncStatePayload,
  PMTaskEventPayload,
  PMTaskUpdatePayload,
  PMTaskDeletedPayload,
  PMTaskStatusPayload,
  PMPhaseEventPayload,
  PMPhaseTransitionPayload,
  PMProjectEventPayload,
  PMProjectDeletedPayload,
  PMTeamChangePayload,
  PresencePayload,
  PMHealthEventPayload,
  PMRiskEventPayload,
  // PM-12.6: Agent Streaming, Suggestions, Health Updates
  PMAgentStreamStartPayload,
  PMAgentStreamChunkPayload,
  PMAgentStreamEndPayload,
  PMAgentTypingPayload,
  PMSuggestionEventPayload,
  PMSuggestionActionPayload,
  PMHealthUpdatePayload,
  // DM-11.2: Dashboard State Sync
  DashboardStateUpdatePayloadSchema,
  DashboardStateSyncPayload,
  DashboardStateFullPayload,
  DashboardStateRequestPayloadSchema,
  getDashboardStateRoom,
  WS_EVENTS,
  getWorkspaceRoom,
  getUserRoom,
  getProjectRoom,
} from './realtime.types';
import { PresenceService } from './presence.service';
import { DashboardStateService } from '../modules/dashboard/dashboard-state.service';

// ============================================
// Input Validation Schemas (Zod)
// ============================================

const PresenceUpdateSchema = z.object({
  status: z.enum(['online', 'away', 'busy']),
});

const TypingSchema = z.object({
  chatId: z.string().min(1).max(100),
});

const SyncRequestSchema = z.object({
  lastEventId: z.string().optional(),
  since: z.string().optional(),
});

const PMPresenceUpdateSchema = z.object({
  projectId: z.string().min(1).max(100),
  taskId: z.string().min(1).max(100).optional(),
  page: z.enum(['overview', 'tasks', 'settings', 'docs']),
});

/**
 * Connection Limits Configuration
 *
 * These limits prevent resource exhaustion and abuse:
 *
 * MAX_CONNECTIONS_PER_WORKSPACE (default: 100)
 *   - Prevents a single workspace from consuming all server resources
 *   - 100 allows ~20-50 concurrent users with multiple browser tabs
 *   - Configurable via WS_MAX_CONNECTIONS_PER_WORKSPACE env var
 *
 * MAX_CONNECTIONS_PER_USER (default: 5)
 *   - Allows user to have multiple tabs/devices
 *   - 5 covers: desktop, mobile, tablet + 2 extra browser tabs
 *   - Configurable via WS_MAX_CONNECTIONS_PER_USER env var
 */
const MAX_CONNECTIONS_PER_WORKSPACE = parseInt(
  process.env.WS_MAX_CONNECTIONS_PER_WORKSPACE || '100',
  10
);
const MAX_CONNECTIONS_PER_USER = parseInt(
  process.env.WS_MAX_CONNECTIONS_PER_USER || '5',
  10
);

/**
 * RealtimeGateway - WebSocket Gateway for Real-Time Updates
 *
 * Handles WebSocket connections, authentication, and event broadcasting.
 * Uses Socket.io with workspace-scoped rooms for multi-tenant isolation.
 *
 * Key Features:
 * - JWT authentication in handshake (validates against sessions table)
 * - Workspace room isolation
 * - Event broadcasting to workspace and user rooms
 * - Connection/disconnection tracking
 * - Rate limiting per workspace/user
 * - Heartbeat for zombie connection detection
 * - Graceful degradation
 *
 * Security:
 * - Validates JWT token from handshake.auth.token
 * - Verifies session exists and is not expired
 * - Extracts userId/workspaceId from verified session (NOT from client)
 * - Enforces connection limits per workspace and user
 *
 * @see Story 16-15: Implement WebSocket Real-Time Updates
 */
@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    // SECURITY: Only allow configured origins, not all
    origin: (origin, callback) => {
      const isProduction = process.env.NODE_ENV === 'production';
      const configuredOrigins = process.env.CORS_ALLOWED_ORIGINS;

      const isAllowedDevOrigin = (value: string): boolean => {
        // Accept both http and https; precisely match RFC1918/private ranges.
        const v = (value || '').toLowerCase();
        // SECURITY: Anchor to end-of-string to prevent hostname suffix bypasses
        // (e.g. "http://localhost.evil.com").
        if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(v)) return true;
        if (/^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(v)) return true;
        if (/^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(v)) return true;
        if (/^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(v)) {
          return true;
        }
        return false;
      };

      // SECURITY: In production, CORS_ALLOWED_ORIGINS must be explicitly configured
      if (isProduction && !configuredOrigins) {
        console.error(
          '[SECURITY] CORS_ALLOWED_ORIGINS must be configured in production. ' +
            'WebSocket connections will be rejected until this is fixed.'
        );
        callback(new Error('CORS not configured'), false);
        return;
      }

      // Parse allowed origins - only use localhost fallback in development
      const allowedOrigins =
        configuredOrigins?.split(',').map((s) => s.trim()).filter(Boolean) || [
        'http://localhost:3000',
        'http://localhost:3001',
      ];

      // Allow requests with no origin (mobile apps, curl, etc) in development only
      if (!origin && !isProduction) {
        callback(null, true);
        return;
      }

      // Dev fallback: permit local/private network origins even if the allowlist is missing or incomplete.
      // This avoids confusing "Realtime unavailable" states during Docker/VM/WSL development.
      if (!isProduction && origin && isAllowedDevOrigin(origin)) {
        if (configuredOrigins && !allowedOrigins.includes(origin)) {
          console.warn(
            `[Realtime][CORS] Allowing dev origin not present in CORS_ALLOWED_ORIGINS: ${origin}`,
          );
        }
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin || '')) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'), false);
      }
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  // Heartbeat configuration for zombie connection detection
  pingInterval: 25000, // Send ping every 25 seconds
  pingTimeout: 10000, // Disconnect if no pong within 10 seconds
})
@Injectable()
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

  // Track connected clients by workspace for metrics/debugging and rate limiting
  private readonly connectedClients = new Map<string, Set<string>>(); // workspaceId -> Set<socketId>
  private readonly userConnections = new Map<string, Set<string>>(); // userId -> Set<socketId>

  // DM-11.2: Rate limiting for dashboard state updates (100 per minute per user)
  private readonly dashboardStateRateLimits = new Map<string, { count: number; resetAt: number }>(); // userId -> rate limit state
  private readonly DASHBOARD_STATE_RATE_LIMIT = 100;
  private readonly DASHBOARD_STATE_RATE_WINDOW_MS = 60_000; // 1 minute
  private readonly MAX_STATE_PAYLOAD_SIZE = 64 * 1024; // 64KB

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly presenceService: PresenceService,
    private readonly dashboardStateService: DashboardStateService,
  ) {}

  /**
   * Called after the gateway is initialized
   */
  afterInit() {
    this.logger.log('WebSocket Gateway initialized');

    // Configure CORS from environment
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    this.logger.log(`WebSocket CORS configured for: ${frontendUrl}`);

    if (process.env.NODE_ENV === 'production') {
      if (process.env.WS_ALLOW_COOKIE_FALLBACK === 'true') {
        this.logger.warn(
          '[SECURITY] WS_ALLOW_COOKIE_FALLBACK is enabled in production. ' +
            'Ensure origin validation, monitoring, and session controls are in place. ' +
            'Prefer passing the token via handshake.auth.token instead of cookies.',
        );
      }
      if (process.env.WS_ALLOW_AUTH_HEADER_FALLBACK === 'true') {
        this.logger.warn(
          '[SECURITY] WS_ALLOW_AUTH_HEADER_FALLBACK is enabled in production. ' +
            'This is a migration-only fallback and should be disabled.',
        );
      }
    }
  }

  /**
   * Handle new WebSocket connections
   * SECURITY: Validates JWT token against sessions table before allowing connection
   */
  async handleConnection(client: Socket) {
    try {
      // SECURITY: Extract and validate JWT token (NOT user-provided data!)
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn({
          message: 'Connection rejected - no token provided',
          socketId: client.id,
        });
        client.emit('connection.status', {
          status: 'disconnected',
          message: 'Authentication token required',
        });
        client.disconnect(true);
        return;
      }

      // SECURITY: Validate token against database sessions table
      const validatedUser = await this.validateToken(token);

      if (!validatedUser) {
        this.logger.warn({
          message: 'Connection rejected - invalid or expired token',
          socketId: client.id,
        });
        client.emit('connection.status', {
          status: 'disconnected',
          message: 'Invalid or expired authentication token',
        });
        client.disconnect(true);
        return;
      }

      const { userId, workspaceId, email, sessionId } = validatedUser;

      // SECURITY: Check rate limits
      if (!this.checkRateLimits(userId, workspaceId)) {
        this.logger.warn({
          message: 'Connection rejected - rate limit exceeded',
          socketId: client.id,
          userId,
          workspaceId,
        });
        client.emit('connection.status', {
          status: 'disconnected',
          message: 'Too many connections. Please close some tabs and try again.',
        });
        client.disconnect(true);
        return;
      }

      // Store validated user data on socket (from DB, not from client!)
      client.data = {
        userId,
        workspaceId,
        email,
        sessionId,
        connectedAt: new Date(),
        projectRooms: new Set<string>(), // Initialize empty set for tracking project rooms
      };

      // Join workspace room for multi-tenant isolation
      const workspaceRoom = getWorkspaceRoom(workspaceId);
      await client.join(workspaceRoom);

      // Join user-specific room for targeted events
      const userRoom = getUserRoom(userId);
      await client.join(userRoom);

      // DM-11.2: Join dashboard state room for cross-device sync
      const dashboardStateRoom = getDashboardStateRoom(userId);
      await client.join(dashboardStateRoom);

      // Track connection for rate limiting
      this.trackConnection(workspaceId, client.id, userId);

      this.logger.log({
        message: 'Client connected (authenticated)',
        socketId: client.id,
        userId,
        workspaceId,
        rooms: [workspaceRoom, userRoom, dashboardStateRoom],
      });

      // Send connection confirmation
      client.emit('connection.status', {
        status: 'connected',
        message: 'Connected to real-time updates',
      });
    } catch (error) {
      this.logger.error({
        message: 'Connection error',
        socketId: client.id,
        error: error instanceof Error ? error.message : String(error),
      });
      client.emit('connection.status', {
        status: 'disconnected',
        message: 'Connection failed',
      });
      client.disconnect(true);
    }
  }

  /**
   * Handle WebSocket disconnections
   */
  async handleDisconnect(client: Socket) {
    const { userId, workspaceId, projectRooms } = client.data || {};

    // Clean up presence for all projects the user was in
    if (userId && projectRooms && projectRooms.size > 0) {
      try {
        // Get user details for presence payloads
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true, image: true },
        });

        if (user) {
          // Remove presence and broadcast 'left' event for each project
          // Use Promise.allSettled to ensure all cleanups are attempted even if some fail
          const projectIds = Array.from(projectRooms) as string[];
          const cleanupPromises = projectIds.map(async (projectId) => {
            // Remove presence from Redis
            await this.presenceService.removePresence(userId, projectId);

            // Broadcast presence left event to project room
            const presencePayload: PresencePayload = {
              userId: user.id,
              userName: user.name || user.email,
              userAvatar: user.image,
              projectId,
              page: 'overview', // Default page for left event
              timestamp: new Date().toISOString(),
            };
            this.broadcastPMPresenceLeft(projectId, presencePayload);

            this.logger.debug({
              message: 'PM presence cleaned up on disconnect',
              userId,
              projectId,
            });
          });

          const results = await Promise.allSettled(cleanupPromises);

          // Log any failures
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              this.logger.error({
                message: 'Failed to clean up presence for project',
                userId,
                projectId: projectIds[index],
                error: result.reason instanceof Error ? result.reason.message : String(result.reason),
              });
            }
          });
        }
      } catch (error) {
        this.logger.error({
          message: 'Failed to fetch user for presence cleanup',
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Untrack connection from both workspace and user tracking
    if (workspaceId) {
      this.untrackConnection(workspaceId, client.id, userId);
    }

    this.logger.log({
      message: 'Client disconnected',
      socketId: client.id,
      userId,
      workspaceId,
      projectRoomsCleanedUp: projectRooms?.size || 0,
    });
  }

  // ============================================
  // Client-to-Server Event Handlers
  // ============================================

  /**
   * Handle presence updates
   * SECURITY: Validates input with Zod schema
   */
  @SubscribeMessage('presence.update')
  handlePresenceUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() rawData: unknown,
  ) {
    // SECURITY: Validate input
    const parseResult = PresenceUpdateSchema.safeParse(rawData);
    if (!parseResult.success) {
      this.logger.warn({
        message: 'Invalid presence.update payload',
        socketId: client.id,
        errors: parseResult.error.errors,
      });
      return;
    }

    const data = parseResult.data;
    const { userId, workspaceId } = client.data || {};
    this.logger.debug({
      message: 'Presence update',
      userId,
      workspaceId,
      status: data.status,
    });
    // Could broadcast to other users in workspace if needed
  }

  /**
   * Handle typing start indicator
   * SECURITY: Validates input with Zod schema
   */
  @SubscribeMessage('typing.start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() rawData: unknown,
  ) {
    // SECURITY: Validate input
    const parseResult = TypingSchema.safeParse(rawData);
    if (!parseResult.success) {
      this.logger.warn({
        message: 'Invalid typing.start payload',
        socketId: client.id,
        errors: parseResult.error.errors,
      });
      return;
    }

    const data = parseResult.data;
    const { userId, workspaceId } = client.data || {};
    if (workspaceId && userId) {
      // Broadcast to workspace that user is typing
      client.to(getWorkspaceRoom(workspaceId)).emit('chat.message', {
        id: `typing-${userId}`,
        chatId: data.chatId,
        role: 'system',
        content: '',
        createdAt: new Date().toISOString(),
      } as ChatMessagePayload);
    }
  }

  /**
   * Handle typing stop indicator
   * SECURITY: Validates input with Zod schema
   */
  @SubscribeMessage('typing.stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() rawData: unknown,
  ) {
    // SECURITY: Validate input
    const parseResult = TypingSchema.safeParse(rawData);
    if (!parseResult.success) {
      this.logger.warn({
        message: 'Invalid typing.stop payload',
        socketId: client.id,
        errors: parseResult.error.errors,
      });
      return;
    }

    const data = parseResult.data;
    const { userId, workspaceId } = client.data || {};
    if (workspaceId && userId) {
      // Broadcast typing stop indicator to workspace
      client.to(getWorkspaceRoom(workspaceId)).emit('chat.message', {
        id: `typing-stop-${userId}`,
        chatId: data.chatId,
        role: 'system',
        content: '[typing_stopped]',
        createdAt: new Date().toISOString(),
      } as ChatMessagePayload);
    }
  }

  /**
   * Handle sync request after reconnection
   * Returns current state counts so client can detect if they missed events
   * SECURITY: Validates input with Zod schema
   */
  @SubscribeMessage('sync.request')
  async handleSyncRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() rawData: unknown,
  ) {
    // SECURITY: Validate input
    const parseResult = SyncRequestSchema.safeParse(rawData);
    if (!parseResult.success) {
      this.logger.warn({
        message: 'Invalid sync.request payload',
        socketId: client.id,
        errors: parseResult.error.errors,
      });
      return;
    }

    const { workspaceId } = client.data || {};
    if (!workspaceId) return;

    try {
      // Query actual counts from database for sync verification
      const userId = client.data?.userId;
      const [pendingApprovals, unreadNotifications] = await Promise.all([
        this.prisma.approvalItem.count({
          where: { workspaceId, status: 'pending' },
        }),
        // Count unread notifications for this user in this workspace
        userId
          ? this.prisma.notification.count({
              where: { workspaceId, userId, readAt: null },
            })
          : Promise.resolve(0),
      ]);

      const syncState: SyncStatePayload = {
        pendingApprovals,
        unreadNotifications,
        lastEventTimestamp: new Date().toISOString(),
      };

      client.emit('sync.state', syncState);
    } catch (error) {
      this.logger.error({
        message: 'Failed to fetch sync state from database',
        socketId: client.id,
        workspaceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Emit a fallback sync state with zeros to avoid leaving client hanging
      client.emit('sync.state', {
        pendingApprovals: 0,
        unreadNotifications: 0,
        lastEventTimestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle PM presence updates
   * Tracks user presence in projects with 30-second heartbeat
   * SECURITY: Validates input and verifies project access
   */
  @SubscribeMessage('pm.presence.update')
  async handlePMPresenceUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() rawData: unknown,
  ) {
    // SECURITY: Validate input
    const parseResult = PMPresenceUpdateSchema.safeParse(rawData);
    if (!parseResult.success) {
      this.logger.warn({
        message: 'Invalid pm.presence.update payload',
        socketId: client.id,
        errors: parseResult.error.errors,
      });
      return;
    }

    const data = parseResult.data;
    const { userId, workspaceId } = client.data || {};
    if (!userId || !workspaceId) return;

    try {
      // SECURITY: Verify user has access to project via team membership
      const teamMember = await this.prisma.teamMember.findFirst({
        where: {
          userId,
          isActive: true,
          team: {
            projectId: data.projectId,
            project: {
              workspaceId,
              deletedAt: null,
            },
          },
        },
      });

      if (!teamMember) {
        this.logger.warn({
          message: 'User does not have access to project',
          socketId: client.id,
          userId,
          projectId: data.projectId,
        });
        return;
      }

      // Get user details for broadcast
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, image: true },
      });

      if (!user) {
        this.logger.warn({
          message: 'User not found',
          socketId: client.id,
          userId,
        });
        return;
      }

      // Join project room if not already joined
      const projectRoom = getProjectRoom(data.projectId);
      if (!client.rooms.has(projectRoom)) {
        await client.join(projectRoom);
      }

      // Track this project room for cleanup on disconnect
      if (!client.data.projectRooms) {
        client.data.projectRooms = new Set<string>();
      }
      client.data.projectRooms.add(data.projectId);

      // Update presence in Redis
      await this.presenceService.updatePresence(userId, data.projectId, {
        page: data.page,
        taskId: data.taskId,
      });

      // Build presence payload for broadcast
      const presencePayload: PresencePayload = {
        userId: user.id,
        userName: user.name || user.email,
        userAvatar: user.image,
        projectId: data.projectId,
        taskId: data.taskId,
        page: data.page,
        timestamp: new Date().toISOString(),
      };

      // Broadcast presence update to project room
      // Note: We broadcast 'updated' for all heartbeats - clients can track join/leave locally
      this.broadcastPMPresenceUpdated(data.projectId, presencePayload);

      this.logger.debug({
        message: 'PM presence updated',
        userId,
        projectId: data.projectId,
        page: data.page,
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to handle PM presence update',
        socketId: client.id,
        userId,
        projectId: data.projectId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ============================================
  // DM-11.2: Dashboard State Sync Handlers
  // ============================================

  /**
   * Check if user is within rate limit for dashboard state updates
   */
  private checkDashboardStateRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = this.dashboardStateRateLimits.get(userId);

    if (!userLimit || now > userLimit.resetAt) {
      // Start new window
      this.dashboardStateRateLimits.set(userId, {
        count: 1,
        resetAt: now + this.DASHBOARD_STATE_RATE_WINDOW_MS,
      });
      return true;
    }

    if (userLimit.count >= this.DASHBOARD_STATE_RATE_LIMIT) {
      return false;
    }

    userLimit.count++;
    return true;
  }

  /**
   * Handle dashboard state updates from clients
   * Validates, rate limits, and broadcasts to other tabs/devices
   * SECURITY: Validates input with Zod schema, rate limits per user
   */
  @SubscribeMessage(WS_EVENTS.DASHBOARD_STATE_UPDATE)
  async handleDashboardStateUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() rawData: unknown,
  ) {
    const { userId, workspaceId } = client.data || {};

    if (!userId || !workspaceId) {
      this.logger.warn({
        message: 'Dashboard state update from unauthenticated client',
        socketId: client.id,
      });
      return;
    }

    // SECURITY: Validate payload size
    const payloadSize = JSON.stringify(rawData).length;
    if (payloadSize > this.MAX_STATE_PAYLOAD_SIZE) {
      this.logger.warn({
        message: 'Dashboard state update payload too large',
        socketId: client.id,
        userId,
        payloadSize,
        maxSize: this.MAX_STATE_PAYLOAD_SIZE,
      });
      return;
    }

    // SECURITY: Validate input with Zod
    const parseResult = DashboardStateUpdatePayloadSchema.safeParse(rawData);
    if (!parseResult.success) {
      this.logger.warn({
        message: 'Invalid dashboard.state.update payload',
        socketId: client.id,
        userId,
        errors: parseResult.error.errors,
      });
      return;
    }

    const data = parseResult.data;

    // Rate limit check
    if (!this.checkDashboardStateRateLimit(userId)) {
      this.logger.warn({
        message: 'Dashboard state update rate limit exceeded',
        socketId: client.id,
        userId,
      });
      return;
    }

    // Broadcast to all other clients in the user's dashboard state room
    const dashboardStateRoom = getDashboardStateRoom(userId);
    const syncPayload: DashboardStateSyncPayload = {
      path: data.path,
      value: data.value,
      version: data.version,
      sourceTabId: data.sourceTabId,
    };

    // Emit to all clients in the room (including sender - sender filters by tabId)
    (this.server.to(dashboardStateRoom) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.DASHBOARD_STATE_SYNC,
      syncPayload,
    );

    // Also persist to Redis for durability
    try {
      await this.dashboardStateService.saveState(userId, workspaceId, {
        version: data.version,
        state: { [data.path]: data.value },
      });
    } catch (error) {
      // Log but don't fail the broadcast - Redis persistence is optional
      this.logger.warn({
        message: 'Failed to persist dashboard state update to Redis',
        userId,
        path: data.path,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    this.logger.debug({
      message: 'Dashboard state update broadcast',
      userId,
      path: data.path,
      version: data.version,
      sourceTabId: data.sourceTabId,
    });
  }

  /**
   * Handle dashboard state request on reconnection
   * Returns full state from Redis to the requesting client
   * SECURITY: Validates input with Zod schema
   */
  @SubscribeMessage(WS_EVENTS.DASHBOARD_STATE_REQUEST)
  async handleDashboardStateRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() rawData: unknown,
  ) {
    const { userId, workspaceId } = client.data || {};

    if (!userId || !workspaceId) {
      this.logger.warn({
        message: 'Dashboard state request from unauthenticated client',
        socketId: client.id,
      });
      return;
    }

    // SECURITY: Validate input with Zod
    const parseResult = DashboardStateRequestPayloadSchema.safeParse(rawData);
    if (!parseResult.success) {
      this.logger.warn({
        message: 'Invalid dashboard.state.request payload',
        socketId: client.id,
        userId,
        errors: parseResult.error.errors,
      });
      return;
    }

    const data = parseResult.data;

    try {
      // Fetch full state from Redis
      const storedState = await this.dashboardStateService.getState(userId, workspaceId);

      if (!storedState) {
        // No state stored - send empty state
        const fullPayload: DashboardStateFullPayload = {
          state: {},
          version: 0,
        };
        client.emit(WS_EVENTS.DASHBOARD_STATE_FULL, fullPayload);
        return;
      }

      // Only send if server version is newer than client's known version
      if (storedState.version > data.lastKnownVersion) {
        const fullPayload: DashboardStateFullPayload = {
          state: storedState.state as Record<string, unknown>,
          version: storedState.version,
        };
        client.emit(WS_EVENTS.DASHBOARD_STATE_FULL, fullPayload);

        this.logger.debug({
          message: 'Dashboard state recovery sent',
          userId,
          clientVersion: data.lastKnownVersion,
          serverVersion: storedState.version,
        });
      } else {
        this.logger.debug({
          message: 'Dashboard state request - client already up to date',
          userId,
          clientVersion: data.lastKnownVersion,
          serverVersion: storedState.version,
        });
      }
    } catch (error) {
      this.logger.error({
        message: 'Failed to fetch dashboard state from Redis',
        socketId: client.id,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ============================================
  // Server-Side Broadcast Methods
  // ============================================

  /**
   * Emit an event to all clients in a workspace
   */
  emitToWorkspace<K extends keyof ServerToClientEvents>(
    workspaceId: string,
    event: K,
    data: Parameters<ServerToClientEvents[K]>[0],
  ): void {
    const room = getWorkspaceRoom(workspaceId);
    // Use type assertion to work around Socket.io typing complexity
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      event as string,
      data,
    );

    this.logger.debug({
      message: 'Event emitted to workspace',
      event,
      workspaceId,
      room,
    });
  }

  /**
   * Emit an event to a specific user
   */
  emitToUser<K extends keyof ServerToClientEvents>(
    userId: string,
    event: K,
    data: Parameters<ServerToClientEvents[K]>[0],
  ): void {
    const room = getUserRoom(userId);
    // Use type assertion to work around Socket.io typing complexity
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      event as string,
      data,
    );

    this.logger.debug({
      message: 'Event emitted to user',
      event,
      userId,
      room,
    });
  }

  // ============================================
  // Typed Broadcast Helpers
  // ============================================

  /**
   * Broadcast approval created event
   */
  broadcastApprovalCreated(workspaceId: string, approval: ApprovalEventPayload): void {
    this.emitToWorkspace(workspaceId, WS_EVENTS.APPROVAL_CREATED, approval);
  }

  /**
   * Broadcast approval updated event
   */
  broadcastApprovalUpdated(workspaceId: string, update: ApprovalUpdatePayload): void {
    this.emitToWorkspace(workspaceId, WS_EVENTS.APPROVAL_UPDATED, update);
  }

  /**
   * Broadcast approval deleted event
   */
  broadcastApprovalDeleted(workspaceId: string, id: string): void {
    this.emitToWorkspace(workspaceId, WS_EVENTS.APPROVAL_DELETED, { id });
  }

  /**
   * Broadcast agent status changed event
   */
  broadcastAgentStatusChanged(workspaceId: string, status: AgentStatusPayload): void {
    this.emitToWorkspace(workspaceId, WS_EVENTS.AGENT_STATUS_CHANGED, status);
  }

  /**
   * Broadcast agent run started event
   */
  broadcastAgentRunStarted(workspaceId: string, run: AgentRunPayload): void {
    this.emitToWorkspace(workspaceId, WS_EVENTS.AGENT_RUN_STARTED, run);
  }

  /**
   * Broadcast agent run completed event
   */
  broadcastAgentRunCompleted(workspaceId: string, run: AgentRunPayload): void {
    this.emitToWorkspace(workspaceId, WS_EVENTS.AGENT_RUN_COMPLETED, run);
  }

  /**
   * Broadcast agent run failed event
   */
  broadcastAgentRunFailed(workspaceId: string, run: AgentRunFailedPayload): void {
    this.emitToWorkspace(workspaceId, WS_EVENTS.AGENT_RUN_FAILED, run);
  }

  /**
   * Broadcast new notification event
   */
  broadcastNotification(
    workspaceId: string,
    notification: NotificationPayload,
    userId?: string,
  ): void {
    if (userId) {
      // Send to specific user
      this.emitToUser(userId, WS_EVENTS.NOTIFICATION_NEW, notification);
    } else {
      // Send to entire workspace
      this.emitToWorkspace(workspaceId, WS_EVENTS.NOTIFICATION_NEW, notification);
    }
  }

  /**
   * Broadcast chat message
   */
  broadcastChatMessage(workspaceId: string, message: ChatMessagePayload): void {
    this.emitToWorkspace(workspaceId, WS_EVENTS.CHAT_MESSAGE, message);
  }

  // ============================================
  // PM Broadcast Methods
  // ============================================

  /**
   * Broadcast PM task created event to project room
   */
  broadcastPMTaskCreated(projectId: string, task: PMTaskEventPayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_TASK_CREATED,
      task,
    );

    this.logger.debug({
      message: 'PM task created event emitted',
      projectId,
      taskId: task.id,
      room,
    });
  }

  /**
   * Broadcast PM task updated event to project room
   */
  broadcastPMTaskUpdated(projectId: string, update: PMTaskUpdatePayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_TASK_UPDATED,
      update,
    );

    this.logger.debug({
      message: 'PM task updated event emitted',
      projectId,
      taskId: update.id,
      room,
    });
  }

  /**
   * Broadcast PM task deleted event to project room
   */
  broadcastPMTaskDeleted(projectId: string, deleted: PMTaskDeletedPayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_TASK_DELETED,
      deleted,
    );

    this.logger.debug({
      message: 'PM task deleted event emitted',
      projectId,
      taskId: deleted.id,
      room,
    });
  }

  /**
   * Broadcast PM task status changed event to project room
   */
  broadcastPMTaskStatusChanged(projectId: string, status: PMTaskStatusPayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_TASK_STATUS_CHANGED,
      status,
    );

    this.logger.debug({
      message: 'PM task status changed event emitted',
      projectId,
      taskId: status.id,
      fromStatus: status.fromStatus,
      toStatus: status.toStatus,
      room,
    });
  }

  /**
   * Broadcast PM phase created event to project room
   */
  broadcastPMPhaseCreated(projectId: string, phase: PMPhaseEventPayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_PHASE_CREATED,
      phase,
    );

    this.logger.debug({
      message: 'PM phase created event emitted',
      projectId,
      phaseId: phase.id,
      room,
    });
  }

  /**
   * Broadcast PM phase updated event to project room
   */
  broadcastPMPhaseUpdated(projectId: string, phase: PMPhaseEventPayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_PHASE_UPDATED,
      phase,
    );

    this.logger.debug({
      message: 'PM phase updated event emitted',
      projectId,
      phaseId: phase.id,
      room,
    });
  }

  /**
   * Broadcast PM phase transitioned event to project room
   */
  broadcastPMPhaseTransitioned(
    projectId: string,
    transition: PMPhaseTransitionPayload,
  ): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_PHASE_TRANSITIONED,
      transition,
    );

    this.logger.debug({
      message: 'PM phase transitioned event emitted',
      projectId,
      phaseId: transition.id,
      fromStatus: transition.fromStatus,
      toStatus: transition.toStatus,
      room,
    });
  }

  /**
   * Broadcast PM project created event to workspace room
   */
  broadcastPMProjectCreated(workspaceId: string, project: PMProjectEventPayload): void {
    this.emitToWorkspace(workspaceId, WS_EVENTS.PM_PROJECT_CREATED, project);
  }

  /**
   * Broadcast PM project updated event to workspace room
   */
  broadcastPMProjectUpdated(workspaceId: string, project: PMProjectEventPayload): void {
    this.emitToWorkspace(workspaceId, WS_EVENTS.PM_PROJECT_UPDATED, project);
  }

  /**
   * Broadcast PM project deleted event to workspace room
   */
  broadcastPMProjectDeleted(workspaceId: string, deleted: PMProjectDeletedPayload): void {
    this.emitToWorkspace(workspaceId, WS_EVENTS.PM_PROJECT_DELETED, deleted);
  }

  /**
   * Broadcast PM team member added event to project room
   */
  broadcastPMTeamMemberAdded(projectId: string, change: PMTeamChangePayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_TEAM_MEMBER_ADDED,
      change,
    );

    this.logger.debug({
      message: 'PM team member added event emitted',
      projectId,
      userId: change.userId,
      role: change.role,
      room,
    });
  }

  /**
   * Broadcast PM team member removed event to project room
   */
  broadcastPMTeamMemberRemoved(projectId: string, change: PMTeamChangePayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_TEAM_MEMBER_REMOVED,
      change,
    );

    this.logger.debug({
      message: 'PM team member removed event emitted',
      projectId,
      userId: change.userId,
      room,
    });
  }

  /**
   * Broadcast PM team member updated event to project room
   */
  broadcastPMTeamMemberUpdated(projectId: string, change: PMTeamChangePayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_TEAM_MEMBER_UPDATED,
      change,
    );

    this.logger.debug({
      message: 'PM team member updated event emitted',
      projectId,
      userId: change.userId,
      role: change.role,
      room,
    });
  }

  /**
   * Broadcast PM presence joined event to project room
   */
  broadcastPMPresenceJoined(projectId: string, presence: PresencePayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_PRESENCE_JOINED,
      presence,
    );

    this.logger.debug({
      message: 'PM presence joined event emitted',
      projectId,
      userId: presence.userId,
      page: presence.page,
      room,
    });
  }

  /**
   * Broadcast PM presence left event to project room
   */
  broadcastPMPresenceLeft(projectId: string, presence: PresencePayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_PRESENCE_LEFT,
      presence,
    );

    this.logger.debug({
      message: 'PM presence left event emitted',
      projectId,
      userId: presence.userId,
      room,
    });
  }

  /**
   * Broadcast PM presence updated event to project room
   */
  broadcastPMPresenceUpdated(projectId: string, presence: PresencePayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_PRESENCE_UPDATED,
      presence,
    );

    this.logger.debug({
      message: 'PM presence updated event emitted',
      projectId,
      userId: presence.userId,
      page: presence.page,
      room,
    });
  }

  // ============================================
  // PM Health and Risk Broadcast Methods (PM-12.3)
  // ============================================

  /**
   * Broadcast PM health critical event to workspace
   */
  broadcastPMHealthCritical(workspaceId: string, payload: PMHealthEventPayload): void {
    this.emitToWorkspace(workspaceId, WS_EVENTS.PM_HEALTH_CRITICAL, payload);

    this.logger.debug({
      message: 'PM health critical event emitted',
      workspaceId,
      projectId: payload.projectId,
      score: payload.score,
    });
  }

  /**
   * Broadcast PM health warning event to workspace
   */
  broadcastPMHealthWarning(workspaceId: string, payload: PMHealthEventPayload): void {
    this.emitToWorkspace(workspaceId, WS_EVENTS.PM_HEALTH_WARNING, payload);

    this.logger.debug({
      message: 'PM health warning event emitted',
      workspaceId,
      projectId: payload.projectId,
      score: payload.score,
    });
  }

  /**
   * Broadcast PM risk detected event to workspace
   */
  broadcastPMRiskDetected(workspaceId: string, payload: PMRiskEventPayload): void {
    this.emitToWorkspace(workspaceId, WS_EVENTS.PM_RISK_DETECTED, payload);

    this.logger.debug({
      message: 'PM risk detected event emitted',
      workspaceId,
      projectId: payload.projectId,
      riskId: payload.riskId,
      severity: payload.severity,
    });
  }

  // ============================================
  // PM Agent Streaming Events (PM-12.6)
  // ============================================

  /**
   * Broadcast agent stream start to project room
   */
  broadcastPMAgentStreamStart(projectId: string, payload: PMAgentStreamStartPayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_AGENT_STREAM_START,
      payload,
    );

    this.logger.debug({
      message: 'PM agent stream start emitted',
      projectId,
      agentId: payload.agentId,
      streamId: payload.streamId,
      room,
    });
  }

  /**
   * Broadcast agent stream chunk to project room
   */
  broadcastPMAgentStreamChunk(projectId: string, payload: PMAgentStreamChunkPayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_AGENT_STREAM_CHUNK,
      payload,
    );
    // No logging for chunks to avoid noise
  }

  /**
   * Broadcast agent stream end to project room
   */
  broadcastPMAgentStreamEnd(projectId: string, payload: PMAgentStreamEndPayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_AGENT_STREAM_END,
      payload,
    );

    this.logger.debug({
      message: 'PM agent stream end emitted',
      projectId,
      agentId: payload.agentId,
      streamId: payload.streamId,
      durationMs: payload.durationMs,
      room,
    });
  }

  /**
   * Broadcast agent typing indicator to project room
   */
  broadcastPMAgentTyping(projectId: string, payload: PMAgentTypingPayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_AGENT_TYPING,
      payload,
    );
  }

  // ============================================
  // PM Suggestion Events (PM-12.6)
  // ============================================

  /**
   * Broadcast suggestion created event to project room
   */
  broadcastPMSuggestionCreated(projectId: string, payload: PMSuggestionEventPayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_SUGGESTION_CREATED,
      payload,
    );

    this.logger.debug({
      message: 'PM suggestion created emitted',
      projectId,
      suggestionId: payload.id,
      type: payload.type,
      room,
    });
  }

  /**
   * Broadcast suggestion updated event to project room
   */
  broadcastPMSuggestionUpdated(projectId: string, payload: PMSuggestionEventPayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_SUGGESTION_UPDATED,
      payload,
    );

    this.logger.debug({
      message: 'PM suggestion updated emitted',
      projectId,
      suggestionId: payload.id,
      status: payload.status,
      room,
    });
  }

  /**
   * Broadcast suggestion accepted event to project room
   */
  broadcastPMSuggestionAccepted(projectId: string, payload: PMSuggestionActionPayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_SUGGESTION_ACCEPTED,
      payload,
    );

    this.logger.debug({
      message: 'PM suggestion accepted emitted',
      projectId,
      suggestionId: payload.id,
      actionBy: payload.actionBy,
      room,
    });
  }

  /**
   * Broadcast suggestion rejected event to project room
   */
  broadcastPMSuggestionRejected(projectId: string, payload: PMSuggestionActionPayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_SUGGESTION_REJECTED,
      payload,
    );

    this.logger.debug({
      message: 'PM suggestion rejected emitted',
      projectId,
      suggestionId: payload.id,
      actionBy: payload.actionBy,
      room,
    });
  }

  /**
   * Broadcast suggestion snoozed event to project room
   */
  broadcastPMSuggestionSnoozed(projectId: string, payload: PMSuggestionActionPayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_SUGGESTION_SNOOZED,
      payload,
    );

    this.logger.debug({
      message: 'PM suggestion snoozed emitted',
      projectId,
      suggestionId: payload.id,
      snoozeUntil: payload.snoozeUntil,
      room,
    });
  }

  // ============================================
  // PM Health Live Update Events (PM-12.6)
  // ============================================

  /**
   * Broadcast health score update to project room
   */
  broadcastPMHealthUpdated(projectId: string, payload: PMHealthUpdatePayload): void {
    const room = getProjectRoom(projectId);
    (this.server.to(room) as { emit: (event: string, data: unknown) => void }).emit(
      WS_EVENTS.PM_HEALTH_UPDATED,
      payload,
    );

    this.logger.debug({
      message: 'PM health updated emitted',
      projectId,
      score: payload.score,
      previousScore: payload.previousScore,
      trend: payload.trend,
      room,
    });
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Extract JWT token from socket handshake
   * SECURITY: Token must be in handshake.auth.token
   * Authorization header fallback is disabled by default (opt-in via WS_ALLOW_AUTH_HEADER_FALLBACK)
   */
  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth || {};
    const headers = client.handshake.headers || {};

    const getCookieValue = (cookieHeader: string, cookieName: string): string | null => {
      // Split on ';' pairs and parse each key=value pair using the first '=' occurrence.
      for (const part of cookieHeader.split(';')) {
        const trimmed = part.trim();
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq);
        if (key !== cookieName) continue;
        let value = trimmed.slice(eq + 1);
        // Strip optional surrounding quotes
        if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        return value;
      }
      return null;
    };

    // Try handshake.auth.token (the only supported method)
    if (auth.token && typeof auth.token === 'string') {
      return auth.token;
    }

    // Development fallback: allow token via cookie when session token is HttpOnly (browser can't read it).
    // SECURITY: opt-in only via WS_ALLOW_COOKIE_FALLBACK=true (even in dev).
    const allowCookieFallback = process.env.WS_ALLOW_COOKIE_FALLBACK === 'true';
    if (process.env.NODE_ENV === 'production' && allowCookieFallback) {
      this.logger.warn(
        '[SECURITY] WS_ALLOW_COOKIE_FALLBACK is enabled in production. Ensure origin validation, monitoring, and session controls are in place.',
      );
    }
    if (allowCookieFallback) {
      const cookieHeader = headers.cookie;
      if (cookieHeader && typeof cookieHeader === 'string') {
        const token = getCookieValue(cookieHeader, 'hyvve.session_token');
        if (token) {
          try {
            return decodeURIComponent(token);
          } catch {
            return token;
          }
        }
      }
    }

    // DEPRECATED: Authorization header fallback - disabled by default
    // Enable with WS_ALLOW_AUTH_HEADER_FALLBACK=true during migration only
    const allowHeaderFallback = process.env.WS_ALLOW_AUTH_HEADER_FALLBACK === 'true';
    if (allowHeaderFallback) {
      const authHeader = headers.authorization;
      if (authHeader && typeof authHeader === 'string') {
        const parts = authHeader.trim().split(/\s+/);
        if (parts.length === 2) {
          const [type, token] = parts;
          if (type.toLowerCase() === 'bearer' && token) {
            this.logger.warn({
              event: 'deprecated_auth_header',
              message:
                'Client using deprecated Authorization header. ' +
                'Update to handshake.auth.token. This fallback will be removed.',
              socketId: client.id,
            });
            return token;
          }
        }
      }
    }

    return null;
  }

  /**
   * Validate JWT token against database sessions table
   * SECURITY: This is the same validation as AuthGuard uses for REST endpoints
   *
   * @param token - JWT token string
   * @returns Validated user data or null if invalid
   */
  private async validateToken(token: string): Promise<{
    userId: string;
    workspaceId: string;
    email: string;
    sessionId: string;
  } | null> {
    try {
      // Query sessions table to verify token (same as AuthGuard)
      const session = await this.prisma.session.findUnique({
        where: { token },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      // Check if session exists
      if (!session) {
        return null;
      }

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        return null;
      }

      // Check if user exists
      if (!session.user) {
        return null;
      }

      // Get workspace ID from session (activeWorkspaceId is the current workspace)
      const workspaceId = session.activeWorkspaceId;
      if (!workspaceId) {
        this.logger.warn({
          message: 'Session has no active workspace',
          sessionId: session.id,
          userId: session.user.id,
        });
        return null;
      }

      return {
        userId: session.user.id,
        workspaceId,
        email: session.user.email,
        sessionId: session.id,
      };
    } catch (error) {
      this.logger.error({
        message: 'Token validation error',
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Check rate limits for new connections
   * SECURITY: Prevents DoS by limiting connections per user/workspace
   */
  private checkRateLimits(userId: string, workspaceId: string): boolean {
    const workspaceConnections = this.connectedClients.get(workspaceId)?.size || 0;
    const userConnections = this.userConnections.get(userId)?.size || 0;

    if (workspaceConnections >= MAX_CONNECTIONS_PER_WORKSPACE) {
      this.logger.warn({
        message: 'Workspace connection limit reached',
        workspaceId,
        currentConnections: workspaceConnections,
        limit: MAX_CONNECTIONS_PER_WORKSPACE,
      });
      return false;
    }

    if (userConnections >= MAX_CONNECTIONS_PER_USER) {
      this.logger.warn({
        message: 'User connection limit reached',
        userId,
        currentConnections: userConnections,
        limit: MAX_CONNECTIONS_PER_USER,
      });
      return false;
    }

    return true;
  }

  /**
   * Track a new connection for both workspace and user
   */
  private trackConnection(workspaceId: string, socketId: string, userId?: string): void {
    // Track by workspace
    if (!this.connectedClients.has(workspaceId)) {
      this.connectedClients.set(workspaceId, new Set());
    }
    this.connectedClients.get(workspaceId)!.add(socketId);

    // Track by user for rate limiting
    if (userId) {
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(socketId);
    }
  }

  /**
   * Untrack a disconnected connection
   */
  private untrackConnection(workspaceId: string, socketId: string, userId?: string): void {
    // Untrack from workspace
    const workspaceClients = this.connectedClients.get(workspaceId);
    if (workspaceClients) {
      workspaceClients.delete(socketId);
      if (workspaceClients.size === 0) {
        this.connectedClients.delete(workspaceId);
      }
    }

    // Untrack from user
    if (userId) {
      const userClients = this.userConnections.get(userId);
      if (userClients) {
        userClients.delete(socketId);
        if (userClients.size === 0) {
          this.userConnections.delete(userId);
        }
      }
    }
  }

  /**
   * Get count of connected clients for a workspace
   */
  getWorkspaceClientCount(workspaceId: string): number {
    return this.connectedClients.get(workspaceId)?.size || 0;
  }

  /**
   * Get total connected clients
   */
  getTotalClientCount(): number {
    let total = 0;
    for (const clients of this.connectedClients.values()) {
      total += clients.size;
    }
    return total;
  }
}
