'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAgents } from '@/hooks/use-agents'
import { AgentGrid } from '@/components/agents/AgentGrid'
import { AgentFilters } from '@/components/agents/AgentFilters'
import { AgentStatusSummary } from '@/components/agents/AgentStatusSummary'
import { AgentDetailModal } from '@/components/agents/AgentDetailModal'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { AgentTeam, AgentStatus } from '@hyvve/shared'

interface Filters {
  search: string
  team: AgentTeam | 'all'
  status: AgentStatus | 'all'
}

/**
 * Agents Dashboard Page
 *
 * Displays all AI agents in a filterable, searchable grid.
 * Grouped by team with status summary and detail modal.
 */
export default function AgentsPage() {
  const searchParams = useSearchParams()

  // Filter state
  const [filters, setFilters] = useState<Filters>({
    search: '',
    team: 'all',
    status: 'all',
  })

  // Modal state - sync with URL
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  // Fetch all agents
  const { data: agents = [], isLoading } = useAgents()

  // Initialize modal state from URL on mount
  useEffect(() => {
    const modalParam = searchParams.get('modal')
    if (modalParam) {
      setSelectedAgentId(modalParam)
    }
  }, [searchParams])

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const modalParam = params.get('modal')
      setSelectedAgentId(modalParam)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Filter agents based on current filters
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch =
        filters.search === '' ||
        agent.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        agent.role.toLowerCase().includes(filters.search.toLowerCase())

      const matchesTeam = filters.team === 'all' || agent.team === filters.team

      const matchesStatus =
        filters.status === 'all' || agent.status === filters.status

      return matchesSearch && matchesTeam && matchesStatus
    })
  }, [agents, filters])

  // Group filtered agents by team
  const groupedAgents = useMemo(() => {
    const grouped: Record<string, typeof filteredAgents> = {}

    filteredAgents.forEach((agent) => {
      if (!grouped[agent.team]) {
        grouped[agent.team] = []
      }
      grouped[agent.team].push(agent)
    })

    return grouped
  }, [filteredAgents])

  // Handle agent card click - update URL and modal state
  const handleAgentClick = (agentId: string) => {
    setSelectedAgentId(agentId)

    // Update URL with modal param
    const url = new URL(window.location.href)
    url.searchParams.set('modal', agentId)
    window.history.pushState({}, '', url.toString())
  }

  // Handle modal close - update URL
  const handleModalClose = (open: boolean) => {
    if (!open) {
      setSelectedAgentId(null)

      // Remove modal param from URL
      const url = new URL(window.location.href)
      url.searchParams.delete('modal')
      window.history.pushState({}, '', url.toString())
    }
  }

  // Handle status click from summary
  const handleStatusClick = (status: AgentStatus | 'all') => {
    setFilters((prev) => ({ ...prev, status }))
  }

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({ search: '', team: 'all', status: 'all' })
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            AI Agents
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and monitor all AI agents working on your behalf
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href="/agents/activity">
            View Activity Feed
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Status Summary */}
      <AgentStatusSummary
        agents={agents}
        onStatusClick={handleStatusClick}
        isLoading={isLoading}
      />

      {/* Filters */}
      <AgentFilters filters={filters} onFiltersChange={setFilters} />

      {/* Agent Grid */}
      <AgentGrid
        groupedAgents={groupedAgents}
        onAgentClick={handleAgentClick}
        isLoading={isLoading}
        onClearFilters={handleClearFilters}
      />

      {/* Detail Modal */}
      <AgentDetailModal
        agentId={selectedAgentId}
        open={!!selectedAgentId}
        onOpenChange={handleModalClose}
      />
    </div>
  )
}
