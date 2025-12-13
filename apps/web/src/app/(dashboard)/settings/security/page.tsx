import { SettingsLayout } from '@/components/layouts/settings-layout'
import { TwoFactorCard } from '@/components/settings/two-factor-card'
import { PasswordChangeForm } from '@/components/settings/password-change-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link2, Monitor } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Security',
  description: 'Manage your security settings',
}

export default function SettingsSecurityPage() {
  return (
    <SettingsLayout
      title="Security"
      description="Manage your password and security preferences"
    >
      <div className="space-y-6">
        {/* Password Change Section - Story 15.7 */}
        <PasswordChangeForm />

        {/* Two-Factor Authentication Section - Story 09-3 */}
        <TwoFactorCard />

        {/* Linked Accounts Section - Story 09-7 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 aria-hidden="true" className="h-5 w-5 text-blue-600" />
              Linked Accounts
            </CardTitle>
            <CardDescription>Manage your connected OAuth providers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">OAuth Providers</p>
                <p className="text-sm text-muted-foreground">
                  Connect Google, Microsoft, or GitHub for easier sign-in
                </p>
              </div>
              <Link
                href="/settings/linked-accounts"
                className="text-sm font-medium text-primary hover:underline"
              >
                Manage
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Session Management - Story 01-7 (already implemented) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor aria-hidden="true" className="h-5 w-5 text-purple-600" />
              Active Sessions
            </CardTitle>
            <CardDescription>Manage your active sessions across devices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Device Sessions</p>
                <p className="text-sm text-muted-foreground">
                  View and revoke access from other devices
                </p>
              </div>
              <Link
                href="/settings/sessions"
                className="text-sm font-medium text-primary hover:underline"
              >
                View Sessions
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  )
}
