/**
 * WebSocket Real-Time Types
 *
 * Type definitions for Socket.io server-client communication.
 * These types ensure type-safe event handling across the WebSocket connection.
 *
 * @see Story 16-15: Implement WebSocket Real-Time Updates
 */

/**
 * Server-to-Client Events
 * Events emitted from the server to connected clients
 */
export interface ServerToClientEvents {
  // Approval events
  'approval.created': (data: ApprovalEventPayload) => void;
  'approval.updated': (data: ApprovalUpdatePayload) => void;
  'approval.deleted': (data: { id: string }) => void;

  // Agent events
  'agent.status.changed': (data: AgentStatusPayload) => void;
  'agent.run.started': (data: AgentRunPayload) => void;
  'agent.run.completed': (data: AgentRunPayload) => void;
  'agent.run.failed': (data: AgentRunFailedPayload) => void;

  // Notification events
  'notification.new': (data: NotificationPayload) => void;

  // Chat events
  'chat.message': (data: ChatMessagePayload) => void;

  // Connection status events
  'connection.status': (data: ConnectionStatusPayload) => void;

  // Sync events for reconnection
  'sync.state': (data: SyncStatePayload) => void;
}

/**
 * Client-to-Server Events
 * Events emitted from clients to the server
 */
export interface ClientToServerEvents {
  // Presence updates
  'presence.update': (data: { status: 'online' | 'away' | 'busy' }) => void;

  // Typing indicators
  'typing.start': (data: { chatId: string }) => void;
  'typing.stop': (data: { chatId: string }) => void;

  // Room management (handled internally but can be requested)
  'room.join': (data: { workspaceId: string }) => void;
  'room.leave': (data: { workspaceId: string }) => void;

  // Request sync after reconnection
  'sync.request': (data: { lastEventId?: string; since?: string }) => void;
}

/**
 * Inter-Server Events (for potential Redis adapter scaling)
 */
export interface InterServerEvents {
  ping: () => void;
}

/**
 * Socket Data (stored on each socket connection)
 */
export interface SocketData {
  userId: string;
  workspaceId: string;
  email?: string;
  sessionId?: string;
  connectedAt: Date;
}

// ============================================
// Event Payloads
// ============================================

/**
 * Approval event payload for created approvals
 */
export interface ApprovalEventPayload {
  id: string;
  type: string;
  title: string;
  description?: string;
  confidenceScore: number;
  recommendation: 'approve' | 'review' | 'full_review';
  status: string;
  assignedToId?: string;
  createdAt: string;
  dueAt?: string;
  sourceModule?: string;
  sourceId?: string;
  correlationId?: string;
}

/**
 * Approval update payload (partial update)
 */
export interface ApprovalUpdatePayload {
  id: string;
  status?: string;
  confidenceScore?: number;
  recommendation?: 'approve' | 'review' | 'full_review';
  assignedToId?: string;
  decision?: 'approved' | 'rejected';
  decidedById?: string;
  decisionNotes?: string;
  decidedAt?: string;
  correlationId?: string;
}

/**
 * Agent status change payload
 */
export interface AgentStatusPayload {
  agentId: string;
  agentName: string;
  status: 'idle' | 'running' | 'paused' | 'error' | 'offline';
  lastActiveAt?: string;
  currentTask?: string;
  correlationId?: string;
}

/**
 * Agent run payload
 */
export interface AgentRunPayload {
  runId: string;
  agentId: string;
  agentName: string;
  status: 'started' | 'completed' | 'failed';
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  durationMs?: number;
  tokensUsed?: number;
  triggeredBy?: 'user' | 'system' | 'schedule';
  correlationId?: string;
}

/**
 * Agent run failed payload
 */
export interface AgentRunFailedPayload extends AgentRunPayload {
  error: string;
  errorCode?: string;
}

/**
 * Notification payload
 */
export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
  read: boolean;
  correlationId?: string;
}

/**
 * Chat message payload
 */
export interface ChatMessagePayload {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
  }>;
  correlationId?: string;
}

/**
 * Connection status payload
 */
export interface ConnectionStatusPayload {
  status: 'connected' | 'reconnecting' | 'disconnected';
  message?: string;
  reconnectAttempt?: number;
  maxReconnectAttempts?: number;
}

/**
 * Sync state payload for reconnection
 */
export interface SyncStatePayload {
  pendingApprovals?: number;
  unreadNotifications?: number;
  activeAgents?: number;
  lastEventTimestamp?: string;
}

// ============================================
// WebSocket Event Names
// ============================================

/**
 * WebSocket event names for type-safe event emission
 */
export const WS_EVENTS = {
  // Approval events
  APPROVAL_CREATED: 'approval.created',
  APPROVAL_UPDATED: 'approval.updated',
  APPROVAL_DELETED: 'approval.deleted',

  // Agent events
  AGENT_STATUS_CHANGED: 'agent.status.changed',
  AGENT_RUN_STARTED: 'agent.run.started',
  AGENT_RUN_COMPLETED: 'agent.run.completed',
  AGENT_RUN_FAILED: 'agent.run.failed',

  // Notification events
  NOTIFICATION_NEW: 'notification.new',

  // Chat events
  CHAT_MESSAGE: 'chat.message',

  // Connection events
  CONNECTION_STATUS: 'connection.status',

  // Sync events
  SYNC_STATE: 'sync.state',
} as const;

export type WsEventName = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];

// ============================================
// Room Names
// ============================================

/**
 * Generate room name for workspace
 */
export function getWorkspaceRoom(workspaceId: string): string {
  return `workspace:${workspaceId}`;
}

/**
 * Generate room name for user-specific events
 */
export function getUserRoom(userId: string): string {
  return `user:${userId}`;
}
