import { SettingsLayout } from '@/components/layouts/settings-layout'
import { AIProviderList } from '@/components/settings/ai-provider-list'

export const metadata = {
  title: 'API Keys',
  description: 'Manage AI provider API keys for your workspace',
}

export default function SettingsApiKeysPage() {
  return (
    <SettingsLayout
      title="API Keys"
      description="Add and manage AI provider API keys (BYOAI)"
    >
      <AIProviderList />
    </SettingsLayout>
  )
}
