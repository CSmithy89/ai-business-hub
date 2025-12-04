'use client'

/**
 * Two-Factor Authentication Card
 * Story 09-3: Card component for security settings page
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import { TwoFactorSetupModal } from './two-factor-setup-modal'
import { useSession } from '@/lib/auth-client'

export function TwoFactorCard() {
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const { data: session } = useSession()

  // Fetch actual 2FA status from session
  useEffect(() => {
    const fetch2FAStatus = async () => {
      if (!session?.user?.id) {
        return
      }

      try {
        // Check the user's 2FA status from the database via session
        // The session should contain twoFactorEnabled flag
        // For now, we'll use a simple API call to check status
        const response = await fetch('/api/auth/2fa/status')
        if (response.ok) {
          const data = await response.json()
          setTwoFactorEnabled(data.twoFactorEnabled || false)
        }
      } catch (error) {
        console.error('Failed to fetch 2FA status:', error)
      }
    }

    fetch2FAStatus()
  }, [session?.user?.id])

  const handleSetupComplete = () => {
    // Refresh 2FA status
    setTwoFactorEnabled(true)
    // Optionally reload to refresh session
    window.location.reload()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {twoFactorEnabled ? (
                  <>
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    Two-Factor Authentication
                  </>
                ) : (
                  <>
                    <ShieldOff className="h-5 w-5 text-gray-400" />
                    Two-Factor Authentication
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {twoFactorEnabled
                  ? 'Your account is protected with two-factor authentication'
                  : 'Add an extra layer of security to your account'}
              </CardDescription>
            </div>
            {twoFactorEnabled ? (
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                Enabled
              </span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                Disabled
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {twoFactorEnabled ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>Two-factor authentication is enabled on your account.</p>
                <p className="mt-2">
                  You&apos;ll be asked for a verification code each time you sign in.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  View Backup Codes
                </Button>
                <Button variant="outline" size="sm">
                  Regenerate Codes
                </Button>
              </div>

              <div className="pt-4 border-t">
                <Button variant="destructive" size="sm">
                  Disable Two-Factor Authentication
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>
                  Two-factor authentication adds an extra layer of security to your account.
                </p>
                <p className="mt-2">
                  You&apos;ll need to provide a verification code from your authenticator app in
                  addition to your password when signing in.
                </p>
              </div>

              <Button onClick={() => setShowSetupModal(true)}>
                Enable Two-Factor Authentication
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {session?.user?.email && (
        <TwoFactorSetupModal
          open={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          onComplete={handleSetupComplete}
          userEmail={session.user.email}
        />
      )}
    </>
  )
}
