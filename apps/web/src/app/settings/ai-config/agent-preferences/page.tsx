import { SettingsLayout } from '@/components/layouts/settings-layout'
import { AgentModelPreferences } from '@/components/settings/agent-model-preferences'

export const metadata = {
  title: 'Agent Preferences | HYVVE',
  description: 'Configure AI model preferences for each agent team',
}

export default function AgentPreferencesPage() {
  return (
    <SettingsLayout
      title="Agent Preferences"
      description="Configure which AI model each agent team should use"
    >
      <AgentModelPreferences />
    </SettingsLayout>
  )
}
