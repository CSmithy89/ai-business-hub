'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import type { AgentTeam, AgentStatus } from '@hyvve/shared'

interface Filters {
  search: string
  team: AgentTeam | 'all'
  status: AgentStatus | 'all'
}

interface AgentFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

/**
 * AgentFilters Component
 *
 * Search and filter controls for agent dashboard.
 * Includes debounced search input and team/status dropdowns.
 */
export function AgentFilters({ filters, onFiltersChange }: AgentFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search)
  const filtersRef = useRef(filters)
  const onFiltersChangeRef = useRef(onFiltersChange)

  // Keep refs up to date
  useEffect(() => {
    filtersRef.current = filters
    onFiltersChangeRef.current = onFiltersChange
  }, [filters, onFiltersChange])

  // Debounce search input (300ms)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== filtersRef.current.search) {
        onFiltersChangeRef.current({ ...filtersRef.current, search: searchInput })
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchInput])

  const handleTeamChange = (team: string) => {
    onFiltersChange({ ...filters, team: team as AgentTeam | 'all' })
  }

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status: status as AgentStatus | 'all' })
  }

  const handleClearFilters = () => {
    setSearchInput('')
    onFiltersChange({ search: '', team: 'all', status: 'all' })
  }

  const hasActiveFilters =
    filters.search !== '' || filters.team !== 'all' || filters.status !== 'all'

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
            aria-label="Search agents"
          />
        </div>

        {/* Team Filter */}
        <Select value={filters.team} onValueChange={handleTeamChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            <SelectItem value="validation">Validation</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="branding">Branding</SelectItem>
            <SelectItem value="orchestrator">Orchestrator</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="busy">Busy</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="w-full sm:w-auto"
        >
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  )
}
