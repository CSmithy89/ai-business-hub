'use client';

/**
 * TeamActivityWidget
 *
 * Displays recent team activity feed with user avatars and timestamps.
 * Used by AI agents to show team activity on the dashboard.
 *
 * @see docs/modules/bm-dm/stories/dm-03-3-widget-rendering-pipeline.md
 *
 * @example
 * render_dashboard_widget({
 *   type: 'TeamActivity',
 *   data: {
 *     activities: [
 *       { user: 'John Doe', action: 'completed task', target: 'Fix login bug', time: '2 hours ago' },
 *       { user: 'Jane Smith', action: 'created', target: 'New feature spec', time: '3 hours ago' }
 *     ]
 *   }
 * })
 */

import { ActivityIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetEmpty } from './WidgetEmpty';
import type { TeamActivityData } from '../types';

export interface TeamActivityWidgetProps {
  /** Team activity data */
  data: TeamActivityData;
  /** Whether the widget is loading */
  isLoading?: boolean;
}

/**
 * Get initials from a user name.
 * Returns first two letters uppercase.
 */
function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Get a consistent color class for a user based on their name.
 * Uses a simple hash to assign colors.
 */
function getUserColorClass(name: string | null | undefined): string {
  const colors = [
    'bg-blue-500/20 text-blue-700 dark:text-blue-300',
    'bg-green-500/20 text-green-700 dark:text-green-300',
    'bg-purple-500/20 text-purple-700 dark:text-purple-300',
    'bg-orange-500/20 text-orange-700 dark:text-orange-300',
    'bg-pink-500/20 text-pink-700 dark:text-pink-300',
    'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300',
  ];

  // Handle null/undefined name - return first color as default
  if (!name) {
    return colors[0];
  }

  // Simple hash based on character codes
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % colors.length;
  }

  return colors[hash];
}

export function TeamActivityWidget({
  data,
  isLoading,
}: TeamActivityWidgetProps) {
  if (isLoading) {
    return <WidgetSkeleton variant="default" />;
  }

  if (!data?.activities || data.activities.length === 0) {
    return (
      <WidgetEmpty
        message="No recent activity"
        icon={<ActivityIcon className="h-10 w-10 opacity-50" />}
      />
    );
  }

  return (
    <Card data-testid="team-activity-widget">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <ActivityIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {data.title || 'Recent Activity'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.activities.map((activity, idx) => (
            <div
              key={`${activity.user}-${activity.time}-${idx}`}
              className="flex items-start gap-3"
              data-testid={`activity-item-${idx}`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className={getUserColorClass(activity.user)}>
                  {getInitials(activity.user)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{activity.user}</span>{' '}
                  <span className="text-muted-foreground">{activity.action}</span>
                  {activity.target && (
                    <>
                      {' '}
                      <span className="font-medium">{activity.target}</span>
                    </>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
