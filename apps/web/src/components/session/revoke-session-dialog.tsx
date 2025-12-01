'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface RevokeSessionDialogProps {
  onConfirm: () => Promise<void>
  sessionCount: number
}

export function RevokeSessionDialog({
  onConfirm,
  sessionCount,
}: RevokeSessionDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)

  const handleConfirm = async () => {
    setIsRevoking(true)
    try {
      await onConfirm()
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to revoke sessions:', error)
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          Revoke All Other Sessions
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke All Other Sessions?</AlertDialogTitle>
          <AlertDialogDescription>
            This will sign you out on all other devices ({sessionCount - 1}{' '}
            {sessionCount - 1 === 1 ? 'session' : 'sessions'}). Your current session
            will remain active.
            <br />
            <br />
            You&apos;ll need to sign in again on those devices.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isRevoking}
            className="bg-red-600 hover:bg-red-700"
          >
            {isRevoking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Revoking...
              </>
            ) : (
              'Revoke All Other Sessions'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
