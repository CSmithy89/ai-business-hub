/**
 * Label Filter Component
 *
 * Story: PM-03.7 - Advanced Filters
 *
 * Multi-select dropdown with autocomplete for filtering tasks by labels.
 */

'use client'

import { useState, useMemo } from 'react'
import { Check, ChevronDown, Tag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TaskListItem } from '@/hooks/use-pm-tasks'

interface LabelFilterProps {
  /** Selected label names */
  value: string[]
  /** Callback when selection changes */
  onChange: (labels: string[]) => void
  /** All tasks (to extract available labels) */
  tasks: TaskListItem[]
}

/**
 * LabelFilter Component
 *
 * Provides a multi-select dropdown with autocomplete for filtering by labels.
 */
export function LabelFilter({ value, onChange, tasks }: LabelFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Extract unique labels from all tasks
  const availableLabels = useMemo(() => {
    const labelSet = new Set<string>()
    // Note: TaskListItem doesn't include labels in the list view
    // In a real implementation, we'd need to fetch label metadata from the API
    // For now, we'll allow manual input
    return Array.from(labelSet).sort()
  }, [tasks])

  const filteredLabels = availableLabels.filter((label) =>
    label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleToggle = (label: string) => {
    if (value.includes(label)) {
      onChange(value.filter((l) => l !== label))
    } else {
      onChange([...value, label])
    }
  }

  const handleAddNew = () => {
    if (searchQuery && !value.includes(searchQuery) && !availableLabels.includes(searchQuery)) {
      onChange([...value, searchQuery])
      setSearchQuery('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery) {
      e.preventDefault()
      handleAddNew()
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Tag className="h-4 w-4" />
          Labels
          {value.length > 0 && (
            <span className="rounded-sm bg-primary px-1 py-0.5 text-xs text-primary-foreground">
              {value.length}
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm font-medium">Labels</span>
          {value.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs font-normal text-muted-foreground hover:text-foreground"
              onClick={() => onChange([])}
            >
              Clear all
            </Button>
          )}
        </div>

        <div className="p-3">
          <Input
            placeholder="Search or add label..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-9"
          />
        </div>

        {value.length > 0 && (
          <div className="border-b px-3 pb-3">
            <div className="flex flex-wrap gap-1">
              {value.map((label) => (
                <Badge key={label} variant="secondary" className="gap-1 pr-1">
                  {label}
                  <button
                    type="button"
                    onClick={() => handleToggle(label)}
                    className="hover:bg-background/50 rounded-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="max-h-[200px] overflow-y-auto">
          {filteredLabels.length === 0 && !searchQuery ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No labels found. Type to create one.
            </div>
          ) : filteredLabels.length === 0 && searchQuery ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
              onClick={handleAddNew}
            >
              <Tag className="h-4 w-4" />
              <span>
                Create "<span className="font-medium">{searchQuery}</span>"
              </span>
            </button>
          ) : (
            filteredLabels.map((label) => (
              <button
                key={label}
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent',
                  value.includes(label) && 'bg-accent'
                )}
                onClick={() => handleToggle(label)}
              >
                <Tag className="h-4 w-4" />
                <span className="flex-1 truncate text-left">{label}</span>
                {value.includes(label) && <Check className="h-4 w-4 shrink-0" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
