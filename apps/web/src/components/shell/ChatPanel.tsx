/**
 * Chat Panel Component
 *
 * Persistent AI chat interface fixed to the right side of the dashboard.
 * Features:
 * - Message display (user, agent, system)
 * - Streaming typing indicators
 * - Auto-scroll message list
 * - Input area with @mention support
 * - Collapse/expand functionality
 */

'use client';

import { useUIStore } from '@/stores/ui';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { cn } from '@/lib/utils';

export function ChatPanel() {
  const { chatPanelOpen, chatPanelWidth, toggleChatPanel } = useUIStore();
  const { messages, isTyping, sendMessage } = useChatMessages();

  // Current agent info
  const currentAgent = {
    name: 'Hub',
    icon: '🎯',
    color: '#FF6B6B',
  };

  // Collapsed state - show icon button
  if (!chatPanelOpen) {
    return (
      <button
        onClick={toggleChatPanel}
        className={cn(
          'fixed top-[60px] right-0 z-10 flex h-12 w-12 items-center',
          'justify-center rounded-l-lg border-l border-t border-b',
          'border-[rgb(var(--color-border-default))]',
          'bg-[rgb(var(--color-bg-secondary))]',
          'shadow-lg transition-all duration-300',
          'hover:bg-[rgb(var(--color-bg-hover))]'
        )}
        aria-label="Open chat panel"
      >
        <span
          className="material-symbols-outlined text-[rgb(var(--color-text-secondary))]"
          style={{ fontSize: '22px' }}
        >
          chat_bubble
        </span>
        {/* Unread indicator dot */}
        <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[rgb(var(--color-primary-500))]" />
      </button>
    );
  }

  return (
    <aside
      className={cn(
        'fixed top-[60px] right-0 bottom-0 z-10 flex flex-col',
        'border-l border-[rgb(var(--color-border-default))]',
        'bg-[rgb(var(--color-bg-surface))]',
        'shadow-xl transition-all duration-300 ease-in-out'
      )}
      style={{ width: `${chatPanelWidth}px` }}
    >
      {/* Chat Panel Header */}
      <header
        className={cn(
          'flex h-14 flex-shrink-0 items-center justify-between',
          'border-b border-[rgb(var(--color-border-default))]',
          'bg-[rgb(var(--color-bg-secondary))] px-4'
        )}
      >
        {/* Left Section: Agent Selector */}
        <div
          className={cn(
            'flex cursor-pointer items-center gap-2.5 rounded-md p-1.5 pr-2.5',
            'transition-colors duration-150',
            'hover:bg-[rgb(var(--color-bg-tertiary))]'
          )}
        >
          {/* Agent Avatar with Status Indicator */}
          <div className="relative h-9 w-9 shrink-0">
            <div
              className="flex h-full w-full items-center justify-center rounded-full text-white"
              style={{ backgroundColor: currentAgent.color }}
            >
              <span style={{ fontSize: '20px' }}>{currentAgent.icon}</span>
            </div>
            {/* Online status dot */}
            <div
              className={cn(
                'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full',
                'border-2 border-[rgb(var(--color-bg-secondary))]',
                'bg-[#2ECC71]'
              )}
            />
          </div>

          <div>
            <p className="text-[15px] font-semibold leading-none text-[rgb(var(--color-text-primary))]">
              {currentAgent.name}
            </p>
            <p className="text-xs text-[#2ECC71]">Online</p>
          </div>

          <span
            className="material-symbols-outlined !text-lg !font-light text-[rgb(var(--color-text-secondary))]"
            style={{ fontSize: '18px' }}
          >
            expand_more
          </span>
        </div>

        {/* Right Section: Action Buttons */}
        <div className="flex items-center gap-1">
          {/* History Button */}
          <button
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md',
              'text-[rgb(var(--color-text-secondary))] transition-colors duration-150',
              'hover:bg-[rgb(var(--color-bg-tertiary))]'
            )}
            aria-label="Chat history"
            onClick={() => {
              // TODO: Implement chat history
              console.log('History clicked');
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              history
            </span>
          </button>

          {/* Minimize Button */}
          <button
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md',
              'text-[rgb(var(--color-text-secondary))] transition-colors duration-150',
              'hover:bg-[rgb(var(--color-bg-tertiary))]'
            )}
            aria-label="Minimize chat panel"
            onClick={toggleChatPanel}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              remove
            </span>
          </button>

          {/* Expand Button (Placeholder) */}
          <button
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md',
              'text-[rgb(var(--color-text-secondary))] transition-colors duration-150',
              'hover:bg-[rgb(var(--color-bg-tertiary))]'
            )}
            aria-label="Expand to full screen"
            onClick={() => {
              // TODO: Implement full screen mode
              console.log('Expand clicked');
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              open_in_full
            </span>
          </button>

          {/* Pop-out Button (Placeholder) */}
          <button
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md',
              'text-[rgb(var(--color-text-secondary))] transition-colors duration-150',
              'hover:bg-[rgb(var(--color-bg-tertiary))]'
            )}
            aria-label="Open in new window"
            onClick={() => {
              // TODO: Implement pop-out window
              console.log('Pop-out clicked');
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              open_in_new
            </span>
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <ChatMessageList
        messages={messages}
        isTyping={isTyping}
        currentAgent={currentAgent}
      />

      {/* Chat Input */}
      <ChatInput onSend={sendMessage} agentName={currentAgent.name} />
    </aside>
  );
}
