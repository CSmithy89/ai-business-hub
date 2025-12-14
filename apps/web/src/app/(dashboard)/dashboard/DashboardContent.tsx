/**
 * Portfolio Dashboard Content (Client Component)
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
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function DashboardContent() {
  const { data: businesses, isLoading, error } = useBusinesses()

  // Check if error is due to no workspace being selected
  const businessError = error as BusinessError | null
  const isNoWorkspace = businessError?.code === 'NO_WORKSPACE'
  const isUnauthorized = businessError?.code === 'UNAUTHORIZED'

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

      {/* Signed out state */}
      {isUnauthorized && (
        <div className="rounded-lg border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-bg-secondary))] p-6">
          <h3 className="text-lg font-semibold text-[rgb(var(--color-text-primary))]">
            Sign in required
          </h3>
          <p className="mt-1 text-sm text-[rgb(var(--color-text-secondary))]">
            Sign in to view and manage your businesses.
          </p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Error State (other errors) */}
      {error && !isNoWorkspace && !isUnauthorized && (
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
