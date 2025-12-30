/**
 * useGenerativeLayout Hook
 *
 * React hook for managing generative UI layouts composed by AI agents.
 * Integrates with CopilotKit's useCopilotAction to handle render_generative_layout
 * tool calls from agents.
 *
 * Features:
 * - Layout state management with history (last 10 layouts)
 * - Tool call handling via CopilotKit
 * - Navigation (go back to previous layout)
 * - Framer Motion animated transitions
 *
 * @see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md - Section 3.3
 * Epic: DM-06 | Story: DM-06.3
 */
'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { useCopilotAction } from '@copilotkit/react-core';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  GenerativeLayoutRenderer,
} from '@/components/generative-ui/GenerativeLayout';
import type {
  GenerativeLayout,
  LayoutConfig,
  LayoutSlot,
  UseGenerativeLayoutOptions,
  UseGenerativeLayoutReturn,
  RenderGenerativeLayoutArgs,
} from './layout-types';

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_HISTORY_SIZE = 10;

// =============================================================================
// LOADING SKELETON
// =============================================================================

/**
 * Loading skeleton shown while layout is being composed.
 */
function LayoutSkeleton(): ReactNode {
  return (
    <Card className="w-full">
      <CardContent className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <div className="space-y-2 text-center">
          <Skeleton className="h-4 w-32 mx-auto" />
          <p className="text-sm text-muted-foreground">Composing layout...</p>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Hook to manage generative UI layouts from AI agents.
 *
 * Registers a CopilotKit action handler for 'render_generative_layout' tool calls
 * and manages layout state including history for back navigation.
 *
 * @param options - Hook configuration options
 * @returns Layout state and control functions
 *
 * @example
 * ```typescript
 * function Dashboard() {
 *   const { currentLayout, hasHistory, goBack, clearLayout } = useGenerativeLayout({
 *     onLayoutChange: (layout) => console.log('Layout changed:', layout),
 *   });
 *
 *   return (
 *     <div>
 *       {hasHistory && <Button onClick={goBack}>Back</Button>}
 *       {currentLayout && <GenerativeLayoutRenderer layout={currentLayout} />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useGenerativeLayout(
  options: UseGenerativeLayoutOptions = {}
): UseGenerativeLayoutReturn {
  const [currentLayout, setCurrentLayout] = useState<GenerativeLayout | null>(
    null
  );
  const [layoutHistory, setLayoutHistory] = useState<GenerativeLayout[]>([]);

  // Handle layout changes
  const handleLayoutChange = useCallback(
    (layout: GenerativeLayout | null) => {
      if (layout) {
        // Add to history (keep last MAX_HISTORY_SIZE layouts)
        setLayoutHistory((prev) => [...prev, layout].slice(-MAX_HISTORY_SIZE));
      }
      setCurrentLayout(layout);
      options.onLayoutChange?.(layout);
    },
    [options]
  );

  // Clear current layout
  const clearLayout = useCallback(() => {
    handleLayoutChange(null);
  }, [handleLayoutChange]);

  // Navigate to previous layout in history
  const goBack = useCallback(() => {
    if (layoutHistory.length > 1) {
      // Remove current layout from history
      const newHistory = layoutHistory.slice(0, -1);
      const previousLayout = newHistory[newHistory.length - 1] || null;

      setLayoutHistory(newHistory);
      setCurrentLayout(previousLayout);
      options.onLayoutChange?.(previousLayout);
    } else {
      // No history, just clear
      clearLayout();
      setLayoutHistory([]);
    }
  }, [layoutHistory, options, clearLayout]);

  // Register CopilotKit action for layout tool calls
  useCopilotAction({
    name: 'render_generative_layout',
    description:
      'Render a dynamic layout on the dashboard with widgets composed by the agent',
    parameters: [
      {
        name: 'layout_type',
        type: 'string',
        description: "Layout type: 'single', 'split', 'wizard', or 'grid'",
        required: true,
      },
      {
        name: 'config',
        type: 'object',
        description: 'Layout-specific configuration',
        required: true,
      },
      {
        name: 'slots',
        type: 'object[]',
        description:
          'Array of slot definitions with widget, data, and optional title',
        required: true,
      },
      {
        name: 'metadata',
        type: 'object',
        description: 'Optional layout metadata (title, description)',
        required: false,
      },
    ],
    // Use renderAndWaitForResponse pattern for generative UI
    renderAndWaitForResponse: ({ args, status }) => {
      // Show loading skeleton while pending
      if (status === 'inProgress' || status === 'executing') {
        return <LayoutSkeleton />;
      }

      // Parse args into typed layout
      const typedArgs = args as unknown as RenderGenerativeLayoutArgs;

      const layout: GenerativeLayout = {
        id: `layout-${Date.now()}`,
        type: typedArgs.layout_type,
        config: typedArgs.config as unknown as LayoutConfig,
        slots: (typedArgs.slots || []).map((slot, index) => ({
          id: slot.id || `slot-${index}`,
          widget: slot.widget,
          data: slot.data || {},
          title: slot.title,
        })) as LayoutSlot[],
        metadata: {
          title: typedArgs.metadata?.title,
          description: typedArgs.metadata?.description,
          createdAt: Date.now(),
          agentId: 'dashboard_gateway',
        },
      };

      // Update layout state
      handleLayoutChange(layout);

      // Render the layout
      return <GenerativeLayoutRenderer layout={layout} />;
    },
  });

  return {
    currentLayout,
    layoutHistory,
    clearLayout,
    goBack,
    hasHistory: layoutHistory.length > 1,
  };
}

// =============================================================================
// STANDALONE GENERATIVE LAYOUT PROVIDER
// =============================================================================

interface GenerativeLayoutProviderProps {
  children: ReactNode;
  onLayoutChange?: (layout: GenerativeLayout | null) => void;
}

/**
 * Provider component that sets up generative layout handling.
 *
 * Use this to wrap components that need access to agent-composed layouts
 * without manually calling the hook.
 *
 * @example
 * ```tsx
 * <GenerativeLayoutProvider onLayoutChange={(l) => console.log(l)}>
 *   <Dashboard />
 * </GenerativeLayoutProvider>
 * ```
 */
export function GenerativeLayoutProvider({
  children,
  onLayoutChange,
}: GenerativeLayoutProviderProps) {
  // Just register the hook - layouts render inline via CopilotKit
  useGenerativeLayout({ onLayoutChange });

  return <>{children}</>;
}
