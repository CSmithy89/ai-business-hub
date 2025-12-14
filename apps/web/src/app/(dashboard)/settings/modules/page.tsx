import { SettingsLayout } from '@/components/layouts/settings-layout'
import { ModuleManagement } from '@/components/settings/module-management'
import { WorkspaceRequired } from '@/components/settings/workspace-required'
import { getSession } from '@/lib/auth-server'

export const metadata = {
  title: 'Modules',
  description: 'Enable and manage workspace modules',
}

export default async function SettingsModulesPage() {
  const session = await getSession()
  const workspaceId = session?.session.activeWorkspaceId

  return (
    <SettingsLayout
      title="Modules"
      description="Enable and manage optional modules for this workspace"
    >
      {workspaceId ? <ModuleManagement /> : <WorkspaceRequired />}
    </SettingsLayout>
  )
}
