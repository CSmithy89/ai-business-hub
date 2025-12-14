import { SettingsLayout } from '@/components/layouts/settings-layout'
import { AIProviderList } from '@/components/settings/ai-provider-list'
import { WorkspaceRequired } from '@/components/settings/workspace-required'
import { getSession } from '@/lib/auth-server'

export const metadata = {
  title: 'API Keys',
  description: 'Manage AI provider API keys for your workspace',
}

export default async function SettingsApiKeysPage() {
  const session = await getSession()
  const workspaceId = session?.session.activeWorkspaceId

  return (
    <SettingsLayout
      title="API Keys"
      description="Add and manage AI provider API keys (BYOAI)"
    >
      {workspaceId ? <AIProviderList /> : <WorkspaceRequired />}
    </SettingsLayout>
  )
}
