import { SettingsLayout } from '@/components/layouts/settings-layout'
import { AgentModelPreferences } from '@/components/settings/agent-model-preferences'
import { AIConfigSubnav } from '@/components/settings/ai-config-subnav'

export const metadata = {
  title: 'Agent Preferences',
  description: 'Configure AI model preferences for each agent team',
}

export default function AgentPreferencesPage() {
  return (
    <SettingsLayout
      title="Agent Preferences"
      description="Configure which AI model each agent team should use"
    >
      <AIConfigSubnav />
      <AgentModelPreferences />
    </SettingsLayout>
  )
}
