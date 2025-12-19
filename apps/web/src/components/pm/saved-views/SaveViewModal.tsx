'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateSavedView, useUpdateSavedView, type SavedView, type CreateSavedViewInput } from '@/hooks/use-saved-views'

interface SaveViewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  viewState: {
    viewType: 'LIST' | 'KANBAN' | 'CALENDAR' | 'TABLE'
    filters: Record<string, any>
    sortBy?: string
    sortOrder?: string
    groupBy?: string
  }
  existingView?: SavedView | null
}

export function SaveViewModal({ open, onOpenChange, projectId, viewState, existingView }: SaveViewModalProps) {
  const [name, setName] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [isShared, setIsShared] = useState(false)

  const createMutation = useCreateSavedView()
  const updateMutation = useUpdateSavedView()

  // Pre-fill form if editing existing view
  useEffect(() => {
    if (existingView) {
      setName(existingView.name)
      setIsDefault(existingView.isDefault)
      setIsShared(existingView.isShared)
    } else {
      setName('')
      setIsDefault(false)
      setIsShared(false)
    }
  }, [existingView, open])

  const handleSave = async () => {
    if (!name.trim()) return

    // Include groupBy in filters if in kanban mode
    const filters = { ...viewState.filters }
    if (viewState.viewType === 'KANBAN' && viewState.groupBy) {
      filters.kanbanGroupBy = viewState.groupBy
    }

    const input: CreateSavedViewInput = {
      name: name.trim(),
      projectId,
      viewType: viewState.viewType,
      filters,
      sortBy: viewState.sortBy,
      sortOrder: viewState.sortOrder,
      isDefault,
      isShared,
    }

    if (existingView) {
      await updateMutation.mutateAsync({ id: existingView.id, input })
    } else {
      await createMutation.mutateAsync(input)
    }

    onOpenChange(false)
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{existingView ? 'Edit View' : 'Save View'}</DialogTitle>
          <DialogDescription>
            {existingView
              ? 'Update the name and settings for this saved view.'
              : 'Save your current filters and view configuration for quick access later.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="view-name">View name</Label>
            <Input
              id="view-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Active Tasks"
              maxLength={50}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="default"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked as boolean)}
              disabled={isLoading}
            />
            <Label
              htmlFor="default"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Set as default view
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="shared"
              checked={isShared}
              onCheckedChange={(checked) => setIsShared(checked as boolean)}
              disabled={isLoading}
            />
            <Label
              htmlFor="shared"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Share with team
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isLoading}>
            {isLoading ? 'Saving...' : existingView ? 'Update' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
