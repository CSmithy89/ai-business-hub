/**
 * Chat Full Screen Component
 *
 * Full-screen chat modal for mobile devices (<768px).
 * Features:
 * - Full-screen overlay
 * - Floating action button (FAB) trigger
 * - Swipe down to close gesture
 * - Touch-optimized UI
 * - Agent selection
 * - Message streaming support
 *
 * Story: 16-3 - Implement Mobile Layout
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { AgentSelector, CHAT_AGENTS, type ChatAgent } from '@/components/chat/AgentSelector';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatFullScreenProps {
  /** Whether the full-screen modal is open */
  open: boolean;
  /** Callback when modal should close */
  onOpenChange: (open: boolean) => void;
}

const SWIPE_DOWN_THRESHOLD = 100; // pixels

/**
 * Full-screen chat modal for mobile devices
 */
export function ChatFullScreen({ open, onOpenChange }: ChatFullScreenProps) {
  const [selectedAgent, setSelectedAgent] = useState<ChatAgent>(CHAT_AGENTS[0]);
  const { messages, isTyping, isStreaming, sendMessage, stopStreaming, addAgentGreeting } =
    useChatMessages(selectedAgent);

  // Swipe to close state
  const [swipeStartY, setSwipeStartY] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Current agent info
  const currentAgent = {
    name: selectedAgent.name,
    icon: selectedAgent.icon,
    color: selectedAgent.color,
  };

  // Handle agent change with greeting
  const handleAgentChange = (agent: ChatAgent) => {
    if (agent.id !== selectedAgent.id) {
      setSelectedAgent(agent);
      addAgentGreeting(agent);
    }
  };

  // Swipe down to close gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setSwipeStartY(touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeStartY === null) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - swipeStartY;

    // Only allow swipe down from the top area (first 100px)
    if (swipeStartY > 100) return;

    // If swiped down more than threshold, close
    if (deltaY > SWIPE_DOWN_THRESHOLD) {
      onOpenChange(false);
      setSwipeStartY(null);
    }
  };

  const handleTouchEnd = () => {
    setSwipeStartY(null);
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed inset-0 z-50',
        'bg-[rgb(var(--color-bg-surface))]',
        'flex flex-col',
        'animate-in slide-in-from-bottom duration-300'
      )}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe indicator */}
      <div className="flex h-8 items-center justify-center flex-shrink-0">
        <div className="h-1.5 w-12 rounded-full bg-[rgb(var(--color-border-strong))]" />
      </div>

      {/* Header */}
      <div
        className={cn(
          'flex h-14 flex-shrink-0 items-center justify-between',
          'border-b border-[rgb(var(--color-border-default))]',
          'bg-[rgb(var(--color-bg-secondary))] px-4'
        )}
      >
        {/* Agent Selector */}
        <AgentSelector
          selectedAgent={selectedAgent}
          onAgentChange={handleAgentChange}
        />

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 touch-target-min"
          onClick={() => onOpenChange(false)}
          aria-label="Close chat"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages Area - flexible height */}
      <div className="flex-1 overflow-hidden">
        <ChatMessageList
          messages={messages}
          isTyping={isTyping}
          isStreaming={isStreaming}
          currentAgent={currentAgent}
          onStopStreaming={stopStreaming}
        />
      </div>

      {/* Chat Input - fixed at bottom */}
      <ChatInput
        onSend={sendMessage}
        agentName={currentAgent.name}
        disabled={isTyping || isStreaming}
      />
    </div>
  );
}

/**
 * Floating action button (FAB) trigger for chat
 * Fixed position in bottom-right corner on mobile
 */
export function ChatFullScreenFAB({
  onClick,
  unreadCount = 0,
}: {
  onClick: () => void;
  unreadCount?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'fixed bottom-24 right-6 z-30',
        'md:hidden', // Only show on mobile
        'flex h-14 w-14 items-center justify-center',
        'rounded-full shadow-lg',
        'bg-[rgb(var(--color-primary-500))]',
        'hover:bg-[rgb(var(--color-primary-600))]',
        'active:scale-95 transition-all duration-150',
        'touch-target-min'
      )}
      style={{
        // Account for safe area on iOS/Android
        bottom: 'calc(4.5rem + env(safe-area-inset-bottom))',
      }}
      aria-label="Open chat"
    >
      <MessageCircle className="h-6 w-6 text-white" strokeWidth={2} />
      {unreadCount > 0 && (
        <div
          className={cn(
            'absolute -top-1 -right-1',
            'flex h-6 w-6 items-center justify-center',
            'rounded-full bg-[rgb(var(--color-coral-500))]',
            'text-xs font-semibold text-white',
            'shadow-md'
          )}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </button>
  );
}
