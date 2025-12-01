import { SettingsLayout } from '@/components/layouts/settings-layout'

export const metadata = {
  title: 'Security Settings | HYVVE',
  description: 'Manage your security settings',
}

export default function SettingsSecurityPage() {
  return (
    <SettingsLayout
      title="Security"
      description="Manage your password and security preferences"
    >
      <div className="rounded-lg border bg-white p-6">
        <p className="text-gray-500">Security settings coming soon.</p>
      </div>
    </SettingsLayout>
  )
}
