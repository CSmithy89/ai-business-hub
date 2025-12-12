'use client'

import { Check, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

/**
 * Permission Matrix Component
 * Story 15-10a: Implement Workspace Roles Page
 *
 * Displays a read-only table showing which permissions each role has.
 * Visual hierarchy: Owner at top with most permissions, descending to Guest.
 */

/**
 * Role definitions in order of permission level (highest to lowest)
 */
const ROLES = [
  { id: 'owner', name: 'Owner', description: 'Full workspace control' },
  { id: 'admin', name: 'Admin', description: 'Manage workspace settings and members' },
  { id: 'billing', name: 'Billing', description: 'Manage subscriptions and payments' },
  { id: 'member', name: 'Member', description: 'Standard workspace access' },
  { id: 'viewer', name: 'Viewer', description: 'Read-only access' },
  { id: 'guest', name: 'Guest', description: 'Limited external access' },
] as const

/**
 * Permission categories with descriptions
 */
const PERMISSION_CATEGORIES = [
  { id: 'workspace', name: 'Workspace Settings', shortName: 'Workspace' },
  { id: 'members', name: 'Member Management', shortName: 'Members' },
  { id: 'billing', name: 'Billing & Subscription', shortName: 'Billing' },
  { id: 'business', name: 'Business Management', shortName: 'Business' },
  { id: 'agents', name: 'AI Agent Configuration', shortName: 'AI Agents' },
  { id: 'approvals', name: 'Approval Actions', shortName: 'Approvals' },
  { id: 'export', name: 'Data Export', shortName: 'Export' },
] as const

type RoleId = (typeof ROLES)[number]['id']
type PermissionId = (typeof PERMISSION_CATEGORIES)[number]['id']

/**
 * Permission matrix defining which roles have which permissions
 * true = has permission, false = does not have permission
 */
const PERMISSION_MATRIX: Record<RoleId, Record<PermissionId, boolean>> = {
  owner: {
    workspace: true,
    members: true,
    billing: true,
    business: true,
    agents: true,
    approvals: true,
    export: true,
  },
  admin: {
    workspace: true,
    members: true,
    billing: false,
    business: true,
    agents: true,
    approvals: true,
    export: true,
  },
  billing: {
    workspace: false,
    members: false,
    billing: true,
    business: false,
    agents: false,
    approvals: false,
    export: true,
  },
  member: {
    workspace: false,
    members: false,
    billing: false,
    business: true,
    agents: true,
    approvals: true,
    export: true,
  },
  viewer: {
    workspace: false,
    members: false,
    billing: false,
    business: false,
    agents: false,
    approvals: false,
    export: false,
  },
  guest: {
    workspace: false,
    members: false,
    billing: false,
    business: false,
    agents: false,
    approvals: false,
    export: false,
  },
}

/**
 * Role color mapping for visual distinction
 */
const ROLE_COLORS: Record<RoleId, string> = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  billing: 'bg-orange-100 text-orange-800',
  member: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800',
  guest: 'bg-yellow-100 text-yellow-800',
}

/**
 * Permission indicator component
 */
function PermissionIndicator({ hasPermission }: { hasPermission: boolean }) {
  return hasPermission ? (
    <div className="flex justify-center">
      <div className="rounded-full bg-green-100 p-1">
        <Check className="h-4 w-4 text-green-600" />
      </div>
    </div>
  ) : (
    <div className="flex justify-center">
      <div className="rounded-full bg-gray-100 p-1">
        <X className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  )
}

/**
 * PermissionMatrix Component
 *
 * Displays a visual matrix of roles and their permissions.
 * Read-only display for understanding role capabilities.
 */
export function PermissionMatrix() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Matrix</CardTitle>
        <CardDescription>
          Overview of permissions for each role. Owners have full access, while other roles have
          limited capabilities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Responsive container with horizontal scroll on mobile */}
        <div className="overflow-x-auto -mx-6 px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px] min-w-[140px]">Role</TableHead>
                {PERMISSION_CATEGORIES.map((category) => (
                  <TableHead
                    key={category.id}
                    className="text-center min-w-[100px]"
                    title={category.name}
                  >
                    {/* Show short name on small screens, full name on larger */}
                    <span className="hidden lg:inline">{category.name}</span>
                    <span className="lg:hidden">{category.shortName}</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROLES.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium w-fit ${ROLE_COLORS[role.id]}`}
                      >
                        {role.name}
                      </span>
                      <span className="text-xs text-gray-500 hidden sm:block">{role.description}</span>
                    </div>
                  </TableCell>
                  {PERMISSION_CATEGORIES.map((category) => (
                    <TableCell key={category.id} className="text-center">
                      <PermissionIndicator
                        hasPermission={PERMISSION_MATRIX[role.id][category.id]}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-green-100 p-1">
              <Check className="h-3 w-3 text-green-600" />
            </div>
            <span>Has permission</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-gray-100 p-1">
              <X className="h-3 w-3 text-gray-400" />
            </div>
            <span>No permission</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
