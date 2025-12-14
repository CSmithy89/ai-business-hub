import { SettingsLayout } from '@/components/layouts/settings-layout'
import { AgentModelPreferences } from '@/components/settings/agent-model-preferences'
import { AIConfigSubnav } from '@/components/settings/ai-config-subnav'
import { WorkspaceRequired } from '@/components/settings/workspace-required'
import { getSession } from '@/lib/auth-server'

export const metadata = {
  title: 'Agent Preferences',
  description: 'Configure AI model preferences for each agent team',
}

export default async function AgentPreferencesPage() {
  const session = await getSession()
  const workspaceId = session?.session.activeWorkspaceId

  return (
    <SettingsLayout
      title="Agent Preferences"
      description="Configure which AI model each agent team should use"
    >
      <AIConfigSubnav />
      {workspaceId ? <AgentModelPreferences /> : <WorkspaceRequired />}
    </SettingsLayout>
  )
}
