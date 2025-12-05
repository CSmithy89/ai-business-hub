'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { SettingsLayout } from '@/components/layouts/settings-layout'
import { TeamStatsCards } from '@/components/settings/team-stats-cards'
import { MembersList, type MemberFilters } from '@/components/settings/members-list'
import { MembersSearchFilter } from '@/components/settings/members-search-filter'
import { InviteMemberModal } from '@/components/settings/invite-member-modal'
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
      {/* Header with Invite Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
          <p className="text-gray-600 mt-1">Manage your workspace team and invite new members</p>
        </div>
        <InviteMemberModal />
      </div>

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
      title=""
      description=""
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
