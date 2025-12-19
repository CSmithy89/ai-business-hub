/**
 * Presence Types
 *
 * Shared types for real-time presence tracking across projects.
 * Used by both backend (API) and frontend (Web).
 *
 * @see Story PM-06.2: Presence Indicators
 */

/**
 * User location within a project
 */
export interface PresenceLocation {
  page: 'overview' | 'tasks' | 'settings' | 'docs';
  taskId?: string;
}

/**
 * Presence user information
 */
export interface PresenceUser {
  userId: string;
  userName: string;
  userAvatar: string | null;
  location: PresenceLocation;
  lastSeen: string; // ISO timestamp
}

/**
 * Response from presence query endpoint
 */
export interface PresenceResponse {
  users: PresenceUser[];
  total: number;
}

/**
 * Presence payload for WebSocket events
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

/**
 * Client-side presence update input
 */
export interface PresenceUpdateInput {
  projectId: string;
  taskId?: string;
  page: 'overview' | 'tasks' | 'settings' | 'docs';
}
