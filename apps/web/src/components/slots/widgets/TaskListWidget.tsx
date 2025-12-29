'use client';

/**
 * TaskListWidget
 *
 * Displays a compact scrollable list of tasks with status icons and priority badges.
 * Supports limiting displayed tasks and showing a "more tasks" indicator.
 *
 * @see docs/modules/bm-dm/stories/dm-01-3-base-widget-components.md
 *
 * @example
 * render_dashboard_widget({
 *   type: 'TaskList',
 *   data: {
 *     tasks: [
 *       { id: '1', title: 'Review PRD', status: 'done', priority: 'high' },
 *       { id: '2', title: 'Design mockups', status: 'in_progress', priority: 'medium' },
 *       { id: '3', title: 'Write tests', status: 'todo', priority: 'low' }
 *     ],
 *     limit: 5
 *   }
 * })
 */

import { CheckCircle2Icon, CircleIcon, CircleDotIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetEmpty } from './WidgetEmpty';
import type { TaskListData } from '../types';

export interface TaskListWidgetProps {
  /** Task list data */
  data: TaskListData;
  /** Whether the widget is loading */
  isLoading?: boolean;
}

const STATUS_ICONS = {
  todo: CircleIcon,
  in_progress: CircleDotIcon,
  done: CheckCircle2Icon,
} as const;

const STATUS_COLORS = {
  todo: 'text-muted-foreground',
  in_progress: 'text-blue-500',
  done: 'text-green-500',
} as const;

const PRIORITY_CONFIG = {
  high: {
    label: 'High',
    className:
      'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  },
  medium: {
    label: 'Medium',
    className:
      'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  },
  low: {
    label: 'Low',
    className:
      'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
} as const;

export function TaskListWidget({ data, isLoading }: TaskListWidgetProps) {
  if (isLoading) {
    return <WidgetSkeleton variant="default" />;
  }

  if (!data?.tasks || data.tasks.length === 0) {
    return <WidgetEmpty message="No tasks to display" />;
  }

  const displayedTasks = data.limit
    ? data.tasks.slice(0, data.limit)
    : data.tasks;
  const hasMore = data.limit && data.tasks.length > data.limit;

  return (
    <Card data-testid="task-list-widget">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {data.title || 'Tasks'}
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {data.tasks.length} total
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-64">
          <ul
            className="divide-y divide-border"
            role="list"
            aria-label="Task list"
          >
            {displayedTasks.map((task) => {
              const StatusIcon = STATUS_ICONS[task.status] || CircleIcon;
              const statusColor = STATUS_COLORS[task.status] || STATUS_COLORS.todo;
              const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

              return (
                <li
                  key={task.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  data-testid={`task-item-${task.id}`}
                >
                  <StatusIcon
                    className={`h-4 w-4 flex-shrink-0 ${statusColor}`}
                    aria-label={`Status: ${task.status.replace('_', ' ')}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm truncate ${
                        task.status === 'done'
                          ? 'text-muted-foreground line-through'
                          : ''
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.assignee && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {task.assignee}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`flex-shrink-0 text-xs ${priorityConfig.className}`}
                  >
                    {priorityConfig.label}
                  </Badge>
                </li>
              );
            })}
          </ul>
          {hasMore && (
            <div className="px-4 py-2 text-center text-xs text-muted-foreground border-t">
              +{data.tasks.length - data.limit!} more tasks
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
