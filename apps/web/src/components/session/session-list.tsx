'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { SessionCard } from './session-card'
import { RevokeSessionDialog } from './revoke-session-dialog'
import {
  listSessions,
  revokeSession,
  revokeOtherSessions,
  getCurrentSessionToken,
  type Session,
} from '@/lib/auth-client'
import { AlertCircle, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SessionList() {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const currentSessionToken = getCurrentSessionToken()

  // Fetch sessions
  const {
    data: sessions,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: listSessions,
    refetchOnWindowFocus: true,
  })

  // Revoke individual session mutation
  const revokeSessionMutation = useMutation({
    mutationFn: (token: string) => revokeSession({ token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      setError(null)
      // Show success toast (you can add a toast library later)
      console.log('Session revoked successfully')
    },
    onError: (error: unknown) => {
      console.error('Error revoking session:', error)
      setError('Failed to revoke session. Please try again.')
    },
  })

  // Revoke all other sessions mutation
  const revokeOthersMutation = useMutation({
    mutationFn: revokeOtherSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      setError(null)
      console.log('All other sessions revoked successfully')
    },
    onError: (error: unknown) => {
      console.error('Error revoking other sessions:', error)
      setError('Failed to revoke other sessions. Please try again.')
    },
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Loading Skeleton */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-full h-48 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    )
  }

  // Error state
  if (queryError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-1">
              Failed to Load Sessions
            </h3>
            <p className="text-sm text-red-600 mb-3">
              Unable to fetch your active sessions. Please check your internet
              connection and try again.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Empty state (only current session)
  if (!sessions || sessions.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 border border-gray-200 rounded-lg">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Active Sessions
        </h3>
        <p className="text-sm text-gray-600">
          You don't have any active sessions at the moment.
        </p>
      </div>
    )
  }

  // Single session state (only current session)
  if (sessions.length === 1) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Single Session Active
              </h3>
              <p className="text-sm text-blue-700">
                You're currently signed in on this device only. Sign in on other
                devices to see them here.
              </p>
            </div>
          </div>
        </div>

        <SessionCard
          session={sessions[0]}
          isCurrentSession={true}
          onRevoke={async (token) => {
            await revokeSessionMutation.mutateAsync(token)
          }}
        />
      </div>
    )
  }

  // Multiple sessions
  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Revoke All Other Sessions Button */}
      <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div>
          <h3 className="font-semibold text-yellow-900 mb-1">
            Multiple Sessions Active
          </h3>
          <p className="text-sm text-yellow-700">
            You have {sessions.length} active sessions. You can revoke individual
            sessions or sign out from all other devices at once.
          </p>
        </div>
        <RevokeSessionDialog
          onConfirm={async () => {
            await revokeOthersMutation.mutateAsync()
          }}
          sessionCount={sessions.length}
        />
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.map((session: Session) => {
          const isCurrentSession = currentSessionToken === session.token
          return (
            <SessionCard
              key={session.id}
              session={session}
              isCurrentSession={isCurrentSession}
              onRevoke={async (token) => {
                await revokeSessionMutation.mutateAsync(token)
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
