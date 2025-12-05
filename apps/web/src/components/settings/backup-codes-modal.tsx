'use client'

/**
 * Backup Codes Management Modal
 * Story 09-5: Regenerate and view backup codes
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Download, Copy, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface BackupCodesModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function BackupCodesModal({ open, onClose, onSuccess }: BackupCodesModalProps) {
  const [password, setPassword] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!password) {
      setError('Please enter your password')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/2fa/backup-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to generate backup codes')
      }

      setBackupCodes(data.backupCodes)
      setPassword('')
      toast.success('Backup codes generated', {
        description: 'Save these codes in a secure location.',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate backup codes')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    const codesText = backupCodes.join('\n')
    await navigator.clipboard.writeText(codesText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard', {
      description: 'Backup codes have been copied.',
    })
  }

  const handleDownload = () => {
    const codesText = backupCodes.join('\n')
    const blob = new Blob([codesText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'hyvve-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Backup codes downloaded', {
      description: 'Save the file in a secure location.',
    })
  }

  const handleClose = () => {
    if (backupCodes.length > 0 && !confirmed) {
      return
    }
    setPassword('')
    setBackupCodes([])
    setError('')
    setConfirmed(false)
    setCopied(false)
    if (onSuccess && backupCodes.length > 0) {
      onSuccess()
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Regenerate Backup Codes</DialogTitle>
          <DialogDescription>
            Generate new backup codes for account recovery
          </DialogDescription>
        </DialogHeader>

        {backupCodes.length === 0 ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will invalidate all existing backup codes. Make sure to save the new codes in
                a secure location.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="password">Current Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button onClick={handleGenerate} disabled={loading} className="flex-1">
                {loading ? 'Generating...' : 'Generate New Codes'}
              </Button>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Save these codes in a secure location. They will not be shown again.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg border">
              {backupCodes.map((code, i) => (
                <div key={i} className="font-mono text-sm bg-white p-2 rounded border">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex-1"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="confirmed"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
              />
              <label
                htmlFor="confirmed"
                className="text-sm text-gray-600 cursor-pointer leading-tight"
              >
                I have saved these backup codes in a secure location
              </label>
            </div>

            <Button
              onClick={handleClose}
              disabled={!confirmed}
              className="w-full"
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
