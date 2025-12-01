'use client'

import { useState } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'
import { parseUserAgent } from '@/lib/utils/user-agent'
import type { Session } from '@/lib/auth-client'

interface SessionCardProps {
  session: Session
  isCurrentSession: boolean
  onRevoke: (token: string) => Promise<void>
}

export function SessionCard({
  session,
  isCurrentSession,
  onRevoke,
}: SessionCardProps) {
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)

  const parsedUA = parseUserAgent(session.userAgent)
  const DeviceIcon = parsedUA.device.icon
  const BrowserIcon = parsedUA.browser.icon

  // Format last activity time
  const lastActivityDate = new Date(session.updatedAt)
  const now = new Date()
  const timeDiff = now.getTime() - lastActivityDate.getTime()
  const isActiveNow = timeDiff < 5 * 60 * 1000 // Less than 5 minutes

  const lastActivity = isActiveNow
    ? 'Active now'
    : `${formatDistanceToNow(lastActivityDate, { addSuffix: true })}`

  const handleRevoke = async () => {
    setIsRevoking(true)
    try {
      await onRevoke(session.token)
      setShowRevokeDialog(false)
    } catch (error) {
      console.error('Failed to revoke session:', error)
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <>
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {/* Device Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                  <DeviceIcon className="w-6 h-6 text-gray-600" />
                </div>
              </div>

              {/* Session Details */}
              <div className="flex-1 space-y-2">
                {/* Browser and OS */}
                <div className="flex items-center gap-2">
                  <BrowserIcon className="w-4 h-4 text-gray-500" />
                  <h3 className="font-semibold text-gray-900">
                    {parsedUA.browser.name}{' '}
                    {parsedUA.browser.version && (
                      <span className="font-normal text-gray-600">
                        {parsedUA.browser.version.split('.')[0]}
                      </span>
                    )}
                  </h3>
                </div>

                {/* Operating System */}
                <p className="text-sm text-gray-600">
                  {parsedUA.os.name}{' '}
                  {parsedUA.os.version && `${parsedUA.os.version}`}
                </p>

                {/* Last Activity */}
                <p className="text-sm text-gray-500">
                  Last active: <span className="font-medium">{lastActivity}</span>
                </p>

                {/* Session Created */}
                <p className="text-xs text-gray-400">
                  Created {format(new Date(session.createdAt), 'PPP')}
                </p>

                {/* IP Address (optional) */}
                {session.ipAddress && (
                  <p className="text-xs text-gray-400">
                    IP: {session.ipAddress}
                  </p>
                )}
              </div>
            </div>

            {/* Current Session Badge */}
            {isCurrentSession && (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                Current Session
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          {isCurrentSession ? (
            <p className="text-sm text-gray-500">
              This is your current session. Sign out to end it.
            </p>
          ) : (
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={() => setShowRevokeDialog(true)}
            >
              Revoke Session
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign out the device using this session. You'll need to sign
              in again on that device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={isRevoking}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRevoking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                'Revoke Session'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
