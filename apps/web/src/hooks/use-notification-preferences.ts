'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { NESTJS_API_URL } from '@/lib/api-config'
import { toast } from 'sonner'
import { NotificationPreferenceDto, UpdateNotificationPreferenceDto } from '@hyvve/shared'

/**
 * Response type for get preferences endpoint
 */
interface PreferencesResponse {
  data: NotificationPreferenceDto
}

/**
 * Get session token from session object
 */
function getSessionToken(session: any): string {
  return session?.session?.token || session?.token || ''
}

/**
 * Fetch user's notification preferences
 */
async function fetchPreferences(token: string): Promise<NotificationPreferenceDto> {
  const response = await fetch(`${NESTJS_API_URL}/pm/notifications/preferences`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch notification preferences')
  }

  const data: PreferencesResponse = await response.json()
  return data.data
}

/**
 * Update notification preferences
 */
async function updatePreferences(
  updates: UpdateNotificationPreferenceDto,
  token: string
): Promise<NotificationPreferenceDto> {
  const response = await fetch(`${NESTJS_API_URL}/pm/notifications/preferences`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update notification preferences')
  }

  const data: PreferencesResponse = await response.json()
  return data.data
}

/**
 * Reset preferences to defaults
 */
async function resetPreferences(token: string): Promise<NotificationPreferenceDto> {
  const response = await fetch(`${NESTJS_API_URL}/pm/notifications/preferences/reset`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to reset notification preferences')
  }

  const data: PreferencesResponse = await response.json()
  return data.data
}

/**
 * Hook to fetch notification preferences
 */
export function useNotificationPreferences() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const token = getSessionToken(session)

  return useQuery({
    queryKey: ['notification-preferences', userId],
    queryFn: () => fetchPreferences(token),
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook to update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const userId = session?.user?.id
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: (updates: UpdateNotificationPreferenceDto) => {
      if (!userId) throw new Error('User not authenticated')
      return updatePreferences(updates, token)
    },

    // Optimistic update
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notification-preferences', userId] })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<NotificationPreferenceDto>([
        'notification-preferences',
        userId,
      ])

      // Optimistically update
      if (previousData) {
        queryClient.setQueryData<NotificationPreferenceDto>(
          ['notification-preferences', userId],
          {
            ...previousData,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
        )
      }

      return { previousData }
    },

    // Rollback on error
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['notification-preferences', userId], context.previousData)
      }
      toast.error('Failed to update notification preferences')
    },

    // Invalidate and refetch on success
    onSuccess: () => {
      toast.success('Notification preferences updated')
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', userId] })
    },
  })
}

/**
 * Hook to reset notification preferences to defaults
 */
export function useResetNotificationPreferences() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const userId = session?.user?.id
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('User not authenticated')
      return resetPreferences(token)
    },

    onError: () => {
      toast.error('Failed to reset notification preferences')
    },

    onSuccess: () => {
      toast.success('Notification preferences reset to defaults')
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', userId] })
    },
  })
}
