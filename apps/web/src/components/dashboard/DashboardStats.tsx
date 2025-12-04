'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCard {
  id: string;
  title: string;
  value: string | number;
  change?: {
    value: number;
    direction: 'up' | 'down';
  };
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'info';
}

/**
 * DashboardStats Component
 *
 * Grid of stat cards displaying key metrics:
 * - Pending approvals
 * - Active agents
 * - AI confidence score
 * - Today's token usage
 */
export function DashboardStats() {
  const stats: StatCard[] = getMockStats();

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCardItem key={stat.id} stat={stat} />
      ))}
    </div>
  );
}

/**
 * Individual stat card component
 */
function StatCardItem({ stat }: { stat: StatCard }) {
  const colorClasses = getColorClasses(stat.color);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">
            {stat.title}
          </CardTitle>
          <span
            className={`material-symbols-rounded text-2xl ${colorClasses.icon}`}
            aria-hidden="true"
          >
            {stat.icon}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold text-[rgb(var(--color-text-primary))]">
            {stat.value}
          </div>
          {stat.change && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                stat.change.direction === 'up'
                  ? 'text-[rgb(var(--color-success-500))]'
                  : 'text-[rgb(var(--color-error-500))]'
              }`}
            >
              <span className="material-symbols-rounded text-base">
                {stat.change.direction === 'up' ? 'trending_up' : 'trending_down'}
              </span>
              <span>{Math.abs(stat.change.value)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Get color classes based on stat type
 */
function getColorClasses(color: StatCard['color']) {
  const colorMap = {
    primary: {
      icon: 'text-[rgb(var(--color-primary-500))]',
      bg: 'bg-[rgb(var(--color-primary-50))]',
    },
    success: {
      icon: 'text-[rgb(var(--color-success-500))]',
      bg: 'bg-[rgb(var(--color-success-50))]',
    },
    warning: {
      icon: 'text-[rgb(var(--color-warning-500))]',
      bg: 'bg-[rgb(var(--color-warning-50))]',
    },
    info: {
      icon: 'text-[rgb(var(--color-info-500))]',
      bg: 'bg-[rgb(var(--color-info-50))]',
    },
  };

  return colorMap[color];
}

/**
 * Mock data - will be replaced with real API calls
 */
function getMockStats(): StatCard[] {
  return [
    {
      id: 'approvals',
      title: 'Pending Approvals',
      value: 12,
      change: {
        value: 8,
        direction: 'up',
      },
      icon: 'pending_actions',
      color: 'primary',
    },
    {
      id: 'agents',
      title: 'Active Agents',
      value: 3,
      icon: 'smart_toy',
      color: 'info',
    },
    {
      id: 'confidence',
      title: 'AI Confidence Score',
      value: '87%',
      change: {
        value: 3,
        direction: 'up',
      },
      icon: 'psychology',
      color: 'success',
    },
    {
      id: 'usage',
      title: "Today's Token Usage",
      value: '2.3k',
      change: {
        value: 12,
        direction: 'down',
      },
      icon: 'monitoring',
      color: 'warning',
    },
  ];
}
