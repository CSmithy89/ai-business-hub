'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Save, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import type { WorkspaceWithRole } from '@hyvve/shared'

/**
 * Common timezones for the dropdown
 */
const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland',
]

/**
 * Form data for workspace settings
 */
interface WorkspaceFormData {
  name: string
  image: string
  timezone: string
}

/**
 * Fetch workspace details by ID
 */
async function fetchWorkspace(workspaceId: string): Promise<WorkspaceWithRole> {
  const response = await fetch(`/api/workspaces/${workspaceId}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch workspace')
  }

  return data.data
}

/**
 * Update workspace settings
 */
async function updateWorkspace(
  workspaceId: string,
  formData: Partial<WorkspaceFormData>
): Promise<WorkspaceWithRole> {
  const response = await fetch(`/api/workspaces/${workspaceId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update workspace')
  }

  return data.data
}

/**
 * Delete workspace (soft delete)
 */
async function deleteWorkspace(workspaceId: string): Promise<void> {
  const response = await fetch(`/api/workspaces/${workspaceId}`, {
    method: 'DELETE',
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete workspace')
  }
}

/**
 * WorkspaceSettingsForm Component
 *
 * Form for editing workspace name, image, and timezone settings.
 */
export function WorkspaceSettingsForm() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const router = useRouter()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId

  // Form state
  const [formData, setFormData] = useState<WorkspaceFormData>({
    name: '',
    image: '',
    timezone: 'UTC',
  })
  const [hasChanges, setHasChanges] = useState(false)

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')

  // Fetch workspace data
  const {
    data: workspace,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => fetchWorkspace(workspaceId!),
    enabled: !!workspaceId,
  })

  // Update form when workspace data loads
  useEffect(() => {
    if (workspace) {
      setFormData({
        name: workspace.name,
        image: workspace.image || '',
        timezone: workspace.timezone || 'UTC',
      })
    }
  }, [workspace])

  // Check for changes
  const checkChanges = useCallback(() => {
    if (!workspace) return false
    return (
      formData.name !== workspace.name ||
      formData.image !== (workspace.image || '') ||
      formData.timezone !== (workspace.timezone || 'UTC')
    )
  }, [formData, workspace])

  useEffect(() => {
    setHasChanges(checkChanges())
  }, [checkChanges])

  // Update mutation
  const mutation = useMutation({
    mutationFn: (data: Partial<WorkspaceFormData>) =>
      updateWorkspace(workspaceId!, data),
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['workspace', workspaceId] })

      // Snapshot previous value
      const previousWorkspace = queryClient.getQueryData(['workspace', workspaceId])

      // Optimistically update
      queryClient.setQueryData(['workspace', workspaceId], (old: WorkspaceWithRole | undefined) => {
        if (!old) return old
        return { ...old, ...newData }
      })

      return { previousWorkspace }
    },
    onSuccess: () => {
      toast.success('Workspace settings updated successfully')
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
    onError: (error, _newData, context) => {
      // Rollback on error
      if (context?.previousWorkspace) {
        queryClient.setQueryData(['workspace', workspaceId], context.previousWorkspace)
      }
      toast.error(error.message || 'Failed to update workspace settings')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteWorkspace(workspaceId!),
    onSuccess: () => {
      toast.success('Workspace scheduled for deletion')
      // Invalidate workspaces list
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      // Redirect to dashboard
      router.push('/dashboard')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete workspace')
    },
  })

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (deleteConfirmName === workspace?.name) {
      deleteMutation.mutate()
    }
  }

  // Reset delete dialog
  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false)
    setDeleteConfirmName('')
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasChanges || !workspace) return

    // Only send changed fields
    const changes: Partial<WorkspaceFormData> = {}

    if (formData.name !== workspace.name) {
      changes.name = formData.name
    }

    if (formData.image !== (workspace.image || '')) {
      changes.image = formData.image || null as unknown as string
    }

    if (formData.timezone !== (workspace.timezone || 'UTC')) {
      changes.timezone = formData.timezone
    }

    if (Object.keys(changes).length > 0) {
      mutation.mutate(changes)
    }
  }

  // Handle input changes
  const handleChange = (field: keyof WorkspaceFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
            <span className="text-gray-500">Loading workspace settings...</span>
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
            {error instanceof Error ? error.message : 'Failed to load workspace'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Update your workspace name and avatar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Workspace Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Workspace Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="My Workspace"
              minLength={3}
              maxLength={50}
              required
            />
            <p className="text-xs text-gray-500">
              This is the display name for your workspace. The URL slug will be
              automatically updated.
            </p>
          </div>

          {/* Workspace Image URL */}
          <div className="space-y-2">
            <Label htmlFor="image">Workspace Image URL</Label>
            <div className="flex items-center gap-4">
              {/* Image Preview */}
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {formData.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formData.image}
                    alt="Workspace"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-2xl font-semibold text-gray-400">
                    {formData.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Input
                  id="image"
                  type="url"
                  value={formData.image}
                  onChange={(e) => handleChange('image', e.target.value)}
                  placeholder="https://example.com/image.png"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a URL for your workspace logo or avatar
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timezone Card */}
      <Card>
        <CardHeader>
          <CardTitle>Timezone</CardTitle>
          <CardDescription>
            Set the default timezone for workspace events and timestamps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="timezone">Workspace Timezone</Label>
            <select
              id="timezone"
              value={formData.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#FF6B6B] focus:outline-none focus:ring-1 focus:ring-[#FF6B6B]"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              This timezone will be used for scheduling and displaying timestamps
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!hasChanges || mutation.isPending}
          className="min-w-[120px]"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Danger Zone - Owner Only */}
      {workspace?.role === 'owner' && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-red-700">
              Irreversible actions that affect your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-900">Delete this workspace</p>
                <p className="text-sm text-red-700">
                  Once deleted, there is a 30-day grace period before permanent deletion.
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Workspace
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={handleCloseDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Workspace
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This action will schedule <strong>{workspace?.name}</strong> for
                deletion. All workspace data will be permanently deleted after 30
                days.
              </p>
              <p>
                To confirm, please type the workspace name:{' '}
                <strong>{workspace?.name}</strong>
              </p>
              <Input
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder="Type workspace name to confirm"
                className="mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDeleteDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteConfirmName !== workspace?.name || deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Workspace'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}
