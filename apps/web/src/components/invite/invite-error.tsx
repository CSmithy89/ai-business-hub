'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, LogOut, Mail, ArrowLeft } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

interface InviteErrorProps {
  title: string
  message: string
  showContactSupport?: boolean
  showRequestNew?: boolean
  showSignOut?: boolean
  currentEmail?: string
  invitedEmail?: string
}

/**
 * Invitation error display component
 * Shows appropriate error message and action buttons
 */
export function InviteError({
  title,
  message,
  showContactSupport,
  showRequestNew,
  showSignOut,
  currentEmail,
  invitedEmail,
}: InviteErrorProps) {
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    // Reload to allow sign-in with correct account
    window.location.reload()
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-destructive" />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-base">{message}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Email mismatch details */}
        {showSignOut && currentEmail && invitedEmail && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current account:</span>
              <span className="font-medium">{currentEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invitation sent to:</span>
              <span className="font-medium">{invitedEmail}</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2">
          {showSignOut && (
            <Button
              onClick={handleSignOut}
              variant="default"
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out & Use Correct Account
            </Button>
          )}

          {showRequestNew && (
            <Button
              variant="outline"
              className="w-full"
              asChild
            >
              <Link href="mailto:support@hyvve.app?subject=Invitation%20Request">
                <Mail className="mr-2 h-4 w-4" />
                Request New Invitation
              </Link>
            </Button>
          )}

          {showContactSupport && (
            <Button
              variant="outline"
              className="w-full"
              asChild
            >
              <Link href="mailto:support@hyvve.app">
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </Link>
            </Button>
          )}

          {/* Always show back to home */}
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
