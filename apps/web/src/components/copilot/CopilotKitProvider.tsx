'use client';

import { CopilotKit } from '@copilotkit/react-core';

interface CopilotKitProviderProps {
  children: React.ReactNode;
}

/**
 * CopilotKit Provider Wrapper
 *
 * Wraps children with CopilotKit provider configured for AG-UI protocol.
 * Must be rendered client-side only (SSR-safe via 'use client' directive).
 *
 * Configuration:
 * - Uses NEXT_PUBLIC_AGNO_URL for Agno backend connection (appends /agui)
 * - Falls back to /api/copilotkit mock route for local development
 * - Optional NEXT_PUBLIC_COPILOTKIT_KEY for CopilotKit Cloud features
 *
 * @see https://docs.copilotkit.ai
 * @see docs/modules/bm-dm/epics/epic-dm-01-tech-spec.md
 */
export function CopilotKitProvider({ children }: CopilotKitProviderProps) {
  // Determine runtime URL:
  // - If NEXT_PUBLIC_AGNO_URL is set, use it with /agui endpoint
  // - Otherwise fall back to local mock API route
  const runtimeUrl = process.env.NEXT_PUBLIC_AGNO_URL
    ? `${process.env.NEXT_PUBLIC_AGNO_URL}/agui`
    : '/api/copilotkit';

  return (
    <CopilotKit
      runtimeUrl={runtimeUrl}
      // publicApiKey is optional - only needed for CopilotKit Cloud features
      publicApiKey={process.env.NEXT_PUBLIC_COPILOTKIT_KEY}
    >
      {children}
    </CopilotKit>
  );
}
