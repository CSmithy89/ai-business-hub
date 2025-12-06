'use client'

/**
 * Invite Member Modal Component
 * Story 09-11: Allow workspace admins to invite new team members
 */

import { useState } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Mail, UserPlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSession } from '@/lib/auth-client'
import {
  inviteMemberSchema,
  type InviteMemberFormData,
  WORKSPACE_ROLES,
} from '@/lib/validations/workspace'

/**
 * Role labels for display
 */
const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
  guest: 'Guest',
}

/**
 * Role descriptions
 */
const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Can manage members and workspace settings',
  member: 'Can access and contribute to workspace',
  viewer: 'Can view workspace content only',
  guest: 'Limited access to specific resources',
}

/**
 * Send invitation API call
 */
async function sendInvitation(
  workspaceId: string,
  data: InviteMemberFormData
): Promise<void> {
  const response = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'Failed to send invitation')
  }
}

/**
 * InviteMemberModal Component
 *
 * Modal dialog for inviting new members to workspace:
 * - Email input with validation
 * - Role selection dropdown
 * - Loading states
 * - Success/error handling
 * - Query invalidation on success
 */
export function InviteMemberModal() {
  const [open, setOpen] = useState(false)
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)
    ?.activeWorkspaceId

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteMemberFormData>({
    // Type assertion needed due to Zod version mismatch with @hookform/resolvers
    resolver: zodResolver(inviteMemberSchema as unknown as Parameters<typeof zodResolver>[0]) as unknown as Resolver<InviteMemberFormData>,
    defaultValues: {
      email: '',
      role: 'member',
    },
  })

  const selectedRole = watch('role')

  // Mutation for sending invitation
  const sendInvitationMutation = useMutation({
    mutationFn: (data: InviteMemberFormData) => sendInvitation(workspaceId!, data),
    onSuccess: () => {
      toast.success('Invitation sent successfully')
      // Invalidate members and invitations queries
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['workspace-invitations', workspaceId] })
      handleClose()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send invitation')
    },
  })

  const handleClose = () => {
    setOpen(false)
    reset()
  }

  const onSubmit = (data: InviteMemberFormData) => {
    sendInvitationMutation.mutate(data)
  }

  if (!workspaceId) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your workspace. They will receive an email with a link to
            accept the invitation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                className="pl-10"
                {...register('email')}
                disabled={sendInvitationMutation.isPending}
                aria-invalid={errors.email ? 'true' : 'false'}
              />
            </div>
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setValue('role', value as InviteMemberFormData['role'])}
              disabled={sendInvitationMutation.isPending}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {WORKSPACE_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{ROLE_LABELS[role]}</span>
                      <span className="text-xs text-gray-500">{ROLE_DESCRIPTIONS[role]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-red-600">{errors.role.message}</p>}
          </div>

          {/* Selected Role Info */}
          {selectedRole && (
            <div className="rounded-lg border bg-gray-50 p-3">
              <p className="text-sm text-gray-700">
                <strong>{ROLE_LABELS[selectedRole]}</strong> role will be assigned.{' '}
                {ROLE_DESCRIPTIONS[selectedRole]}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={sendInvitationMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sendInvitationMutation.isPending}>
              {sendInvitationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
