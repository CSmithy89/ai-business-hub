/**
 * Notification Hook
 *
 * Manages notification state with mock data.
 * TODO: Replace with real API integration in future epic.
 */

'use client'

import { useEffect, useState } from 'react'
import { IS_MOCK_DATA_ENABLED } from '@/lib/api-config'
import type { Notification } from '@/lib/mock-data'
import { MOCK_NOTIFICATIONS } from '@/lib/mock-data'

// Preserve existing exports for components consuming types from this hook
export type { Notification, NotificationType } from '@/lib/mock-data'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(
    IS_MOCK_DATA_ENABLED ? MOCK_NOTIFICATIONS : []
  )

  useEffect(() => {
    if (!IS_MOCK_DATA_ENABLED && process.env.NODE_ENV !== 'test') {
      console.warn('[notifications] Mock data disabled; returning empty notifications set.')
    }
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    )
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  }
}
