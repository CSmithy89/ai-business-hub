'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
        <Label htmlFor="portfolio-status" className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">
          Status
        </Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger id="portfolio-status">
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
        <Label htmlFor="portfolio-team-lead" className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">
          Team lead
        </Label>
        <Select value={teamLeadId} onValueChange={onTeamLeadChange}>
          <SelectTrigger id="portfolio-team-lead">
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
        <Label htmlFor="portfolio-search" className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">
          Search
        </Label>
        <Input
          id="portfolio-search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search projects..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="portfolio-from" className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">
          From
        </Label>
        <Input
          id="portfolio-from"
          type="date"
          value={from}
          onChange={(event) => onFromChange(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="portfolio-to" className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">
          To
        </Label>
        <Input
          id="portfolio-to"
          type="date"
          value={to}
          onChange={(event) => onToChange(event.target.value)}
        />
      </div>
    </div>
  )
}
