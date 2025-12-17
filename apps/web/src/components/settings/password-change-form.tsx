'use client'

/**
 * Password Change Form Component
 * Story 15.7: Implements password change on security settings page
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authClient } from '@/lib/auth-client'
import { changePasswordSchema, type ChangePasswordFormData } from '@/lib/validations/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Key, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function PasswordChangeForm() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ChangePasswordFormData>({
    resolver:
      zodResolver(changePasswordSchema as unknown as Parameters<typeof zodResolver>[0]) as unknown as Resolver<ChangePasswordFormData>,
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
      revokeOtherSessions: true,
    },
  })

  const newPassword = watch('newPassword')
  const revokeOtherSessions = watch('revokeOtherSessions')

  // Password strength indicators
  const passwordChecks = {
    length: newPassword?.length >= 8,
    uppercase: /[A-Z]/.test(newPassword || ''),
    lowercase: /[a-z]/.test(newPassword || ''),
    number: /[0-9]/.test(newPassword || ''),
  }

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true)

    try {
      const result = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: data.revokeOtherSessions ?? true,
      })

      if (result.error) {
        // Handle specific error messages
        const errorMessage = result.error.message || 'Failed to change password'
        if (errorMessage.toLowerCase().includes('incorrect') ||
            errorMessage.toLowerCase().includes('invalid') ||
            errorMessage.toLowerCase().includes('wrong')) {
          toast.error('Current password is incorrect')
        } else {
          toast.error(errorMessage)
        }
        return
      }

      toast.success('Password changed successfully')
      reset()

      // If sessions were revoked, user might need to re-authenticate on other devices
      if (data.revokeOtherSessions) {
        toast.info('All other sessions have been signed out')
      }
    } catch (error) {
      console.error('Password change error:', error)
      toast.error('Failed to change password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const PasswordToggle = ({
    show,
    onToggle
  }: {
    show: boolean
    onToggle: () => void
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      tabIndex={-1}
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )

  const PasswordRequirement = ({
    met,
    children
  }: {
    met: boolean
    children: React.ReactNode
  }) => (
    <li className={cn(
      'flex items-center gap-2 text-xs',
      met ? 'text-green-600' : 'text-muted-foreground'
    )}>
      <CheckCircle className={cn('h-3 w-3', met ? 'text-green-600' : 'text-muted-foreground/50')} />
      {children}
    </li>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          Change Password
        </CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter your current password"
                autoComplete="current-password"
                disabled={isSubmitting}
                className={cn(errors.currentPassword && 'border-destructive')}
                {...register('currentPassword')}
              />
              <PasswordToggle
                show={showCurrentPassword}
                onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
              />
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter your new password"
                autoComplete="new-password"
                disabled={isSubmitting}
                className={cn(errors.newPassword && 'border-destructive')}
                {...register('newPassword')}
              />
              <PasswordToggle
                show={showNewPassword}
                onToggle={() => setShowNewPassword(!showNewPassword)}
              />
            </div>
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword.message}</p>
            )}

            {/* Password requirements */}
            {newPassword && (
              <ul className="space-y-1 mt-2">
                <PasswordRequirement met={passwordChecks.length}>
                  At least 8 characters
                </PasswordRequirement>
                <PasswordRequirement met={passwordChecks.uppercase}>
                  One uppercase letter
                </PasswordRequirement>
                <PasswordRequirement met={passwordChecks.lowercase}>
                  One lowercase letter
                </PasswordRequirement>
                <PasswordRequirement met={passwordChecks.number}>
                  One number
                </PasswordRequirement>
              </ul>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmNewPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                autoComplete="new-password"
                disabled={isSubmitting}
                className={cn(errors.confirmNewPassword && 'border-destructive')}
                {...register('confirmNewPassword')}
              />
              <PasswordToggle
                show={showConfirmPassword}
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            </div>
            {errors.confirmNewPassword && (
              <p className="text-sm text-destructive">{errors.confirmNewPassword.message}</p>
            )}
          </div>

          {/* Revoke Other Sessions */}
          <div className="flex items-start space-x-3 pt-2">
            <Checkbox
              id="revokeOtherSessions"
              checked={revokeOtherSessions}
              onCheckedChange={(checked) => setValue('revokeOtherSessions', checked as boolean)}
              disabled={isSubmitting}
            />
            <div className="space-y-1">
              <Label
                htmlFor="revokeOtherSessions"
                className="text-sm font-medium cursor-pointer"
              >
                Sign out of all other sessions
              </Label>
              <p className="text-xs text-muted-foreground">
                For security, we recommend signing out of all other devices when you change your password.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={!isDirty || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing Password...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
