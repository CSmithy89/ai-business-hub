'use client';

/**
 * CopilotChatButton Component
 *
 * Toggle button for the CopilotChat panel, typically placed in the header.
 * Shows the current open/closed state and provides keyboard shortcut hint in tooltip.
 *
 * Features:
 * - MessageCircle icon from lucide-react
 * - Tooltip with keyboard shortcut (Cmd+/ or Ctrl+/)
 * - Accessible with aria-label
 * - Platform-aware shortcut display (Cmd on Mac, Ctrl on Windows)
 *
 * @see docs/modules/bm-dm/stories/dm-01-4-copilotkit-chat-integration.md
 * Epic: DM-01 | Story: DM-01.4
 */

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCopilotChatState } from './use-copilot-chat-state';

export function CopilotChatButton() {
  const { isOpen, toggle } = useCopilotChatState();
  const [isMac, setIsMac] = useState(false);

  // Detect platform on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform));
    }
  }, []);

  const shortcutDisplay = isMac ? '\u2318/' : 'Ctrl+/';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label="Toggle AI Assistant"
          aria-pressed={isOpen}
          data-testid="copilot-chat-button"
          className={isOpen ? 'text-primary' : undefined}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="flex items-center gap-2">
          AI Assistant
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            {shortcutDisplay}
          </kbd>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
