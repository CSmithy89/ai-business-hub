'use client'

import { SettingsLayout } from '@/components/layouts/settings-layout'
import { TeamStatsCards } from '@/components/settings/team-stats-cards'
import { MembersList } from '@/components/settings/members-list'

export default function WorkspaceMembersPage() {
  return (
    <SettingsLayout
      title="Team Members"
      description="Manage your workspace team members and their roles"
    >
      <div className="space-y-6">
        <TeamStatsCards />
        <MembersList />
      </div>
    </SettingsLayout>
  )
}
