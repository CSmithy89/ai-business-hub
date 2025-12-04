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
import { getStatusVariant, getStatusLabel, getBusinessDefaultRoute } from '@/lib/business-status'
import { CheckCircle2, Circle, Clock } from 'lucide-react'

interface BusinessCardProps {
  business: Business
}

/**
 * Module status row showing completion indicator
 */
function ModuleStatusRow({ label, status }: { label: string; status: string }) {
  const getIcon = () => {
    switch (status) {
      case 'COMPLETE':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'NOT_STARTED':
        return <Circle className="h-4 w-4 text-gray-300" />
      default:
        return <Circle className="h-4 w-4 text-gray-300" />
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {getIcon()}
      <span className="text-muted-foreground">{label}</span>
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
      className="cursor-pointer transition-shadow hover:shadow-lg"
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
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{business.name}</CardTitle>
          <Badge variant={getStatusVariant(business.onboardingStatus)}>
            {getStatusLabel(business.onboardingStatus)}
          </Badge>
        </div>
        {business.description && (
          <CardDescription className="line-clamp-2">
            {business.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        {/* Validation Score (if available) */}
        {business.validationScore !== null && (
          <div className="mb-4">
            <div className="text-sm text-muted-foreground">Validation Score</div>
            <div className="text-2xl font-bold">{business.validationScore}/100</div>
          </div>
        )}

        {/* Module Status */}
        <div className="space-y-2">
          <ModuleStatusRow label="Validation" status={business.validationStatus} />
          <ModuleStatusRow label="Planning" status={business.planningStatus} />
          <ModuleStatusRow label="Branding" status={business.brandingStatus} />
        </div>
      </CardContent>

      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(new Date(business.updatedAt))} ago
        </div>
      </CardFooter>
    </Card>
  )
}
