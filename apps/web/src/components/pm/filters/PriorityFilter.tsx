/**
 * Priority Filter Component
 *
 * Story: PM-03.7 - Advanced Filters
 *
 * Single-select dropdown for filtering tasks by priority.
 */

'use client'

import { ChevronDown } from 'lucide-react'
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
import type { TaskPriority } from '@/hooks/use-pm-tasks'
import { TASK_PRIORITIES, TASK_PRIORITY_META } from '@/lib/pm/task-meta'
import { cn } from '@/lib/utils'

interface PriorityFilterProps {
  /** Selected priority */
  value: TaskPriority | null
  /** Callback when selection changes */
  onChange: (priority: TaskPriority | null) => void
}

/**
 * PriorityFilter Component
 *
 * Provides a single-select dropdown for filtering by task priority.
 */
export function PriorityFilter({ value, onChange }: PriorityFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          Priority
          {value && (
            <span className="rounded-sm bg-primary px-1 py-0.5 text-xs text-primary-foreground">
              1
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[160px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Priority</span>
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
        <DropdownMenuRadioGroup value={value || ''} onValueChange={(v) => onChange(v as TaskPriority)}>
          {TASK_PRIORITIES.map((priority) => {
            const meta = TASK_PRIORITY_META[priority]
            return (
              <DropdownMenuRadioItem key={priority} value={priority}>
                <span className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', meta.dotClassName)} />
                  {meta.label}
                </span>
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
