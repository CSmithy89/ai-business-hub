import { SessionList } from '@/components/session/session-list'
import { SettingsLayout } from '@/components/layouts/settings-layout'

export const metadata = {
  title: 'Active Sessions | HYVVE',
  description: 'Manage your active sessions across devices',
}

export default function SessionsPage() {
  return (
    <SettingsLayout
      title="Active Sessions"
      description="Manage your active sessions across different devices. You can revoke access from devices you no longer use or don&apos;t recognize."
    >
      {/* Security Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-1">
          Security Recommendation
        </h3>
        <p className="text-sm text-blue-700">
          Regularly review your active sessions and revoke any sessions you don&apos;t
          recognize. If you see suspicious activity, change your password
          immediately and revoke all other sessions.
        </p>
      </div>

      {/* Sessions List */}
      <SessionList />
    </SettingsLayout>
  )
}
