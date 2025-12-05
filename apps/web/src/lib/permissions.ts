/**
 * Permission Definitions for Custom Roles
 * Story 09-14: Implement Custom Role Creation
 *
 * Defines available permissions and their categories for the RBAC system.
 * Used by custom role creation UI and permission validation.
 */

import { PERMISSIONS } from '@hyvve/shared'

/**
 * Permission category groupings for UI display
 * Groups related permissions together in the permission selector
 */
export interface PermissionCategory {
  id: string
  label: string
  description: string
  permissions: PermissionDefinition[]
}

/**
 * Individual permission definition with metadata
 */
export interface PermissionDefinition {
  id: string
  label: string
  description: string
}

/**
 * Built-in role names that cannot be created as custom roles
 */
export const BUILT_IN_ROLES = ['owner', 'admin', 'member', 'viewer', 'guest'] as const
export type BuiltInRole = typeof BUILT_IN_ROLES[number]

/**
 * Permission categories with human-readable labels and descriptions
 * Organized by functional area for better UX in role creation
 */
export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    description: 'Manage workspace settings and configuration',
    permissions: [
      {
        id: PERMISSIONS.WORKSPACE_READ,
        label: 'View workspace',
        description: 'View workspace details and settings',
      },
      {
        id: PERMISSIONS.WORKSPACE_UPDATE,
        label: 'Edit workspace',
        description: 'Update workspace name, image, and settings',
      },
      {
        id: PERMISSIONS.WORKSPACE_DELETE,
        label: 'Delete workspace',
        description: 'Permanently delete the workspace (owner only)',
      },
    ],
  },
  {
    id: 'members',
    label: 'Team Members',
    description: 'Manage workspace members and invitations',
    permissions: [
      {
        id: PERMISSIONS.MEMBERS_VIEW,
        label: 'View members',
        description: 'View team member list and details',
      },
      {
        id: PERMISSIONS.MEMBERS_INVITE,
        label: 'Invite members',
        description: 'Send invitations to new team members',
      },
      {
        id: PERMISSIONS.MEMBERS_REMOVE,
        label: 'Remove members',
        description: 'Remove members from the workspace',
      },
      {
        id: PERMISSIONS.MEMBERS_CHANGE_ROLE,
        label: 'Change member roles',
        description: 'Modify member roles and permissions',
      },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    description: 'Manage content and records',
    permissions: [
      {
        id: PERMISSIONS.RECORDS_VIEW,
        label: 'View content',
        description: 'View records and content items',
      },
      {
        id: PERMISSIONS.RECORDS_CREATE,
        label: 'Create content',
        description: 'Create new records and content',
      },
      {
        id: PERMISSIONS.RECORDS_EDIT,
        label: 'Edit content',
        description: 'Edit existing records and content',
      },
      {
        id: PERMISSIONS.RECORDS_DELETE,
        label: 'Delete content',
        description: 'Delete records and content',
      },
    ],
  },
  {
    id: 'approvals',
    label: 'Approvals',
    description: 'Review and manage approval queue',
    permissions: [
      {
        id: PERMISSIONS.APPROVALS_VIEW,
        label: 'View approvals',
        description: 'View pending approval items',
      },
      {
        id: PERMISSIONS.APPROVALS_APPROVE,
        label: 'Approve items',
        description: 'Approve pending items in the queue',
      },
      {
        id: PERMISSIONS.APPROVALS_REJECT,
        label: 'Reject items',
        description: 'Reject pending items in the queue',
      },
    ],
  },
  {
    id: 'ai_agents',
    label: 'AI Agents',
    description: 'Configure and run AI agents',
    permissions: [
      {
        id: PERMISSIONS.AGENTS_VIEW,
        label: 'View agents',
        description: 'View AI agent configurations',
      },
      {
        id: PERMISSIONS.AGENTS_CONFIGURE,
        label: 'Configure agents',
        description: 'Create and modify AI agent settings',
      },
      {
        id: PERMISSIONS.AGENTS_RUN,
        label: 'Run agents',
        description: 'Execute AI agents and workflows',
      },
    ],
  },
  {
    id: 'api_keys',
    label: 'API Keys',
    description: 'Manage API access keys',
    permissions: [
      {
        id: PERMISSIONS.API_KEYS_VIEW,
        label: 'View API keys',
        description: 'View existing API keys',
      },
      {
        id: PERMISSIONS.API_KEYS_CREATE,
        label: 'Create API keys',
        description: 'Generate new API keys',
      },
      {
        id: PERMISSIONS.API_KEYS_REVOKE,
        label: 'Revoke API keys',
        description: 'Revoke or delete API keys',
      },
    ],
  },
  {
    id: 'modules',
    label: 'Modules',
    description: 'Access workspace modules',
    permissions: [
      {
        id: PERMISSIONS.MODULE_VIEW,
        label: 'View modules',
        description: 'Access and view module content',
      },
      {
        id: PERMISSIONS.MODULE_ADMIN,
        label: 'Administer modules',
        description: 'Configure and manage modules',
      },
    ],
  },
]

/**
 * Get all permission IDs as a flat array
 * Useful for validation and permission checks
 */
export function getAllPermissionIds(): string[] {
  return PERMISSION_CATEGORIES.flatMap((category) =>
    category.permissions.map((p) => p.id)
  )
}

/**
 * Validate if a permission ID is valid
 */
export function isValidPermission(permissionId: string): boolean {
  return getAllPermissionIds().includes(permissionId)
}

/**
 * Validate if a role name is a built-in role
 */
export function isBuiltInRole(roleName: string): boolean {
  return BUILT_IN_ROLES.includes(roleName.toLowerCase() as BuiltInRole)
}

/**
 * Get permission label by ID
 */
export function getPermissionLabel(permissionId: string): string | undefined {
  for (const category of PERMISSION_CATEGORIES) {
    const permission = category.permissions.find((p) => p.id === permissionId)
    if (permission) {
      return permission.label
    }
  }
  return undefined
}

/**
 * Get permission category by ID
 */
export function getPermissionCategory(permissionId: string): PermissionCategory | undefined {
  return PERMISSION_CATEGORIES.find((category) =>
    category.permissions.some((p) => p.id === permissionId)
  )
}
