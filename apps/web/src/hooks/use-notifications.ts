/**
 * Notification Hook
 *
 * Manages notification state with mock data.
 * TODO: Replace with real API integration in future epic.
 */

'use client';

import { useState } from 'react';

export type NotificationType = 'approval' | 'system' | 'mention' | 'update';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

// Mock notification data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'approval',
    title: 'Approval needed',
    message: 'Email campaign "Summer Sale" requires your review',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
    read: false,
    actionUrl: '/approvals',
  },
  {
    id: '2',
    type: 'mention',
    title: 'Maya mentioned you',
    message: 'Maya mentioned you in a conversation about the new CRM setup',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
    read: false,
  },
  {
    id: '3',
    type: 'system',
    title: 'Token limit reached',
    message: 'Your daily token limit for Claude is at 90%. Consider upgrading your plan.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    actionUrl: '/settings/usage',
  },
  {
    id: '4',
    type: 'update',
    title: 'Workspace updated',
    message: 'John Smith updated workspace settings',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    read: true,
  },
  {
    id: '5',
    type: 'approval',
    title: 'Content approved',
    message: 'Your blog post "Getting Started with AI" was approved',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    read: true,
  },
  {
    id: '6',
    type: 'system',
    title: 'Backup completed',
    message: 'Your workspace data has been successfully backed up',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    read: true,
  },
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
