/**
 * BusinessCard Component
 *
 * Displays a business as an interactive card with:
 * - Business name and description
 * - Onboarding status badge
 * - Validation score (if available)
 * - Module status indicators
 *
 * Story: 08.2 - Implement Portfolio Dashboard with Business Cards
 */

'use client'

import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import type { Business } from '@hyvve/db'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getStatusVariant, getStatusLabel, getBusinessDefaultRoute } from '@/lib/business-status'

interface BusinessCardProps {
  business: Business
}

/**
 * Module status row showing progress bar
 */
function ModuleStatusRow({ label, status }: { label: string; status: string }) {
  const getPercentage = (status: string) => {
    switch (status) {
      case 'COMPLETE':
        return 100
      case 'IN_PROGRESS':
        return 50
      case 'NOT_STARTED':
        return 0
      default:
        return 0
    }
  }

  const percentage = getPercentage(status)

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  )
}

export function BusinessCard({ business }: BusinessCardProps) {
  const router = useRouter()

  const handleClick = () => {
    const route = getBusinessDefaultRoute(business)
    router.push(route as Parameters<typeof router.push>[0])
  }

  return (
    <Card
      className="cursor-pointer card-hover-lift"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg leading-tight truncate" title={business.name}>{business.name}</CardTitle>
          <Badge variant={getStatusVariant(business.onboardingStatus)} className="shrink-0">
            {getStatusLabel(business.onboardingStatus)}
          </Badge>
        </div>
        {business.description && (
          <CardDescription className="line-clamp-2 text-xs">
            {business.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pb-3">
        {/* Validation Score (if available) */}
        {business.validationScore !== null && (
          <div className="flex items-baseline justify-between border-b pb-3">
            <div className="text-xs font-medium text-muted-foreground">Validation Score</div>
            <div className="text-2xl font-bold tracking-tight text-primary">
              {business.validationScore}<span className="text-xs font-normal text-muted-foreground">/100</span>
            </div>
          </div>
        )}

        {/* Module Status */}
        <div className="space-y-3">
          <ModuleStatusRow label="Validation" status={business.validationStatus} />
          <ModuleStatusRow label="Planning" status={business.planningStatus} />
          <ModuleStatusRow label="Branding" status={business.brandingStatus} />
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="text-[10px] text-muted-foreground w-full text-right">
          Updated {formatDistanceToNow(new Date(business.updatedAt))} ago
        </div>
      </CardFooter>
    </Card>
  )
}
