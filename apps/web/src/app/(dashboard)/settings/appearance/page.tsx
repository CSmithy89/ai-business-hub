import { SettingsLayout } from '@/components/layouts/settings-layout'
import { AppearanceSettings } from '@/components/settings/appearance-settings'

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
      <AppearanceSettings />
    </SettingsLayout>
  )
}
