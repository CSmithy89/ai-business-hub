'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

/**
 * DashboardQuickActions Component
 *
 * Displays a grid of quick action buttons for common tasks.
 * Mobile-friendly layout that adapts to screen size.
 */
export function DashboardQuickActions() {
  const actions = getQuickActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className="h-auto flex-col gap-2 p-4 hover:bg-[rgb(var(--color-bg-tertiary))]"
              onClick={action.onClick}
            >
              <span className="material-symbols-rounded text-3xl text-[rgb(var(--color-primary-500))]">
                {action.icon}
              </span>
              <span className="text-xs font-medium text-[rgb(var(--color-text-primary))]">
                {action.title}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Get quick action buttons
 */
function getQuickActions(): QuickAction[] {
  return [
    {
      id: 'chat',
      title: 'New Chat',
      description: 'Start a conversation with Hub',
      icon: 'chat',
      onClick: () => {
        // TODO: Open chat panel
        console.log('Open new chat');
      },
    },
    {
      id: 'approvals',
      title: 'Approvals',
      description: 'Review pending approvals',
      icon: 'approval',
      onClick: () => {
        // TODO: Navigate to approvals page
        console.log('Navigate to approvals');
      },
    },
    {
      id: 'agents',
      title: 'Agents',
      description: 'View and manage agents',
      icon: 'smart_toy',
      onClick: () => {
        // TODO: Navigate to agents page
        console.log('Navigate to agents');
      },
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure workspace',
      icon: 'settings',
      onClick: () => {
        // TODO: Navigate to settings
        console.log('Navigate to settings');
      },
    },
  ];
}
