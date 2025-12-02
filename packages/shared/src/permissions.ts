/**
 * Permission Matrix System
 * Centralized permission definitions and role-based access control utilities
 *
 * This module provides:
 * - Permission constants organized by category
 * - Role-to-permission mappings
 * - Permission checking utilities
 * - Role hierarchy enforcement
 * - Module-level permission overrides
 *
 * @module permissions
 */

import type { WorkspaceRole } from './types/workspace'

// ===========================================
// PERMISSION CONSTANTS
// ===========================================

/**
 * All platform permissions organized by category
 *
 * Naming convention: CATEGORY_ACTION
 * Value format: 'category:action'
 */
export const PERMISSIONS = {
  // Workspace Management
  WORKSPACE_READ: 'workspace:read',
  WORKSPACE_UPDATE: 'workspace:update',
  WORKSPACE_DELETE: 'workspace:delete',

  // Member Management
  MEMBERS_VIEW: 'members:view',
  MEMBERS_INVITE: 'members:invite',
  MEMBERS_REMOVE: 'members:remove',
  MEMBERS_CHANGE_ROLE: 'members:change_role',

  // Record Management (generic data entities)
  RECORDS_VIEW: 'records:view',
  RECORDS_CREATE: 'records:create',
  RECORDS_EDIT: 'records:edit',
  RECORDS_DELETE: 'records:delete',

  // Approval Queue
  APPROVALS_VIEW: 'approvals:view',
  APPROVALS_APPROVE: 'approvals:approve',
  APPROVALS_REJECT: 'approvals:reject',

  // AI Agent Management
  AGENTS_VIEW: 'agents:view',
  AGENTS_CONFIGURE: 'agents:configure',
  AGENTS_RUN: 'agents:run',

  // API Key Management
  API_KEYS_VIEW: 'api_keys:view',
  API_KEYS_CREATE: 'api_keys:create',
  API_KEYS_REVOKE: 'api_keys:revoke',

  // Module Permissions
  MODULE_VIEW: 'module:view',
  MODULE_ADMIN: 'module:admin',
} as const

/**
 * Permission type derived from PERMISSIONS object
 * Enables type-safe permission checks
 */
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// ===========================================
// ROLE PERMISSION MAPPINGS
// ===========================================

/**
 * Role hierarchy levels used for comparison
 * Higher number = higher privilege
 */
const ROLE_LEVELS: Record<WorkspaceRole, number> = {
  owner: 5,
  admin: 4,
  member: 3,
  viewer: 2,
  guest: 1,
}

/**
 * Role-to-permission mappings
 *
 * Role Hierarchy:
 * - Owner: All permissions (including workspace deletion)
 * - Admin: All permissions except workspace deletion
 * - Member: Limited permissions (read workspace, view members, own records)
 * - Viewer: Read-only permissions
 * - Guest: Minimal access
 */
export const ROLE_PERMISSIONS: Record<WorkspaceRole, readonly Permission[]> = {
  owner: Object.values(PERMISSIONS),

  admin: [
    // Workspace (no delete)
    PERMISSIONS.WORKSPACE_READ,
    PERMISSIONS.WORKSPACE_UPDATE,

    // Members (full access)
    PERMISSIONS.MEMBERS_VIEW,
    PERMISSIONS.MEMBERS_INVITE,
    PERMISSIONS.MEMBERS_REMOVE,
    PERMISSIONS.MEMBERS_CHANGE_ROLE,

    // Records (full access)
    PERMISSIONS.RECORDS_VIEW,
    PERMISSIONS.RECORDS_CREATE,
    PERMISSIONS.RECORDS_EDIT,
    PERMISSIONS.RECORDS_DELETE,

    // Approvals (full access)
    PERMISSIONS.APPROVALS_VIEW,
    PERMISSIONS.APPROVALS_APPROVE,
    PERMISSIONS.APPROVALS_REJECT,

    // Agents (full access)
    PERMISSIONS.AGENTS_VIEW,
    PERMISSIONS.AGENTS_CONFIGURE,
    PERMISSIONS.AGENTS_RUN,

    // API Keys (full access)
    PERMISSIONS.API_KEYS_VIEW,
    PERMISSIONS.API_KEYS_CREATE,
    PERMISSIONS.API_KEYS_REVOKE,

    // Modules (full access)
    PERMISSIONS.MODULE_VIEW,
    PERMISSIONS.MODULE_ADMIN,
  ],

  member: [
    // Workspace (read only)
    PERMISSIONS.WORKSPACE_READ,

    // Members (view only)
    PERMISSIONS.MEMBERS_VIEW,

    // Records (view, create, edit own)
    PERMISSIONS.RECORDS_VIEW,
    PERMISSIONS.RECORDS_CREATE,
    PERMISSIONS.RECORDS_EDIT,

    // Approvals (view own only)
    PERMISSIONS.APPROVALS_VIEW,

    // Agents (view and run)
    PERMISSIONS.AGENTS_VIEW,
    PERMISSIONS.AGENTS_RUN,

    // Module (view only)
    PERMISSIONS.MODULE_VIEW,
  ],

  viewer: [
    // Workspace (read only)
    PERMISSIONS.WORKSPACE_READ,

    // Members (view only)
    PERMISSIONS.MEMBERS_VIEW,

    // Records (view only)
    PERMISSIONS.RECORDS_VIEW,

    // Agents (view only)
    PERMISSIONS.AGENTS_VIEW,

    // Module (view only)
    PERMISSIONS.MODULE_VIEW,
  ],

  guest: [
    // Workspace (read only)
    PERMISSIONS.WORKSPACE_READ,

    // Records (limited view)
    PERMISSIONS.RECORDS_VIEW,
  ],
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Check if a role has a specific permission
 *
 * @param role - The workspace role to check
 * @param permission - The permission to verify
 * @returns true if the role has the permission, false otherwise
 *
 * @example
 * ```typescript
 * hasPermission('admin', PERMISSIONS.WORKSPACE_DELETE) // false
 * hasPermission('owner', PERMISSIONS.WORKSPACE_DELETE) // true
 * hasPermission('member', PERMISSIONS.RECORDS_VIEW) // true
 * ```
 */
export function hasPermission(
  role: WorkspaceRole,
  permission: Permission
): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  return permissions.includes(permission)
}

/**
 * Get all permissions for a role
 *
 * @param role - The workspace role
 * @returns Array of permissions assigned to the role
 *
 * @example
 * ```typescript
 * const permissions = getPermissions('admin')
 * // Returns all admin permissions
 * ```
 */
export function getPermissions(role: WorkspaceRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role]
}

/**
 * Check if an actor can change a target member's role
 *
 * Role modification rules:
 * - Owner can modify anyone except other owners
 * - Admin can modify member, viewer, and guest only
 * - Member, Viewer, and Guest cannot modify roles
 *
 * @param actorRole - Role of the user attempting the change
 * @param targetRole - Role of the user being modified
 * @returns true if the change is allowed, false otherwise
 *
 * @example
 * ```typescript
 * canChangeRole('owner', 'admin') // true
 * canChangeRole('admin', 'owner') // false
 * canChangeRole('admin', 'member') // true
 * canChangeRole('member', 'viewer') // false
 * ```
 */
export function canChangeRole(
  actorRole: WorkspaceRole,
  targetRole: WorkspaceRole
): boolean {
  const targetLevel = ROLE_LEVELS[targetRole]

  // Owner can modify anyone except other owners
  if (actorRole === 'owner') {
    return targetRole !== 'owner'
  }

  // Admin can modify roles below admin level
  if (actorRole === 'admin') {
    return targetLevel < ROLE_LEVELS.admin
  }

  // Member, Viewer, Guest cannot modify roles
  return false
}

/**
 * Check if an actor can remove a target member
 *
 * Follows the same rules as canChangeRole:
 * - Owner can remove anyone except other owners
 * - Admin can remove member, viewer, and guest only
 * - Member, Viewer, and Guest cannot remove members
 *
 * @param actorRole - Role of the user attempting the removal
 * @param targetRole - Role of the user being removed
 * @returns true if the removal is allowed, false otherwise
 *
 * @example
 * ```typescript
 * canRemoveMember('owner', 'admin') // true
 * canRemoveMember('admin', 'owner') // false
 * canRemoveMember('admin', 'member') // true
 * ```
 */
export function canRemoveMember(
  actorRole: WorkspaceRole,
  targetRole: WorkspaceRole
): boolean {
  return canChangeRole(actorRole, targetRole)
}

// ===========================================
// MODULE PERMISSION OVERRIDES
// ===========================================

/**
 * Module-specific permission override
 *
 * Supports two patterns:
 * 1. Role elevation: Grant all permissions of an elevated role within a module
 * 2. Specific permissions: Grant only specific permissions within a module
 *
 * @example
 * ```typescript
 * // Pattern 1: Role elevation
 * { role: 'admin' } // Member becomes admin in this module
 *
 * // Pattern 2: Specific permissions
 * { permissions: ['records:view', 'records:create'] }
 * ```
 */
export interface ModulePermissionOverride {
  /** Elevated role for this module */
  role?: WorkspaceRole
  /** Specific permissions granted in this module */
  permissions?: Permission[]
}

/**
 * Module permission overrides map
 * Maps module ID to override configuration
 *
 * @example
 * ```typescript
 * const overrides: ModulePermissions = {
 *   'bm-crm': { role: 'admin' },
 *   'bmc': { permissions: ['records:view', 'records:create'] }
 * }
 * ```
 */
export type ModulePermissions = Record<string, ModulePermissionOverride>

/**
 * Check if a role has a permission within a specific module
 *
 * Permission resolution logic:
 * 1. Check if base role has the permission
 * 2. If module overrides exist and module ID matches:
 *    a. If override specifies role elevation, check elevated role's permissions
 *    b. If override specifies specific permissions, check if permission is in list
 * 3. Fall back to base role permission
 *
 * @param baseRole - The user's base workspace role
 * @param moduleId - The module identifier (e.g., 'bm-crm', 'bmc')
 * @param permission - The permission to check
 * @param modulePermissions - Optional module permission overrides
 * @returns true if the permission is granted, false otherwise
 *
 * @example
 * ```typescript
 * // Base role check (no overrides)
 * hasModulePermission('member', 'bm-crm', PERMISSIONS.MODULE_VIEW)
 * // Returns true (member has MODULE_VIEW)
 *
 * // Role elevation
 * hasModulePermission(
 *   'member',
 *   'bm-crm',
 *   PERMISSIONS.MODULE_ADMIN,
 *   { 'bm-crm': { role: 'admin' } }
 * )
 * // Returns true (member elevated to admin in CRM)
 *
 * // Specific permissions
 * hasModulePermission(
 *   'viewer',
 *   'bmc',
 *   PERMISSIONS.RECORDS_CREATE,
 *   { 'bmc': { permissions: ['records:view', 'records:create'] } }
 * )
 * // Returns true (viewer granted specific permission)
 * ```
 */
export function hasModulePermission(
  baseRole: WorkspaceRole,
  moduleId: string,
  permission: Permission,
  modulePermissions?: ModulePermissions | null
): boolean {
  // First check if base role has the permission
  const hasBasePermission = hasPermission(baseRole, permission)

  // If no overrides, return base check
  if (!modulePermissions || !(moduleId in modulePermissions)) {
    return hasBasePermission
  }

  const override = modulePermissions[moduleId]

  // Pattern 1: Role elevation
  // If override specifies a role, check that role's permissions
  if (override.role) {
    return hasPermission(override.role, permission)
  }

  // Pattern 2: Specific permissions
  // If override specifies permissions, check if permission is in list
  if (override.permissions && Array.isArray(override.permissions)) {
    return override.permissions.includes(permission)
  }

  // Fall back to base role check
  return hasBasePermission
}
