import { SettingsLayout } from '@/components/layouts/settings-layout'
import { TwoFactorCard } from '@/components/settings/two-factor-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
      <div className="space-y-6">
        {/* Password Change Section - Future Story */}
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Password change functionality coming soon.</p>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication Section - Story 09-3 */}
        <TwoFactorCard />

        {/* Session Management - Story 01-7 (already implemented) */}
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Manage your active sessions across devices</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              View and manage your active sessions in the{' '}
              <a href="/settings/sessions" className="text-blue-600 hover:underline">
                Sessions page
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  )
}
