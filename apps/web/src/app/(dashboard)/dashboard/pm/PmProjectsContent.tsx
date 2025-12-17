'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Plus, FolderOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePmProjects } from '@/hooks/use-pm-projects'
import type { ListProjectsQuery } from '@hyvve/shared'

const PROJECT_STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'] as const
const PROJECT_TYPES = [
  'COURSE',
  'PODCAST',
  'BOOK',
  'NEWSLETTER',
  'VIDEO_SERIES',
  'COMMUNITY',
  'SOFTWARE',
  'WEBSITE',
  'CUSTOM',
] as const

function progressPercent(totalTasks: number, completedTasks: number): number {
  if (!Number.isFinite(totalTasks) || totalTasks <= 0) return 0
  const safeCompleted = Number.isFinite(completedTasks) ? completedTasks : 0
  return Math.max(0, Math.min(100, Math.round((safeCompleted / totalTasks) * 100)))
}

export function PmProjectsContent() {
  type StatusValue = Exclude<ListProjectsQuery['status'], undefined>
  type TypeValue = Exclude<ListProjectsQuery['type'], undefined>

  const [status, setStatus] = useState<StatusValue | 'all'>('all')
  const [type, setType] = useState<TypeValue | 'all'>('all')
  const [search, setSearch] = useState<string>('')

  const filters: ListProjectsQuery = useMemo(() => {
    return {
      status: status === 'all' ? undefined : status,
      type: type === 'all' ? undefined : type,
      search: search.trim() ? search.trim() : undefined,
      page: 1,
      limit: 50,
    }
  }, [search, status, type])

  const { data, isLoading, error } = usePmProjects(filters)

  const projects = data?.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--color-text-primary))]">Projects</h1>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">
            Track work across phases and teams.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href={{ pathname: '/dashboard/pm/new' }}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </span>
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Status</span>
            <Select value={status} onValueChange={(value) => setStatus(value as StatusValue | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {PROJECT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Type</span>
            <Select value={type} onValueChange={(value) => setType(value as TypeValue | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {PROJECT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Search</span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or slug..."
            />
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-red-600">{error.message}</p>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-[rgb(var(--color-text-secondary))]">Loading projects…</p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          headline="Create your first project"
          description="Start tracking work with structured phases, templates, and team roles."
          ctaText="New Project"
          ctaHref="/dashboard/pm/new"
        />
      ) : null}

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const percent = progressPercent(project.totalTasks, project.completedTasks)
            return (
              <Link
                key={project.id}
                href={{ pathname: '/dashboard/pm/[slug]', query: { slug: project.slug } }}
                className="block"
              >
                <Card className="h-full transition-colors hover:bg-[rgb(var(--color-bg-secondary))]">
                  <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-md text-white"
                        style={{ backgroundColor: project.color || '#3B82F6' }}
                        aria-hidden="true"
                      >
                        <span className="text-sm font-semibold">
                          {(project.icon || 'folder').slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{project.name}</CardTitle>
                        <p className="mt-1 truncate text-xs text-[rgb(var(--color-text-secondary))]">
                          {project.slug}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {project.type.replace(/_/g, ' ')}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[rgb(var(--color-text-secondary))]">
                        {project.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-medium text-[rgb(var(--color-text-primary))]">
                        {percent}%
                      </span>
                    </div>
                    <Progress value={percent} />
                    <div className="text-xs text-[rgb(var(--color-text-secondary))]">
                      {project.completedTasks}/{project.totalTasks} tasks completed
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
