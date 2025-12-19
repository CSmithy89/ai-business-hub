/**
 * Type Filter Component
 *
 * Story: PM-03.7 - Advanced Filters
 *
 * Single-select dropdown for filtering tasks by type.
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
import type { TaskType } from '@/hooks/use-pm-tasks'
import { TASK_TYPES, TASK_TYPE_META } from '@/lib/pm/task-meta'
import { cn } from '@/lib/utils'

interface TypeFilterProps {
  /** Selected type */
  value: TaskType | null
  /** Callback when selection changes */
  onChange: (type: TaskType | null) => void
}

/**
 * TypeFilter Component
 *
 * Provides a single-select dropdown for filtering by task type.
 */
export function TypeFilter({ value, onChange }: TypeFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          Type
          {value && (
            <span className="rounded-sm bg-primary px-1 py-0.5 text-xs text-primary-foreground">
              1
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[180px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Type</span>
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
        <DropdownMenuRadioGroup value={value || ''} onValueChange={(v) => onChange(v as TaskType)}>
          {TASK_TYPES.map((type) => {
            const meta = TASK_TYPE_META[type]
            const Icon = meta.icon
            return (
              <DropdownMenuRadioItem key={type} value={type}>
                <span className="flex items-center gap-2">
                  <Icon className={cn('h-4 w-4', meta.iconClassName)} />
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
