'use client'

import { SettingsLayout } from '@/components/layouts/settings-layout'
import { MembersList } from '@/components/settings/members-list'

export default function WorkspaceMembersPage() {
  return (
    <SettingsLayout
      title="Team Members"
      description="Manage your workspace team members and their roles"
    >
      <MembersList />
    </SettingsLayout>
  )
}
