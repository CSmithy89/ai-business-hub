/**
 * Businesses Portfolio Page
 *
 * Landing page for signed-in users showing all businesses in the workspace.
 * Features:
 * - Responsive card grid with business status and progress
 * - Search and sort functionality
 * - Empty state for new users
 * - Add new business CTA
 *
 * Epic: 15 - UI/UX Platform Foundation
 * Story: 15.2 - Create Businesses Portfolio Landing Page
 */

'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BusinessGrid } from '@/components/business/BusinessGrid';
import { useBusinesses } from '@/hooks/use-businesses';

export default function BusinessesPage() {
  const { data: businesses, isLoading, error, refetch } = useBusinesses();

  return (
    <div className="container mx-auto space-y-8 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Businesses</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and track your business portfolio
          </p>
        </div>

        <Button asChild>
          <Link href="/onboarding/wizard">
            <Plus className="mr-2 h-4 w-4" />
            Add Business
          </Link>
        </Button>
      </div>

      {/* Business Grid with Search/Sort */}
      <BusinessGrid
        businesses={businesses}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
      />
    </div>
  );
}
