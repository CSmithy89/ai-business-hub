'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, AlertCircle } from 'lucide-react'

interface TwoFactorVerifyProps {
  userId: string
  onSuccess: () => void
  onCancel: () => void
}

interface VerifyFormData {
  code: string
}

export function TwoFactorVerify({ userId, onSuccess, onCancel }: TwoFactorVerifyProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [trustDevice, setTrustDevice] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VerifyFormData>()

  const onSubmit = async (data: VerifyFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/2fa/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          code: data.code,
          isBackupCode: useBackupCode,
          trustDevice,
        }),
      })

      let result: any = {}
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        try {
          result = await response.json()
        } catch (parseErr) {
          console.warn('Failed to parse JSON response for 2FA verification:', parseErr)
          result = {}
        }
      }

      if (response.ok) {
        onSuccess()
      } else {
        setError(result?.error?.message || 'Verification failed')
        if (result?.remainingAttempts !== undefined) {
          setRemainingAttempts(result.remainingAttempts)
        }
        reset()
      }
    } catch (err) {
      console.error('2FA verification error:', err)
      setError('Unable to verify code. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h2>
        <p className="text-gray-600">
          {useBackupCode
            ? 'Enter one of your backup codes'
            : 'Enter the 6-digit code from your authenticator app'}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-600">{error}</p>
            {remainingAttempts !== null && remainingAttempts > 0 && (
              <p className="text-xs text-red-500 mt-1">
                {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">
            {useBackupCode ? 'Backup Code' : 'Verification Code'}
          </Label>
          <Input
            id="code"
            type="text"
            placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
            maxLength={useBackupCode ? 9 : 6}
            {...register('code', {
              required: 'Code is required',
              pattern: {
                value: useBackupCode ? /^[A-Z0-9]{4}-[A-Z0-9]{4}$/i : /^[0-9]{6}$/,
                message: useBackupCode
                  ? 'Backup code must be in format XXXX-XXXX'
                  : 'Code must be 6 digits',
              },
            })}
            disabled={isSubmitting}
            autoFocus
            autoComplete="off"
            className="text-center text-lg tracking-widest"
          />
          {errors.code && (
            <p className="text-sm text-red-600">{errors.code.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="trustDevice"
            checked={trustDevice}
            onCheckedChange={(checked) => setTrustDevice(!!checked)}
            disabled={isSubmitting}
          />
          <Label
            htmlFor="trustDevice"
            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Trust this device for 30 days
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify & Sign In'
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setUseBackupCode((prev) => !prev)
            reset()
            setError(null)
            setRemainingAttempts(null)
          }}
          disabled={isSubmitting}
        >
          {useBackupCode ? 'Use authenticator code instead' : 'Use backup code instead'}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full text-gray-600"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </form>
    </div>
  )
}
