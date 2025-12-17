'use client'

import { useState } from 'react'
import { Link as LinkIcon, Star, Check, X, FileText } from 'lucide-react'
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
import { useKBPages, useLinkPageToProject } from '@/hooks/use-kb-pages'
import { useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

interface LinkDocModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  existingPageIds: string[]
}

export function LinkDocModal({
  open,
  onOpenChange,
  projectId,
  existingPageIds,
}: LinkDocModalProps) {
  const [search, setSearch] = useState('')
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [isPrimary, setIsPrimary] = useState(false)

  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId || ''

  const { data: pagesData, isLoading } = useKBPages(workspaceId, true)
  const linkMutation = useLinkPageToProject(workspaceId)

  const pages = pagesData?.data ?? []
  const alreadyLinkedIds = new Set(existingPageIds)

  const filteredPages = pages.filter((p) => {
    if (alreadyLinkedIds.has(p.id)) return false
    if (!search) return true
    return p.title.toLowerCase().includes(search.toLowerCase())
  })

  const handleLink = async () => {
    if (!selectedPageId) return

    try {
      await linkMutation.mutateAsync({
        pageId: selectedPageId,
        projectId,
        isPrimary,
      })
      setSelectedPageId(null)
      setIsPrimary(false)
      onOpenChange(false)
    } catch {
      // Error handled by hook
    }
  }

  const handleClose = () => {
    setSelectedPageId(null)
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
            Link KB Page
          </DialogTitle>
          <DialogDescription>
            Select a KB page to link to this project. The page will appear in the
            project&apos;s Docs tab.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Search pages..."
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
            ) : filteredPages.length === 0 ? (
              <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
                {pages.length === 0
                  ? 'No KB pages found'
                  : alreadyLinkedIds.size === pages.length
                    ? 'All pages are already linked'
                    : 'No matching pages'}
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredPages.map((page) => (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => setSelectedPageId(page.id)}
                    className={cn(
                      'w-full rounded-md px-3 py-2 text-left transition-colors',
                      'hover:bg-accent',
                      selectedPageId === page.id && 'bg-accent ring-2 ring-primary'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{page.title}</span>
                      </div>
                      {selectedPageId === page.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    {page.parentId && (
                      <div className="ml-6 text-xs text-muted-foreground">
                        Nested page
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {selectedPageId && (
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
            disabled={!selectedPageId || linkMutation.isPending}
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            {linkMutation.isPending ? 'Linking...' : 'Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
