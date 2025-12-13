/**
 * WebSocket Real-Time Types (Frontend)
 *
 * Type definitions for Socket.io client-server communication.
 * These mirror the backend types for type-safe event handling.
 *
 * @see Story 16-15: Implement WebSocket Real-Time Updates
 */

/**
 * Server-to-Client Events
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
 */
export interface ClientToServerEvents {
  // Presence updates
  'presence.update': (data: { status: 'online' | 'away' | 'busy' }) => void;

  // Typing indicators
  'typing.start': (data: { chatId: string }) => void;
  'typing.stop': (data: { chatId: string }) => void;

  // Room management
  'room.join': (data: { workspaceId: string }) => void;
  'room.leave': (data: { workspaceId: string }) => void;

  // Request sync after reconnection
  'sync.request': (data: { lastEventId?: string; since?: string }) => void;
}

// ============================================
// Event Payloads
// ============================================

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

export interface AgentStatusPayload {
  agentId: string;
  agentName: string;
  status: 'idle' | 'running' | 'paused' | 'error' | 'offline';
  lastActiveAt?: string;
  currentTask?: string;
  correlationId?: string;
}

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

export interface AgentRunFailedPayload extends AgentRunPayload {
  error: string;
  errorCode?: string;
}

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

export interface ConnectionStatusPayload {
  status: 'connected' | 'reconnecting' | 'disconnected';
  message?: string;
  reconnectAttempt?: number;
  maxReconnectAttempts?: number;
}

export interface SyncStatePayload {
  pendingApprovals?: number;
  unreadNotifications?: number;
  activeAgents?: number;
  lastEventTimestamp?: string;
}

// ============================================
// Connection State
// ============================================

export type ConnectionState = 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'error';

export interface RealtimeConnectionState {
  status: ConnectionState;
  reconnectAttempt: number;
  maxReconnectAttempts: number;
  lastConnectedAt: Date | null;
  error: string | null;
}

// ============================================
// Event Names (for type-safe subscriptions)
// ============================================

export const WS_EVENTS = {
  APPROVAL_CREATED: 'approval.created',
  APPROVAL_UPDATED: 'approval.updated',
  APPROVAL_DELETED: 'approval.deleted',
  AGENT_STATUS_CHANGED: 'agent.status.changed',
  AGENT_RUN_STARTED: 'agent.run.started',
  AGENT_RUN_COMPLETED: 'agent.run.completed',
  AGENT_RUN_FAILED: 'agent.run.failed',
  NOTIFICATION_NEW: 'notification.new',
  CHAT_MESSAGE: 'chat.message',
  CONNECTION_STATUS: 'connection.status',
  SYNC_STATE: 'sync.state',
} as const;

export type WsEventName = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];
