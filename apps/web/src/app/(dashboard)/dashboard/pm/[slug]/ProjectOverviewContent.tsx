'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import { CalendarDays, ChevronRight, FileText, Settings, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePmProject } from '@/hooks/use-pm-projects'
import { usePresence } from '@/hooks/use-presence'
import { PresenceBar } from '@/components/pm/presence/PresenceBar'
import { cn } from '@/lib/utils'
import { useProjectContext, type ProjectContext } from '@/lib/context'

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

function percentFromTasks(total: number, completed: number): number {
  if (!Number.isFinite(total) || total <= 0) return 0
  const safeCompleted = Number.isFinite(completed) ? completed : 0
  return clampPercent((safeCompleted / total) * 100)
}

function daysRemaining(targetDate: string | null): number | null {
  if (!targetDate) return null
  const end = new Date(targetDate)
  if (Number.isNaN(end.getTime())) return null
  const diffMs = end.getTime() - Date.now()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function parseMoney(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function percentSpent(budget: number, spend: number): number {
  if (!Number.isFinite(budget) || budget <= 0) return 0
  if (!Number.isFinite(spend) || spend < 0) return 0
  return clampPercent((spend / budget) * 100)
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase()
  const variant =
    normalized === 'ACTIVE' ? 'success' : normalized === 'ON_HOLD' ? 'secondary' : 'outline'

  return <Badge variant={variant as any}>{normalized.replace(/_/g, ' ')}</Badge>
}

function ProgressRing({
  percent,
  label,
}: {
  percent: number
  label?: string
}) {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (clampPercent(percent) / 100) * circumference

  return (
    <div className="relative h-12 w-12">
      <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="rgb(var(--color-border-default))"
          strokeWidth="4"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="rgb(var(--color-primary-500))"
          strokeWidth="4"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-[rgb(var(--color-text-primary))]">
          {clampPercent(percent)}%
        </span>
      </div>
      {label ? <span className="sr-only">{label}</span> : null}
    </div>
  )
}

function PhaseTimeline({
  phases,
}: {
  phases: Array<{ id: string; name: string; phaseNumber: number; status: string }>
}) {
  return (
    <div className="flex w-full items-stretch gap-0 overflow-x-auto pb-2">
      {phases.map((phase, idx) => {
        const isCurrent = phase.status === 'CURRENT'
        const isCompleted = phase.status === 'COMPLETED'
        const dotClass = cn(
          'h-3 w-3 rounded-full',
          isCompleted && 'bg-green-500',
          isCurrent && 'bg-[rgb(var(--color-primary-500))]',
          !isCompleted && !isCurrent && 'bg-[rgb(var(--color-border-default))]',
        )

        return (
          <div key={phase.id} className="flex min-w-[240px] flex-col gap-2 px-2">
            <div className="flex items-center gap-3">
              <div className={dotClass} aria-hidden="true" />
              <div className="h-px flex-1 bg-[rgb(var(--color-border-default))]" aria-hidden="true" />
              {idx < phases.length - 1 ? (
                <div className="w-2" aria-hidden="true" />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">
                  Phase {phase.phaseNumber}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {phase.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div className="mt-1 truncate text-sm font-medium text-[rgb(var(--color-text-primary))]">
                {phase.name}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ProjectOverviewContent() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug

  const { data, isLoading, error } = usePmProject(slug)
  const project = data?.data

  // Track user presence on this project page
  usePresence({
    projectId: project?.id ?? '',
    page: 'overview',
    enabled: !!project?.id,
  })

  // Transform project data into context format for CopilotKit agents
  // This enables natural language references like "this project" to work correctly
  const projectContext = useMemo<ProjectContext | null>(() => {
    if (!project) return null

    // Map API status to context status
    const statusMap: Record<string, 'active' | 'on-hold' | 'completed'> = {
      ACTIVE: 'active',
      ON_HOLD: 'on-hold',
      COMPLETED: 'completed',
    }

    // Find the current phase
    const currentPhase = project.phases?.find((p) => p.status === 'CURRENT')

    return {
      id: project.id,
      name: project.name,
      status: statusMap[project.status] ?? 'active',
      currentPhase: currentPhase?.name,
      progress: percentFromTasks(project.totalTasks, project.completedTasks),
      tasksTotal: project.totalTasks,
      tasksCompleted: project.completedTasks,
      team: project.team?.members?.map((m) => ({
        id: m.id,
        name: '', // Member names not available in current API response
        role: '',
      })),
    }
  }, [project])

  // Expose project context to CopilotKit agents
  useProjectContext(projectContext)

  if (!slug) return null

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">Loading project…</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !project) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-red-600">{error?.message || 'Project not found'}</p>
          <Link href={{ pathname: '/dashboard/pm' }} className="mt-3 inline-block text-sm text-primary hover:underline">
            Back to projects
          </Link>
        </CardContent>
      </Card>
    )
  }

  const percent = percentFromTasks(project.totalTasks, project.completedTasks)
  const remaining = daysRemaining(project.targetDate ?? null)
  const teamCount = project.team?.members?.length ?? 0
  const budget = parseMoney(project.budget)
  const spend = parseMoney(project.actualSpend) ?? 0
  const budgetPct = budget !== null ? percentSpent(budget, spend) : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-bg-primary))] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-md text-white"
              style={{ backgroundColor: project.color || '#3B82F6' }}
              aria-hidden="true"
            >
              <span className="text-sm font-semibold">{(project.icon || 'folder').slice(0, 1).toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="truncate text-2xl font-semibold text-[rgb(var(--color-text-primary))]">
                  {project.name}
                </h1>
                <PresenceBar projectId={project.id} />
              </div>
              <p className="mt-1 text-sm text-[rgb(var(--color-text-secondary))]">{project.description || project.slug}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={project.status} />
                <Badge variant="secondary">{project.type.replace(/_/g, ' ')}</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {budget !== null ? (
              <div className="rounded-md border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-bg-tertiary))] px-3 py-2">
                <div className="text-xs text-[rgb(var(--color-text-secondary))]">Budget</div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">
                    {formatMoney(spend)} / {formatMoney(budget)}
                  </div>
                  <Badge
                    variant={budgetPct !== null && budgetPct >= 90 ? 'destructive' : 'secondary'}
                    className="text-[10px]"
                  >
                    {budgetPct ?? 0}%
                  </Badge>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-[rgb(var(--color-border-default))]">
                  <div
                    className={cn(
                      'h-2 rounded-full',
                      budgetPct !== null && budgetPct >= 100 && 'bg-red-500',
                      budgetPct !== null && budgetPct >= 90 && budgetPct < 100 && 'bg-amber-500',
                      budgetPct !== null && budgetPct < 90 && 'bg-[rgb(var(--color-primary-500))]',
                    )}
                    style={{ width: `${budgetPct ?? 0}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            ) : null}
            <ProgressRing percent={percent} label="Project progress" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href={`/dashboard/pm/${slug}`}
            className="rounded-md bg-[rgb(var(--color-bg-tertiary))] px-3 py-1.5 text-[rgb(var(--color-text-primary))]"
          >
            Overview
          </Link>
          <Link
            href={`/dashboard/pm/${slug}/tasks`}
            className="rounded-md px-3 py-1.5 text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-bg-tertiary))]"
          >
            Tasks
          </Link>
          <Link
            href={`/dashboard/pm/${slug}/team`}
            className="rounded-md px-3 py-1.5 text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-bg-tertiary))]"
          >
            Team
          </Link>
          <Link
            href={`/dashboard/pm/${slug}/docs`}
            className="rounded-md px-3 py-1.5 text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-bg-tertiary))]"
          >
            Docs
          </Link>
          <Link
            href={`/dashboard/pm/${slug}/settings`}
            className="rounded-md px-3 py-1.5 text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-bg-tertiary))]"
          >
            Settings
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Phases</CardTitle>
        </CardHeader>
        <CardContent>
          {project.phases?.length ? (
            <PhaseTimeline phases={project.phases} />
          ) : (
            <p className="text-sm text-[rgb(var(--color-text-secondary))]">
              No phases yet. Choose a template when creating a project (PM-01.7 will generate phases automatically).
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <ChevronRight className="h-5 w-5 text-[rgb(var(--color-text-secondary))]" />
            <div>
              <div className="text-xs text-[rgb(var(--color-text-secondary))]">Tasks</div>
              <div className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">
                {project.completedTasks}/{project.totalTasks}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <Users className="h-5 w-5 text-[rgb(var(--color-text-secondary))]" />
            <div>
              <div className="text-xs text-[rgb(var(--color-text-secondary))]">Team</div>
              <div className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">
                {teamCount}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <CalendarDays className="h-5 w-5 text-[rgb(var(--color-text-secondary))]" />
            <div>
              <div className="text-xs text-[rgb(var(--color-text-secondary))]">Days remaining</div>
              <div className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">
                {remaining === null ? '—' : remaining}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href={`/dashboard/pm/${slug}/docs`}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center justify-between py-5">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[rgb(var(--color-text-secondary))]" />
                <div className="text-sm font-medium text-[rgb(var(--color-text-primary))]">Project Docs</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href={`/dashboard/pm/${slug}/settings`}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center justify-between py-5">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-[rgb(var(--color-text-secondary))]" />
                <div className="text-sm font-medium text-[rgb(var(--color-text-primary))]">Settings</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
