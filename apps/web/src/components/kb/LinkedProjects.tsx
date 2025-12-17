'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FolderKanban, Star, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  useLinkedProjects,
  useUnlinkPageFromProject,
  type ProjectPageLink,
} from '@/hooks/use-kb-pages'
import { LinkProjectModal } from './LinkProjectModal'
import { cn } from '@/lib/utils'

interface LinkedProjectsProps {
  pageId: string
  workspaceId: string
}

export function LinkedProjects({ pageId, workspaceId }: LinkedProjectsProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const { data, isLoading } = useLinkedProjects(pageId, workspaceId)
  const unlinkMutation = useUnlinkPageFromProject(workspaceId)

  const links = data?.data ?? []

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Linked Projects
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="mr-1 h-3 w-3" />
            Link
          </Button>
        </div>

        {links.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No projects linked yet
          </p>
        ) : (
          <ul className="space-y-1">
            {links.map((link) => (
              <LinkedProjectItem
                key={link.id}
                link={link}
                onUnlink={() =>
                  unlinkMutation.mutate({
                    pageId,
                    projectId: link.projectId,
                  })
                }
                isUnlinking={unlinkMutation.isPending}
              />
            ))}
          </ul>
        )}

        <LinkProjectModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          pageId={pageId}
          workspaceId={workspaceId}
          existingLinks={links}
        />
      </div>
    </TooltipProvider>
  )
}

function LinkedProjectItem({
  link,
  onUnlink,
  isUnlinking,
}: {
  link: ProjectPageLink
  onUnlink: () => void
  isUnlinking: boolean
}) {
  return (
    <li className="group flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5 text-sm">
      <FolderKanban className="h-4 w-4 text-muted-foreground" />
      <Link
        href={`/dashboard/pm/${link.project?.slug}`}
        className="flex-1 truncate hover:underline"
      >
        {link.project?.name || 'Unknown Project'}
      </Link>

      {link.isPrimary && (
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="secondary" className="h-5 gap-1 px-1.5">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <span className="text-xs">Primary</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>This is the primary doc for the project</p>
          </TooltipContent>
        </Tooltip>
      )}

      <button
        type="button"
        onClick={onUnlink}
        disabled={isUnlinking}
        className={cn(
          'rounded p-0.5 opacity-0 transition-opacity hover:bg-destructive/20',
          'group-hover:opacity-100',
          isUnlinking && 'cursor-not-allowed opacity-50'
        )}
        title="Unlink from project"
      >
        <X className="h-3.5 w-3.5 text-destructive" />
      </button>
    </li>
  )
}
