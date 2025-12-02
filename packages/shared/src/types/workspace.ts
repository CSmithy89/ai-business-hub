/**
 * Workspace and member type definitions
 * Used for multi-tenant workspace management and RBAC
 */

import { z } from 'zod'

/**
 * Workspace role definitions for RBAC
 * Aligned with better-auth organization plugin
 */
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer' | 'guest'

/**
 * Role hierarchy for permission checks
 */
export const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  owner: 100,
  admin: 80,
  member: 60,
  viewer: 40,
  guest: 20,
}

/**
 * Workspace information
 * Matches Prisma Workspace model
 */
export interface Workspace {
  /** Workspace ID (UUID) */
  id: string
  /** Workspace display name */
  name: string
  /** Workspace slug (URL-safe identifier) */
  slug: string
  /** Optional workspace avatar/logo URL */
  image: string | null
  /** IANA timezone for the workspace */
  timezone: string
  /** Created timestamp */
  createdAt: Date
  /** Last updated timestamp */
  updatedAt: Date
  /** Soft delete timestamp (null if not deleted) */
  deletedAt: Date | null
}

/**
 * Workspace with user's role and optional member count
 * Used in API responses that need role context
 */
export interface WorkspaceWithRole extends Workspace {
  /** Current user's role in this workspace */
  role: WorkspaceRole
  /** Total active members in workspace (optional) */
  memberCount?: number
}

/**
 * Workspace member information
 * Matches Prisma WorkspaceMember model
 */
export interface WorkspaceMember {
  /** Member ID */
  id: string
  /** Workspace ID */
  workspaceId: string
  /** User ID */
  userId: string
  /** Member role */
  role: WorkspaceRole
  /** Module-level permission overrides */
  modulePermissions: Record<string, unknown> | null
  /** Who invited this member (null for owners) */
  invitedById: string | null
  /** Invitation timestamp */
  invitedAt: Date
  /** Acceptance timestamp (null if pending) */
  acceptedAt: Date | null
}

/**
 * Workspace invitation
 * Matches Prisma WorkspaceInvitation model
 * Note: Invitations are deleted when accepted (no acceptedAt field)
 */
export interface WorkspaceInvitation {
  /** Invitation ID */
  id: string
  /** Workspace ID */
  workspaceId: string
  /** Invitee email */
  email: string
  /** Role to be assigned */
  role: WorkspaceRole
  /** Invitation token */
  token: string
  /** Invited by user ID */
  invitedById: string
  /** Created timestamp */
  createdAt: Date
  /** Expiration timestamp */
  expiresAt: Date
}

// ===========================================
// ZOD VALIDATION SCHEMAS
// ===========================================

/**
 * Schema for creating a new workspace
 */
export const CreateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(3, 'Workspace name must be at least 3 characters')
    .max(50, 'Workspace name must be under 50 characters')
    .trim(),
})

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>

/**
 * Schema for creating a workspace invitation
 * Owners and admins can invite new members with specified roles
 */
export const CreateInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member', 'viewer', 'guest'], {
    message: 'Invalid role. Must be admin, member, viewer, or guest.',
  }),
})

export type CreateInvitationInput = z.infer<typeof CreateInvitationSchema>

/**
 * Invitable roles (excludes 'owner' - cannot be invited, must be creator)
 */
export const INVITABLE_ROLES = ['admin', 'member', 'viewer', 'guest'] as const
export type InvitableRole = (typeof INVITABLE_ROLES)[number]

/**
 * List of valid IANA timezones (subset for common ones)
 * Full list should be validated against Intl.supportedValuesOf('timeZone')
 */
export const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
] as const

/**
 * Validate if a string is a valid IANA timezone
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

/**
 * Schema for updating workspace settings
 */
export const UpdateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(3, 'Workspace name must be at least 3 characters')
    .max(50, 'Workspace name must be under 50 characters')
    .trim()
    .optional(),
  image: z.string().url('Invalid image URL').nullable().optional(),
  timezone: z
    .string()
    .refine(isValidTimezone, 'Invalid timezone')
    .optional(),
})

export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceSchema>

// ===========================================
// API RESPONSE TYPES
// ===========================================

/**
 * Standard API success response for workspace operations
 */
export interface WorkspaceApiResponse<T = Workspace> {
  success: true
  data: T
}

/**
 * Standard API error response
 */
export interface WorkspaceApiError {
  success: false
  error: string
  message: string
  retryAfter?: number
}

/**
 * Workspace list API response
 */
export interface WorkspaceListResponse {
  success: true
  data: WorkspaceWithRole[]
}

/**
 * Workspace deletion response
 */
export interface WorkspaceDeletionResponse {
  success: true
  message: string
  deletedAt: string
}
