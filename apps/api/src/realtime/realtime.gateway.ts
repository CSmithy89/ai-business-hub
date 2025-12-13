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
  WS_EVENTS,
  getWorkspaceRoom,
  getUserRoom,
} from './realtime.types';

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

// Rate limiting constants
const MAX_CONNECTIONS_PER_WORKSPACE = 100;
const MAX_CONNECTIONS_PER_USER = 5;

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
      const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
      ];
      // Allow requests with no origin (mobile apps, curl, etc) in development
      if (!origin && process.env.NODE_ENV !== 'production') {
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

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
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
      };

      // Join workspace room for multi-tenant isolation
      const workspaceRoom = getWorkspaceRoom(workspaceId);
      await client.join(workspaceRoom);

      // Join user-specific room for targeted events
      const userRoom = getUserRoom(userId);
      await client.join(userRoom);

      // Track connection for rate limiting
      this.trackConnection(workspaceId, client.id, userId);

      this.logger.log({
        message: 'Client connected (authenticated)',
        socketId: client.id,
        userId,
        workspaceId,
        rooms: [workspaceRoom, userRoom],
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
  handleDisconnect(client: Socket) {
    const { userId, workspaceId } = client.data || {};

    // Untrack connection from both workspace and user tracking
    if (workspaceId) {
      this.untrackConnection(workspaceId, client.id, userId);
    }

    this.logger.log({
      message: 'Client disconnected',
      socketId: client.id,
      userId,
      workspaceId,
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

    // Query actual counts from database for sync verification
    const [pendingApprovals, unreadNotifications] = await Promise.all([
      this.prisma.approvalItem.count({
        where: { workspaceId, status: 'pending' },
      }),
      // Notification table might not exist yet, so we catch errors
      Promise.resolve(0), // TODO: Add notification count when Notification model exists
    ]);

    const syncState: SyncStatePayload = {
      pendingApprovals,
      unreadNotifications,
      lastEventTimestamp: new Date().toISOString(),
    };

    client.emit('sync.state', syncState);
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
  // Helper Methods
  // ============================================

  /**
   * Extract JWT token from socket handshake
   * SECURITY: Token should be in handshake.auth.token or Authorization header
   */
  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth || {};
    const headers = client.handshake.headers || {};

    // Try handshake.auth.token first (preferred for WebSocket)
    if (auth.token && typeof auth.token === 'string') {
      return auth.token;
    }

    // Try Authorization header (Bearer token)
    const authHeader = headers.authorization;
    if (authHeader && typeof authHeader === 'string') {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        return token;
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
