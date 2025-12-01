import { SettingsLayout } from '@/components/layouts/settings-layout'

export const metadata = {
  title: 'Profile Settings | HYVVE',
  description: 'Manage your profile settings',
}

export default function SettingsProfilePage() {
  return (
    <SettingsLayout
      title="Profile"
      description="Manage your personal information and preferences"
    >
      <div className="rounded-lg border bg-white p-6">
        <p className="text-gray-500">Profile settings coming soon.</p>
      </div>
    </SettingsLayout>
  )
}
