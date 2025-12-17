'use client'

import { useState } from 'react'
import { Link as LinkIcon, Star, Check, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { usePmProjects } from '@/hooks/use-pm-projects'
import { useLinkPageToProject, type ProjectPageLink } from '@/hooks/use-kb-pages'
import { cn } from '@/lib/utils'

interface LinkProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pageId: string
  workspaceId: string
  existingLinks: ProjectPageLink[]
}

export function LinkProjectModal({
  open,
  onOpenChange,
  pageId,
  workspaceId,
  existingLinks,
}: LinkProjectModalProps) {
  const [search, setSearch] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [isPrimary, setIsPrimary] = useState(false)

  const { data: projectsData, isLoading } = usePmProjects()
  const linkMutation = useLinkPageToProject(workspaceId)

  const projects = projectsData?.data ?? []
  const alreadyLinkedIds = new Set(existingLinks.map((l) => l.projectId))

  const filteredProjects = projects.filter((p) => {
    if (alreadyLinkedIds.has(p.id)) return false
    if (!search) return true
    return p.name.toLowerCase().includes(search.toLowerCase())
  })

  const handleLink = async () => {
    if (!selectedProjectId) return

    try {
      await linkMutation.mutateAsync({
        pageId,
        projectId: selectedProjectId,
        isPrimary,
      })
      setSelectedProjectId(null)
      setIsPrimary(false)
      onOpenChange(false)
    } catch {
      // Error handled by hook
    }
  }

  const handleClose = () => {
    setSelectedProjectId(null)
    setIsPrimary(false)
    setSearch('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Link to Project
          </DialogTitle>
          <DialogDescription>
            Select a project to link this page to. The page will appear in the
            project&apos;s Docs tab.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <ScrollArea className="h-[250px] rounded-md border">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
                {projects.length === 0
                  ? 'No projects found'
                  : alreadyLinkedIds.size === projects.length
                    ? 'Page is linked to all projects'
                    : 'No matching projects'}
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setSelectedProjectId(project.id)}
                    className={cn(
                      'w-full rounded-md px-3 py-2 text-left transition-colors',
                      'hover:bg-accent',
                      selectedProjectId === project.id && 'bg-accent ring-2 ring-primary'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{project.name}</span>
                      {selectedProjectId === project.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {project.status || 'Active'}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {selectedProjectId && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrimary"
                checked={isPrimary}
                onCheckedChange={(checked) => setIsPrimary(checked === true)}
              />
              <label
                htmlFor="isPrimary"
                className="flex cursor-pointer items-center gap-1 text-sm font-medium leading-none"
              >
                <Star className="h-3 w-3" />
                Set as primary doc for this project
              </label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={!selectedProjectId || linkMutation.isPending}
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            {linkMutation.isPending ? 'Linking...' : 'Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
