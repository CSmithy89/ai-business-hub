'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronRight, FileText, MoreHorizontal, Plus, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { KBPage } from '@/hooks/use-kb-pages'

interface PageTreeNodeProps {
  page: KBPage
  level: number
  isExpanded: boolean
  isCurrent: boolean
  hasChildren: boolean
  onToggleExpand: () => void
  onNavigate: (slug: string) => void
  onCreateSubpage?: (parentId: string) => void
  onRename?: (pageId: string) => void
  onDelete?: (pageId: string) => void
}

export function PageTreeNode({
  page,
  level,
  isExpanded,
  isCurrent,
  hasChildren,
  onToggleExpand,
  onNavigate,
  onCreateSubpage,
  onRename,
  onDelete,
}: PageTreeNodeProps) {
  const [showMenu, setShowMenu] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: page.id,
    data: {
      type: 'page',
      page,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-1 rounded-md transition-colors',
        isCurrent && 'bg-accent font-medium',
        isDragging && 'cursor-grabbing'
      )}
    >
      <div
        className={cn(
          'flex flex-1 items-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-accent',
          isCurrent && 'bg-accent'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onNavigate(page.slug)}
        {...attributes}
        {...listeners}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
            className="p-0.5 hover:bg-accent-foreground/10 rounded flex-shrink-0"
          >
            <ChevronRight
              className={cn(
                'w-4 h-4 transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
          </button>
        ) : (
          <div className="w-5 flex-shrink-0" />
        )}

        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />

        <span className="flex-1 truncate text-sm">
          {page.title}
        </span>

        <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'w-6 h-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
                showMenu && 'opacity-100'
              )}
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onCreateSubpage && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onCreateSubpage(page.id)
                  setShowMenu(false)
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Subpage
              </DropdownMenuItem>
            )}
            {onRename && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onRename(page.id)
                  setShowMenu(false)
                }}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(page.id)
                  setShowMenu(false)
                }}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
