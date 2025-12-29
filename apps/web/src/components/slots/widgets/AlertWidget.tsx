'use client';

/**
 * AlertWidget
 *
 * Displays alert messages with severity levels and optional action buttons.
 * Used by AI agents to communicate important information to users.
 *
 * @see docs/modules/bm-dm/stories/dm-01-3-base-widget-components.md
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

export interface AlertWidgetProps {
  /** Alert data */
  data: AlertData;
  /** Whether the widget is loading */
  isLoading?: boolean;
}

const SEVERITY_CONFIG = {
  info: {
    icon: InfoIcon,
    className:
      'border-blue-500/50 bg-blue-500/10 text-blue-900 dark:text-blue-100 [&>svg]:text-blue-500',
  },
  warning: {
    icon: AlertTriangleIcon,
    className:
      'border-yellow-500/50 bg-yellow-500/10 text-yellow-900 dark:text-yellow-100 [&>svg]:text-yellow-500',
  },
  error: {
    icon: XCircleIcon,
    className:
      'border-red-500/50 bg-red-500/10 text-red-900 dark:text-red-100 [&>svg]:text-red-500',
  },
  success: {
    icon: CheckCircle2Icon,
    className:
      'border-green-500/50 bg-green-500/10 text-green-900 dark:text-green-100 [&>svg]:text-green-500',
  },
} as const;

export function AlertWidget({ data, isLoading }: AlertWidgetProps) {
  if (isLoading) {
    return <WidgetSkeleton variant="alert" />;
  }

  if (!data?.title || !data?.message) {
    // Alerts without title/message shouldn't render
    return null;
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
          <Button variant="outline" size="sm" className="mt-3" asChild>
            {/* Dynamic href from agent data - cast to any for Next.js 15 route typing */}
            <Link href={data.action.href as never}>{data.action.label}</Link>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
