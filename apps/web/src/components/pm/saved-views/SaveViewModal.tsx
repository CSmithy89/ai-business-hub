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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateSavedView, useUpdateSavedView, type SavedView, type CreateSavedViewInput } from '@/hooks/use-saved-views'

interface SaveViewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  viewState: {
    viewType: 'LIST' | 'KANBAN' | 'CALENDAR' | 'TABLE' | 'TIMELINE'
    filters: Record<string, any>
    sortBy?: string
    sortOrder?: string
    groupBy?: string
    columns?: string[]
  }
  existingView?: SavedView | null
}

const COLUMN_LABELS: Record<string, string> = {
  select: 'Selection',
  taskNumber: 'ID',
  title: 'Title',
  status: 'Status',
  priority: 'Priority',
  assigneeId: 'Assignee',
  dueDate: 'Due Date',
}

const SORT_FIELDS = ['taskNumber', 'title', 'status', 'priority', 'assigneeId', 'dueDate'] as const

export function SaveViewModal({ open, onOpenChange, projectId, viewState, existingView }: SaveViewModalProps) {
  const [name, setName] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [isShared, setIsShared] = useState(false)
  const [columns, setColumns] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const createMutation = useCreateSavedView()
  const updateMutation = useUpdateSavedView()

  // Pre-fill form if editing existing view
  useEffect(() => {
    const defaultColumns = viewState.columns && viewState.columns.length > 0
      ? viewState.columns
      : Object.keys(COLUMN_LABELS)

    if (existingView) {
      setName(existingView.name)
      setIsDefault(existingView.isDefault)
      setIsShared(existingView.isShared)
      setColumns(existingView.columns ?? defaultColumns)
      setSortBy(existingView.sortBy ?? '')
      setSortOrder((existingView.sortOrder as 'asc' | 'desc') ?? 'asc')
    } else {
      setName('')
      setIsDefault(false)
      setIsShared(false)
      setColumns(defaultColumns)
      setSortBy(viewState.sortBy ?? '')
      setSortOrder((viewState.sortOrder as 'asc' | 'desc') ?? 'asc')
    }
  }, [existingView, open])

  const handleSave = async () => {
    if (!name.trim()) return

    // Include groupBy in filters if in kanban mode
    const filters = { ...viewState.filters }
    if (viewState.viewType === 'KANBAN' && viewState.groupBy) {
      filters.kanbanGroupBy = viewState.groupBy
    }

    const resolvedColumns = columns.length > 0 ? columns : viewState.columns
    const input: CreateSavedViewInput = {
      name: name.trim(),
      projectId,
      viewType: viewState.viewType,
      filters,
      sortBy: sortBy || undefined,
      sortOrder: sortBy ? sortOrder : undefined,
      columns: resolvedColumns,
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
  const showColumns = viewState.viewType === 'LIST' || viewState.viewType === 'TABLE'

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

          {showColumns ? (
            <>
              <div className="grid gap-2">
                <Label>Visible columns</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(COLUMN_LABELS).map(([columnId, label]) => (
                    <label key={columnId} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={columns.includes(columnId)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setColumns((prev) => Array.from(new Set([...prev, columnId])))
                          } else {
                            setColumns((prev) => prev.filter((id) => id !== columnId))
                          }
                        }}
                      />
                      <span className="text-[rgb(var(--color-text-primary))]">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Sort by</Label>
                  <Select
                    value={sortBy || 'none'}
                    onValueChange={(value) => setSortBy(value === 'none' ? '' : value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No sorting" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {SORT_FIELDS.map((field) => (
                        <SelectItem key={field} value={field}>
                          {COLUMN_LABELS[field] || field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Sort order</Label>
                  <Select
                    value={sortOrder}
                    onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ascending" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : null}

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
