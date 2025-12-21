import { SettingsLayout } from '@/components/layouts/settings-layout'
import { NotificationPreferencesPanel } from '@/components/settings/notification-preferences/NotificationPreferencesPanel'

export const metadata = {
  title: 'Notification Preferences',
  description: 'Manage your notification preferences',
}

export default function NotificationsSettingsPage() {
  return (
    <SettingsLayout
      title="Notification Preferences"
      description="Customize which notifications you receive and when"
    >
      <NotificationPreferencesPanel />
    </SettingsLayout>
  )
}
