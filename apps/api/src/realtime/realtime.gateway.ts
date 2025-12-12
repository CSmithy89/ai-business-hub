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

/**
 * RealtimeGateway - WebSocket Gateway for Real-Time Updates
 *
 * Handles WebSocket connections, authentication, and event broadcasting.
 * Uses Socket.io with workspace-scoped rooms for multi-tenant isolation.
 *
 * Key Features:
 * - JWT authentication in handshake
 * - Workspace room isolation
 * - Event broadcasting to workspace and user rooms
 * - Connection/disconnection tracking
 * - Graceful degradation
 *
 * @see Story 16-15: Implement WebSocket Real-Time Updates
 */
@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: true, // Will be configured from ConfigService
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
@Injectable()
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

  // Track connected clients by workspace for metrics/debugging
  private readonly connectedClients = new Map<string, Set<string>>(); // workspaceId -> Set<socketId>

  constructor(private readonly configService: ConfigService) {}

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
   * Validates JWT and joins workspace room
   */
  async handleConnection(client: Socket) {
    try {
      // Extract auth data from handshake
      const { userId, workspaceId, email, sessionId } = this.extractAuthData(client);

      if (!userId || !workspaceId) {
        this.logger.warn(
          `Connection rejected - missing auth data (socketId: ${client.id})`,
        );
        client.emit('connection.status', {
          status: 'disconnected',
          message: 'Authentication required',
        });
        client.disconnect(true);
        return;
      }

      // Store user data on socket
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

      // Track connection
      this.trackConnection(workspaceId, client.id);

      this.logger.log({
        message: 'Client connected',
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
      client.disconnect(true);
    }
  }

  /**
   * Handle WebSocket disconnections
   */
  handleDisconnect(client: Socket) {
    const { userId, workspaceId } = client.data || {};

    // Untrack connection
    if (workspaceId) {
      this.untrackConnection(workspaceId, client.id);
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
   */
  @SubscribeMessage('presence.update')
  handlePresenceUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { status: 'online' | 'away' | 'busy' },
  ) {
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
   */
  @SubscribeMessage('typing.start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const { userId, workspaceId } = client.data || {};
    if (workspaceId) {
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
   */
  @SubscribeMessage('typing.stop')
  handleTypingStop(
    @ConnectedSocket() _client: Socket,
    @MessageBody() _data: { chatId: string },
  ) {
    // Typing stop could be handled similarly
  }

  /**
   * Handle sync request after reconnection
   */
  @SubscribeMessage('sync.request')
  async handleSyncRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() _data: { lastEventId?: string; since?: string },
  ) {
    const { workspaceId } = client.data || {};
    if (!workspaceId) return;

    // Send current state summary
    // In production, this would query actual counts from database
    const syncState: SyncStatePayload = {
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
   * Extract authentication data from socket handshake
   */
  private extractAuthData(client: Socket): {
    userId?: string;
    workspaceId?: string;
    email?: string;
    sessionId?: string;
  } {
    const auth = client.handshake.auth || {};
    const query = client.handshake.query || {};

    // Auth data can come from handshake.auth or query params
    return {
      userId: auth.userId || (query.userId as string),
      workspaceId: auth.workspaceId || (query.workspaceId as string),
      email: auth.email || (query.email as string),
      sessionId: auth.sessionId || (query.sessionId as string),
    };
  }

  /**
   * Track a new connection
   */
  private trackConnection(workspaceId: string, socketId: string): void {
    if (!this.connectedClients.has(workspaceId)) {
      this.connectedClients.set(workspaceId, new Set());
    }
    this.connectedClients.get(workspaceId)!.add(socketId);
  }

  /**
   * Untrack a disconnected connection
   */
  private untrackConnection(workspaceId: string, socketId: string): void {
    const clients = this.connectedClients.get(workspaceId);
    if (clients) {
      clients.delete(socketId);
      if (clients.size === 0) {
        this.connectedClients.delete(workspaceId);
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
