/**
 * Chat Bottom Sheet Component
 *
 * Bottom sheet modal for chat panel on tablet devices (768-1024px).
 * Features:
 * - Swipe up to open from tab bar
 * - Swipe down to close
 * - Draggable height adjustment
 * - Touch-optimized UI
 * - Minimum height: 200px, Maximum: 80vh
 *
 * Story: 16-2 - Implement Tablet Layout
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, GripHorizontal } from 'lucide-react';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { AgentSelector, CHAT_AGENTS, type ChatAgent } from '@/components/chat/AgentSelector';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatBottomSheetProps {
  /** Whether the bottom sheet is open */
  open: boolean;
  /** Callback when bottom sheet should close */
  onOpenChange: (open: boolean) => void;
}

const MIN_HEIGHT = 200;
const DEFAULT_HEIGHT = 400;
const MAX_HEIGHT_VH = 80; // 80% of viewport height

/**
 * Chat bottom sheet for tablet devices
 */
export function ChatBottomSheet({ open, onOpenChange }: ChatBottomSheetProps) {
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const [selectedAgent, setSelectedAgent] = useState<ChatAgent>(CHAT_AGENTS[0]);
  const { messages, isTyping, isStreaming, sendMessage, stopStreaming, addAgentGreeting } =
    useChatMessages(selectedAgent);

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

  // Calculate max height based on viewport
  const getMaxHeight = () => {
    if (typeof window === 'undefined') return 600;
    return Math.floor(window.innerHeight * (MAX_HEIGHT_VH / 100));
  };

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartY(clientY);
    setStartHeight(height);
  };

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaY = startY - clientY; // Inverted: dragging up increases height
      const newHeight = Math.max(
        MIN_HEIGHT,
        Math.min(getMaxHeight(), startHeight + deltaY)
      );
      setHeight(newHeight);
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, startY, startHeight]);

  // Swipe down to close gesture
  const handleSwipeDown = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startSwipeY = touch.clientY;

    const handleSwipeMove = (moveEvent: TouchEvent) => {
      const currentY = moveEvent.touches[0].clientY;
      const deltaY = currentY - startSwipeY;

      // If swiped down more than 100px, close
      if (deltaY > 100) {
        onOpenChange(false);
        document.removeEventListener('touchmove', handleSwipeMove);
        document.removeEventListener('touchend', handleSwipeEnd);
      }
    };

    const handleSwipeEnd = () => {
      document.removeEventListener('touchmove', handleSwipeMove);
      document.removeEventListener('touchend', handleSwipeEnd);
    };

    document.addEventListener('touchmove', handleSwipeMove);
    document.addEventListener('touchend', handleSwipeEnd);
  };

  if (!open) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm',
          'animate-in fade-in-0 duration-300'
        )}
        onClick={() => onOpenChange(false)}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-[rgb(var(--color-bg-surface))]',
          'border-t border-[rgb(var(--color-border-default))]',
          'rounded-t-2xl shadow-2xl',
          'flex flex-col',
          'animate-in slide-in-from-bottom duration-300'
        )}
        style={{ height: `${height}px` }}
      >
        {/* Drag Handle */}
        <div
          className={cn(
            'flex items-center justify-center h-8 cursor-row-resize touch-none',
            'border-b border-[rgb(var(--color-border-default))]',
            isDragging && 'bg-[rgb(var(--color-bg-tertiary))]'
          )}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onTouchMove={handleSwipeDown}
        >
          <GripHorizontal className="h-5 w-5 text-[rgb(var(--color-text-muted))]" />
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

        {/* Messages Area */}
        <ChatMessageList
          messages={messages}
          isTyping={isTyping}
          isStreaming={isStreaming}
          currentAgent={currentAgent}
          onStopStreaming={stopStreaming}
        />

        {/* Chat Input */}
        <ChatInput
          onSend={sendMessage}
          agentName={currentAgent.name}
          disabled={isTyping || isStreaming}
        />
      </div>
    </>
  );
}

/**
 * Floating action button trigger for chat
 * Should be placed in a fixed position on tablet
 */
export function ChatBottomSheetTrigger({
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
        'fixed bottom-6 right-6 z-30',
        'flex h-14 w-14 items-center justify-center',
        'rounded-full shadow-lg',
        'bg-[rgb(var(--color-primary-500))]',
        'hover:bg-[rgb(var(--color-primary-600))]',
        'active:scale-95 transition-all duration-150',
        'touch-target-min'
      )}
      aria-label="Open chat"
    >
      <MessageCircle className="h-6 w-6 text-white" />
      {unreadCount > 0 && (
        <div
          className={cn(
            'absolute -top-1 -right-1',
            'flex h-6 w-6 items-center justify-center',
            'rounded-full bg-[rgb(var(--color-coral-500))]',
            'text-xs font-medium text-white'
          )}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </button>
  );
}
