/**
 * EmptyBusinessState Component
 *
 * Empty state displayed when user has no businesses.
 * Encourages user to start their first business.
 *
 * Story: 08.2 - Implement Portfolio Dashboard with Business Cards
 * Story: 16.18 - Character-Driven Empty States
 */

'use client'

import { EmptyState } from '@/components/ui/empty-state'

export function EmptyBusinessState() {
  return <EmptyState variant="businesses" />
}
