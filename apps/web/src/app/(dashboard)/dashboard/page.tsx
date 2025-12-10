/**
 * Portfolio Dashboard Page
 *
 * Displays all businesses for the current workspace.
 * Shows empty state when no businesses exist.
 *
 * Story: 08.2 - Implement Portfolio Dashboard with Business Cards
 */

'use client'

import { useBusinesses, type BusinessError } from '@/hooks/use-businesses'
import { BusinessCard } from '@/components/business/BusinessCard'
import { StartBusinessCard } from '@/components/business/StartBusinessCard'
import { EmptyBusinessState } from '@/components/business/EmptyBusinessState'
import { BusinessCardSkeleton } from '@/components/business/BusinessCardSkeleton'
import { NoWorkspaceState } from '@/components/business/NoWorkspaceState'

export default function PortfolioDashboardPage() {
  const { data: businesses, isLoading, error } = useBusinesses()

  // Check if error is due to no workspace being selected
  const businessError = error as BusinessError | null
  const isNoWorkspace = businessError?.code === 'NO_WORKSPACE'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Businesses</h1>
          <p className="text-muted-foreground">Manage and track your business portfolio</p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <BusinessCardSkeleton />
          <BusinessCardSkeleton />
          <BusinessCardSkeleton />
        </div>
      )}

      {/* No Workspace State */}
      {isNoWorkspace && <NoWorkspaceState />}

      {/* Error State (other errors) */}
      {error && !isNoWorkspace && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load businesses. Please try again later.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && businesses?.length === 0 && <EmptyBusinessState />}

      {/* Business Cards Grid */}
      {!isLoading && !error && businesses && businesses.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StartBusinessCard />
          {businesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      )}
    </div>
  )
}
