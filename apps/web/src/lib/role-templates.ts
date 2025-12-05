/**
 * Role Templates for Quick Role Creation
 * Story 09-15: Implement Permission Templates
 *
 * Provides pre-built role templates with common permission configurations
 * to accelerate role creation for typical team roles.
 */

import { PERMISSIONS } from '@hyvve/shared'

/**
 * Role template definition
 * Each template includes a predefined set of permissions for a common role type
 */
export interface RoleTemplate {
  /** Unique identifier for the template */
  id: string
  /** Display name for the template */
  name: string
  /** Description of what this role is intended for */
  description: string
  /** Lucide icon name for visual representation */
  icon: string
  /** Pre-configured permissions for this role */
  permissions: string[]
}

/**
 * Available role templates for quick role creation
 *
 * Templates are designed for common business roles with appropriate
 * permission sets for their typical responsibilities.
 */
export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: 'content-manager',
    name: 'Content Manager',
    description: 'Manage content and records with full CRUD permissions',
    icon: 'FileText',
    permissions: [
      // View workspace and team
      PERMISSIONS.WORKSPACE_READ,
      PERMISSIONS.MEMBERS_VIEW,

      // Full content management
      PERMISSIONS.RECORDS_VIEW,
      PERMISSIONS.RECORDS_CREATE,
      PERMISSIONS.RECORDS_EDIT,
      PERMISSIONS.RECORDS_DELETE,

      // Approvals
      PERMISSIONS.APPROVALS_VIEW,
      PERMISSIONS.APPROVALS_APPROVE,
      PERMISSIONS.APPROVALS_REJECT,

      // Module access
      PERMISSIONS.MODULE_VIEW,
    ],
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Configure AI agents, API keys, and access content',
    icon: 'Code',
    permissions: [
      // View workspace and team
      PERMISSIONS.WORKSPACE_READ,
      PERMISSIONS.MEMBERS_VIEW,

      // Content view only
      PERMISSIONS.RECORDS_VIEW,

      // Full AI agent access
      PERMISSIONS.AGENTS_VIEW,
      PERMISSIONS.AGENTS_CONFIGURE,
      PERMISSIONS.AGENTS_RUN,

      // API key management
      PERMISSIONS.API_KEYS_VIEW,
      PERMISSIONS.API_KEYS_CREATE,
      PERMISSIONS.API_KEYS_REVOKE,

      // Module access
      PERMISSIONS.MODULE_VIEW,
      PERMISSIONS.MODULE_ADMIN,
    ],
  },
  {
    id: 'analyst',
    name: 'Analyst',
    description: 'View all data and run agents, but no delete or management permissions',
    icon: 'BarChart3',
    permissions: [
      // View workspace and team
      PERMISSIONS.WORKSPACE_READ,
      PERMISSIONS.MEMBERS_VIEW,

      // View content (no edit/delete)
      PERMISSIONS.RECORDS_VIEW,

      // View and run agents (no configure)
      PERMISSIONS.AGENTS_VIEW,
      PERMISSIONS.AGENTS_RUN,

      // View approvals
      PERMISSIONS.APPROVALS_VIEW,

      // View API keys
      PERMISSIONS.API_KEYS_VIEW,

      // Module view
      PERMISSIONS.MODULE_VIEW,
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Create and edit content with limited administrative access',
    icon: 'Megaphone',
    permissions: [
      // View workspace and team
      PERMISSIONS.WORKSPACE_READ,
      PERMISSIONS.MEMBERS_VIEW,

      // Content create and edit (no delete)
      PERMISSIONS.RECORDS_VIEW,
      PERMISSIONS.RECORDS_CREATE,
      PERMISSIONS.RECORDS_EDIT,

      // View and run agents
      PERMISSIONS.AGENTS_VIEW,
      PERMISSIONS.AGENTS_RUN,

      // View approvals
      PERMISSIONS.APPROVALS_VIEW,

      // Module view
      PERMISSIONS.MODULE_VIEW,
    ],
  },
  {
    id: 'support',
    name: 'Support',
    description: 'View all content and make limited edits, no delete permissions',
    icon: 'Headphones',
    permissions: [
      // View workspace and team
      PERMISSIONS.WORKSPACE_READ,
      PERMISSIONS.MEMBERS_VIEW,

      // View and edit content (no delete)
      PERMISSIONS.RECORDS_VIEW,
      PERMISSIONS.RECORDS_EDIT,

      // View and run agents
      PERMISSIONS.AGENTS_VIEW,
      PERMISSIONS.AGENTS_RUN,

      // View approvals
      PERMISSIONS.APPROVALS_VIEW,

      // Module view
      PERMISSIONS.MODULE_VIEW,
    ],
  },
]

/**
 * Get a role template by ID
 *
 * @param templateId - The template identifier
 * @returns The role template, or undefined if not found
 */
export function getRoleTemplate(templateId: string): RoleTemplate | undefined {
  return ROLE_TEMPLATES.find((template) => template.id === templateId)
}

/**
 * Get suggested name for a template
 * Can be used as default role name when creating from template
 *
 * @param templateId - The template identifier
 * @returns Suggested role name, or empty string if template not found
 */
export function getTemplateSuggestedName(templateId: string): string {
  const template = getRoleTemplate(templateId)
  return template?.name || ''
}
