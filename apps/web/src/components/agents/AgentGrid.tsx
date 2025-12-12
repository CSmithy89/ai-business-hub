'use client'

import { AgentCardStandard } from './AgentCardStandard'
import type { Agent, AgentTeam } from '@hyvve/shared'
import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SkeletonAgentCard } from '@/components/ui/skeleton-card'

interface AgentGridProps {
  groupedAgents: Record<string, Agent[]>
  onAgentClick: (agentId: string) => void
  isLoading?: boolean
  onClearFilters?: () => void
}

const TEAM_HEADERS: Record<AgentTeam, string> = {
  validation: "Vera's Validation Team",
  planning: "Blake's Planning Team",
  branding: "Bella's Branding Team",
  approval: "Approval Team",
  orchestrator: "Orchid's Orchestration Team",
}

/**
 * AgentGrid Component
 *
 * Displays agents in a responsive grid grouped by team.
 * Shows team section headers and handles empty states.
 */
export function AgentGrid({
  groupedAgents,
  onAgentClick,
  isLoading,
  onClearFilters,
}: AgentGridProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <section>
          <div className="mb-4">
            <div className="h-7 w-48 animate-pulse rounded bg-muted" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonAgentCard key={i} />
            ))}
          </div>
        </section>
      </div>
    )
  }

  // Get all teams with agents
  const teams = Object.keys(groupedAgents) as AgentTeam[]

  // Empty state
  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <SearchX className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No agents found</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          No agents match your current filters.
          <br />
          Try adjusting your search or clearing filters.
        </p>
        {onClearFilters && (
          <Button onClick={onClearFilters} variant="outline">
            Clear Filters
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {teams.map((team) => {
        const agents = groupedAgents[team]
        if (!agents || agents.length === 0) return null

        return (
          <section key={team}>
            {/* Team Header */}
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
              {TEAM_HEADERS[team] || team}
            </h2>

            {/* Agent Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {agents.map((agent) => (
                <AgentCardStandard
                  key={agent.id}
                  agent={agent}
                  onClick={() => onAgentClick(agent.id)}
                  data-testid="agent-card"
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
