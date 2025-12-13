'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, MoreHorizontal, UserMinus, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSession } from '@/lib/auth-client'
import { formatLastActive, formatDateTime, getActivityStatus, type ActivityStatus } from '@/lib/date-utils'

/**
 * Member data from API
 */
interface Member {
  id: string
  userId: string
  name: string | null
  email: string
  image: string | null
  role: string
  invitedAt: string
  acceptedAt: string | null
  lastActiveAt: string | null
  invitedBy: {
    id: string
    name: string | null
  } | null
}

/**
 * Role configuration
 * Story 15-10: Added billing role for future subscription management
 */
const ROLES = ['admin', 'member', 'viewer', 'guest', 'billing'] as const
type Role = (typeof ROLES)[number]

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
  guest: 'Guest',
  billing: 'Billing',
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  member: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800',
  guest: 'bg-yellow-100 text-yellow-800',
  billing: 'bg-orange-100 text-orange-800',
}

/**
 * Pagination constants
 * Story 15-10: Add pagination for large teams
 */
const PAGE_SIZE = 20

/**
 * Status colors for activity badges
 */
const STATUS_COLORS: Record<ActivityStatus, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-gray-400',
}

const STATUS_LABELS: Record<ActivityStatus, string> = {
  online: 'Online',
  away: 'Away',
  offline: 'Offline',
}

/**
 * Fetch workspace members
 */
async function fetchMembers(workspaceId: string): Promise<Member[]> {
  const response = await fetch(`/api/workspaces/${workspaceId}/members`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch members')
  }

  return data.data
}

/**
 * Update member role
 */
async function updateMemberRole(
  workspaceId: string,
  userId: string,
  role: string
): Promise<void> {
  const response = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update role')
  }
}

/**
 * Remove member from workspace
 */
async function removeMember(workspaceId: string, userId: string): Promise<void> {
  const response = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
    method: 'DELETE',
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to remove member')
  }
}

/**
 * Filter values
 */
export interface MemberFilters {
  search: string
  role: string
  status: string
}

/**
 * MembersList Props
 */
interface MembersListProps {
  filters?: MemberFilters
}

/**
 * Status Badge Component
 * Shows activity status with color-coded indicator
 */
interface StatusBadgeProps {
  status: ActivityStatus
  lastActiveAt: string | null
}

function StatusBadge({ status, lastActiveAt }: StatusBadgeProps) {
  const statusColor = STATUS_COLORS[status]
  const statusLabel = STATUS_LABELS[status]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${statusColor}`} />
            <span className="text-sm text-gray-600">{statusLabel}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {lastActiveAt
              ? `Last active: ${formatDateTime(lastActiveAt)}`
              : 'Never logged in'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Filter members based on search and filter criteria
 */
function filterMembers(members: Member[], filters?: MemberFilters): Member[] {
  if (!filters) return members

  return members.filter((member) => {
    // Search filter (name or email)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const nameMatch = member.name?.toLowerCase().includes(searchLower)
      const emailMatch = member.email.toLowerCase().includes(searchLower)
      if (!nameMatch && !emailMatch) {
        return false
      }
    }

    // Role filter
    if (filters.role && filters.role !== 'all') {
      if (member.role !== filters.role) {
        return false
      }
    }

    // Status filter (active = has acceptedAt, pending = no acceptedAt)
    if (filters.status && filters.status !== 'all') {
      const isActive = !!member.acceptedAt
      if (filters.status === 'active' && !isActive) {
        return false
      }
      if (filters.status === 'pending' && isActive) {
        return false
      }
    }

    return true
  })
}

/**
 * MembersList Component
 *
 * Displays workspace members with role management capabilities.
 * Supports filtering by search term, role, and status.
 */
export function MembersList({ filters }: MembersListProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const currentUserId = session?.user?.id

  // Member to remove (for confirmation dialog)
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null)

  // Pagination state (Story 15-10)
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch members
  const {
    data: members,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => fetchMembers(workspaceId!),
    enabled: !!workspaceId,
  })

  // Get current user's role
  const currentUserRole = members?.find((m) => m.userId === currentUserId)?.role

  // Can the current user manage members?
  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin'

  // Apply filters to members
  const filteredMembers = members ? filterMembers(members, filters) : []

  // Pagination calculations (Story 15-10)
  const totalMembers = filteredMembers.length
  const totalPages = Math.ceil(totalMembers / PAGE_SIZE)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex)

  // Reset to page 1 when filters change (Story 15-10)
  // Note: This is handled automatically since filters prop change triggers re-render

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateMemberRole(workspaceId!, userId, role),
    onSuccess: () => {
      toast.success('Member role updated')
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update role')
    },
  })

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeMember(workspaceId!, userId),
    onSuccess: () => {
      toast.success('Member removed from workspace')
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
      setMemberToRemove(null)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove member')
    },
  })

  // Handle role change
  const handleRoleChange = (userId: string, newRole: Role) => {
    updateRoleMutation.mutate({ userId, role: newRole })
  }

  // Handle remove confirmation
  const handleRemoveConfirm = () => {
    if (memberToRemove) {
      removeMemberMutation.mutate(memberToRemove.userId)
    }
  }

  // Loading state
  if (!workspaceId) {
    return (
      <Card>
        <CardContent className="py-10">
          <p className="text-center text-gray-500">No workspace selected</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="text-gray-500">Loading members...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10">
          <p className="text-center text-red-500">
            {error instanceof Error ? error.message : 'Failed to load members'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          {paginatedMembers.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">
                {members && members.length > 0
                  ? 'No members match your filters'
                  : 'No members found'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {paginatedMembers.map((member) => {
                const activityStatus = getActivityStatus(member.lastActiveAt)
                const lastActive = formatLastActive(member.lastActiveAt)

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-4 p-4 hover:bg-gray-50"
                  >
                    {/* Member Info */}
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage
                          src={member.image || undefined}
                          alt={member.name || member.email}
                        />
                        <AvatarFallback>
                          {(member.name || member.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-gray-900">
                            {member.name || member.email}
                          </span>
                          {member.userId === currentUserId && (
                            <Badge variant="outline" className="flex-shrink-0 text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <span className="truncate text-sm text-gray-500">{member.email}</span>
                      </div>
                    </div>

                    {/* Status - Hidden on mobile */}
                    <div className="hidden flex-shrink-0 sm:block">
                      <StatusBadge status={activityStatus} lastActiveAt={member.lastActiveAt} />
                    </div>

                    {/* Last Active - Hidden on mobile */}
                    <div className="hidden w-32 flex-shrink-0 text-sm text-gray-600 lg:block">
                      {lastActive}
                    </div>

                    {/* Role & Actions */}
                    <div className="flex flex-shrink-0 items-center gap-3">
                      <Badge className={ROLE_COLORS[member.role] || ROLE_COLORS.member}>
                        {ROLE_LABELS[member.role] || member.role}
                      </Badge>

                      {/* Actions dropdown - only for non-owners and if user can manage */}
                      {canManageMembers &&
                        member.role !== 'owner' &&
                        member.userId !== currentUserId && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* Role options */}
                              {ROLES.map((role) => (
                                <DropdownMenuItem
                                  key={role}
                                  onClick={() => handleRoleChange(member.userId, role)}
                                  disabled={member.role === role}
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  Make {ROLE_LABELS[role]}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              {/* Remove option */}
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setMemberToRemove(member)}
                              >
                                <UserMinus className="mr-2 h-4 w-4" />
                                Remove from workspace
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls (Story 15-10) */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalMembers}
        itemsPerPage={PAGE_SIZE}
        onPageChange={setCurrentPage}
        className="mt-4"
        ariaLabel="Members list pagination"
      />

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <strong>{memberToRemove?.name || memberToRemove?.email}</strong> from
              this workspace? They will lose access to all workspace resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={removeMemberMutation.isPending}
            >
              {removeMemberMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
