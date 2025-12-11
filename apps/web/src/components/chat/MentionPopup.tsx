/**
 * Mention Popup Component
 *
 * Displays a popup with available agents when user types @ in the chat input.
 * Allows quick selection of agents to mention in messages.
 *
 * Story: 15.4 - Connect Chat Panel to Agno Backend
 */

'use client';

import { useEffect, useRef } from 'react';
import { CHAT_AGENTS, type ChatAgent } from './AgentSelector';
import { cn } from '@/lib/utils';

interface MentionPopupProps {
  /** Whether the popup is visible */
  isOpen: boolean;
  /** Filter text after @ symbol */
  filter: string;
  /** Position from bottom of input area */
  position: { bottom: number; left: number };
  /** Currently highlighted index for keyboard navigation */
  highlightedIndex: number;
  /** Callback when an agent is selected */
  onSelect: (agent: ChatAgent) => void;
  /** Callback to close the popup */
  onClose: () => void;
}

export function MentionPopup({
  isOpen,
  filter,
  position,
  highlightedIndex,
  onSelect,
  onClose,
}: MentionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Filter agents based on input
  const filteredAgents = CHAT_AGENTS.filter(
    (agent) =>
      agent.name.toLowerCase().includes(filter.toLowerCase()) ||
      agent.id.toLowerCase().includes(filter.toLowerCase())
  );

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || filteredAgents.length === 0) {
    return null;
  }

  return (
    <div
      ref={popupRef}
      className={cn(
        'absolute z-50 w-56',
        'rounded-lg border border-[rgb(var(--color-border-default))]',
        'bg-[rgb(var(--color-bg-surface))] shadow-lg',
        'animate-in fade-in-0 slide-in-from-bottom-2 duration-200'
      )}
      style={{
        bottom: position.bottom,
        left: position.left,
      }}
    >
      <div className="p-1.5">
        <p className="px-2 py-1 text-xs font-medium text-[rgb(var(--color-text-muted))]">
          Mention an agent
        </p>
        {filteredAgents.map((agent, index) => (
          <button
            key={agent.id}
            type="button"
            onClick={() => onSelect(agent)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5',
              'transition-colors duration-100',
              index === highlightedIndex
                ? 'bg-[rgb(var(--color-bg-muted))]'
                : 'hover:bg-[rgb(var(--color-bg-tertiary))]'
            )}
          >
            {/* Agent Avatar */}
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: agent.color }}
            >
              <span style={{ fontSize: '12px' }}>{agent.icon}</span>
            </div>

            {/* Agent Info */}
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-[rgb(var(--color-text-primary))]">
                @{agent.id}
              </p>
              <p className="text-xs text-[rgb(var(--color-text-muted))]">{agent.name}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Get filtered agents based on mention filter
 */
export function getFilteredAgents(filter: string): ChatAgent[] {
  return CHAT_AGENTS.filter(
    (agent) =>
      agent.name.toLowerCase().includes(filter.toLowerCase()) ||
      agent.id.toLowerCase().includes(filter.toLowerCase())
  );
}
