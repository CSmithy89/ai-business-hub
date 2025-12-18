'use client'

import { useState } from 'react'
import { Bookmark, ChevronDown, Eye, EyeOff, Pencil, Share2, Star, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import { useSavedViews, useDeleteSavedView, useUpdateSavedView, type SavedView } from '@/hooks/use-saved-views'
import { SaveViewModal } from './SaveViewModal'
import { cn } from '@/lib/utils'

interface SavedViewsDropdownProps {
  projectId: string
  currentUserId: string
  onApplyView: (view: SavedView | null) => void
  onSaveCurrentView: () => void
  activeViewId?: string | null
  currentViewState: {
    viewType: 'LIST' | 'KANBAN' | 'CALENDAR' | 'TABLE'
    filters: Record<string, any>
    sortBy?: string
    sortOrder?: string
    groupBy?: string
  }
}

export function SavedViewsDropdown({
  projectId,
  currentUserId,
  onApplyView,
  onSaveCurrentView,
  activeViewId,
  currentViewState,
}: SavedViewsDropdownProps) {
  const { data } = useSavedViews(projectId)
  const views = data?.data ?? []

  const deleteMutation = useDeleteSavedView()
  const updateMutation = useUpdateSavedView()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [viewToDelete, setViewToDelete] = useState<SavedView | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [viewToEdit, setViewToEdit] = useState<SavedView | null>(null)

  const myViews = views.filter((v: SavedView) => v.userId === currentUserId && !v.isShared)
  const mySharedViews = views.filter((v: SavedView) => v.userId === currentUserId && v.isShared)
  const otherSharedViews = views.filter((v: SavedView) => v.userId !== currentUserId && v.isShared)

  const handleDelete = async () => {
    if (!viewToDelete) return
    await deleteMutation.mutateAsync({ id: viewToDelete.id, projectId })
    setDeleteDialogOpen(false)
    setViewToDelete(null)
    if (activeViewId === viewToDelete.id) {
      onApplyView(null) // Reset to "All Tasks"
    }
  }

  const handleToggleDefault = async (view: SavedView) => {
    await updateMutation.mutateAsync({
      id: view.id,
      input: { isDefault: !view.isDefault },
    })
  }

  const handleToggleShared = async (view: SavedView) => {
    await updateMutation.mutateAsync({
      id: view.id,
      input: { isShared: !view.isShared },
    })
  }

  const openDeleteDialog = (view: SavedView) => {
    setViewToDelete(view)
    setDeleteDialogOpen(true)
  }

  const openEditModal = (view: SavedView) => {
    setViewToEdit(view)
    setEditModalOpen(true)
  }

  const activeView = views.find((v) => v.id === activeViewId)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Bookmark className="h-4 w-4" />
            {activeView ? activeView.name : 'Saved Views'}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* My Views */}
          {myViews.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs font-normal text-[rgb(var(--color-text-secondary))]">
                My Views
              </DropdownMenuLabel>
              {myViews.map((view: SavedView) => (
                <ViewMenuItem
                  key={view.id}
                  view={view}
                  isActive={view.id === activeViewId}
                  isOwner={true}
                  onApply={() => onApplyView(view)}
                  onEdit={() => openEditModal(view)}
                  onDelete={() => openDeleteDialog(view)}
                  onToggleDefault={() => handleToggleDefault(view)}
                  onToggleShared={() => handleToggleShared(view)}
                />
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {/* My Shared Views */}
          {mySharedViews.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs font-normal text-[rgb(var(--color-text-secondary))]">
                My Shared Views
              </DropdownMenuLabel>
              {mySharedViews.map((view: SavedView) => (
                <ViewMenuItem
                  key={view.id}
                  view={view}
                  isActive={view.id === activeViewId}
                  isOwner={true}
                  onApply={() => onApplyView(view)}
                  onEdit={() => openEditModal(view)}
                  onDelete={() => openDeleteDialog(view)}
                  onToggleDefault={() => handleToggleDefault(view)}
                  onToggleShared={() => handleToggleShared(view)}
                />
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Team Shared Views */}
          {otherSharedViews.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs font-normal text-[rgb(var(--color-text-secondary))]">
                Team Shared Views
              </DropdownMenuLabel>
              {otherSharedViews.map((view: SavedView) => (
                <ViewMenuItem
                  key={view.id}
                  view={view}
                  isActive={view.id === activeViewId}
                  isOwner={false}
                  onApply={() => onApplyView(view)}
                />
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Actions */}
          <DropdownMenuItem onClick={() => onApplyView(null)}>
            <Eye className="mr-2 h-4 w-4" />
            All Tasks (Reset Filters)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSaveCurrentView}>
            <Bookmark className="mr-2 h-4 w-4" />
            Save Current View
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Saved View</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{viewToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Modal */}
      <SaveViewModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        projectId={projectId}
        viewState={currentViewState}
        existingView={viewToEdit}
      />
    </>
  )
}

interface ViewMenuItemProps {
  view: SavedView
  isActive: boolean
  isOwner: boolean
  onApply: () => void
  onEdit?: () => void
  onDelete?: () => void
  onToggleDefault?: () => void
  onToggleShared?: () => void
}

function ViewMenuItem({ view, isActive, isOwner, onApply, onEdit, onDelete, onToggleDefault, onToggleShared }: ViewMenuItemProps) {
  if (!isOwner) {
    // Simple view item for team shared views
    return (
      <DropdownMenuItem onClick={onApply} className={cn(isActive && 'bg-[rgb(var(--color-bg-tertiary))]')}>
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            {view.isDefault && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
            <span className="truncate">{view.name}</span>
          </div>
          {view.isShared && <Users className="h-3.5 w-3.5 text-[rgb(var(--color-text-secondary))]" />}
        </div>
      </DropdownMenuItem>
    )
  }

  // Full menu item with actions for own views
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className={cn(isActive && 'bg-[rgb(var(--color-bg-tertiary))]')}>
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            {view.isDefault && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
            <span className="truncate">{view.name}</span>
          </div>
          {view.isShared && <Users className="h-3.5 w-3.5 text-[rgb(var(--color-text-secondary))]" />}
        </div>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem onClick={onApply}>
          <Eye className="mr-2 h-4 w-4" />
          Apply View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleDefault}>
          {view.isDefault ? (
            <>
              <Star className="mr-2 h-4 w-4 fill-yellow-400 text-yellow-400" />
              Unset as Default
            </>
          ) : (
            <>
              <Star className="mr-2 h-4 w-4" />
              Set as Default
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleShared}>
          {view.isShared ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Make Private
            </>
          ) : (
            <>
              <Share2 className="mr-2 h-4 w-4" />
              Share with Team
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
