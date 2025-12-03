'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string | null | undefined;
  description?: string;
  alert?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * StatCard component for displaying metrics
 *
 * Story: 05-7 - Event Monitoring Dashboard
 */
export function StatCard({
  title,
  value,
  description,
  alert = false,
  icon,
  className,
}: StatCardProps) {
  const displayValue = value ?? '-';

  return (
    <Card
      className={cn(
        'transition-colors',
        alert && typeof value === 'number' && value > 0 && 'border-red-500 bg-red-50',
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'text-2xl font-bold',
            alert && typeof value === 'number' && value > 0 && 'text-red-600'
          )}
        >
          {displayValue}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
