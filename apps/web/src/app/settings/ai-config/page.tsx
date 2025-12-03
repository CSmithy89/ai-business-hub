import { SettingsLayout } from '@/components/layouts/settings-layout'
import { AIProviderList } from '@/components/settings/ai-provider-list'

export const metadata = {
  title: 'AI Configuration | HYVVE',
  description: 'Configure your AI preferences',
}

export default function SettingsAiConfigPage() {
  return (
    <SettingsLayout
      title="AI Configuration"
      description="Configure AI providers and preferences"
    >
      <AIProviderList />
    </SettingsLayout>
  )
}
