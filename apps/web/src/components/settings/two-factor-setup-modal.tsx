'use client'

/**
 * Two-Factor Authentication Setup Modal
 * Story 09-3: Multi-step modal for 2FA setup
 */

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Copy, Download, Smartphone, ShieldCheck, Key } from 'lucide-react'
import { toast } from 'sonner'

type SetupStep = 'options' | 'qr-code' | 'verification' | 'backup-codes'

interface TwoFactorSetupModalProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
  userEmail: string
}

export function TwoFactorSetupModal({ open, onClose, onComplete }: TwoFactorSetupModalProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>('options')
  const [password, setPassword] = useState('')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [manualEntryCode, setManualEntryCode] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [confirmedSaved, setConfirmedSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStartSetup = async () => {
    if (!password) {
      setError('Current password is required')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to generate 2FA secret')
      }

      const data = await response.json()
      setQrCode(data.qrCode)
      setManualEntryCode(data.manualEntryCode)
      setCurrentStep('qr-code')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start setup')
      toast.error(err instanceof Error ? err.message : 'Failed to start 2FA setup')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/2fa/verify-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verificationCode }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Invalid verification code')
      }

      const data = await response.json()
      setBackupCodes(data.backupCodes)
      setCurrentStep('backup-codes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
      toast.error(err instanceof Error ? err.message : 'Invalid verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Copied to clipboard')
  }

  const handleCopyAllCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    toast.success('All codes copied to clipboard')
  }

  const handleDownloadCodes = () => {
    const content = `HYVVE Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}

${backupCodes.join('\n')}

IMPORTANT:
- Each code can only be used once
- Store these codes securely
- Do not share these codes with anyone
`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hyvve-backup-codes-${Date.now()}.txt`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Backup codes downloaded')
  }

  const handleComplete = () => {
    toast.success('Two-factor authentication enabled')
    onComplete()
    onClose()
  }

  const handleClose = () => {
    // Reset state
    setCurrentStep('options')
    setPassword('')
    setQrCode(null)
    setManualEntryCode(null)
    setVerificationCode('')
    setBackupCodes([])
    setConfirmedSaved(false)
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {currentStep === 'options' && (
          <>
            <DialogHeader>
              <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
              <DialogDescription>
                Add an extra layer of security to your account
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Current Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your current password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-gray-500">
                  To enable two-factor authentication, please verify your password
                </p>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Authenticator App</h3>
                    <p className="text-sm text-gray-600">
                      Use Google Authenticator, Authy, or 1Password
                    </p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    Recommended
                  </span>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3 opacity-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <ShieldCheck className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">SMS Authentication</h3>
                    <p className="text-sm text-gray-600">Receive codes via text message</p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleStartSetup} disabled={isLoading || !password}>
                {isLoading ? 'Loading...' : 'Continue with Authenticator App'}
              </Button>
            </div>
          </>
        )}

        {currentStep === 'qr-code' && (
          <>
            <DialogHeader>
              <DialogTitle>Scan QR Code</DialogTitle>
              <DialogDescription>
                Use your authenticator app to scan this QR code
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {qrCode && (
                <div className="flex flex-col items-center gap-4">
                  <Image
                    src={qrCode}
                    alt="QR Code for 2FA Setup"
                    width={256}
                    height={256}
                    className="w-64 h-64 border rounded-lg"
                    unoptimized
                  />
                  <p className="text-sm text-gray-600 text-center">
                    Scan this QR code with your authenticator app
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Can&apos;t scan the QR code?</p>
                <div className="flex items-center gap-2 bg-gray-100 p-3 rounded">
                  <code
                    className="font-mono text-sm flex-1"
                    data-testid="manual-entry-code"
                  >
                    {manualEntryCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => manualEntryCode && handleCopyCode(manualEntryCode)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Enter this code manually in your authenticator app
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCurrentStep('options')}>
                Back
              </Button>
              <Button onClick={() => setCurrentStep('verification')}>
                Continue
              </Button>
            </div>
          </>
        )}

        {currentStep === 'verification' && (
          <>
            <DialogHeader>
              <DialogTitle>Verify Setup</DialogTitle>
              <DialogDescription>
                Enter the 6-digit code from your authenticator app
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  className="text-center text-2xl tracking-widest font-mono"
                  name="verificationCode"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCurrentStep('qr-code')}>
                Back
              </Button>
              <Button
                onClick={handleVerifyCode}
                disabled={verificationCode.length !== 6 || isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </div>
          </>
        )}

        {currentStep === 'backup-codes' && (
          <>
            <DialogHeader>
              <DialogTitle>Save Your Backup Codes</DialogTitle>
              <DialogDescription>
                Store these codes in a safe place. You can use them to access your account if you lose your device.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  <Key className="inline h-4 w-4 mr-1" />
                  Important: Save these codes
                </h3>
                <p className="text-sm text-yellow-800">
                  Each code can only be used once. Store them securely.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    data-testid="backup-code"
                    className="font-mono text-center py-2 bg-white border rounded text-sm"
                  >
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleDownloadCodes} variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download Codes
                </Button>
                <Button onClick={handleCopyAllCodes} variant="outline" className="flex-1">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy All Codes
                </Button>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={confirmedSaved}
                  onCheckedChange={(checked) => setConfirmedSaved(checked === true)}
                />
                <span className="text-sm">
                  I have saved these codes in a safe place
                </span>
              </label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button onClick={handleComplete} disabled={!confirmedSaved} className="w-full">
                Complete Setup
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
