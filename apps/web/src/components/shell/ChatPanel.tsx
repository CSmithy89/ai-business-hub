/**
 * Chat Panel Component
 *
 * Persistent AI chat interface with multiple position options.
 * Features:
 * - Position 1: Right Panel (default) - Full height on right side
 * - Position 2: Bottom Horizontal - Docked at bottom, full width
 * - Position 3: Floating Window - Draggable, resizable
 * - Position 4: Collapsed - Minimized to floating action button
 * - Message display (user, agent, system)
 * - Streaming typing indicators
 * - Auto-scroll message list
 * - Input area with @mention support
 * - Agent selector dropdown
 *
 * Story 07.1: Create Dashboard Layout Component
 * Story 15.4: Connect Chat Panel to Agno Backend
 * Story 15.12: Implement Chat Panel Position Options
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  History,
  Minus,
  Maximize2,
  PanelRight,
  PanelBottom,
  Move,
  Pin,
  PinOff,
} from 'lucide-react';
import { useUIStore, type ChatPanelPosition } from '@/stores/ui';
import { useChatPosition } from '@/hooks/use-chat-position';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { AgentSelector, CHAT_AGENTS, type ChatAgent } from '@/components/chat/AgentSelector';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { LAYOUT } from '@/lib/layout-constants';

/**
 * Position button component with tooltip
 */
function PositionButton({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md',
            'text-[rgb(var(--color-text-secondary))] transition-colors duration-150',
            isActive
              ? 'bg-[rgb(var(--color-bg-tertiary))] text-[rgb(var(--color-text-primary))]'
              : 'hover:bg-[rgb(var(--color-bg-tertiary))]'
          )}
          aria-label={label}
          aria-pressed={isActive}
          onClick={onClick}
        >
          <Icon className="h-5 w-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function ChatPanel() {
  const { chatPanelWidth, chatPanelHeight, floatingPosition, setFloatingPosition, sidebarCollapsed } = useUIStore();
  const {
    isCollapsed,
    isFloating,
    isBottom,
    isRight,
    setPosition,
    toggle,
    isMobile,
  } = useChatPosition();

  const [selectedAgent, setSelectedAgent] = useState<ChatAgent>(CHAT_AGENTS[0]);
  const { messages, isTyping, isStreaming, sendMessage, stopStreaming, addAgentGreeting } =
    useChatMessages(selectedAgent);

  // Refs for drag functionality
  const panelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Current agent info (from selected agent)
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

  // Position change handlers
  const handlePositionChange = (newPosition: ChatPanelPosition) => {
    setPosition(newPosition);
  };

  // Drag handlers for floating panel
  const handleDragStart = (e: React.MouseEvent) => {
    if (floatingPosition.isPinned) return;
    isDragging.current = true;
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newX = Math.max(0, e.clientX - dragOffset.current.x);
      const newY = Math.max(60, e.clientY - dragOffset.current.y); // 60px for header
      setFloatingPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setFloatingPosition]);

  // Toggle pin for floating panel
  const togglePin = () => {
    setFloatingPosition({ isPinned: !floatingPosition.isPinned });
  };

  // Collapsed state - show floating action button
  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center',
          'justify-center rounded-full shadow-lg transition-all duration-300',
          'bg-[rgb(var(--color-primary-500))]',
          'hover:bg-[rgb(var(--color-primary-600))]',
          'hover:scale-105 active:scale-95'
        )}
        aria-label="Open chat panel (Ctrl+Shift+C)"
      >
        <MessageCircle className="h-6 w-6 text-white" />
        {/* Unread indicator badge */}
        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[rgb(var(--color-coral-500))] text-xs font-medium text-white">
          2
        </div>
      </button>
    );
  }

  // Mobile full-screen modal
  if (isMobile) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex flex-col',
          'bg-[rgb(var(--color-bg-surface))]'
        )}
      >
        {/* Mobile Header */}
        <header
          className={cn(
            'flex h-14 flex-shrink-0 items-center justify-between',
            'border-b border-[rgb(var(--color-border-default))]',
            'bg-[rgb(var(--color-bg-secondary))] px-4'
          )}
        >
          <AgentSelector
            selectedAgent={selectedAgent}
            onAgentChange={handleAgentChange}
          />
          <button
            type="button"
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md',
              'text-[rgb(var(--color-text-secondary))] transition-colors duration-150',
              'hover:bg-[rgb(var(--color-bg-tertiary))]'
            )}
            aria-label="Close chat"
            onClick={toggle}
          >
            <Minus className="h-5 w-5" />
          </button>
        </header>
        <ChatMessageList
          messages={messages}
          isTyping={isTyping}
          isStreaming={isStreaming}
          currentAgent={currentAgent}
          onStopStreaming={stopStreaming}
        />
        <ChatInput
          onSend={sendMessage}
          agentName={currentAgent.name}
          disabled={isTyping || isStreaming}
        />
      </div>
    );
  }

  // Common header content
  const headerContent = (
    <>
      {/* Left Section: Agent Selector */}
      <AgentSelector
        selectedAgent={selectedAgent}
        onAgentChange={handleAgentChange}
      />

      {/* Right Section: Position Buttons + Actions */}
      <div className="flex items-center gap-1">
        {/* Position Buttons */}
        <div className="flex items-center gap-0.5 mr-2 border-r border-[rgb(var(--color-border-default))] pr-2">
          <PositionButton
            icon={PanelRight}
            label="Right panel"
            isActive={isRight}
            onClick={() => handlePositionChange('right')}
          />
          <PositionButton
            icon={PanelBottom}
            label="Bottom panel"
            isActive={isBottom}
            onClick={() => handlePositionChange('bottom')}
          />
          <PositionButton
            icon={Move}
            label="Floating window"
            isActive={isFloating}
            onClick={() => handlePositionChange('floating')}
          />
        </div>

        {/* Floating-specific: Pin button */}
        {isFloating && (
          <PositionButton
            icon={floatingPosition.isPinned ? PinOff : Pin}
            label={floatingPosition.isPinned ? 'Unpin window' : 'Pin window'}
            isActive={floatingPosition.isPinned}
            onClick={togglePin}
          />
        )}

        {/* History Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md',
                'text-[rgb(var(--color-text-secondary))] transition-colors duration-150',
                'hover:bg-[rgb(var(--color-bg-tertiary))]'
              )}
              aria-label="Chat history"
            >
              <History className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Chat history</p>
          </TooltipContent>
        </Tooltip>

        {/* Expand/Maximize Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md',
                'text-[rgb(var(--color-text-secondary))] transition-colors duration-150',
                'hover:bg-[rgb(var(--color-bg-tertiary))]'
              )}
              aria-label="Expand to full screen"
            >
              <Maximize2 className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Full screen</p>
          </TooltipContent>
        </Tooltip>

        {/* Minimize Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md',
                'text-[rgb(var(--color-text-secondary))] transition-colors duration-150',
                'hover:bg-[rgb(var(--color-bg-tertiary))]'
              )}
              aria-label="Minimize (Ctrl+Shift+C)"
              onClick={toggle}
            >
              <Minus className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Minimize (Ctrl+Shift+C)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </>
  );

  // Floating window position
  if (isFloating) {
    return (
      <aside
        ref={panelRef}
        className={cn(
          'fixed z-50 flex flex-col',
          'border border-[rgb(var(--color-border-default))]',
          'bg-[rgb(var(--color-bg-surface))]',
          'rounded-lg shadow-2xl',
          'transition-shadow duration-300'
        )}
        style={{
          left: `${floatingPosition.x}px`,
          top: `${floatingPosition.y}px`,
          width: `${floatingPosition.width}px`,
          height: `${floatingPosition.height}px`,
        }}
      >
        {/* Draggable Header */}
        <header
          className={cn(
            'flex h-12 flex-shrink-0 items-center justify-between',
            'border-b border-[rgb(var(--color-border-default))]',
            'bg-[rgb(var(--color-bg-secondary))] px-3 rounded-t-lg',
            !floatingPosition.isPinned && 'cursor-grab active:cursor-grabbing'
          )}
          onMouseDown={handleDragStart}
        >
          {headerContent}
        </header>

        <ChatMessageList
          messages={messages}
          isTyping={isTyping}
          isStreaming={isStreaming}
          currentAgent={currentAgent}
          onStopStreaming={stopStreaming}
        />

        <ChatInput
          onSend={sendMessage}
          agentName={currentAgent.name}
          disabled={isTyping || isStreaming}
        />
      </aside>
    );
  }

  // Bottom horizontal position - vertical layout like standard chat
  if (isBottom) {
    // Calculate sidebar width based on collapsed state
    const sidebarWidth = sidebarCollapsed
      ? LAYOUT.SIDEBAR_COLLAPSED_WIDTH
      : LAYOUT.SIDEBAR_EXPANDED_WIDTH;

    return (
      <aside
        className={cn(
          'fixed right-0 bottom-0 z-40 flex flex-col',
          'border-t border-l border-[rgb(var(--color-border-default))]',
          'bg-[rgb(var(--color-bg-surface))]',
          'shadow-xl transition-all duration-300 ease-in-out'
        )}
        style={{
          height: `${chatPanelHeight}px`,
          left: `${sidebarWidth}px`, // Dynamic sidebar width to not cover sidebar
        }}
      >
        {/* Header */}
        <header
          className={cn(
            'flex h-12 flex-shrink-0 items-center justify-between',
            'border-b border-[rgb(var(--color-border-default))]',
            'bg-[rgb(var(--color-bg-secondary))] px-4'
          )}
        >
          {headerContent}
        </header>

        {/* Vertical layout - messages above, input below (standard chat layout) */}
        <ChatMessageList
          messages={messages}
          isTyping={isTyping}
          isStreaming={isStreaming}
          currentAgent={currentAgent}
          onStopStreaming={stopStreaming}
        />
        <ChatInput
          onSend={sendMessage}
          agentName={currentAgent.name}
          disabled={isTyping || isStreaming}
        />
      </aside>
    );
  }

  // Default: Right panel position
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
        {headerContent}
      </header>

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
    </aside>
  );
}
