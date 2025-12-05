'use client'

/**
 * Pending Invitations Section Component
 * Story 09-12: Display and manage pending workspace invitations
 */

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Mail, Trash2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
 * Invitation data from API
 */
interface Invitation {
  id: string
  email: string
  role: string
  expiresAt: string
  createdAt: string
  invitedBy: {
    id: string
    name: string | null
    email: string
  }
}

/**
 * Role configuration (must match members-list.tsx)
 */
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
 * Fetch pending invitations
 */
async function fetchInvitations(workspaceId: string): Promise<Invitation[]> {
  const response = await fetch(`/api/workspaces/${workspaceId}/invitations`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch invitations')
  }

  return data.data
}

/**
 * Revoke an invitation
 */
async function revokeInvitation(
  workspaceId: string,
  invitationId: string
): Promise<void> {
  const response = await fetch(
    `/api/workspaces/${workspaceId}/invitations/${invitationId}`,
    {
      method: 'DELETE',
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to revoke invitation')
  }
}

/**
 * Resend an invitation
 */
async function resendInvitation(
  workspaceId: string,
  invitationId: string
): Promise<void> {
  const response = await fetch(
    `/api/workspaces/${workspaceId}/invitations/${invitationId}/resend`,
    {
      method: 'POST',
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to resend invitation')
  }
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * PendingInvitationsSection Component
 *
 * Displays pending workspace invitations with management capabilities:
 * - Table view of all pending invitations
 * - Email, role, invited date, and invited by columns
 * - Resend invitation (with cooldown to prevent spam)
 * - Revoke/cancel invitation (with confirmation)
 * - Empty state when no invitations
 * - Only visible to admins/owners
 */
export function PendingInvitationsSection() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)
    ?.activeWorkspaceId

  // State for revoke confirmation dialog
  const [invitationToRevoke, setInvitationToRevoke] = useState<Invitation | null>(null)

  // State for resend cooldown (invitation ID -> cooldown end time)
  const [resendCooldowns, setResendCooldowns] = useState<Record<string, number>>({})

  // Fetch invitations
  const {
    data: invitations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['workspace-invitations', workspaceId],
    queryFn: () => fetchInvitations(workspaceId!),
    enabled: !!workspaceId,
  })

  // Resend invitation mutation
  const resendMutation = useMutation({
    mutationFn: ({ invitationId }: { invitationId: string }) =>
      resendInvitation(workspaceId!, invitationId),
    onSuccess: (_, variables) => {
      toast.success('Invitation email resent successfully')
      // Set cooldown for 60 seconds
      setResendCooldowns((prev) => ({
        ...prev,
        [variables.invitationId]: Date.now() + 60000, // 60 seconds cooldown
      }))
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to resend invitation')
    },
  })

  // Revoke invitation mutation
  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) => revokeInvitation(workspaceId!, invitationId),
    onSuccess: () => {
      toast.success('Invitation revoked successfully')
      queryClient.invalidateQueries({ queryKey: ['workspace-invitations', workspaceId] })
      setInvitationToRevoke(null)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to revoke invitation')
    },
  })

  // Handle resend button click
  const handleResend = useCallback(
    (invitationId: string) => {
      resendMutation.mutate({ invitationId })
    },
    [resendMutation]
  )

  // Handle revoke confirmation
  const handleRevokeConfirm = useCallback(() => {
    if (invitationToRevoke) {
      revokeMutation.mutate(invitationToRevoke.id)
    }
  }, [invitationToRevoke, revokeMutation])

  // Check if resend is on cooldown
  const isResendOnCooldown = useCallback(
    (invitationId: string): boolean => {
      const cooldownEnd = resendCooldowns[invitationId]
      if (!cooldownEnd) return false
      if (Date.now() >= cooldownEnd) {
        // Cooldown expired, remove it
        setResendCooldowns((prev) => {
          const next = { ...prev }
          delete next[invitationId]
          return next
        })
        return false
      }
      return true
    },
    [resendCooldowns]
  )

  // Don't render if no workspace
  if (!workspaceId) {
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent className="py-10">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="text-gray-500">Loading invitations...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state (permission denied returns empty array from API)
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent className="py-10">
          <p className="text-center text-red-500">
            {error instanceof Error ? error.message : 'Failed to load invitations'}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (!invitations || invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <Mail className="h-12 w-12 text-gray-300" />
            <p className="text-gray-500 font-medium">No pending invitations</p>
            <p className="text-sm text-gray-400">
              Invitations you send will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Table view
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Invited Date</TableHead>
                <TableHead>Invited By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => {
                const onCooldown = isResendOnCooldown(invitation.id)
                const isResending =
                  resendMutation.isPending && resendMutation.variables?.invitationId === invitation.id

                return (
                  <TableRow key={invitation.id}>
                    {/* Email */}
                    <TableCell className="font-medium">{invitation.email}</TableCell>

                    {/* Role */}
                    <TableCell>
                      <Badge className={ROLE_COLORS[invitation.role] || ROLE_COLORS.member}>
                        {ROLE_LABELS[invitation.role] || invitation.role}
                      </Badge>
                    </TableCell>

                    {/* Invited Date */}
                    <TableCell className="text-gray-600">
                      {formatDate(invitation.createdAt)}
                    </TableCell>

                    {/* Invited By */}
                    <TableCell className="text-gray-600">
                      {invitation.invitedBy.name || invitation.invitedBy.email}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Resend Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResend(invitation.id)}
                          disabled={isResending || onCooldown}
                          title={
                            onCooldown
                              ? 'Please wait before resending'
                              : 'Resend invitation email'
                          }
                        >
                          {isResending ? (
                            <>
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                              Resend
                            </>
                          )}
                        </Button>

                        {/* Revoke Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInvitationToRevoke(invitation)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Revoke
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog
        open={!!invitationToRevoke}
        onOpenChange={() => setInvitationToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the invitation for{' '}
              <strong>{invitationToRevoke?.email}</strong>? The invitation link will no
              longer work and they will not be able to join the workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={revokeMutation.isPending}
            >
              {revokeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                'Revoke Invitation'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
