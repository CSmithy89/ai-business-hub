/**
 * Group By Selector Component
 *
 * Story: PM-03.3 - Kanban Drag & Drop
 *
 * Dropdown selector for choosing kanban board grouping option.
 * Supports 5 grouping modes: Status, Priority, Assignee, Type, Phase.
 */

'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GroupByOption } from '@/lib/pm/kanban-grouping'

interface GroupBySelectorProps {
  /** Current grouping value */
  value: GroupByOption
  /** Callback when grouping changes */
  onChange: (groupBy: GroupByOption) => void
}

const GROUP_OPTIONS: Array<{ value: GroupByOption; label: string; hint?: string }> = [
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'type', label: 'Type' },
  { value: 'phase', label: 'Phase', hint: '(view only)' },
]

/**
 * Group By Selector Component
 *
 * Renders a dropdown menu for selecting kanban board grouping option.
 * Shows checkmark next to currently selected option.
 *
 * Usage:
 * ```tsx
 * <GroupBySelector
 *   value={groupBy}
 *   onChange={(newGroupBy) => setGroupBy(newGroupBy)}
 * />
 * ```
 */
export function GroupBySelector({ value, onChange }: GroupBySelectorProps) {
  const selectedOption = GROUP_OPTIONS.find(opt => opt.value === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Group By: {selectedOption?.label}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {GROUP_OPTIONS.map(option => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                value === option.value ? "opacity-100" : "opacity-0"
              )}
            />
            {option.label}
            {option.hint && (
              <span className="ml-1 text-xs text-muted-foreground">{option.hint}</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
