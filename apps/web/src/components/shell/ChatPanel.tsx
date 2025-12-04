/**
 * Chat Panel Component (Placeholder)
 *
 * This is a placeholder for the full Chat Panel implementation in Story 07.4.
 * Currently shows a basic chat panel with collapse/expand functionality.
 */

'use client';

import { useUIStore } from '@/stores/ui';

export function ChatPanel() {
  const { chatPanelOpen, chatPanelWidth, toggleChatPanel } = useUIStore();

  if (!chatPanelOpen) {
    return (
      <button
        onClick={toggleChatPanel}
        className="fixed top-[60px] right-0 z-10 flex h-12 w-12 items-center
                   justify-center rounded-l-lg border-l border-t border-b
                   border-[rgb(var(--color-border-default))]
                   bg-[rgb(var(--color-bg-secondary))]
                   shadow-lg transition-all duration-300
                   hover:bg-[rgb(var(--color-bg-hover))]"
        aria-label="Open chat panel"
      >
        <span className="text-lg">💬</span>
      </button>
    );
  }

  return (
    <aside
      className="fixed top-[60px] right-0 bottom-0 z-10 flex flex-col
                 border-l border-[rgb(var(--color-border-default))]
                 bg-[rgb(var(--color-bg-secondary))]
                 shadow-xl transition-all duration-300 ease-in-out"
      style={{ width: `${chatPanelWidth}px` }}
    >
      {/* Chat panel header */}
      <div
        className="flex h-14 flex-shrink-0 items-center justify-between
                   border-b border-[rgb(var(--color-border-default))] px-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6B6B]">
            <span className="text-lg">🤖</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">
              Hub
            </p>
            <p className="text-xs text-[rgb(var(--color-text-secondary))]">
              AI Assistant
            </p>
          </div>
        </div>
        <button
          onClick={toggleChatPanel}
          className="flex h-8 w-8 items-center justify-center rounded-md
                     text-[rgb(var(--color-text-secondary))]
                     transition-colors duration-150
                     hover:bg-[rgb(var(--color-bg-hover))]"
          aria-label="Close chat panel"
        >
          <span className="text-lg">✕</span>
        </button>
      </div>

      {/* Chat panel content placeholder */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-sm text-[rgb(var(--color-text-secondary))] text-center">
          Chat Panel placeholder
          <br />
          Story 07.4
        </div>
      </div>
    </aside>
  );
}
