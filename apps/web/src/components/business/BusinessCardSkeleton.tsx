/**
 * BusinessCardSkeleton Component
 *
 * Loading skeleton for business cards.
 * Matches BusinessCard layout to prevent layout shift.
 *
 * Story: 08.2 - Implement Portfolio Dashboard with Business Cards
 */

import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function BusinessCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>

      <CardContent>
        <div className="mb-4">
          <Skeleton className="mb-1 h-3 w-28" />
          <Skeleton className="h-8 w-16" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-32" />
        </div>
      </CardContent>

      <CardFooter>
        <Skeleton className="h-3 w-40" />
      </CardFooter>
    </Card>
  )
}
