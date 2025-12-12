import { SettingsLayout } from '@/components/layouts/settings-layout'
import { ProfileForm } from '@/components/settings/profile-form'

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
      <ProfileForm />
    </SettingsLayout>
  )
}
