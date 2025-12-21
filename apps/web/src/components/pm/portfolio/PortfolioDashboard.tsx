'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { AlertTriangle, BarChart3, FolderOpen, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Progress } from '@/components/ui/progress'
import { PortfolioFilters } from './PortfolioFilters'
import { usePmPortfolio } from '@/hooks/use-pm-portfolio'

function progressPercent(totalTasks: number, completedTasks: number): number {
  if (!Number.isFinite(totalTasks) || totalTasks <= 0) return 0
  const safeCompleted = Number.isFinite(completedTasks) ? completedTasks : 0
  return Math.max(0, Math.min(100, Math.round((safeCompleted / totalTasks) * 100)))
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  try {
    return format(new Date(value), 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

function healthVariant(score: number): 'success' | 'secondary' | 'destructive' {
  if (score >= 75) return 'success'
  if (score >= 50) return 'secondary'
  return 'destructive'
}

function statusVariant(status: string): 'success' | 'secondary' | 'outline' {
  if (status === 'ACTIVE') return 'success'
  if (status === 'ON_HOLD') return 'secondary'
  return 'outline'
}

export function PortfolioDashboard() {
  const [status, setStatus] = useState('all')
  const [teamLeadId, setTeamLeadId] = useState('all')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const filters = useMemo(() => {
    return {
      status: status === 'all' ? undefined : status,
      teamLeadId: teamLeadId === 'all' ? undefined : teamLeadId,
      search: search.trim() ? search.trim() : undefined,
      from: from || undefined,
      to: to || undefined,
    }
  }, [from, search, status, teamLeadId, to])

  const { data, isLoading, error } = usePmPortfolio(filters)
  const portfolio = data?.data
  const projects = portfolio?.projects ?? []
  const teamLeads = portfolio?.teamLeads ?? []
  const totals = portfolio?.totals
  const health = portfolio?.health

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--color-text-primary))]">Portfolio</h1>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">
            Monitor project health and resource load across the workspace.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <BarChart3 className="h-5 w-5 text-[rgb(var(--color-text-secondary))]" />
            <div>
              <div className="text-xs text-[rgb(var(--color-text-secondary))]">Total projects</div>
              <div className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">
                {totals?.totalProjects ?? 0}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <Users className="h-5 w-5 text-[rgb(var(--color-text-secondary))]" />
            <div>
              <div className="text-xs text-[rgb(var(--color-text-secondary))]">Active projects</div>
              <div className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">
                {totals?.activeProjects ?? 0}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <BarChart3 className="h-5 w-5 text-[rgb(var(--color-text-secondary))]" />
            <div>
              <div className="text-xs text-[rgb(var(--color-text-secondary))]">Avg health</div>
              <div className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">
                {health?.averageScore ?? 0}%
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <div className="text-xs text-[rgb(var(--color-text-secondary))]">At risk</div>
              <div className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">
                {health?.atRisk ?? 0}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <PortfolioFilters
            status={status}
            teamLeadId={teamLeadId}
            search={search}
            from={from}
            to={to}
            teamLeads={teamLeads}
            onStatusChange={setStatus}
            onTeamLeadChange={setTeamLeadId}
            onSearchChange={setSearch}
            onFromChange={setFrom}
            onToChange={setTo}
          />
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
            <p className="text-sm text-[rgb(var(--color-text-secondary))]">Loading portfolio…</p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          headline="No projects match the filters"
          description="Adjust filters to see your portfolio overview."
          ctaText="Reset filters"
          onCtaClick={() => {
            setStatus('all')
            setTeamLeadId('all')
            setSearch('')
            setFrom('')
            setTo('')
          }}
        />
      ) : null}

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
                        className="flex h-11 w-11 items-center justify-center rounded-md text-white"
                        style={{ backgroundColor: project.color || '#3B82F6' }}
                        aria-hidden="true"
                      >
                        <span className="text-sm font-semibold">
                          {(project.icon || 'folder').slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{project.name}</CardTitle>
                        <p className="mt-1 text-xs text-[rgb(var(--color-text-secondary))]">
                          Target: {formatDate(project.targetDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={statusVariant(project.status)}>{project.status.replace(/_/g, ' ')}</Badge>
                      <Badge variant={healthVariant(project.healthScore)}>
                        Health {project.healthScore}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs text-[rgb(var(--color-text-secondary))]">
                      <span>Progress</span>
                      <span className="font-medium text-[rgb(var(--color-text-primary))]">{percent}%</span>
                    </div>
                    <Progress value={percent} />
                    <div className="grid gap-2 text-xs text-[rgb(var(--color-text-secondary))] sm:grid-cols-2">
                      <div>
                        {project.completedTasks}/{project.totalTasks} tasks complete
                      </div>
                      <div>
                        Team: {project.team.memberCount} members
                        {project.team.leadName ? ` · Lead ${project.team.leadName}` : ''}
                      </div>
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
