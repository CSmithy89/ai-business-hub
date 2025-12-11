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
 * - Agent selector dropdown
 *
 * Updated: Story 15.4 - Connect Chat Panel to Agno Backend
 */

'use client';

import { useState } from 'react';
import {
  MessageCircle,
  History,
  Minus,
  Maximize2,
  ExternalLink,
} from 'lucide-react';
import { useUIStore } from '@/stores/ui';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { AgentSelector, CHAT_AGENTS, type ChatAgent } from '@/components/chat/AgentSelector';
import { cn } from '@/lib/utils';

export function ChatPanel() {
  const { chatPanelOpen, chatPanelWidth, toggleChatPanel } = useUIStore();
  const [selectedAgent, setSelectedAgent] = useState<ChatAgent>(CHAT_AGENTS[0]);
  const { messages, isTyping, sendMessage } = useChatMessages(selectedAgent);

  // Current agent info (from selected agent)
  const currentAgent = {
    name: selectedAgent.name,
    icon: selectedAgent.icon,
    color: selectedAgent.color,
  };

  // Handle agent change with greeting
  const handleAgentChange = (agent: ChatAgent) => {
    setSelectedAgent(agent);
    // TODO: Send agent greeting message when agent changes
  };

  // Collapsed state - show icon button
  if (!chatPanelOpen) {
    return (
      <button
        type="button"
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
        <MessageCircle className="h-5 w-5 text-[rgb(var(--color-text-secondary))]" />
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
        <AgentSelector
          selectedAgent={selectedAgent}
          onAgentChange={handleAgentChange}
        />

        {/* Right Section: Action Buttons */}
        <div className="flex items-center gap-1">
          {/* History Button */}
          <button
            type="button"
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md',
              'text-[rgb(var(--color-text-secondary))] transition-colors duration-150',
              'hover:bg-[rgb(var(--color-bg-tertiary))]'
            )}
            aria-label="Chat history"
            onClick={() => {
              // TODO: Implement chat history panel
            }}
          >
            <History className="h-5 w-5" />
          </button>

          {/* Minimize Button */}
          <button
            type="button"
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md',
              'text-[rgb(var(--color-text-secondary))] transition-colors duration-150',
              'hover:bg-[rgb(var(--color-bg-tertiary))]'
            )}
            aria-label="Minimize chat panel"
            onClick={toggleChatPanel}
          >
            <Minus className="h-5 w-5" />
          </button>

          {/* Expand Button (Placeholder) */}
          <button
            type="button"
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md',
              'text-[rgb(var(--color-text-secondary))] transition-colors duration-150',
              'hover:bg-[rgb(var(--color-bg-tertiary))]'
            )}
            aria-label="Expand to full screen"
            onClick={() => {
              // TODO: Implement full screen mode
            }}
          >
            <Maximize2 className="h-5 w-5" />
          </button>

          {/* Pop-out Button (Placeholder) */}
          <button
            type="button"
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md',
              'text-[rgb(var(--color-text-secondary))] transition-colors duration-150',
              'hover:bg-[rgb(var(--color-bg-tertiary))]'
            )}
            aria-label="Open in new window"
            onClick={() => {
              // TODO: Implement pop-out window
            }}
          >
            <ExternalLink className="h-5 w-5" />
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
