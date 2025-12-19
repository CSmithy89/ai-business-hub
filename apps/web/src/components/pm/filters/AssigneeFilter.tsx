/**
 * Assignee Filter Component
 *
 * Story: PM-03.7 - Advanced Filters
 *
 * Single-select dropdown with search for filtering tasks by assignee.
 */

'use client'

import { useState } from 'react'
import { Check, ChevronDown, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { usePmTeam } from '@/hooks/use-pm-team'
import { cn } from '@/lib/utils'

interface AssigneeFilterProps {
  /** Selected assignee ID */
  value: string | null
  /** Callback when selection changes */
  onChange: (assigneeId: string | null) => void
  /** Project ID for fetching team members */
  projectId: string
}

/**
 * AssigneeFilter Component
 *
 * Provides a searchable dropdown for filtering by task assignee.
 */
export function AssigneeFilter({ value, onChange, projectId }: AssigneeFilterProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: teamData } = usePmTeam(projectId)
  const team = teamData?.data

  const members = team?.members.filter((m) => m.isActive && m.user) || []

  const filteredMembers = members.filter((member) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const name = member.user?.name?.toLowerCase() || ''
    const email = member.user?.email?.toLowerCase() || ''
    return name.includes(query) || email.includes(query)
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          Assignee
          {value && (
            <span className="rounded-sm bg-primary px-1 py-0.5 text-xs text-primary-foreground">
              1
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[260px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Assignee</span>
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
        <div className="px-2 pb-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8"
            />
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {filteredMembers.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              {searchQuery ? 'No members found' : 'No team members'}
            </div>
          ) : (
            filteredMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent',
                  value === member.userId && 'bg-accent'
                )}
                onClick={() => {
                  onChange(value === member.userId ? null : member.userId)
                  setSearchQuery('')
                }}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.user?.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {member.user?.name?.[0]?.toUpperCase() || member.user?.email?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 truncate text-left">
                  <div className="truncate font-medium">
                    {member.user?.name || member.user?.email}
                  </div>
                  {member.user?.name && (
                    <div className="truncate text-xs text-muted-foreground">
                      {member.user.email}
                    </div>
                  )}
                </div>
                {value === member.userId && <Check className="h-4 w-4 shrink-0" />}
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
