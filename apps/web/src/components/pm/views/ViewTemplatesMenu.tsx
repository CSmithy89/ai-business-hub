'use client'

import { useEffect, useState } from 'react'
import { BookmarkPlus, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type ViewTemplate = {
  id: string
  name: string
  viewState: {
    viewType: 'LIST' | 'KANBAN' | 'CALENDAR' | 'TABLE'
    filters: Record<string, any>
    sortBy?: string
    sortOrder?: string
    groupBy?: string
    columns?: string[]
  }
}

interface ViewTemplatesMenuProps {
  workspaceId: string
  currentViewState: ViewTemplate['viewState']
  onApplyTemplate: (viewState: ViewTemplate['viewState']) => void
}

function getStorageKey(workspaceId: string) {
  return `pm-view-templates-${workspaceId}`
}

export function ViewTemplatesMenu({ workspaceId, currentViewState, onApplyTemplate }: ViewTemplatesMenuProps) {
  const [templates, setTemplates] = useState<ViewTemplate[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(getStorageKey(workspaceId))
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as ViewTemplate[]
      setTemplates(parsed)
    } catch {
      setTemplates([])
    }
  }, [workspaceId])

  const saveTemplates = (next: ViewTemplate[]) => {
    setTemplates(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(getStorageKey(workspaceId), JSON.stringify(next))
    }
  }

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return
    const next: ViewTemplate = {
      id: `${Date.now()}`,
      name: templateName.trim(),
      viewState: currentViewState,
    }
    saveTemplates([next, ...templates])
    setTemplateName('')
    setDialogOpen(false)
  }

  const hasTemplates = templates.length > 0

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Layers className="h-4 w-4" />
            Templates
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>View Templates</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {hasTemplates ? (
            templates.map((template) => (
              <DropdownMenuItem key={template.id} onClick={() => onApplyTemplate(template.viewState)}>
                {template.name}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>No templates saved</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDialogOpen(true)}>
            <BookmarkPlus className="mr-2 h-4 w-4" />
            Save current as template
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save View Template</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Template name"
            value={templateName}
            onChange={(event) => setTemplateName(event.target.value)}
            maxLength={40}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={!templateName.trim()}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
