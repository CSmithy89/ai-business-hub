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

  // PM Task events
  'pm.task.created': (data: PMTaskEventPayload) => void;
  'pm.task.updated': (data: PMTaskUpdatePayload) => void;
  'pm.task.deleted': (data: PMTaskDeletedPayload) => void;
  'pm.task.status_changed': (data: PMTaskStatusPayload) => void;
  'pm.task.assigned': (data: PMTaskAssignmentPayload) => void;

  // PM Phase events
  'pm.phase.created': (data: PMPhaseEventPayload) => void;
  'pm.phase.updated': (data: PMPhaseEventPayload) => void;
  'pm.phase.transitioned': (data: PMPhaseTransitionPayload) => void;

  // PM Project events
  'pm.project.created': (data: PMProjectEventPayload) => void;
  'pm.project.updated': (data: PMProjectEventPayload) => void;
  'pm.project.deleted': (data: PMProjectDeletedPayload) => void;

  // PM Team events
  'pm.team.member_added': (data: PMTeamChangePayload) => void;
  'pm.team.member_removed': (data: PMTeamChangePayload) => void;
  'pm.team.member_updated': (data: PMTeamChangePayload) => void;

  // PM Presence events
  'pm.presence.joined': (data: PresencePayload) => void;
  'pm.presence.left': (data: PresencePayload) => void;
  'pm.presence.updated': (data: PresencePayload) => void;
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

  // PM Presence updates
  'pm.presence.update': (data: {
    projectId: string;
    taskId?: string;
    page: 'overview' | 'tasks' | 'settings' | 'docs';
  }) => void;
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
  projectRooms?: Set<string>; // Track which project rooms this socket is in
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
// PM Event Payloads
// ============================================

/**
 * PM Task event payload for created/updated tasks
 */
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

/**
 * PM Task update payload (partial update)
 */
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

/**
 * PM Task deleted payload
 */
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

/**
 * PM Task status change payload
 */
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

/**
 * PM Task assignment change payload
 */
export interface PMTaskAssignmentPayload {
  id: string;
  projectId: string;
  phaseId: string;
  taskNumber: number;
  title: string;
  fromAssigneeId?: string;
  toAssigneeId?: string;
  fromAgentId?: string;
  toAgentId?: string;
  assignmentType: string;
  assignedBy: string;
  assignedAt: string;
  correlationId?: string;
}

/**
 * PM Phase event payload
 */
export interface PMPhaseEventPayload {
  id: string;
  projectId: string;
  phaseNumber: number;
  name: string;
  description?: string;
  status: string;
  bmadPhase?: string;
  startDate?: string;
  endDate?: string;
  totalTasks: number;
  completedTasks: number;
  createdAt?: string;
  updatedAt: string;
  correlationId?: string;
}

/**
 * PM Phase transition payload
 */
export interface PMPhaseTransitionPayload {
  id: string;
  projectId: string;
  phaseNumber: number;
  name: string;
  fromStatus: string;
  toStatus: string;
  transitionedBy: string;
  transitionedAt: string;
  correlationId?: string;
}

/**
 * PM Project event payload
 */
export interface PMProjectEventPayload {
  id: string;
  workspaceId: string;
  businessId: string;
  slug: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  type: string;
  status: string;
  startDate?: string;
  targetDate?: string;
  createdAt?: string;
  updatedAt: string;
  correlationId?: string;
}

/**
 * PM Project deleted payload
 */
export interface PMProjectDeletedPayload {
  id: string;
  workspaceId: string;
  businessId: string;
  slug: string;
  name: string;
  deletedBy: string;
  deletedAt: string;
  correlationId?: string;
}

/**
 * PM Team member change payload
 */
export interface PMTeamChangePayload {
  projectId: string;
  userId: string;
  role: string;
  action: 'added' | 'removed' | 'updated';
  changedBy: string;
  changedAt: string;
  correlationId?: string;
}

/**
 * PM Presence payload
 */
export interface PresencePayload {
  userId: string;
  userName: string;
  userAvatar: string | null;
  projectId: string;
  taskId?: string;
  page: 'overview' | 'tasks' | 'settings' | 'docs';
  timestamp: string;
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

  // PM Task events
  PM_TASK_CREATED: 'pm.task.created',
  PM_TASK_UPDATED: 'pm.task.updated',
  PM_TASK_DELETED: 'pm.task.deleted',
  PM_TASK_STATUS_CHANGED: 'pm.task.status_changed',
  PM_TASK_ASSIGNED: 'pm.task.assigned',

  // PM Phase events
  PM_PHASE_CREATED: 'pm.phase.created',
  PM_PHASE_UPDATED: 'pm.phase.updated',
  PM_PHASE_TRANSITIONED: 'pm.phase.transitioned',

  // PM Project events
  PM_PROJECT_CREATED: 'pm.project.created',
  PM_PROJECT_UPDATED: 'pm.project.updated',
  PM_PROJECT_DELETED: 'pm.project.deleted',

  // PM Team events
  PM_TEAM_MEMBER_ADDED: 'pm.team.member_added',
  PM_TEAM_MEMBER_REMOVED: 'pm.team.member_removed',
  PM_TEAM_MEMBER_UPDATED: 'pm.team.member_updated',

  // PM Presence events
  PM_PRESENCE_JOINED: 'pm.presence.joined',
  PM_PRESENCE_LEFT: 'pm.presence.left',
  PM_PRESENCE_UPDATED: 'pm.presence.updated',
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

/**
 * Generate room name for project-specific events
 */
export function getProjectRoom(projectId: string): string {
  return `project:${projectId}`;
}

/**
 * Generate room name for task-specific events
 */
export function getTaskRoom(taskId: string): string {
  return `task:${taskId}`;
}
