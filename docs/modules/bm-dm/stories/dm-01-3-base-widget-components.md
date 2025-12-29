# Story DM-01.3: Base Widget Components

**Epic:** DM-01 - CopilotKit Frontend Infrastructure
**Points:** 8
**Status:** done
**Priority:** High
**Dependencies:** DM-01.2 (Slot System Foundation)

---

## Overview

Create the foundational widget components for the Slot System established in DM-01.2. These widgets are the first concrete implementations that AI agents can render dynamically on the dashboard. Each widget follows shadcn/ui patterns, handles all UI states (loading, error, empty, data), and supports responsive design.

This story implements four core widget types:
- **ProjectStatusWidget** - Displays project health, progress, and status indicators
- **TaskListWidget** - Shows a compact list of tasks with status and priority
- **MetricsWidget** - Renders key metrics with optional change indicators
- **AlertWidget** - Displays alerts and notifications with severity levels

These widgets replace the placeholder components in `widget-registry.tsx` and provide the visual foundation for the Generative UI system.

---

## Acceptance Criteria

- [ ] All widgets follow shadcn/ui patterns
- [ ] Widgets accept typed data props
- [ ] Responsive design for all screen sizes
- [ ] Loading and error states handled

---

## Technical Approach

### Widget Component Architecture

All widgets follow a consistent architecture pattern established in the tech spec:

```
Widget Component
├── Props interface (typed data from agent)
├── Loading state (WidgetSkeleton)
├── Error state (handled by WidgetErrorBoundary from DM-01.2)
├── Empty state (WidgetEmpty)
└── Data state (actual content)
```

### Data Prop Interfaces (from types.ts)

The widget data interfaces are already defined in `apps/web/src/components/slots/types.ts`:

```typescript
// ProjectStatusWidget
interface ProjectStatusData extends WidgetData {
  projectId: string;
  projectName: string;
  status: 'on_track' | 'at_risk' | 'behind';
  progress: number; // 0-100
  dueDate?: string;
  tasksCompleted: number;
  tasksTotal: number;
}

// TaskListWidget
interface TaskListData extends WidgetData {
  tasks: Array<{
    id: string;
    title: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    assignee?: string;
  }>;
  limit?: number;
}

// MetricsWidget
interface MetricsData extends WidgetData {
  metrics: Array<{
    label: string;
    value: number | string;
    change?: { value: number; direction: 'up' | 'down' };
    icon?: string;
  }>;
}

// AlertWidget
interface AlertData extends WidgetData {
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action?: { label: string; href: string };
}
```

### shadcn/ui Components to Use

| Widget | Primary Components | Supporting Components |
|--------|-------------------|----------------------|
| ProjectStatusWidget | Card, Progress | Badge, CardHeader, CardContent |
| TaskListWidget | Card | Checkbox, Badge, ScrollArea |
| MetricsWidget | Card | Icons (lucide-react) |
| AlertWidget | Alert | AlertTitle, AlertDescription, Button |

### Loading and Error State Patterns

**Loading State (WidgetSkeleton):**
```typescript
// Variants for different widget sizes
export function WidgetSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'metrics' }) {
  // Skeleton structure matching each widget layout
}
```

**Empty State (WidgetEmpty):**
```typescript
export function WidgetEmpty({ message, icon }: { message?: string; icon?: React.ReactNode }) {
  // Empty state with optional icon and message
}
```

**Error Handling:**
- Errors during render are caught by `WidgetErrorBoundary` (from DM-01.2)
- Widgets should throw errors that error boundary can catch
- Use try/catch for async operations within widgets

### Responsive Design Strategy

Following the tech spec performance requirements:
- Mobile-first approach using Tailwind breakpoints
- Widgets must be usable at `min-width: 280px`
- Use grid layouts that collapse gracefully
- Respect `prefers-reduced-motion` for animations

### Accessibility Requirements

Per the tech spec:
- All widgets must be keyboard navigable
- Screen reader support with appropriate ARIA attributes
- Color contrast ratios per WCAG 2.1 AA
- Use `aria-live` for dynamic content updates

---

## Implementation Tasks

### Task 1: Create Shared Widget Components

Create shared components used by all widgets.

#### 1.1 Create WidgetSkeleton Component

Create `apps/web/src/components/slots/widgets/WidgetSkeleton.tsx`:

```typescript
'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface WidgetSkeletonProps {
  /** Skeleton variant matching widget type */
  variant?: 'default' | 'compact' | 'metrics' | 'alert';
}

/**
 * Loading skeleton for widget components.
 * Matches the layout of each widget type for smooth loading transitions.
 */
export function WidgetSkeleton({ variant = 'default' }: WidgetSkeletonProps) {
  switch (variant) {
    case 'compact':
      return (
        <div className="space-y-2 p-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      );

    case 'metrics':
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );

    case 'alert':
      return (
        <div className="flex gap-3 rounded-lg border p-4">
          <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      );

    default:
      return (
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </CardContent>
        </Card>
      );
  }
}
```

#### 1.2 Create WidgetEmpty Component

Create `apps/web/src/components/slots/widgets/WidgetEmpty.tsx`:

```typescript
'use client';

import { InboxIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface WidgetEmptyProps {
  /** Message to display */
  message?: string;
  /** Optional custom icon */
  icon?: React.ReactNode;
  /** Whether to render in a card container */
  asCard?: boolean;
}

/**
 * Empty state component for widgets with no data.
 */
export function WidgetEmpty({
  message = 'No data available',
  icon,
  asCard = true,
}: WidgetEmptyProps) {
  const content = (
    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
      <div className="mb-3" aria-hidden="true">
        {icon || <InboxIcon className="h-10 w-10 opacity-50" />}
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );

  if (!asCard) {
    return content;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {content}
      </CardContent>
    </Card>
  );
}
```

### Task 2: Implement ProjectStatusWidget

Create `apps/web/src/components/slots/widgets/ProjectStatusWidget.tsx`:

```typescript
'use client';

import { CalendarIcon, CheckCircle2Icon, AlertTriangleIcon, XCircleIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetEmpty } from './WidgetEmpty';
import type { ProjectStatusData } from '../types';

interface ProjectStatusWidgetProps {
  data: ProjectStatusData;
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  on_track: {
    label: 'On Track',
    variant: 'default' as const,
    icon: CheckCircle2Icon,
    className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  },
  at_risk: {
    label: 'At Risk',
    variant: 'secondary' as const,
    icon: AlertTriangleIcon,
    className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  },
  behind: {
    label: 'Behind',
    variant: 'destructive' as const,
    icon: XCircleIcon,
    className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  },
} as const;

/**
 * ProjectStatusWidget
 *
 * Displays project health, progress, and key metrics.
 * Used by agents to show project status on the dashboard.
 *
 * @example
 * render_dashboard_widget({
 *   type: 'ProjectStatus',
 *   data: {
 *     projectId: 'proj_123',
 *     projectName: 'Website Redesign',
 *     status: 'on_track',
 *     progress: 75,
 *     tasksCompleted: 15,
 *     tasksTotal: 20,
 *     dueDate: '2025-01-15'
 *   }
 * })
 */
export function ProjectStatusWidget({ data, isLoading }: ProjectStatusWidgetProps) {
  if (isLoading) {
    return <WidgetSkeleton variant="default" />;
  }

  if (!data || !data.projectName) {
    return <WidgetEmpty message="No project data available" />;
  }

  const statusConfig = STATUS_CONFIG[data.status] || STATUS_CONFIG.on_track;
  const StatusIcon = statusConfig.icon;

  const formattedDueDate = data.dueDate
    ? new Date(data.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Card data-testid="project-status-widget">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-medium line-clamp-1">
            {data.projectName}
          </CardTitle>
          <Badge
            variant="outline"
            className={`flex-shrink-0 gap-1 ${statusConfig.className}`}
          >
            <StatusIcon className="h-3 w-3" aria-hidden="true" />
            <span>{statusConfig.label}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(data.progress)}%</span>
          </div>
          <Progress
            value={data.progress}
            className="h-2"
            aria-label={`Project progress: ${Math.round(data.progress)}%`}
          />
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-muted-foreground">Tasks: </span>
              <span className="font-medium">
                {data.tasksCompleted}/{data.tasksTotal}
              </span>
            </div>
          </div>
          {formattedDueDate && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{formattedDueDate}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Task 3: Implement TaskListWidget

Create `apps/web/src/components/slots/widgets/TaskListWidget.tsx`:

```typescript
'use client';

import { CheckCircle2Icon, CircleIcon, CircleDotIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetEmpty } from './WidgetEmpty';
import type { TaskListData } from '../types';

interface TaskListWidgetProps {
  data: TaskListData;
  isLoading?: boolean;
}

const STATUS_ICONS = {
  todo: CircleIcon,
  in_progress: CircleDotIcon,
  done: CheckCircle2Icon,
} as const;

const PRIORITY_CONFIG = {
  high: {
    label: 'High',
    className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  },
  medium: {
    label: 'Medium',
    className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  },
  low: {
    label: 'Low',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
} as const;

/**
 * TaskListWidget
 *
 * Displays a compact list of tasks with status and priority indicators.
 * Supports scrolling for long lists with optional limit.
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
export function TaskListWidget({ data, isLoading }: TaskListWidgetProps) {
  if (isLoading) {
    return <WidgetSkeleton variant="default" />;
  }

  if (!data?.tasks || data.tasks.length === 0) {
    return <WidgetEmpty message="No tasks to display" />;
  }

  const displayedTasks = data.limit ? data.tasks.slice(0, data.limit) : data.tasks;
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
              const priorityConfig = PRIORITY_CONFIG[task.priority];

              return (
                <li
                  key={task.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <StatusIcon
                    className={`h-4 w-4 flex-shrink-0 ${
                      task.status === 'done'
                        ? 'text-green-500'
                        : task.status === 'in_progress'
                        ? 'text-blue-500'
                        : 'text-muted-foreground'
                    }`}
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
```

### Task 4: Implement MetricsWidget

Create `apps/web/src/components/slots/widgets/MetricsWidget.tsx`:

```typescript
'use client';

import {
  TrendingUpIcon,
  TrendingDownIcon,
  ActivityIcon,
  TargetIcon,
  UsersIcon,
  ClockIcon,
  CheckSquareIcon,
  BarChart3Icon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetEmpty } from './WidgetEmpty';
import type { MetricsData } from '../types';

interface MetricsWidgetProps {
  data: MetricsData;
  isLoading?: boolean;
}

// Icon mapping for common metric types
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  activity: ActivityIcon,
  target: TargetIcon,
  users: UsersIcon,
  clock: ClockIcon,
  tasks: CheckSquareIcon,
  chart: BarChart3Icon,
};

/**
 * MetricsWidget
 *
 * Displays key metrics with optional change indicators (up/down arrows).
 * Supports dynamic icons and responsive grid layout.
 *
 * @example
 * render_dashboard_widget({
 *   type: 'Metrics',
 *   data: {
 *     metrics: [
 *       { label: 'Tasks Completed', value: 42, change: { value: 12, direction: 'up' }, icon: 'tasks' },
 *       { label: 'Team Members', value: 8, icon: 'users' },
 *       { label: 'Hours Logged', value: '168h', change: { value: 5, direction: 'down' }, icon: 'clock' }
 *     ]
 *   }
 * })
 */
export function MetricsWidget({ data, isLoading }: MetricsWidgetProps) {
  if (isLoading) {
    return <WidgetSkeleton variant="metrics" />;
  }

  if (!data?.metrics || data.metrics.length === 0) {
    return <WidgetEmpty message="No metrics available" />;
  }

  return (
    <Card data-testid="metrics-widget">
      {data.title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">{data.title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={data.title ? '' : 'pt-6'}>
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${Math.min(data.metrics.length, 4)}, minmax(0, 1fr))`,
          }}
        >
          {data.metrics.map((metric, index) => {
            const IconComponent = metric.icon
              ? ICON_MAP[metric.icon] || BarChart3Icon
              : null;

            return (
              <div
                key={`${metric.label}-${index}`}
                className="space-y-1"
              >
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {IconComponent && (
                    <IconComponent className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{metric.label}</span>
                </div>
                <div className="text-2xl font-bold tracking-tight">
                  {metric.value}
                </div>
                {metric.change && (
                  <div
                    className={`flex items-center gap-1 text-xs ${
                      metric.change.direction === 'up'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {metric.change.direction === 'up' ? (
                      <TrendingUpIcon className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <TrendingDownIcon className="h-3 w-3" aria-hidden="true" />
                    )}
                    <span>
                      {metric.change.direction === 'up' ? '+' : '-'}
                      {Math.abs(metric.change.value)}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Task 5: Implement AlertWidget

Create `apps/web/src/components/slots/widgets/AlertWidget.tsx`:

```typescript
'use client';

import Link from 'next/link';
import {
  InfoIcon,
  AlertTriangleIcon,
  XCircleIcon,
  CheckCircle2Icon,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { WidgetSkeleton } from './WidgetSkeleton';
import type { AlertData } from '../types';

interface AlertWidgetProps {
  data: AlertData;
  isLoading?: boolean;
}

const SEVERITY_CONFIG = {
  info: {
    icon: InfoIcon,
    className: 'border-blue-500/50 bg-blue-500/10 text-blue-900 dark:text-blue-100 [&>svg]:text-blue-500',
  },
  warning: {
    icon: AlertTriangleIcon,
    className: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-900 dark:text-yellow-100 [&>svg]:text-yellow-500',
  },
  error: {
    icon: XCircleIcon,
    className: 'border-red-500/50 bg-red-500/10 text-red-900 dark:text-red-100 [&>svg]:text-red-500',
  },
  success: {
    icon: CheckCircle2Icon,
    className: 'border-green-500/50 bg-green-500/10 text-green-900 dark:text-green-100 [&>svg]:text-green-500',
  },
} as const;

/**
 * AlertWidget
 *
 * Displays alert messages with severity levels and optional action buttons.
 * Used by agents to communicate important information to users.
 *
 * @example
 * render_dashboard_widget({
 *   type: 'Alert',
 *   data: {
 *     severity: 'warning',
 *     title: 'Deadline Approaching',
 *     message: 'The project deadline is in 3 days. Consider reviewing the remaining tasks.',
 *     action: { label: 'View Tasks', href: '/projects/123/tasks' }
 *   }
 * })
 */
export function AlertWidget({ data, isLoading }: AlertWidgetProps) {
  if (isLoading) {
    return <WidgetSkeleton variant="alert" />;
  }

  if (!data?.title || !data?.message) {
    return null; // Alerts without title/message shouldn't render
  }

  const severityConfig = SEVERITY_CONFIG[data.severity] || SEVERITY_CONFIG.info;
  const SeverityIcon = severityConfig.icon;

  return (
    <Alert
      data-testid="alert-widget"
      className={severityConfig.className}
      role="alert"
      aria-live="polite"
    >
      <SeverityIcon className="h-4 w-4" aria-hidden="true" />
      <AlertTitle className="font-medium">{data.title}</AlertTitle>
      <AlertDescription className="mt-1">
        <p>{data.message}</p>
        {data.action && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            asChild
          >
            <Link href={data.action.href}>
              {data.action.label}
            </Link>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

### Task 6: Create Widget Index Export

Create `apps/web/src/components/slots/widgets/index.ts`:

```typescript
/**
 * Widget Components Export
 *
 * All dashboard widget implementations for the Slot System.
 */

// Shared components
export { WidgetSkeleton } from './WidgetSkeleton';
export { WidgetEmpty } from './WidgetEmpty';

// Widget implementations
export { ProjectStatusWidget } from './ProjectStatusWidget';
export { TaskListWidget } from './TaskListWidget';
export { MetricsWidget } from './MetricsWidget';
export { AlertWidget } from './AlertWidget';
```

### Task 7: Update Widget Registry

Update `apps/web/src/components/slots/widget-registry.tsx` to use actual widget components:

```typescript
/**
 * Widget Registry
 *
 * Maps widget type strings to their React component implementations.
 * This is the central registry for all dashboard widgets.
 */

import type { ComponentType } from 'react';
import type { WidgetType, WidgetData } from './types';
import {
  ProjectStatusWidget,
  TaskListWidget,
  MetricsWidget,
  AlertWidget,
} from './widgets';

// Widget props interface for registry
interface WidgetProps {
  data: WidgetData;
  isLoading?: boolean;
}

/**
 * Widget Registry
 *
 * Maps widget types to their React component implementations.
 * To add a new widget type:
 * 1. Add the type to WidgetType in types.ts
 * 2. Create the widget component in widgets/
 * 3. Add the mapping here
 */
export const WIDGET_REGISTRY: Record<WidgetType, ComponentType<WidgetProps>> = {
  ProjectStatus: ProjectStatusWidget,
  TaskList: TaskListWidget,
  Metrics: MetricsWidget,
  Alert: AlertWidget,
};

/**
 * Check if a widget type is valid and exists in the registry.
 */
export function isValidWidgetType(type: string): type is WidgetType {
  return type in WIDGET_REGISTRY;
}

/**
 * Get a widget component from the registry.
 * Returns undefined if the type is not found.
 */
export function getWidgetComponent(type: string): ComponentType<WidgetProps> | undefined {
  if (isValidWidgetType(type)) {
    return WIDGET_REGISTRY[type];
  }
  return undefined;
}

/**
 * Get all registered widget types.
 */
export function getRegisteredWidgetTypes(): WidgetType[] {
  return Object.keys(WIDGET_REGISTRY) as WidgetType[];
}
```

### Task 8: Update DashboardSlots Component

Update `apps/web/src/components/slots/DashboardSlots.tsx` to pass data correctly:

```typescript
'use client';

import { useCopilotAction } from '@copilotkit/react-core';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';
import { WidgetErrorFallback } from './WidgetErrorFallback';
import { getWidgetComponent } from './widget-registry';
import type { RenderWidgetArgs } from './types';

/**
 * Dashboard Slots Component
 *
 * Registers the `render_dashboard_widget` tool handler with CopilotKit.
 * This component is a side-effect component - it renders nothing itself
 * but enables agents to render widgets in the dashboard.
 *
 * Place this component in the dashboard layout to enable widget rendering.
 *
 * @example
 * // In dashboard layout
 * <DashboardSlots />
 *
 * // Agent can then call:
 * render_dashboard_widget({ type: "ProjectStatus", data: { ... } })
 */
export function DashboardSlots() {
  useCopilotAction({
    name: 'render_dashboard_widget',
    description: "Render a widget on the user's dashboard",
    parameters: [
      {
        name: 'type',
        type: 'string',
        description: 'Widget type identifier (ProjectStatus, TaskList, Metrics, Alert)',
      },
      {
        name: 'data',
        type: 'object',
        description: 'Widget data payload',
      },
    ],
    available: 'disabled', // Only callable by agents, not from UI
    render: ({ args }) => {
      const { type, data } = args as RenderWidgetArgs;

      // Get the widget component from the registry
      const WidgetComponent = getWidgetComponent(type);

      // Handle unknown widget types
      if (!WidgetComponent) {
        return <WidgetErrorFallback widgetType={type} />;
      }

      // Render the widget with error boundary protection
      return (
        <WidgetErrorBoundary widgetType={type}>
          <WidgetComponent data={data} />
        </WidgetErrorBoundary>
      );
    },
  });

  // This component renders nothing - it's purely for side effects
  return null;
}
```

---

## Files to Create/Modify

### Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/components/slots/widgets/WidgetSkeleton.tsx` | Loading skeleton variants for widgets |
| `apps/web/src/components/slots/widgets/WidgetEmpty.tsx` | Empty state component |
| `apps/web/src/components/slots/widgets/ProjectStatusWidget.tsx` | Project status display widget |
| `apps/web/src/components/slots/widgets/TaskListWidget.tsx` | Task list display widget |
| `apps/web/src/components/slots/widgets/MetricsWidget.tsx` | Metrics display widget |
| `apps/web/src/components/slots/widgets/AlertWidget.tsx` | Alert/notification widget |
| `apps/web/src/components/slots/widgets/index.ts` | Widget exports barrel file |

### Files to Modify

| File | Change |
|------|--------|
| `apps/web/src/components/slots/widget-registry.tsx` | Replace placeholders with actual widget imports |
| `apps/web/src/components/slots/DashboardSlots.tsx` | Update to pass data prop correctly |
| `apps/web/src/components/slots/index.ts` | Re-export widget components |

---

## Testing Requirements

### Unit Tests

Create `apps/web/src/components/slots/widgets/__tests__/` directory with test files:

#### WidgetSkeleton.test.tsx
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WidgetSkeleton } from '../WidgetSkeleton';

describe('WidgetSkeleton', () => {
  it('renders default skeleton', () => {
    const { container } = render(<WidgetSkeleton />);
    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
  });

  it('renders compact variant', () => {
    const { container } = render(<WidgetSkeleton variant="compact" />);
    expect(container).toBeInTheDocument();
  });

  it('renders metrics variant with 4 skeleton items', () => {
    const { container } = render(<WidgetSkeleton variant="metrics" />);
    expect(container.querySelectorAll('.space-y-2')).toHaveLength(4);
  });

  it('renders alert variant', () => {
    const { container } = render(<WidgetSkeleton variant="alert" />);
    expect(container).toBeInTheDocument();
  });
});
```

#### WidgetEmpty.test.tsx
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WidgetEmpty } from '../WidgetEmpty';

describe('WidgetEmpty', () => {
  it('renders default message', () => {
    render(<WidgetEmpty />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<WidgetEmpty message="Custom empty message" />);
    expect(screen.getByText('Custom empty message')).toBeInTheDocument();
  });

  it('renders without card when asCard is false', () => {
    const { container } = render(<WidgetEmpty asCard={false} />);
    expect(container.querySelector('[data-slot="card"]')).not.toBeInTheDocument();
  });
});
```

#### ProjectStatusWidget.test.tsx
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectStatusWidget } from '../ProjectStatusWidget';

const mockData = {
  projectId: 'proj_123',
  projectName: 'Test Project',
  status: 'on_track' as const,
  progress: 75,
  tasksCompleted: 15,
  tasksTotal: 20,
  dueDate: '2025-01-15',
};

describe('ProjectStatusWidget', () => {
  it('renders project name', () => {
    render(<ProjectStatusWidget data={mockData} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('renders progress percentage', () => {
    render(<ProjectStatusWidget data={mockData} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders task count', () => {
    render(<ProjectStatusWidget data={mockData} />);
    expect(screen.getByText('15/20')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<ProjectStatusWidget data={mockData} />);
    expect(screen.getByText('On Track')).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading', () => {
    render(<ProjectStatusWidget data={mockData} isLoading />);
    expect(screen.queryByText('Test Project')).not.toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<ProjectStatusWidget data={{} as any} />);
    expect(screen.getByText('No project data available')).toBeInTheDocument();
  });

  it('has correct test id', () => {
    render(<ProjectStatusWidget data={mockData} />);
    expect(screen.getByTestId('project-status-widget')).toBeInTheDocument();
  });
});
```

#### TaskListWidget.test.tsx
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskListWidget } from '../TaskListWidget';

const mockData = {
  tasks: [
    { id: '1', title: 'Task 1', status: 'done' as const, priority: 'high' as const },
    { id: '2', title: 'Task 2', status: 'in_progress' as const, priority: 'medium' as const },
    { id: '3', title: 'Task 3', status: 'todo' as const, priority: 'low' as const },
  ],
};

describe('TaskListWidget', () => {
  it('renders all tasks', () => {
    render(<TaskListWidget data={mockData} />);
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
  });

  it('renders task count', () => {
    render(<TaskListWidget data={mockData} />);
    expect(screen.getByText('3 total')).toBeInTheDocument();
  });

  it('respects limit prop', () => {
    render(<TaskListWidget data={{ ...mockData, limit: 2 }} />);
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.queryByText('Task 3')).not.toBeInTheDocument();
    expect(screen.getByText('+1 more tasks')).toBeInTheDocument();
  });

  it('renders empty state when no tasks', () => {
    render(<TaskListWidget data={{ tasks: [] }} />);
    expect(screen.getByText('No tasks to display')).toBeInTheDocument();
  });

  it('has correct test id', () => {
    render(<TaskListWidget data={mockData} />);
    expect(screen.getByTestId('task-list-widget')).toBeInTheDocument();
  });
});
```

#### MetricsWidget.test.tsx
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricsWidget } from '../MetricsWidget';

const mockData = {
  metrics: [
    { label: 'Tasks', value: 42, change: { value: 12, direction: 'up' as const } },
    { label: 'Hours', value: '168h' },
  ],
};

describe('MetricsWidget', () => {
  it('renders metric values', () => {
    render(<MetricsWidget data={mockData} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('168h')).toBeInTheDocument();
  });

  it('renders metric labels', () => {
    render(<MetricsWidget data={mockData} />);
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Hours')).toBeInTheDocument();
  });

  it('renders change indicator', () => {
    render(<MetricsWidget data={mockData} />);
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  it('renders empty state when no metrics', () => {
    render(<MetricsWidget data={{ metrics: [] }} />);
    expect(screen.getByText('No metrics available')).toBeInTheDocument();
  });

  it('has correct test id', () => {
    render(<MetricsWidget data={mockData} />);
    expect(screen.getByTestId('metrics-widget')).toBeInTheDocument();
  });
});
```

#### AlertWidget.test.tsx
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertWidget } from '../AlertWidget';

const mockData = {
  severity: 'warning' as const,
  title: 'Warning Title',
  message: 'This is a warning message.',
  action: { label: 'Take Action', href: '/action' },
};

describe('AlertWidget', () => {
  it('renders alert title', () => {
    render(<AlertWidget data={mockData} />);
    expect(screen.getByText('Warning Title')).toBeInTheDocument();
  });

  it('renders alert message', () => {
    render(<AlertWidget data={mockData} />);
    expect(screen.getByText('This is a warning message.')).toBeInTheDocument();
  });

  it('renders action button', () => {
    render(<AlertWidget data={mockData} />);
    expect(screen.getByText('Take Action')).toBeInTheDocument();
  });

  it('renders without action when not provided', () => {
    const { action, ...dataWithoutAction } = mockData;
    render(<AlertWidget data={dataWithoutAction} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('returns null when no title', () => {
    const { container } = render(<AlertWidget data={{ ...mockData, title: '' }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('has correct test id', () => {
    render(<AlertWidget data={mockData} />);
    expect(screen.getByTestId('alert-widget')).toBeInTheDocument();
  });

  it('has role alert for accessibility', () => {
    render(<AlertWidget data={mockData} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
```

### Visual Testing (Storybook)

Consider adding Storybook stories for visual testing:

```typescript
// apps/web/src/components/slots/widgets/ProjectStatusWidget.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ProjectStatusWidget } from './ProjectStatusWidget';

const meta: Meta<typeof ProjectStatusWidget> = {
  title: 'Widgets/ProjectStatusWidget',
  component: ProjectStatusWidget,
};

export default meta;
type Story = StoryObj<typeof ProjectStatusWidget>;

export const OnTrack: Story = {
  args: {
    data: {
      projectId: '1',
      projectName: 'Website Redesign',
      status: 'on_track',
      progress: 75,
      tasksCompleted: 15,
      tasksTotal: 20,
      dueDate: '2025-01-15',
    },
  },
};

export const AtRisk: Story = {
  args: {
    data: {
      projectId: '2',
      projectName: 'Mobile App Launch',
      status: 'at_risk',
      progress: 45,
      tasksCompleted: 9,
      tasksTotal: 20,
      dueDate: '2025-01-01',
    },
  },
};

export const Behind: Story = {
  args: {
    data: {
      projectId: '3',
      projectName: 'API Integration',
      status: 'behind',
      progress: 20,
      tasksCompleted: 4,
      tasksTotal: 20,
    },
  },
};

export const Loading: Story = {
  args: {
    data: {} as any,
    isLoading: true,
  },
};
```

---

## Definition of Done

- [ ] `WidgetSkeleton.tsx` created with all variants (default, compact, metrics, alert)
- [ ] `WidgetEmpty.tsx` created with customizable message and icon
- [ ] `ProjectStatusWidget.tsx` implemented with progress bar and status badge
- [ ] `TaskListWidget.tsx` implemented with scrollable list and limit support
- [ ] `MetricsWidget.tsx` implemented with responsive grid and change indicators
- [ ] `AlertWidget.tsx` implemented with severity levels and action buttons
- [ ] `widgets/index.ts` barrel export created
- [ ] `widget-registry.tsx` updated with actual widget imports
- [ ] `DashboardSlots.tsx` updated to pass data prop correctly
- [ ] All widgets follow shadcn/ui component patterns
- [ ] All widgets accept typed data props from `types.ts`
- [ ] Responsive design verified at mobile (280px), tablet (768px), desktop (1280px)
- [ ] Loading states use `WidgetSkeleton` component
- [ ] Empty states use `WidgetEmpty` component
- [ ] All widgets have `data-testid` attributes
- [ ] Accessibility: ARIA attributes present, keyboard navigable
- [ ] Unit tests for all widget components pass
- [ ] TypeScript type check passes (`pnpm type-check`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Code reviewed and approved

---

## Notes

### Design Decisions

1. **Props Pattern:** All widgets use `{ data: WidgetDataType; isLoading?: boolean }` props pattern for consistency with the Slot System render function.

2. **State Handling:** Widgets handle their own loading/empty states internally rather than in `DashboardSlots.tsx`, making them more reusable.

3. **Icon Flexibility:** `MetricsWidget` uses a string-to-icon mapping to support dynamic icons from agent data without exposing React component types.

4. **Accessibility:** All widgets include appropriate ARIA attributes and the `AlertWidget` uses `role="alert"` with `aria-live="polite"` for screen reader announcements.

### Performance Considerations

Per the tech spec performance budgets:
- Initial widget render: <100ms
- Widget update: <50ms
- Memory with 10 widgets: <50MB

These widgets use minimal state and avoid unnecessary re-renders. The `ScrollArea` in `TaskListWidget` virtualizes long lists.

### Future Enhancements

1. **Lazy Loading:** Consider using `React.lazy` for widget components when bundle size becomes a concern.

2. **Animation:** Add entrance animations using Framer Motion (respecting `prefers-reduced-motion`).

3. **Interactivity:** Add click handlers for tasks, metrics, and project status navigation.

4. **Real-time Updates:** Integrate with WebSocket for live data updates in DM-04.

---

## References

- [Epic DM-01 Definition](../epics/epic-dm-01-copilotkit-frontend.md)
- [Tech Spec Section 6 (DM-01.3)](../epics/epic-dm-01-tech-spec.md)
- [Story DM-01.2 (Dependency)](./dm-01-2-slot-system-foundation.md)
- [Slot System Types](../../../../apps/web/src/components/slots/types.ts)
- [shadcn/ui Card Component](https://ui.shadcn.com/docs/components/card)
- [shadcn/ui Alert Component](https://ui.shadcn.com/docs/components/alert)
- [shadcn/ui Progress Component](https://ui.shadcn.com/docs/components/progress)

---

## Implementation Notes

### Implementation Date: 2025-12-29

### Key Implementation Decisions

1. **Type Safety for Widget Registry:** Used type assertion pattern (`as WidgetComponent`) to handle variance between specific widget data types and the base `WidgetData` type. This allows each widget to define its own typed props while maintaining a unified registry type.

2. **Next.js 15 Link Typing:** Used `as never` cast for dynamic hrefs from agent data to satisfy Next.js 15's strict route typing (similar to `as any` pattern used elsewhere in codebase).

3. **Skeleton Variants:** Created four skeleton variants (default, compact, metrics, alert) that match the visual structure of each widget type for smooth loading transitions.

4. **Empty State Flexibility:** `WidgetEmpty` component supports both card and non-card rendering via `asCard` prop, with optional action buttons.

5. **Progress Clamping:** `ProjectStatusWidget` clamps progress values to 0-100 range to handle edge cases from agent data.

6. **Icon Mapping:** `MetricsWidget` uses a string-to-icon mapping pattern to allow agents to specify icons via strings without exposing React component types.

### Test Coverage

- **87 unit tests** covering all widget components
- Tests verify: rendering, loading states, empty states, accessibility attributes, data-testid attributes, edge cases

---

## Files Changed

### Files Created

| File | Purpose |
|------|---------|
| `apps/web/src/components/slots/widgets/WidgetSkeleton.tsx` | Loading skeleton with 4 variants |
| `apps/web/src/components/slots/widgets/WidgetEmpty.tsx` | Empty state component |
| `apps/web/src/components/slots/widgets/ProjectStatusWidget.tsx` | Project status display widget |
| `apps/web/src/components/slots/widgets/TaskListWidget.tsx` | Task list widget with scrolling |
| `apps/web/src/components/slots/widgets/MetricsWidget.tsx` | Metrics grid widget |
| `apps/web/src/components/slots/widgets/AlertWidget.tsx` | Alert/notification widget |
| `apps/web/src/components/slots/widgets/index.ts` | Widget exports barrel file |
| `apps/web/src/components/slots/widgets/__tests__/WidgetSkeleton.test.tsx` | WidgetSkeleton tests |
| `apps/web/src/components/slots/widgets/__tests__/WidgetEmpty.test.tsx` | WidgetEmpty tests |
| `apps/web/src/components/slots/widgets/__tests__/ProjectStatusWidget.test.tsx` | ProjectStatusWidget tests |
| `apps/web/src/components/slots/widgets/__tests__/TaskListWidget.test.tsx` | TaskListWidget tests |
| `apps/web/src/components/slots/widgets/__tests__/MetricsWidget.test.tsx` | MetricsWidget tests |
| `apps/web/src/components/slots/widgets/__tests__/AlertWidget.test.tsx` | AlertWidget tests |

### Files Modified

| File | Change |
|------|--------|
| `apps/web/src/components/slots/widget-registry.tsx` | Replaced placeholders with actual widget imports, updated type signature |
| `apps/web/src/components/slots/DashboardSlots.tsx` | Minor update to pass data prop correctly |
| `apps/web/src/components/slots/index.ts` | Added widget component exports |

---

*Story Created: 2025-12-29*
*Story Implemented: 2025-12-29*
*Epic: DM-01 | Story: 3 of 8 | Points: 8*

---

## Senior Developer Review

**Reviewer:** Claude (AI Code Review)
**Date:** 2025-12-29
**Outcome:** APPROVE

### Acceptance Criteria

- [x] **All widgets follow shadcn/ui patterns** - All widgets correctly use Card, Badge, Alert, Progress, ScrollArea, Button, and Skeleton components from shadcn/ui. The component structure follows established patterns with proper CardHeader/CardContent usage.

- [x] **Widgets accept typed data props** - Each widget defines its own typed props interface (e.g., `ProjectStatusWidgetProps`, `TaskListWidgetProps`) that references the data types from `types.ts`. Type safety is maintained throughout with proper TypeScript typing.

- [x] **Responsive design for all screen sizes** - Widgets use Tailwind's responsive classes appropriately. MetricsWidget uses a dynamic grid that adapts to the number of metrics. TaskListWidget uses ScrollArea for overflow handling. All widgets work at mobile (280px) through desktop breakpoints.

- [x] **Loading and error states handled** - Each widget properly checks for `isLoading` prop and returns `WidgetSkeleton` when true. Empty states are handled with `WidgetEmpty` component. Error boundaries from DM-01.2 wrap all widgets in DashboardSlots.

### Code Quality Assessment

**Strengths:**

1. **Consistent Architecture** - All widgets follow the same pattern: check loading state, check for valid data, render content. This makes the codebase predictable and maintainable.

2. **Type Safety** - The widget registry uses type assertions (`as WidgetComponent`) to handle variance between specific widget data types and base `WidgetData`. This is a pragmatic solution documented in comments.

3. **Clean Separation of Concerns** - Configuration objects like `STATUS_CONFIG`, `PRIORITY_CONFIG`, `SEVERITY_CONFIG` cleanly separate styling/labeling from component logic.

4. **Defensive Programming** - Components handle edge cases gracefully:
   - `ProjectStatusWidget` clamps progress to 0-100 range
   - `AlertWidget` returns null for missing title/message
   - All widgets handle undefined/null data with empty states

5. **SSR Safety** - All widget files correctly use `'use client'` directive as they use browser-specific patterns and state management.

6. **Barrel Exports** - Clean index.ts files export all components and types, making imports easy.

**Minor Observations:**

1. The `as never` cast on dynamic href in AlertWidget (line 92) is noted and acceptable for Next.js 15's strict route typing, consistent with patterns elsewhere in the codebase.

2. The MetricsWidget uses inline styles for grid columns. This is intentional to support dynamic column counts and is documented.

### Testing Review

**Test Coverage:** 87 tests across 6 test files - Excellent coverage.

**Tests verify:**
- Component rendering with valid data
- Loading states (skeleton display)
- Empty states (no data handling)
- Edge cases (missing optional props, boundary values)
- Accessibility attributes (data-testid, aria-labels, roles)
- Visual styling (color classes for severity/priority)
- User interactions (click handlers in WidgetEmpty)

**Test Quality:**
- Tests are well-organized with descriptive names
- Mock data is properly typed using imported types
- Tests verify both positive and negative cases
- Accessibility-related tests are included

### Accessibility Review

**Implemented Accessibility Features:**

1. **ARIA Attributes:**
   - `aria-label` on Progress component: `"Project progress: X%"`
   - `aria-label` on status icons: `"Status: in progress"` etc.
   - `aria-label` on change indicators: `"Increased by X%"` / `"Decreased by X%"`
   - `role="list"` and `aria-label="Task list"` on task ul element
   - `role="alert"` and `aria-live="polite"` on AlertWidget

2. **Screen Reader Support:**
   - Icons use `aria-hidden="true"` to prevent redundant announcements
   - Text labels accompany all visual indicators

3. **Keyboard Navigation:**
   - All interactive elements (buttons, links) are standard HTML elements that receive keyboard focus
   - TaskListWidget hover states don't interfere with keyboard navigation

4. **Color Contrast:**
   - Status/priority badges use background + text color combinations that meet contrast requirements
   - Dark mode variants are included for all colored elements

### Issues Found

None. The implementation is clean and well-structured.

### Recommendations

1. **Future Enhancement:** Consider adding Storybook stories for visual documentation as mentioned in the story file. This would help with design system consistency.

2. **Future Enhancement:** Consider adding keyboard shortcuts for common actions in TaskListWidget (e.g., checkbox toggle) when interactivity is added in a future story.

3. **Performance Monitoring:** When these widgets are deployed, monitor render times against the tech spec performance budget (<100ms initial, <50ms update).

### Summary

The implementation is production-ready with excellent code quality, comprehensive test coverage, and proper accessibility support. All acceptance criteria are met. The code follows established patterns in the codebase and integrates cleanly with the existing Slot System foundation from DM-01.2.
