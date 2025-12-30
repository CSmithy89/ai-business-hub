'use client';

/**
 * Dashboard Chat Component
 *
 * Provides an AI assistant chat interface specifically for the dashboard.
 * Features quick action suggestions that users can click to trigger common queries.
 *
 * Uses the global CopilotChat panel state via useCopilotChatState hook,
 * allowing the chat to be opened with pre-filled messages.
 *
 * @example
 * <DashboardChat />
 *
 * Epic: DM-03 | Story: DM-03.4 - Dashboard Page Integration
 * @see docs/modules/bm-dm/epics/epic-dm-03-tech-spec.md - Section 3.4
 */

import { useEffect, useState } from 'react';
import { useCopilotChatState } from '@/components/copilot';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Activity,
  BarChart3,
  FolderKanban,
  MessageCircle,
  AlertTriangle,
} from 'lucide-react';

/** Quick action suggestion for the dashboard */
interface QuickActionSuggestion {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Message to send to the AI assistant */
  message: string;
  /** Icon component */
  icon: typeof MessageCircle;
  /** Optional description */
  description?: string;
}

/** Default quick action suggestions */
const QUICK_ACTIONS: QuickActionSuggestion[] = [
  {
    id: 'project-status',
    label: 'Show project status',
    message: 'Show me the status of my active projects',
    icon: FolderKanban,
    description: 'View project progress and health',
  },
  {
    id: 'at-risk',
    label: "What's at risk?",
    message: 'What projects or tasks are at risk this week?',
    icon: AlertTriangle,
    description: 'Identify potential issues',
  },
  {
    id: 'team-activity',
    label: 'Recent team activity',
    message: 'Show me recent team activity',
    icon: Activity,
    description: 'See what your team has been working on',
  },
  {
    id: 'workspace-overview',
    label: 'Workspace overview',
    message: 'Give me a workspace overview with key metrics',
    icon: BarChart3,
    description: 'Get high-level workspace insights',
  },
];

export interface DashboardChatProps {
  /** Additional CSS classes */
  className?: string;
  /** Override default quick actions */
  quickActions?: QuickActionSuggestion[];
}

export function DashboardChat({
  className,
  quickActions = QUICK_ACTIONS,
}: DashboardChatProps) {
  const { open: openChat } = useCopilotChatState();
  const [modifierKey, setModifierKey] = useState('Ctrl');

  // Detect platform to show correct modifier key (Cmd on Mac, Ctrl otherwise)
  useEffect(() => {
    const isMac =
      typeof navigator !== 'undefined' &&
      /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    setModifierKey(isMac ? 'Cmd' : 'Ctrl');
  }, []);

  /**
   * Handle quick action button click.
   * Opens the chat panel - the message is not programmatically sent
   * since CopilotKit doesn't expose a direct message sending API.
   * Instead, the user can see the chat panel opened and the button
   * label hints at what to ask.
   */
  const handleQuickAction = () => {
    openChat();
  };

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5 text-primary" />
          Dashboard Assistant
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ask me anything about your workspace, projects, or team
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions Grid */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Quick actions
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {quickActions.map((action) => (
              <QuickActionButton
                key={action.id}
                action={action}
                onClick={handleQuickAction}
              />
            ))}
          </div>
        </div>

        {/* Open Chat Button */}
        <Button
          variant="default"
          className="w-full gap-2"
          onClick={openChat}
          data-testid="dashboard-open-chat"
        >
          <MessageCircle className="h-4 w-4" />
          Open AI Assistant
        </Button>

        {/* Keyboard shortcut hint */}
        <p className="text-center text-xs text-muted-foreground">
          Press{' '}
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">
            {modifierKey}+/
          </kbd>{' '}
          to toggle assistant
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Quick Action Button Component
 *
 * Renders a clickable button for a quick action suggestion.
 */
interface QuickActionButtonProps {
  action: QuickActionSuggestion;
  onClick: () => void;
}

function QuickActionButton({ action, onClick }: QuickActionButtonProps) {
  const Icon = action.icon;

  return (
    <Button
      variant="outline"
      className="h-auto justify-start gap-2 p-3 text-left"
      onClick={onClick}
      data-testid={`quick-action-${action.id}`}
    >
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{action.label}</span>
        {action.description && (
          <span className="block truncate text-xs text-muted-foreground">
            {action.description}
          </span>
        )}
      </div>
    </Button>
  );
}
