'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useActivityStream } from '@/hooks/use-activity-stream'
import { useAgents } from '@/hooks/use-agents'
import { ActivityCard } from '@/components/agents/ActivityCard'
import { ActivityFilters } from '@/components/agents/ActivityFilters'
import { ActivitySidebar } from '@/components/agents/ActivitySidebar'
import { NewActivitiesBanner } from '@/components/agents/NewActivitiesBanner'
import { Button } from '@/components/ui/button'
import { Activity as ActivityIcon, Loader2 } from 'lucide-react'

interface ActivityFiltersState {
  agentId?: string
  type?: 'task_started' | 'task_completed' | 'approval_requested' | 'approval_processed' | 'error' | 'config_changed'
  status?: 'pending' | 'completed' | 'failed'
}

/**
 * Agent Activity Page
 *
 * Real-time feed of all agent activity across the platform.
 * Features:
 * - Real-time updates via SSE (with polling fallback)
 * - Filtering by agent, type, and status
 * - Infinite scroll for historical data
 * - Live connection indicator
 * - New activity notifications
 */
export default function AgentActivityPage() {
  const [filters, setFilters] = useState<ActivityFiltersState>({})
  const firstNewActivityRef = useRef<HTMLDivElement | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const { activities, newCount, isConnected, isLoading, error, clearNewCount, loadMore, hasMore } =
    useActivityStream(filters)

  // Stabilize loadMore callback reference for IntersectionObserver
  const loadMoreRef2 = useRef(loadMore)
  useEffect(() => {
    loadMoreRef2.current = loadMore
  }, [loadMore])

  const { data: agentsData, isError: isAgentsError } = useAgents()
  const availableAgents = useMemo(
    () => agentsData?.map(agent => ({ id: agent.id, name: agent.name })) ?? [],
    [agentsData]
  )

  // Scroll to first new activity (the earliest in the new batch)
  const handleScrollToNew = useCallback(() => {
    if (firstNewActivityRef.current) {
      firstNewActivityRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    clearNewCount()
  }, [clearNewCount])

  // Infinite scroll observer with stable callback reference
  useEffect(() => {
    if (!loadMoreRef.current) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries.length === 0) return
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreRef2.current?.()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [hasMore, isLoading])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Activity</h1>
          <p className="text-muted-foreground">Real-time feed of all agent actions</p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Main Content */}
        <div className="space-y-4">
          {/* Filters */}
          <ActivityFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableAgents={availableAgents}
          />
          {isAgentsError && (
            <p className="text-sm text-destructive">
              Failed to load agent list for filters. Please refresh to try again.
            </p>
          )}

          {/* New Activities Banner */}
          <NewActivitiesBanner count={newCount} onClick={handleScrollToNew} />

          {/* Loading State */}
          {isLoading && activities.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading activities...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              Failed to load activities. Please try again.
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && activities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ActivityIcon className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-1 text-lg font-semibold">No activities found</h3>
              <p className="text-sm text-muted-foreground">
                {filters.agentId || filters.type || filters.status
                  ? 'Try adjusting your filters.'
                  : 'No agent activity has been recorded yet.'}
              </p>
            </div>
          )}

          {/* Activity Feed */}
          {!error && activities.length > 0 && (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  ref={index === newCount - 1 && newCount > 0 ? firstNewActivityRef : null}
                >
                  <ActivityCard activity={activity} isNew={index < newCount} />
                </div>
              ))}

              {/* Infinite Scroll Trigger */}
              <div ref={loadMoreRef} className="py-4">
                {isLoading && hasMore && (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}

                {/* Load More Button (Fallback) */}
                {!isLoading && hasMore && (
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={loadMore}>
                      Load More
                    </Button>
                  </div>
                )}

                {/* End of List */}
                {!hasMore && activities.length > 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    You have reached the end of the activity feed.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <ActivitySidebar activities={activities} isConnected={isConnected} />
        </div>
      </div>
    </div>
  )
}
