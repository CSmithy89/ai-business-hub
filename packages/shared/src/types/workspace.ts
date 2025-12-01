/**
 * Workspace and member type definitions
 * Used for multi-tenant workspace management and RBAC
 */

/**
 * Workspace role definitions for RBAC
 * Aligned with better-auth organization plugin
 */
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer' | 'guest';

/**
 * Workspace information
 */
export interface Workspace {
  /** Workspace ID */
  id: string;
  /** Workspace name */
  name: string;
  /** Workspace slug (URL-safe identifier) */
  slug: string;
  /** Workspace description */
  description?: string;
  /** Created timestamp */
  createdAt: Date;
  /** Last updated timestamp */
  updatedAt: Date;
  /** Owner user ID */
  ownerId: string;
  /** Active status */
  isActive: boolean;
}

/**
 * Workspace member information
 */
export interface WorkspaceMember {
  /** Member ID */
  id: string;
  /** Workspace ID */
  workspaceId: string;
  /** User ID */
  userId: string;
  /** Member role */
  role: WorkspaceRole;
  /** Joined timestamp */
  joinedAt: Date;
  /** Last activity timestamp */
  lastActiveAt?: Date;
}

/**
 * Workspace invitation
 */
export interface WorkspaceInvitation {
  /** Invitation ID */
  id: string;
  /** Workspace ID */
  workspaceId: string;
  /** Invitee email */
  email: string;
  /** Role to be assigned */
  role: WorkspaceRole;
  /** Invitation token */
  token: string;
  /** Invited by user ID */
  invitedBy: string;
  /** Created timestamp */
  createdAt: Date;
  /** Expiration timestamp */
  expiresAt: Date;
  /** Accepted status */
  isAccepted: boolean;
}
