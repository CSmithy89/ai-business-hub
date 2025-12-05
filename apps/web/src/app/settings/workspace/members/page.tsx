'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { SettingsLayout } from '@/components/layouts/settings-layout'
import { TeamStatsCards } from '@/components/settings/team-stats-cards'
import { MembersList, type MemberFilters } from '@/components/settings/members-list'
import { MembersSearchFilter } from '@/components/settings/members-search-filter'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

/**
 * WorkspaceMembersContent Component
 * Separated to handle Suspense boundary for useSearchParams
 */
function WorkspaceMembersContent() {
  const searchParams = useSearchParams()

  // Initialize filters from URL params
  const [filters, setFilters] = useState<MemberFilters>({
    search: searchParams.get('search') || '',
    role: searchParams.get('role') || 'all',
    status: searchParams.get('status') || 'all',
  })

  // Update filters when URL changes (e.g., browser back/forward)
  useEffect(() => {
    setFilters({
      search: searchParams.get('search') || '',
      role: searchParams.get('role') || 'all',
      status: searchParams.get('status') || 'all',
    })
  }, [searchParams])

  return (
    <div className="space-y-6">
      <TeamStatsCards />
      <MembersSearchFilter filters={filters} onFiltersChange={setFilters} />
      <MembersList filters={filters} />
    </div>
  )
}

/**
 * WorkspaceMembersPage Component
 *
 * Team members management page with search and filtering:
 * - Team stats overview
 * - Search by name/email (debounced)
 * - Filter by role (owner, admin, member, etc.)
 * - Filter by status (active, pending)
 * - Filters persisted in URL query parameters
 */
export default function WorkspaceMembersPage() {
  return (
    <SettingsLayout
      title="Team Members"
      description="Manage your workspace team members and their roles"
    >
      <Suspense
        fallback={
          <Card>
            <CardContent className="py-10">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="text-gray-500">Loading...</span>
              </div>
            </CardContent>
          </Card>
        }
      >
        <WorkspaceMembersContent />
      </Suspense>
    </SettingsLayout>
  )
}
