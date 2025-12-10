import { SettingsLayout } from '@/components/layouts/settings-layout'

export const metadata = {
  title: 'API Keys | HYVVE',
  description: 'Manage your API keys',
}

export default function SettingsApiKeysPage() {
  return (
    <SettingsLayout
      title="API Keys"
      description="Manage API keys for integrations"
    >
      <div className="rounded-lg border bg-white p-6">
        <p className="text-gray-500">API key management coming soon.</p>
      </div>
    </SettingsLayout>
  )
}
