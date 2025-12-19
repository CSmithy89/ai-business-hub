/**
 * Status Filter Component
 *
 * Story: PM-03.7 - Advanced Filters
 *
 * Multi-select dropdown for filtering tasks by status.
 */

'use client'

import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { TaskStatus } from '@/hooks/use-pm-tasks'

const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'AWAITING_APPROVAL', label: 'Awaiting Approval' },
  { value: 'DONE', label: 'Done' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

interface StatusFilterProps {
  /** Selected statuses */
  value: TaskStatus[]
  /** Callback when selection changes */
  onChange: (statuses: TaskStatus[]) => void
}

/**
 * StatusFilter Component
 *
 * Provides a multi-select dropdown for filtering by task status.
 */
export function StatusFilter({ value, onChange }: StatusFilterProps) {
  const handleToggle = (status: TaskStatus) => {
    if (value.includes(status)) {
      onChange(value.filter((s) => s !== status))
    } else {
      onChange([...value, status])
    }
  }

  const handleClear = () => {
    onChange([])
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          Status
          {value.length > 0 && (
            <span className="rounded-sm bg-primary px-1 py-0.5 text-xs text-primary-foreground">
              {value.length}
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Status</span>
          {value.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs font-normal text-muted-foreground hover:text-foreground"
              onClick={handleClear}
            >
              Clear
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TASK_STATUSES.map((status) => (
          <DropdownMenuCheckboxItem
            key={status.value}
            checked={value.includes(status.value)}
            onCheckedChange={() => handleToggle(status.value)}
          >
            {status.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
