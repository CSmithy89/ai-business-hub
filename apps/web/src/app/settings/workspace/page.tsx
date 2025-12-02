'use client'

import { SettingsLayout } from '@/components/layouts/settings-layout'
import { WorkspaceSettingsForm } from '@/components/settings/workspace-settings-form'

export default function WorkspaceSettingsPage() {
  return (
    <SettingsLayout
      title="Workspace Settings"
      description="Manage your workspace name, image, and timezone"
    >
      <WorkspaceSettingsForm />
    </SettingsLayout>
  )
}
