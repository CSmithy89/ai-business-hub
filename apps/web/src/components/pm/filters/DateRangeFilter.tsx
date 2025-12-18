/**
 * Date Range Filter Component
 *
 * Story: PM-03.7 - Advanced Filters
 *
 * Date range picker for filtering tasks by due date.
 */

'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DateRangeFilterProps {
  /** Start date (ISO string) */
  from: string | null
  /** End date (ISO string) */
  to: string | null
  /** Callback when date range changes */
  onChange: (from: string | null, to: string | null) => void
}

/**
 * DateRangeFilter Component
 *
 * Provides a date range picker for filtering by task due dates.
 */
export function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const fromDate = from ? parseISO(from) : undefined
  const toDate = to ? parseISO(to) : undefined

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) {
      onChange(null, null)
      return
    }

    const newFrom = range.from ? range.from.toISOString() : null
    const newTo = range.to ? range.to.toISOString() : null
    onChange(newFrom, newTo)
  }

  const hasRange = from || to

  const displayText = () => {
    if (from && to) {
      return `${format(parseISO(from), 'MMM d')} - ${format(parseISO(to), 'MMM d')}`
    }
    if (from) {
      return `From ${format(parseISO(from), 'MMM d')}`
    }
    if (to) {
      return `Until ${format(parseISO(to), 'MMM d')}`
    }
    return 'Due date'
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarIcon className="h-4 w-4" />
          {displayText()}
          {hasRange && (
            <span className="rounded-sm bg-primary px-1 py-0.5 text-xs text-primary-foreground">
              1
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Due date range</span>
            {hasRange && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs font-normal text-muted-foreground hover:text-foreground"
                onClick={() => {
                  onChange(null, null)
                  setIsOpen(false)
                }}
              >
                Clear
              </Button>
            )}
          </div>
          <Calendar
            mode="range"
            selected={{ from: fromDate, to: toDate }}
            onSelect={handleSelect}
            numberOfMonths={2}
            className="border-0"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
