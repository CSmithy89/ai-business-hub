'use client'

/**
 * Two-Factor Authentication Card
 * Story 09-3: Card component for security settings page
 */

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import { TwoFactorSetupModal } from './two-factor-setup-modal'
import { BackupCodesModal } from './backup-codes-modal'
import { Disable2FAModal } from './disable-2fa-modal'
import { useSession } from '@/lib/auth-client'

interface TwoFactorStatus {
  twoFactorEnabled: boolean
  method?: string
  enabledAt?: string
  backupCodesRemaining?: number
  hasPassword?: boolean
}

export function TwoFactorCard() {
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false)
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus>({
    twoFactorEnabled: false,
  })
  const { data: session } = useSession()

  // Fetch 2FA status from API
  const fetchStatus = useCallback(async () => {
    if (!session?.user?.id) {
      return
    }

    try {
      const response = await fetch('/api/auth/2fa/status')
      if (response.ok) {
        const data = await response.json()
        setTwoFactorStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error)
    }
  }, [session?.user?.id])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleSetupComplete = () => {
    fetchStatus()
    // Optionally reload to refresh session
    window.location.reload()
  }

  const handleManagementSuccess = () => {
    fetchStatus()
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {twoFactorStatus.twoFactorEnabled ? (
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
                {twoFactorStatus.twoFactorEnabled
                  ? 'Your account is protected with two-factor authentication'
                  : 'Add an extra layer of security to your account'}
              </CardDescription>
            </div>
            {twoFactorStatus.twoFactorEnabled ? (
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
          {twoFactorStatus.twoFactorEnabled ? (
            <div className="space-y-4">
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Method:</span>{' '}
                  {twoFactorStatus.method?.toUpperCase() || 'TOTP'}
                </p>
                <p>
                  <span className="font-medium">Enabled:</span>{' '}
                  {formatDate(twoFactorStatus.enabledAt)}
                </p>
                <p>
                  <span className="font-medium">Backup codes remaining:</span>{' '}
                  {twoFactorStatus.backupCodesRemaining || 0}/10
                </p>
                {(twoFactorStatus.backupCodesRemaining || 0) <= 2 && (
                  <p className="text-yellow-600 font-medium">
                    ⚠️ Low backup codes remaining. Consider regenerating.
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBackupCodesModal(true)}
                >
                  Regenerate Backup Codes
                </Button>
              </div>

              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDisableModal(true)}
                >
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
        <>
          <TwoFactorSetupModal
            open={showSetupModal}
            onClose={() => setShowSetupModal(false)}
            onComplete={handleSetupComplete}
            userEmail={session.user.email}
          />
          <BackupCodesModal
            open={showBackupCodesModal}
            onClose={() => setShowBackupCodesModal(false)}
            onSuccess={handleManagementSuccess}
          />
          <Disable2FAModal
            open={showDisableModal}
            onClose={() => setShowDisableModal(false)}
            onSuccess={handleManagementSuccess}
          />
        </>
      )}
    </>
  )
}
