'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { KBPage } from '@/hooks/use-kb-pages'
import { PageTreeNode } from './PageTreeNode'

interface PageTreeProps {
  pages: KBPage[]
  currentPageSlug?: string
  onMove?: (pageId: string, newParentId: string | null) => void
  onCreateSubpage?: (parentId: string) => void
  onRename?: (pageId: string) => void
  onDelete?: (pageId: string) => void
  onNewPage?: () => void
}

interface TreeNode extends KBPage {
  children: TreeNode[]
}

function buildTree(pages: KBPage[]): TreeNode[] {
  const pageMap = new Map<string, TreeNode>()
  const rootNodes: TreeNode[] = []

  // Initialize all pages as tree nodes
  pages.forEach((page) => {
    pageMap.set(page.id, { ...page, children: [] })
  })

  // Build parent-child relationships
  pages.forEach((page) => {
    const node = pageMap.get(page.id)!
    if (page.parentId) {
      const parent = pageMap.get(page.parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        // Parent not found, treat as root
        rootNodes.push(node)
      }
    } else {
      rootNodes.push(node)
    }
  })

  // Sort children by title
  const sortChildren = (node: TreeNode) => {
    node.children.sort((a, b) => a.title.localeCompare(b.title))
    node.children.forEach(sortChildren)
  }
  rootNodes.forEach(sortChildren)

  return rootNodes
}

export function PageTree({
  pages,
  currentPageSlug,
  onMove,
  onCreateSubpage,
  onRename,
  onDelete,
  onNewPage,
}: PageTreeProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const tree = useMemo(() => buildTree(pages), [pages])

  const toggleExpand = (pageId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(pageId)) {
        next.delete(pageId)
      } else {
        next.add(pageId)
      }
      return next
    })
  }

  const handleNavigate = (slug: string) => {
    router.push(`/kb/${slug}`)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) {
      return
    }

    const activeData = active.data.current as { page: KBPage }
    const overData = over.data.current as { page: KBPage } | undefined

    if (!activeData?.page) {
      return
    }

    // If dropped on another page, make it a child
    if (overData?.page && onMove) {
      const newParentId = overData.page.id
      // Don't allow a page to be its own parent
      if (activeData.page.id !== newParentId) {
        onMove(activeData.page.id, newParentId)
        // Auto-expand the new parent
        setExpanded((prev) => new Set(prev).add(newParentId))
      }
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const renderNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const hasChildren = node.children.length > 0
    const isExpanded = expanded.has(node.id)
    const isCurrent = node.slug === currentPageSlug

    return (
      <div key={node.id}>
        <PageTreeNode
          page={node}
          level={level}
          isExpanded={isExpanded}
          isCurrent={isCurrent}
          hasChildren={hasChildren}
          onToggleExpand={() => toggleExpand(node.id)}
          onNavigate={handleNavigate}
          onCreateSubpage={onCreateSubpage}
          onRename={onRename}
          onDelete={onDelete}
        />
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const activePage = activeId ? pages.find((p) => p.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Pages</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onNewPage}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-0.5">
            {tree.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
                <FileText className="mb-2 h-8 w-8 opacity-50" />
                <p>No pages yet</p>
              </div>
            ) : (
              <SortableContext
                items={pages.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {tree.map((node) => renderNode(node))}
              </SortableContext>
            )}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activePage && (
          <div className="flex items-center gap-2 rounded-md bg-accent px-3 py-2 shadow-lg">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{activePage.title}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
