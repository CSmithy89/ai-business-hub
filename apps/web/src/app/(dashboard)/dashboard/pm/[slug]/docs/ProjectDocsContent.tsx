'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { FileText, Plus, Star, Link as LinkIcon, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { usePmProject, useProjectDocs, type ProjectDocLink } from '@/hooks/use-pm-projects'
import { LinkDocModal } from './LinkDocModal'
import { cn } from '@/lib/utils'

function formatRelativeTime(date: string): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return d.toLocaleDateString()
}

function truncateText(text: string | null, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

function ProjectNavTabs({ slug }: { slug: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Link
        href={{ pathname: '/dashboard/pm/[slug]', query: { slug } }}
        className="rounded-md px-3 py-1.5 text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-bg-tertiary))]"
      >
        Overview
      </Link>
      <Link
        href={{ pathname: '/dashboard/pm/[slug]/tasks', query: { slug } }}
        className="rounded-md px-3 py-1.5 text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-bg-tertiary))]"
      >
        Tasks
      </Link>
      <Link
        href={{ pathname: '/dashboard/pm/[slug]/team', query: { slug } }}
        className="rounded-md px-3 py-1.5 text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-bg-tertiary))]"
      >
        Team
      </Link>
      <Link
        href={{ pathname: '/dashboard/pm/[slug]/docs', query: { slug } }}
        className="rounded-md bg-[rgb(var(--color-bg-tertiary))] px-3 py-1.5 text-[rgb(var(--color-text-primary))]"
      >
        Docs
      </Link>
      <Link
        href={{ pathname: '/dashboard/pm/[slug]/settings', query: { slug } }}
        className="rounded-md px-3 py-1.5 text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-bg-tertiary))]"
      >
        Settings
      </Link>
    </div>
  )
}

function DocCard({ doc, isPrimary }: { doc: ProjectDocLink; isPrimary: boolean }) {
  return (
    <Card className={cn(isPrimary && 'ring-2 ring-primary')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <Link
                href={`/kb/${doc.page.slug}`}
                className="truncate font-medium hover:underline"
              >
                {doc.page.title}
              </Link>
              {isPrimary && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="secondary" className="h-5 gap-1 px-1.5">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-xs">Primary</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This is the primary doc for this project</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {doc.page.contentText && (
              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                {truncateText(doc.page.contentText, 150)}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Updated {formatRelativeTime(doc.page.updatedAt)}
            </p>
          </div>
          <Link
            href={`/kb/${doc.page.slug}`}
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Open doc"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ onLinkClick, onCreateClick }: { onLinkClick: () => void; onCreateClick: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">No docs linked yet</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Link existing KB pages to this project or create new documentation to keep everything organized.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={onLinkClick}>
            <LinkIcon className="mr-2 h-4 w-4" />
            Link Existing
          </Button>
          <Button onClick={onCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProjectDocsContent() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const slug = params?.slug

  const [linkModalOpen, setLinkModalOpen] = useState(false)

  const { data: projectData, isLoading: projectLoading, error: projectError } = usePmProject(slug)
  const project = projectData?.data

  const { data: docsData, isLoading: docsLoading } = useProjectDocs(project?.id ?? '')
  const docs = docsData?.data ?? []

  const primaryDoc = docs.find((d) => d.isPrimary)
  const otherDocs = docs.filter((d) => !d.isPrimary)

  if (!slug) return null

  if (projectLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">Loading project...</p>
        </CardContent>
      </Card>
    )
  }

  if (projectError || !project) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-red-600">{projectError?.message || 'Project not found'}</p>
          <Link href="/dashboard/pm" className="mt-3 inline-block text-sm text-primary hover:underline">
            Back to projects
          </Link>
        </CardContent>
      </Card>
    )
  }

  const handleCreateNew = () => {
    // Navigate to KB with context to create and link
    router.push(`/kb?createFor=${project.id}`)
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-lg border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-bg-primary))] p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-md text-white"
                style={{ backgroundColor: project.color || '#3B82F6' }}
                aria-hidden="true"
              >
                <span className="text-sm font-semibold">
                  {(project.icon || 'folder').slice(0, 1).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[rgb(var(--color-text-primary))]">
                  {project.name}
                </h1>
                <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                  Project Documentation
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setLinkModalOpen(true)}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Link Existing
              </Button>
              <Button size="sm" onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create New
              </Button>
            </div>
          </div>

          <ProjectNavTabs slug={slug} />
        </div>

        {/* Docs List */}
        {docsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : docs.length === 0 ? (
          <EmptyState onLinkClick={() => setLinkModalOpen(true)} onCreateClick={handleCreateNew} />
        ) : (
          <div className="space-y-4">
            {/* Primary Doc Section */}
            {primaryDoc && (
              <div>
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">Primary Document</h2>
                <DocCard doc={primaryDoc} isPrimary />
              </div>
            )}

            {/* Other Docs Section */}
            {otherDocs.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                  {primaryDoc ? 'Other Documents' : 'Documents'} ({otherDocs.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {otherDocs.map((doc) => (
                    <DocCard key={doc.id} doc={doc} isPrimary={false} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Link Modal */}
        <LinkDocModal
          open={linkModalOpen}
          onOpenChange={setLinkModalOpen}
          projectId={project.id}
          existingPageIds={docs.map((d) => d.pageId)}
        />
      </div>
    </TooltipProvider>
  )
}
