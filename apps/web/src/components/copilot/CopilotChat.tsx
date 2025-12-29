'use client';

/**
 * CopilotChat Component
 *
 * Wrapper for CopilotKit's CopilotSidebar that integrates with HYVVE's design system.
 * Provides a globally available AI assistant chat interface.
 *
 * Features:
 * - HYVVE-themed styling via CSS custom properties
 * - State synchronized with Zustand store for keyboard shortcuts
 * - Dynamic import for bundle size optimization
 * - Accessibility support (ARIA labels, keyboard navigation)
 *
 * @see docs/modules/bm-dm/stories/dm-01-4-copilotkit-chat-integration.md
 * Epic: DM-01 | Story: DM-01.4
 */

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCopilotChatState } from './use-copilot-chat-state';
import { DM_CONSTANTS } from '@/lib/dm-constants';

// Dynamic import CopilotSidebar for bundle size optimization (~75-100KB gzipped)
const CopilotSidebar = dynamic(
  () => import('@copilotkit/react-ui').then((mod) => mod.CopilotSidebar),
  {
    ssr: false,
    loading: () => null, // No loading indicator - sidebar appears when ready
  }
);

interface CopilotChatProps {
  /** Initial open state (defaults to false) */
  defaultOpen?: boolean;
}

export function CopilotChat({ defaultOpen = false }: CopilotChatProps) {
  const { isOpen, setIsOpen } = useCopilotChatState();

  // Honor the defaultOpen prop on initial mount
  useEffect(() => {
    if (defaultOpen) {
      setIsOpen(true);
    }
  }, [defaultOpen, setIsOpen]);

  // Conditionally render based on isOpen state to support keyboard toggle
  // CopilotSidebar's defaultOpen is only used on initial render
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="copilot-chat"
      style={{ zIndex: DM_CONSTANTS.Z_INDEX.COPILOT_CHAT }}
      data-testid="copilot-chat"
    >
      <CopilotSidebar
        defaultOpen={true}
        onSetOpen={(open) => {
          if (!open) {
            setIsOpen(false);
          }
        }}
        labels={{
          title: 'HYVVE Assistant',
          placeholder: 'Ask anything about your workspace...',
        }}
        clickOutsideToClose={true}
        hitEscapeToClose={true}
      />
    </div>
  );
}
