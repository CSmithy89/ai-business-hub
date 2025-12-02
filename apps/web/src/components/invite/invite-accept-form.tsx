'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, Check, AlertCircle, Loader2 } from 'lucide-react'

interface InviteAcceptFormProps {
  token: string
  workspaceName: string
  inviterName: string
  role: string
}

/**
 * Invitation acceptance form component
 * Displays invitation details and handles acceptance
 */
export function InviteAcceptForm({
  token,
  workspaceName,
  inviterName,
  role,
}: InviteAcceptFormProps) {
  const router = useRouter()
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    setIsAccepting(true)
    setError(null)

    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept invitation')
      }

      // Redirect to workspace dashboard
      router.push(`/dashboard?workspace=${data.data.workspace.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsAccepting(false)
    }
  }

  // Format role for display
  const displayRole = role.charAt(0).toUpperCase() + role.slice(1)

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">You&apos;re Invited!</CardTitle>
        <CardDescription className="text-base">
          {inviterName} has invited you to join
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Workspace info */}
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <h3 className="text-xl font-semibold mb-1">{workspaceName}</h3>
          <p className="text-sm text-muted-foreground">
            You&apos;ll join as a <span className="font-medium">{displayRole}</span>
          </p>
        </div>

        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Accept button */}
        <Button
          onClick={handleAccept}
          disabled={isAccepting}
          className="w-full h-11"
          size="lg"
        >
          {isAccepting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Accept Invitation
            </>
          )}
        </Button>

        {/* Info text */}
        <p className="text-xs text-center text-muted-foreground">
          By accepting, you&apos;ll become a member of this workspace and can
          start collaborating immediately.
        </p>
      </CardContent>
    </Card>
  )
}
