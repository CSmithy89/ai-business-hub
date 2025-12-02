'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, MoreHorizontal, UserMinus, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { useSession } from '@/lib/auth-client'

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
  invitedBy: {
    id: string
    name: string | null
  } | null
}

/**
 * Role configuration
 */
const ROLES = ['admin', 'member', 'viewer', 'guest'] as const
type Role = (typeof ROLES)[number]

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
  guest: 'Guest',
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  member: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800',
  guest: 'bg-yellow-100 text-yellow-800',
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
 * MembersList Component
 *
 * Displays workspace members with role management capabilities.
 */
export function MembersList() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const currentUserId = session?.user?.id

  // Member to remove (for confirmation dialog)
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null)

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
          <div className="divide-y">
            {members?.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                {/* Member Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.image || undefined} alt={member.name || member.email} />
                    <AvatarFallback>
                      {(member.name || member.email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {member.name || member.email}
                      </span>
                      {member.userId === currentUserId && (
                        <Badge variant="outline" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">{member.email}</span>
                  </div>
                </div>

                {/* Role & Actions */}
                <div className="flex items-center gap-3">
                  <Badge className={ROLE_COLORS[member.role] || ROLE_COLORS.member}>
                    {ROLE_LABELS[member.role] || member.role}
                  </Badge>

                  {/* Actions dropdown - only for non-owners and if user can manage */}
                  {canManageMembers && member.role !== 'owner' && member.userId !== currentUserId && (
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
            ))}
          </div>
        </CardContent>
      </Card>

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
