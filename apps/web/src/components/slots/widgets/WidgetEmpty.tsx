'use client';

/**
 * WidgetEmpty Component
 *
 * Empty state component for widgets with no data.
 * Provides a consistent visual pattern for empty states across all widgets.
 *
 * @see docs/modules/bm-dm/stories/dm-01-3-base-widget-components.md
 */

import type { ReactNode } from 'react';
import { InboxIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface WidgetEmptyProps {
  /** Message to display */
  message?: string;
  /** Optional custom icon */
  icon?: ReactNode;
  /** Whether to render in a card container */
  asCard?: boolean;
  /** Optional action button */
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

/**
 * Empty state component for widgets with no data.
 */
export function WidgetEmpty({
  message = 'No data available',
  icon,
  asCard = true,
  action,
}: WidgetEmptyProps) {
  const content = (
    <div
      className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground"
      data-testid="widget-empty"
    >
      <div className="mb-3" aria-hidden="true">
        {icon || <InboxIcon className="h-10 w-10 opacity-50" />}
      </div>
      <p className="text-sm">{message}</p>
      {action && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={action.onClick}
          asChild={!!action.href}
        >
          {action.href ? (
            <a href={action.href}>{action.label}</a>
          ) : (
            action.label
          )}
        </Button>
      )}
    </div>
  );

  if (!asCard) {
    return content;
  }

  return (
    <Card>
      <CardContent className="pt-6">{content}</CardContent>
    </Card>
  );
}
