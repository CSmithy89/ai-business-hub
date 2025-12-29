import { SettingsLayout } from '@/components/layouts/settings-layout'
import { AIProviderList } from '@/components/settings/ai-provider-list'
import { AIConfigSubnav } from '@/components/settings/ai-config-subnav'
import { WorkspaceRequired } from '@/components/settings/workspace-required'
import { getSession } from '@/lib/auth-server'

export const metadata = {
  title: 'AI Providers',
  description: 'Configure your AI API keys (BYOAI)',
}

export default async function AIProvidersPage() {
  const session = await getSession()
  const workspaceId = session?.session?.activeWorkspaceId

  return (
    <SettingsLayout
      title="AI Providers"
      description="Add and manage your AI API keys (Bring Your Own AI)"
    >
      <AIConfigSubnav />
      {workspaceId != null ? <AIProviderList /> : <WorkspaceRequired />}
    </SettingsLayout>
  )
}
