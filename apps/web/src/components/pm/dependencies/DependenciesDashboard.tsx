'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Link2, ListTree } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { DependenciesFilters } from './DependenciesFilters'
import { usePmDependencies } from '@/hooks/use-pm-dependencies'
import { usePmProjects } from '@/hooks/use-pm-projects'

function relationVariant(type: string): 'secondary' | 'outline' | 'success' {
  if (type === 'BLOCKS' || type === 'BLOCKED_BY') return 'success'
  if (type === 'DEPENDS_ON' || type === 'DEPENDENCY_OF') return 'secondary'
  return 'outline'
}

export function DependenciesDashboard() {
  const router = useRouter()
  const [projectId, setProjectId] = useState('all')
  const [relationType, setRelationType] = useState('all')
  const [crossProjectOnly, setCrossProjectOnly] = useState(true)

  const filters = useMemo(() => {
    return {
      projectId: projectId === 'all' ? undefined : projectId,
      relationType: relationType === 'all' ? undefined : relationType,
      crossProjectOnly,
      limit: 100,
      offset: 0,
    }
  }, [crossProjectOnly, projectId, relationType])

  const { data, isLoading, error } = usePmDependencies(filters)
  const dependencies = data?.data.relations ?? []

  const { data: projectsData } = usePmProjects({ page: 1, limit: 100 })
  const projectOptions = projectsData?.data.map((project) => ({
    id: project.id,
    name: project.name,
  })) ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[rgb(var(--color-text-primary))]">Dependencies</h1>
        <p className="text-sm text-[rgb(var(--color-text-secondary))]">
          Track task dependencies across projects and spot blockers early.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <DependenciesFilters
            projectId={projectId}
            relationType={relationType}
            crossProjectOnly={crossProjectOnly}
            projectOptions={projectOptions}
            onProjectChange={setProjectId}
            onRelationTypeChange={setRelationType}
            onCrossProjectChange={setCrossProjectOnly}
          />
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-red-600">Failed to load dependencies. Please try again.</p>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-[rgb(var(--color-text-secondary))]">Loading dependencies…</p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && data && dependencies.length === 0 ? (
        <EmptyState
          icon={ListTree}
          headline="No dependencies found"
          description="Adjust filters or create task relations to see dependencies."
          ctaText="View tasks"
          onCtaClick={() => router.push('/dashboard/pm')}
        />
      ) : null}

      {dependencies.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dependency Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dependencies.map((relation) => (
              <div
                key={relation.id}
                className="flex flex-col gap-3 rounded-md border border-[rgb(var(--color-border-default))] px-3 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-[rgb(var(--color-text-secondary))]">
                    <Link2 className="h-3.5 w-3.5" />
                    <span>
                      {relation.source.projectName} → {relation.target.projectName}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={{ pathname: '/dashboard/pm/[slug]/tasks', query: { slug: relation.source.projectSlug } }}
                      className="text-sm font-medium text-[rgb(var(--color-text-primary))] hover:underline"
                    >
                      #{relation.source.taskNumber} {relation.source.title}
                    </Link>
                    <Badge variant={relationVariant(relation.relationType)}>
                      {relation.relationType.replace(/_/g, ' ')}
                    </Badge>
                    <Link
                      href={{ pathname: '/dashboard/pm/[slug]/tasks', query: { slug: relation.target.projectSlug } }}
                      className="text-sm font-medium text-[rgb(var(--color-text-primary))] hover:underline"
                    >
                      #{relation.target.taskNumber} {relation.target.title}
                    </Link>
                  </div>
                </div>
                <div className="text-xs text-[rgb(var(--color-text-secondary))]">
                  {new Date(relation.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
