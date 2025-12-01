import { SettingsLayout } from '@/components/layouts/settings-layout'

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
      <div className="rounded-lg border bg-white p-6">
        <p className="text-gray-500">AI configuration coming soon.</p>
      </div>
    </SettingsLayout>
  )
}
