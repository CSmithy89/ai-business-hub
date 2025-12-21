'use client'

import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type DependenciesFiltersProps = {
  projectId: string
  relationType: string
  crossProjectOnly: boolean
  projectOptions: Array<{ id: string; name: string }>
  onProjectChange: (value: string) => void
  onRelationTypeChange: (value: string) => void
  onCrossProjectChange: (value: boolean) => void
}

const RELATION_TYPES = [
  'BLOCKS',
  'BLOCKED_BY',
  'DEPENDS_ON',
  'DEPENDENCY_OF',
  'RELATES_TO',
  'DUPLICATES',
  'DUPLICATED_BY',
  'PARENT_OF',
  'CHILD_OF',
] as const

export function DependenciesFilters({
  projectId,
  relationType,
  crossProjectOnly,
  projectOptions,
  onProjectChange,
  onRelationTypeChange,
  onCrossProjectChange,
}: DependenciesFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Project</span>
        <Select value={projectId} onValueChange={onProjectChange}>
          <SelectTrigger>
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {projectOptions.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Relation</span>
        <Select value={relationType} onValueChange={onRelationTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="All relations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {RELATION_TYPES.map((value) => (
              <SelectItem key={value} value={value}>
                {value.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3 rounded-md border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-bg-secondary))] px-3 py-2">
        <div className="flex-1">
          <div className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Cross-project only</div>
          <div className="text-xs text-[rgb(var(--color-text-secondary))]">Hide same-project links</div>
        </div>
        <Switch checked={crossProjectOnly} onCheckedChange={onCrossProjectChange} />
      </div>
    </div>
  )
}
