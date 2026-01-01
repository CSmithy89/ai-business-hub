/**
 * WebSocket Real-Time Types (Frontend)
 *
 * Type definitions for Socket.io client-server communication.
 * These mirror the backend types for type-safe event handling.
 *
 * @see Story 16-15: Implement WebSocket Real-Time Updates
 */

import { PresencePayload } from '@hyvve/shared';

// ============================================
// Dashboard State Sync Payloads (DM-11.2)
// ============================================

/**
 * Dashboard state update payload (client -> server)
 */
export interface DashboardStateUpdatePayload {
  /** JSONPath to the updated property (e.g., 'widgets.w1', 'activeProject') */
  path: string;
  /** The new value for the path */
  value: unknown;
  /** Version number for conflict detection */
  version: number;
  /** ISO timestamp of the update */
  timestamp: string;
  /** Tab ID to exclude sender from receiving echo */
  sourceTabId: string;
}

/**
 * Dashboard state sync payload (server -> other clients)
 */
export interface DashboardStateSyncPayload {
  /** JSONPath to the updated property */
  path: string;
  /** The new value for the path */
  value: unknown;
  /** Version number for conflict detection */
  version: number;
  /** Tab ID of the sender (clients filter out if matches their tabId) */
  sourceTabId: string;
}

/**
 * Full dashboard state payload (server -> client on reconnection)
 */
export interface DashboardStateFullPayload {
  /** Full dashboard state */
  state: Record<string, unknown>;
  /** Current version number */
  version: number;
}

/**
 * State request payload (client -> server on reconnection)
 */
export interface DashboardStateRequestPayload {
  /** Last known version number */
  lastKnownVersion: number;
}

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

  // PM Presence events
  'pm.presence.joined': (data: PresencePayload) => void;
  'pm.presence.left': (data: PresencePayload) => void;
  'pm.presence.updated': (data: PresencePayload) => void;

  // PM Task events
  'pm.task.created': (data: PMTaskEventPayload) => void;
  'pm.task.updated': (data: PMTaskUpdatePayload) => void;
  'pm.task.deleted': (data: PMTaskDeletedPayload) => void;
  'pm.task.status_changed': (data: PMTaskStatusPayload) => void;

  // PM Agent Streaming events (PM-12.6)
  'pm.agent.stream.start': (data: PMAgentStreamStartPayload) => void;
  'pm.agent.stream.chunk': (data: PMAgentStreamChunkPayload) => void;
  'pm.agent.stream.end': (data: PMAgentStreamEndPayload) => void;
  'pm.agent.typing': (data: PMAgentTypingPayload) => void;

  // PM Suggestion events (PM-12.6)
  'pm.suggestion.created': (data: PMSuggestionEventPayload) => void;
  'pm.suggestion.updated': (data: PMSuggestionEventPayload) => void;
  'pm.suggestion.accepted': (data: PMSuggestionActionPayload) => void;
  'pm.suggestion.rejected': (data: PMSuggestionActionPayload) => void;
  'pm.suggestion.snoozed': (data: PMSuggestionActionPayload) => void;

  // PM Health Live Update events (PM-12.6)
  'pm.health.updated': (data: PMHealthUpdatePayload) => void;
  'pm.health.critical': (data: PMHealthEventPayload) => void;
  'pm.health.warning': (data: PMHealthEventPayload) => void;

  // Dashboard State Sync events (DM-11.2)
  'dashboard.state.sync': (data: DashboardStateSyncPayload) => void;
  'dashboard.state.full': (data: DashboardStateFullPayload) => void;
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

  // PM Presence updates
  'pm.presence.update': (data: {
    projectId: string;
    taskId?: string;
    page: 'overview' | 'tasks' | 'settings' | 'docs';
  }) => void;

  // Dashboard State Sync events (DM-11.2)
  'dashboard.state.update': (data: DashboardStateUpdatePayload) => void;
  'dashboard.state.request': (data: DashboardStateRequestPayload) => void;
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
// PM Task Event Payloads (Story PM-06.3)
// ============================================

export interface PMTaskEventPayload {
  id: string;
  projectId: string;
  phaseId: string;
  taskNumber: number;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  assigneeId?: string;
  agentId?: string;
  assignmentType: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  correlationId?: string;
}

export interface PMTaskUpdatePayload {
  id: string;
  projectId: string;
  phaseId: string;
  taskNumber: number;
  title?: string;
  description?: string;
  type?: string;
  priority?: string;
  status?: string;
  assigneeId?: string;
  agentId?: string;
  assignmentType?: string;
  dueDate?: string;
  updatedAt: string;
  updatedBy: string;
  correlationId?: string;
}

export interface PMTaskDeletedPayload {
  id: string;
  projectId: string;
  phaseId: string;
  taskNumber: number;
  title: string;
  deletedBy: string;
  deletedAt: string;
  correlationId?: string;
}

export interface PMTaskStatusPayload {
  id: string;
  projectId: string;
  phaseId: string;
  taskNumber: number;
  title: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  changedAt: string;
  correlationId?: string;
}

// ============================================
// PM Agent Streaming Payloads (PM-12.6)
// ============================================

export interface PMAgentStreamStartPayload {
  streamId: string;
  projectId: string;
  agentId: string;
  agentName: string;
  chatId: string;
  messageId: string;
  timestamp: string;
  correlationId?: string;
}

export interface PMAgentStreamChunkPayload {
  streamId: string;
  projectId: string;
  agentId: string;
  chatId: string;
  messageId: string;
  content: string;
  chunkIndex: number;
  timestamp: string;
}

export interface PMAgentStreamEndPayload {
  streamId: string;
  projectId: string;
  agentId: string;
  agentName: string;
  chatId: string;
  messageId: string;
  fullContent: string;
  tokensUsed?: number;
  durationMs?: number;
  timestamp: string;
  correlationId?: string;
}

export interface PMAgentTypingPayload {
  projectId: string;
  agentId: string;
  agentName: string;
  chatId: string;
  isTyping: boolean;
  timestamp: string;
}

// ============================================
// PM Suggestion Event Payloads (PM-12.6)
// ============================================

export interface PMSuggestionEventPayload {
  id: string;
  projectId: string;
  agentId: string;
  agentName: string;
  type: 'task_recommendation' | 'estimation' | 'phase_transition' | 'health_alert' | 'resource_allocation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'accepted' | 'rejected' | 'snoozed' | 'expired';
  confidence: number;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  correlationId?: string;
}

export interface PMSuggestionActionPayload {
  id: string;
  projectId: string;
  agentId: string;
  agentName: string;
  type: string;
  title: string;
  action: 'accepted' | 'rejected' | 'snoozed';
  actionBy: string;
  actionAt: string;
  snoozeUntil?: string;
  feedback?: string;
  correlationId?: string;
}

// ============================================
// PM Health Event Payloads (PM-12.6)
// ============================================

export interface PMHealthUpdatePayload {
  projectId: string;
  projectName: string;
  score: number;
  previousScore: number;
  level: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  previousLevel: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  trend: 'UP' | 'DOWN' | 'STABLE';
  factors: {
    onTimeDelivery: number;
    blockerImpact: number;
    teamCapacity: number;
    velocityTrend: number;
  };
  triggeredBy: 'task_completed' | 'task_blocked' | 'deadline_passed' | 'scheduled_check' | 'manual';
  timestamp: string;
  correlationId?: string;
}

export interface PMHealthEventPayload {
  projectId: string;
  projectName: string;
  score: number;
  level: 'CRITICAL' | 'WARNING';
  explanation: string;
  timestamp: string;
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
  PM_PRESENCE_JOINED: 'pm.presence.joined',
  PM_PRESENCE_LEFT: 'pm.presence.left',
  PM_PRESENCE_UPDATED: 'pm.presence.updated',
  PM_TASK_CREATED: 'pm.task.created',
  PM_TASK_UPDATED: 'pm.task.updated',
  PM_TASK_DELETED: 'pm.task.deleted',
  PM_TASK_STATUS_CHANGED: 'pm.task.status_changed',
  // PM Agent Streaming events (PM-12.6)
  PM_AGENT_STREAM_START: 'pm.agent.stream.start',
  PM_AGENT_STREAM_CHUNK: 'pm.agent.stream.chunk',
  PM_AGENT_STREAM_END: 'pm.agent.stream.end',
  PM_AGENT_TYPING: 'pm.agent.typing',
  // PM Suggestion events (PM-12.6)
  PM_SUGGESTION_CREATED: 'pm.suggestion.created',
  PM_SUGGESTION_UPDATED: 'pm.suggestion.updated',
  PM_SUGGESTION_ACCEPTED: 'pm.suggestion.accepted',
  PM_SUGGESTION_REJECTED: 'pm.suggestion.rejected',
  PM_SUGGESTION_SNOOZED: 'pm.suggestion.snoozed',
  // PM Health events (PM-12.6)
  PM_HEALTH_UPDATED: 'pm.health.updated',
  PM_HEALTH_CRITICAL: 'pm.health.critical',
  PM_HEALTH_WARNING: 'pm.health.warning',

  // Dashboard State Sync events (DM-11.2)
  DASHBOARD_STATE_UPDATE: 'dashboard.state.update',
  DASHBOARD_STATE_SYNC: 'dashboard.state.sync',
  DASHBOARD_STATE_FULL: 'dashboard.state.full',
  DASHBOARD_STATE_REQUEST: 'dashboard.state.request',
} as const;

export type WsEventName = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];
