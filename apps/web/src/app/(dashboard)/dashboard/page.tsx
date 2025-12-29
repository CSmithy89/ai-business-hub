/**
 * Portfolio Dashboard Page
 *
 * Server component wrapper for metadata.
 * Renders client component for interactive content.
 *
 * Story: 08.2 - Implement Portfolio Dashboard with Business Cards
 * Updated: Story 16-24 - Page Title Tags
 * Updated: Story DM-03.4 - Dashboard Page Integration (agent widgets)
 */

import { Suspense } from 'react'
import { DashboardContent } from './DashboardContent'
import { DashboardAgentSection } from './DashboardAgentSection'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Dashboard',
  description: 'Manage and track your business portfolio',
}

/**
 * Dashboard Page with Agent Widget Integration
 *
 * The page is structured in two sections:
 * 1. Agent Section: Widget grid + Chat sidebar for AI-driven insights
 * 2. Portfolio Section: Business cards (existing functionality)
 */
export default function PortfolioDashboardPage() {
  return (
    <div className="space-y-8">
      {/* AI Agent Section - Widget Grid + Chat */}
      <Suspense fallback={<DashboardAgentSectionSkeleton />}>
        <DashboardAgentSection />
      </Suspense>

      {/* Portfolio Section - Business Cards */}
      <DashboardContent />
    </div>
  )
}

/**
 * Skeleton loading state for the agent section
 */
function DashboardAgentSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Widget Grid Skeleton - 2 columns on desktop */}
      <div className="lg:col-span-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-4"
            >
              <Skeleton className="mb-4 h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Chat Sidebar Skeleton */}
      <div className="rounded-lg border border-border bg-card p-4">
        <Skeleton className="mb-4 h-6 w-1/2" />
        <Skeleton className="mb-2 h-4 w-3/4" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
