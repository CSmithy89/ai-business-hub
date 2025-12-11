'use client'

import { SettingsLayout } from '@/components/layouts/settings-layout'
import { RolesList } from '@/components/settings/roles-list'
import { CreateRoleModal } from '@/components/settings/create-role-modal'
import { PermissionMatrix } from '@/components/settings/permission-matrix'

/**
 * Workspace Roles Page
 * Story 09-14: Implement Custom Role Creation
 * Story 15-10a: Add Permission Matrix visualization
 *
 * Displays all built-in and custom roles for the workspace.
 * Allows workspace owners to create, edit, and delete custom roles.
 * Shows permission matrix for role capabilities overview.
 */
export default function RolesPage() {
  return (
    <SettingsLayout
      title="Roles & Permissions"
      description="Manage workspace roles and define custom permissions for your team"
    >
      <div className="space-y-8">
        {/* Permission Matrix (Story 15-10a) */}
        <PermissionMatrix />

        {/* Header with Create Button */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Custom Roles</h3>
            <p className="text-sm text-gray-600 mt-1">
              Create custom roles with specific permissions for granular access control
            </p>
          </div>
          <CreateRoleModal />
        </div>

        {/* Roles List */}
        <RolesList />
      </div>
    </SettingsLayout>
  )
}
