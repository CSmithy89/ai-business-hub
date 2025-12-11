'use client'

/**
 * BusinessSwitcher Component
 *
 * Header dropdown for switching between businesses.
 * Shows current business with status badge and allows navigation.
 *
 * Story: 15.14 - Implement Business Switcher Dropdown
 */

import { useRouter, useParams } from 'next/navigation'
import { ChevronDown, Loader2, Briefcase, LayoutGrid } from 'lucide-react'
import { useBusinesses } from '@/hooks/use-businesses'
import { getStatusVariant, getStatusLabel, getBusinessDefaultRoute } from '@/lib/business-status'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Business } from '@hyvve/db'

/**
 * Get initials from business name for avatar
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Get avatar background color based on onboarding status
 */
function getAvatarColor(status: string): string {
  switch (status) {
    case 'WIZARD':
      return 'from-gray-400 to-gray-500'
    case 'VALIDATION':
      return 'from-blue-400 to-blue-600'
    case 'PLANNING':
      return 'from-purple-400 to-purple-600'
    case 'BRANDING':
      return 'from-orange-400 to-orange-600'
    case 'COMPLETE':
      return 'from-green-400 to-green-600'
    default:
      return 'from-[rgb(var(--color-primary))] to-[rgb(var(--color-warning))]'
  }
}

export function BusinessSwitcher() {
  const router = useRouter()
  const params = useParams()
  const { data: businesses, isLoading, error } = useBusinesses()

  // Get current business ID from URL params
  const currentBusinessId = params?.businessId as string | undefined

  // Find current business from list
  const currentBusiness = businesses?.find((b) => b.id === currentBusinessId)

  // Handle business selection
  const handleSelect = (business: Business) => {
    const route = getBusinessDefaultRoute(business)
    router.push(route as Parameters<typeof router.push>[0])
  }

  // Handle "View All" click
  const handleViewAll = () => {
    router.push('/businesses' as Parameters<typeof router.push>[0])
  }

  // Display name for current business or placeholder
  const displayName = currentBusiness?.name ?? 'Select Business'
  const displayInitials = currentBusiness ? getInitials(currentBusiness.name) : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-2 h-9 hover:bg-[rgb(var(--color-bg-hover))]"
        >
          {/* Business Avatar or Placeholder Icon */}
          {displayInitials ? (
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-md
                         bg-gradient-to-br ${getAvatarColor(currentBusiness?.onboardingStatus ?? '')}
                         text-xs font-bold text-white`}
            >
              {displayInitials}
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-200">
              <Briefcase className="h-4 w-4 text-gray-500" />
            </div>
          )}

          {/* Business Name */}
          <span className="text-sm font-medium text-[rgb(var(--color-text-primary))] max-w-[120px] truncate">
            {displayName}
          </span>

          {/* Chevron */}
          <ChevronDown className="h-4 w-4 text-[rgb(var(--color-text-tertiary))]" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="py-4 text-center text-sm text-red-500">
            Failed to load businesses
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && (!businesses || businesses.length === 0) && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No businesses found
          </div>
        )}

        {/* Business List */}
        {!isLoading && !error && businesses && businesses.length > 0 && (
          <>
            {businesses.map((business) => (
              <DropdownMenuItem
                key={business.id}
                onClick={() => handleSelect(business)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3 w-full">
                  {/* Business Avatar */}
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-md shrink-0
                               bg-gradient-to-br ${getAvatarColor(business.onboardingStatus)}
                               text-xs font-bold text-white`}
                  >
                    {getInitials(business.name)}
                  </div>

                  {/* Business Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{business.name}</span>
                      {business.id === currentBusinessId && (
                        <span className="text-xs text-green-600">*</span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <Badge
                    variant={getStatusVariant(business.onboardingStatus)}
                    className="shrink-0 text-[10px] px-1.5 py-0.5"
                  >
                    {getStatusLabel(business.onboardingStatus)}
                  </Badge>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* View All Link */}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleViewAll} className="cursor-pointer">
          <LayoutGrid className="mr-2 h-4 w-4" />
          View All Businesses
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
