'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import type { ApprovalStatus, ConfidenceLevel } from '@hyvve/shared'

interface ApprovalFiltersProps {
  statusFilter: ApprovalStatus | 'all'
  onStatusChange: (status: ApprovalStatus | 'all') => void
  confidenceFilter: ConfidenceLevel | 'all'
  onConfidenceChange: (confidence: ConfidenceLevel | 'all') => void
  typeFilter: string
  onTypeChange: (type: string) => void
  sortBy: 'createdAt' | 'dueAt' | 'priority'
  onSortByChange: (sortBy: 'createdAt' | 'dueAt' | 'priority') => void
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: (order: 'asc' | 'desc') => void
}

/**
 * Filter and sort controls for approval queue
 */
export function ApprovalFilters({
  statusFilter,
  onStatusChange,
  confidenceFilter,
  onConfidenceChange,
  typeFilter,
  onTypeChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: ApprovalFiltersProps) {
  const statusLabels: Record<ApprovalStatus | 'all', string> = {
    all: 'All Status',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    auto_approved: 'Auto-Approved',
  }

  const confidenceLabels: Record<ConfidenceLevel | 'all', string> = {
    all: 'All Confidence',
    high: 'High (>85%)',
    medium: 'Medium (60-85%)',
    low: 'Low (<60%)',
  }

  const sortByLabels: Record<'createdAt' | 'dueAt' | 'priority', string> = {
    createdAt: 'Created Date',
    dueAt: 'Due Date',
    priority: 'Priority',
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Left side - Search and Filters */}
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        {/* Type Search */}
        <Input
          type="text"
          placeholder="Search by type..."
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className="w-full sm:w-64"
        />

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between sm:w-auto">
              {statusLabels[statusFilter]}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onStatusChange('all')}>
              All Status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange('pending')}>
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange('approved')}>
              Approved
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange('rejected')}>
              Rejected
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange('auto_approved')}>
              Auto-Approved
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Confidence Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between sm:w-auto">
              {confidenceLabels[confidenceFilter]}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onConfidenceChange('all')}>
              All Confidence
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onConfidenceChange('high')}>
              High (&gt;85%)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onConfidenceChange('medium')}>
              Medium (60-85%)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onConfidenceChange('low')}>
              Low (&lt;60%)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right side - Sort Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Sort By */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between sm:w-auto">
              Sort by: {sortByLabels[sortBy]}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSortByChange('createdAt')}>
              Created Date
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortByChange('dueAt')}>
              Due Date
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortByChange('priority')}>
              Priority
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Order */}
        <Button
          variant="outline"
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="w-full sm:w-auto"
        >
          {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
        </Button>
      </div>
    </div>
  )
}
