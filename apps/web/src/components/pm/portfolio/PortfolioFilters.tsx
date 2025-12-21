'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type PortfolioFiltersProps = {
  status: string
  teamLeadId: string
  search: string
  from: string
  to: string
  teamLeads: Array<{ id: string; name: string }>
  onStatusChange: (value: string) => void
  onTeamLeadChange: (value: string) => void
  onSearchChange: (value: string) => void
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
}

const PROJECT_STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'] as const

export function PortfolioFilters({
  status,
  teamLeadId,
  search,
  from,
  to,
  teamLeads,
  onStatusChange,
  onTeamLeadChange,
  onSearchChange,
  onFromChange,
  onToChange,
}: PortfolioFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Status</span>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {PROJECT_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {value.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Team lead</span>
        <Select value={teamLeadId} onValueChange={onTeamLeadChange}>
          <SelectTrigger>
            <SelectValue placeholder="All teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {teamLeads.map((lead) => (
              <SelectItem key={lead.id} value={lead.id}>
                {lead.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Search</span>
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search projects..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">From</span>
        <Input
          type="date"
          value={from}
          onChange={(event) => onFromChange(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">To</span>
        <Input
          type="date"
          value={to}
          onChange={(event) => onToChange(event.target.value)}
        />
      </div>
    </div>
  )
}
