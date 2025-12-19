/**
 * Phase Filter Component
 *
 * Story: PM-03.7 - Advanced Filters
 *
 * Single-select dropdown for filtering tasks by phase.
 */

'use client'

import { ChevronDown, FolderKanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePmProject } from '@/hooks/use-pm-projects'

interface PhaseFilterProps {
  /** Selected phase ID */
  value: string | null
  /** Callback when selection changes */
  onChange: (phaseId: string | null) => void
  /** Project slug for fetching phases */
  projectSlug: string
}

/**
 * PhaseFilter Component
 *
 * Provides a single-select dropdown for filtering by project phase.
 */
export function PhaseFilter({ value, onChange, projectSlug }: PhaseFilterProps) {
  const { data: projectData } = usePmProject(projectSlug)
  const project = projectData?.data

  const phases = project?.phases || []

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FolderKanban className="h-4 w-4" />
          Phase
          {value && (
            <span className="rounded-sm bg-primary px-1 py-0.5 text-xs text-primary-foreground">
              1
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Phase</span>
          {value && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs font-normal text-muted-foreground hover:text-foreground"
              onClick={() => onChange(null)}
            >
              Clear
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {phases.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            No phases
          </div>
        ) : (
          <DropdownMenuRadioGroup value={value || ''} onValueChange={(v) => onChange(v || null)}>
            {phases.map((phase) => (
              <DropdownMenuRadioItem key={phase.id} value={phase.id}>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Phase {phase.phaseNumber}
                  </span>
                  <span className="truncate">{phase.name}</span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
