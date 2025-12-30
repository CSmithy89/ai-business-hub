'use client';

/**
 * Dashboard Agent Section Component
 *
 * Provides the AI-powered section of the dashboard with:
 * - Widget grid for agent-rendered dynamic widgets
 * - Chat sidebar with quick action suggestions
 *
 * The widget grid receives widgets from the DashboardSlots component
 * which intercepts `render_dashboard_widget` tool calls from agents.
 * The DashboardSlots component is already rendered in the dashboard layout.
 *
 * This component provides:
 * - Section header with description
 * - Responsive grid layout (2:1 on desktop)
 * - DashboardGrid for widget placement
 * - DashboardChat sidebar with quick actions
 * - CopilotKit context for AI agents (DM-06.1)
 *
 * Epic: DM-03 | Story: DM-03.4 - Dashboard Page Integration
 * Epic: DM-06 | Story: DM-06.1 - Deep Context Providers
 * @see docs/modules/bm-dm/epics/epic-dm-03-tech-spec.md - Section 3.4
 * @see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md - Section 3.1
 */

import { useMemo } from 'react';
import { DashboardGrid, DashboardChat } from '@/components/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import { useDashboardStateStore } from '@/stores/dashboard-state-store';
import {
  useActivityContext,
  useViewContext,
  type ActivityContext,
  type ViewContext,
} from '@/lib/context';

export function DashboardAgentSection() {
  // Subscribe to dashboard state for context
  const activity = useDashboardStateStore((state) => state.widgets.activity);
  const projectStatus = useDashboardStateStore(
    (state) => state.widgets.projectStatus
  );

  // Transform activity data into context format for CopilotKit agents
  const activityContext = useMemo<ActivityContext | null>(() => {
    if (!activity) return null;

    return {
      recentActions: activity.activities.map((a) => ({
        action: a.action,
        target: a.target ?? '',
        timestamp: a.timestamp,
      })),
      currentPage: '/dashboard',
      sessionDuration: Date.now() - (activity.lastUpdated || Date.now()),
    };
  }, [activity]);

  // Transform project status data into view context
  const viewContext = useMemo<ViewContext | null>(() => {
    if (!projectStatus) return null;

    return {
      type: 'list' as const,
      filters: {},
      visibleCount: 1,
      totalCount: 1,
    };
  }, [projectStatus]);

  // Expose contexts to CopilotKit agents
  useActivityContext(activityContext);
  useViewContext(viewContext);

  return (
    <section
      className="space-y-4"
      aria-label="AI-powered insights"
      data-testid="dashboard-agent-section"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            AI Insights
          </h2>
          <p className="text-sm text-muted-foreground">
            Real-time updates from your AI team
          </p>
        </div>
      </div>

      {/* Content Grid: Widgets + Chat */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Widget Grid - Takes 2/3 of space on desktop */}
        <div className="lg:col-span-2">
          <DashboardGrid>
            {/*
              Widget content is rendered by DashboardSlots (in layout.tsx)
              via useCopilotAction hook intercepting tool calls.

              We show a placeholder message when no widgets are rendered yet.
              The DashboardSlots component handles the actual widget rendering.
            */}
            <WidgetPlaceholder />
          </DashboardGrid>
        </div>

        {/* Chat Sidebar - Takes 1/3 of space on desktop */}
        <div className="lg:sticky lg:top-4">
          <DashboardChat />
        </div>
      </div>
    </section>
  );
}

/**
 * Placeholder shown when no widgets are rendered yet
 *
 * This component is visible when the user hasn't interacted
 * with the AI assistant to generate widgets.
 */
function WidgetPlaceholder() {
  return (
    <Card className="col-span-full border-dashed">
      <CardContent className="flex min-h-[200px] flex-col items-center justify-center p-6 text-center">
        <Bot className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="mb-2 text-lg font-medium text-muted-foreground">
          No widgets yet
        </h3>
        <p className="max-w-md text-sm text-muted-foreground/75">
          Use the AI Assistant to ask about your projects, team activity,
          or workspace metrics. Widgets will appear here automatically.
        </p>
      </CardContent>
    </Card>
  );
}
