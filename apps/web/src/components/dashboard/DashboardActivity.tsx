'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ActivityType = 'agent' | 'approval' | 'warning' | 'member' | 'system';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date | string;
}

/**
 * DashboardActivity Component
 *
 * Displays recent activity feed with events from agents, approvals, warnings, etc.
 * Shows timestamp relative to current time.
 */
export function DashboardActivity() {
  const activities = getMockActivities();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
          <button
            type="button"
            className="text-sm font-medium text-[rgb(var(--color-primary-500))]
                     hover:text-[rgb(var(--color-primary-600))] transition-colors"
            onClick={() => {
              // TODO: Navigate to full activity log
              console.log('View all activity');
            }}
          >
            View all
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="py-8 text-center">
              <span className="material-symbols-rounded text-5xl text-[rgb(var(--color-text-disabled))]">
                inbox
              </span>
              <p className="mt-2 text-sm text-[rgb(var(--color-text-secondary))]">
                No recent activity
              </p>
            </div>
          ) : (
            activities.map((activity) => (
              <ActivityItemComponent key={activity.id} activity={activity} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Individual activity item
 */
function ActivityItemComponent({ activity }: { activity: ActivityItem }) {
  const { icon, iconColor } = getActivityIcon(activity.type);
  const timestampDate =
    activity.timestamp instanceof Date
      ? activity.timestamp
      : new Date(activity.timestamp);
  const timeAgo = formatTimeAgo(timestampDate);

  return (
    <div className="flex gap-3 pb-4 last:pb-0">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconColor}`}
      >
        <span className="material-symbols-rounded text-xl">{icon}</span>
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-[rgb(var(--color-text-primary))]">
          {activity.title}
        </p>
        <p className="text-sm text-[rgb(var(--color-text-secondary))]">
          {activity.description}
        </p>
        <p className="text-xs text-[rgb(var(--color-text-muted))]">
          <time dateTime={timestampDate.toISOString()}>{timeAgo}</time>
        </p>
      </div>
    </div>
  );
}

/**
 * Get icon and color based on activity type
 */
function getActivityIcon(type: ActivityType): { icon: string; iconColor: string } {
  const iconMap: Record<ActivityType, { icon: string; iconColor: string }> = {
    agent: {
      icon: 'smart_toy',
      iconColor: 'bg-[rgb(var(--color-info-100))] text-[rgb(var(--color-info-600))]',
    },
    approval: {
      icon: 'check_circle',
      iconColor: 'bg-[rgb(var(--color-success-100))] text-[rgb(var(--color-success-600))]',
    },
    warning: {
      icon: 'warning',
      iconColor: 'bg-[rgb(var(--color-warning-100))] text-[rgb(var(--color-warning-600))]',
    },
    member: {
      icon: 'person',
      iconColor: 'bg-[rgb(var(--color-primary-100))] text-[rgb(var(--color-primary-600))]',
    },
    system: {
      icon: 'settings',
      iconColor: 'bg-[rgb(var(--color-slate-200))] text-[rgb(var(--color-slate-600))]',
    },
  };

  return iconMap[type];
}

/**
 * Format timestamp to relative time (e.g., "2m ago", "1h ago")
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds

  if (diff < 60) {
    return 'just now';
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes}m ago`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours}h ago`;
  } else if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `${days}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Mock data - will be replaced with real API calls
 */
function getMockActivities(): ActivityItem[] {
  const now = new Date();

  return [
    {
      id: '1',
      type: 'agent',
      title: 'Content Generator completed task',
      description: 'Blog post draft "10 Ways to Boost Productivity" is ready for review',
      timestamp: new Date(now.getTime() - 2 * 60 * 1000), // 2 minutes ago
    },
    {
      id: '2',
      type: 'approval',
      title: 'Approval accepted',
      description: 'Email campaign "Summer Sale 2024" was approved and sent',
      timestamp: new Date(now.getTime() - 15 * 60 * 1000), // 15 minutes ago
    },
    {
      id: '3',
      type: 'warning',
      title: 'Token limit warning',
      description: 'Workspace "Marketing" has used 85% of daily token limit',
      timestamp: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
    },
    {
      id: '4',
      type: 'member',
      title: 'New team member joined',
      description: 'Sarah Johnson joined the "Sales Team" workspace',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: '5',
      type: 'system',
      title: 'System update completed',
      description: 'HYVVE platform updated to v1.2.3 with new features',
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
    },
  ];
}
