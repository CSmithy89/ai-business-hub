/**
 * BusinessGrid Component
 *
 * Displays businesses in a responsive grid with search and sort functionality.
 * Uses existing BusinessCard, BusinessCardSkeleton, StartBusinessCard components.
 *
 * Epic: 15 - UI/UX Platform Foundation
 * Story: 15.2 - Create Businesses Portfolio Landing Page
 */

'use client';

import { useState, useMemo } from 'react';
import type { Business } from '@hyvve/db';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { BusinessCard } from './BusinessCard';
import { BusinessCardSkeleton } from './BusinessCardSkeleton';
import { StartBusinessCard } from './StartBusinessCard';
import { EmptyBusinessState } from './EmptyBusinessState';

type SortOption = 'name' | 'created' | 'updated' | 'status';

interface BusinessGridProps {
  /** List of businesses to display */
  businesses?: Business[];
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Retry function for error state */
  onRetry?: () => void;
}

/**
 * Sort businesses based on selected option
 */
function sortBusinesses(businesses: Business[], sortBy: SortOption): Business[] {
  const sorted = [...businesses];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'created':
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case 'updated':
      return sorted.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    case 'status': {
      const statusOrder = ['WIZARD', 'VALIDATION', 'PLANNING', 'BRANDING', 'COMPLETE'];
      return sorted.sort(
        (a, b) =>
          statusOrder.indexOf(a.onboardingStatus) - statusOrder.indexOf(b.onboardingStatus)
      );
    }
    default:
      return sorted;
  }
}

export function BusinessGrid({
  businesses,
  isLoading,
  error,
  onRetry,
}: BusinessGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updated');

  // Filter and sort businesses
  const filteredBusinesses = useMemo(() => {
    if (!businesses) return [];

    let filtered = businesses;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.description?.toLowerCase().includes(query)
      );
    }

    // Apply sort
    return sortBusinesses(filtered, sortBy);
  }, [businesses, searchQuery, sortBy]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Search/Sort skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-10 w-full max-w-sm animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
        </div>

        {/* Grid skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <BusinessCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 text-destructive">
          <svg
            className="h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold">Failed to load businesses</h3>
        <p className="mb-4 text-muted-foreground">{error.message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  // Empty state (no businesses at all)
  if (!businesses || businesses.length === 0) {
    return <EmptyBusinessState />;
  }

  // No search results
  const hasNoResults = filteredBusinesses.length === 0 && searchQuery.trim();

  return (
    <div className="space-y-6">
      {/* Search and Sort Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Last Updated</SelectItem>
            <SelectItem value="created">Date Created</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* No Results Message */}
      {hasNoResults && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No businesses found matching &quot;{searchQuery}&quot;
          </p>
        </div>
      )}

      {/* Business Grid */}
      {!hasNoResults && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBusinesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
          <StartBusinessCard />
        </div>
      )}
    </div>
  );
}
