/**
 * Authentication and session type definitions
 * Used across frontend, backend, and AgentOS
 */

/**
 * JWT payload structure for better-auth tokens
 * Used for authentication and authorization across the platform
 */
export interface JwtPayload {
  /** User ID */
  sub: string;
  /** Session identifier */
  sessionId: string;
  /** Current workspace context (optional, can be null if not in workspace) */
  workspaceId?: string;
  /** User email address */
  email: string;
  /** User display name */
  name: string;
  /** Issued at timestamp (Unix time) */
  iat: number;
  /** Expiration timestamp (Unix time) */
  exp: number;
}

/**
 * Session information
 */
export interface Session {
  /** Session ID */
  id: string;
  /** User ID */
  userId: string;
  /** Session expiration date */
  expiresAt: Date;
  /** IP address where session was created */
  ipAddress?: string;
  /** User agent string */
  userAgent?: string;
  /** Active status */
  isActive: boolean;
}

/**
 * User authentication context
 */
export interface AuthContext {
  /** User ID */
  userId: string;
  /** User email */
  email: string;
  /** User name */
  name: string;
  /** Current workspace ID */
  workspaceId?: string;
  /** Session ID */
  sessionId: string;
}
