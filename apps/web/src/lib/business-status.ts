/**
 * Business status helper functions
 *
 * Story: 08.2 - Implement Portfolio Dashboard with Business Cards
 */

import type { OnboardingStatus, Business } from '@hyvve/db'

/**
 * Badge variant type for status indicators
 */
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success'

/**
 * Get badge variant for onboarding status
 */
export function getStatusVariant(status: OnboardingStatus): BadgeVariant {
  switch (status) {
    case 'WIZARD':
      return 'secondary'
    case 'VALIDATION':
      return 'default'
    case 'PLANNING':
      return 'default'
    case 'BRANDING':
      return 'default'
    case 'COMPLETE':
      return 'success'
    default:
      return 'default'
  }
}

/**
 * Get human-readable label for onboarding status
 */
export function getStatusLabel(status: OnboardingStatus): string {
  switch (status) {
    case 'WIZARD':
      return 'Getting Started'
    case 'VALIDATION':
      return 'Validating'
    case 'PLANNING':
      return 'Planning'
    case 'BRANDING':
      return 'Branding'
    case 'COMPLETE':
      return 'Active'
    default:
      return status
  }
}

/**
 * Get default route for a business based on its onboarding status
 */
export function getBusinessDefaultRoute(business: Business): string {
  switch (business.onboardingStatus) {
    case 'WIZARD':
      return `/onboarding/wizard?businessId=${business.id}`
    case 'VALIDATION':
      return `/dashboard/${business.id}/validation`
    case 'PLANNING':
      return `/dashboard/${business.id}/planning`
    case 'BRANDING':
      return `/dashboard/${business.id}/branding`
    case 'COMPLETE':
      return `/dashboard/${business.id}/overview`
    default:
      return `/dashboard/${business.id}/overview`
  }
}
