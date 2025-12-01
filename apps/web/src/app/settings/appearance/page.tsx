import { SettingsLayout } from '@/components/layouts/settings-layout'

export const metadata = {
  title: 'Appearance | HYVVE',
  description: 'Customize the appearance of your dashboard',
}

export default function SettingsAppearancePage() {
  return (
    <SettingsLayout
      title="Appearance"
      description="Customize the look and feel of your dashboard"
    >
      <div className="rounded-lg border bg-white p-6">
        <p className="text-gray-500">Appearance settings coming soon.</p>
      </div>
    </SettingsLayout>
  )
}
