/**
 * Agent Selector Component
 *
 * Dropdown selector for choosing which AI agent to chat with.
 * Displays agent avatar, name, role, and online status.
 *
 * Story: 15.4 - Connect Chat Panel to Agno Backend
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatAgent {
  id: string;
  name: string;
  icon: string;
  color: string;
  role: string;
  status?: 'online' | 'busy' | 'offline';
  /** Greeting message shown when switching to this agent */
  greeting: string;
}

/**
 * Default chat agents available in the system
 */
export const CHAT_AGENTS: ChatAgent[] = [
  {
    id: 'hub',
    name: 'Hub',
    icon: '🎯',
    color: '#FF6B6B',
    role: 'Orchestrator',
    status: 'online',
    greeting:
      "Hello! I'm Hub, your AI orchestrator. I can help coordinate tasks, answer questions, and connect you with specialized agents. How can I assist you today?",
  },
  {
    id: 'maya',
    name: 'Maya',
    icon: '👥',
    color: '#2DD4BF',
    role: 'CRM & Relationships',
    status: 'online',
    greeting:
      "Hi there! I'm Maya, your CRM specialist. I can help you manage customer relationships, track interactions, and nurture leads. What would you like to work on?",
  },
  {
    id: 'atlas',
    name: 'Atlas',
    icon: '🧭',
    color: '#3B82F6',
    role: 'Projects & Tasks',
    status: 'online',
    greeting:
      "Hey! I'm Atlas, your project management expert. I can help you organize tasks, track deadlines, and keep your projects on track. What can I help you plan?",
  },
  {
    id: 'nova',
    name: 'Nova',
    icon: '✨',
    color: '#A855F7',
    role: 'Marketing & Content',
    status: 'online',
    greeting:
      "Hello! I'm Nova, your marketing and content specialist. I can help with content creation, campaign planning, and brand messaging. What shall we create together?",
  },
  {
    id: 'echo',
    name: 'Echo',
    icon: '📊',
    color: '#22C55E',
    role: 'Analytics & Insights',
    status: 'online',
    greeting:
      "Hi! I'm Echo, focused on analytics and insights. I can help you understand data, generate reports, and surface actionable insights. What metrics would you like to explore?",
  },
  // PM-specific agents (bm-pm module)
  {
    id: 'navi',
    name: 'Navi',
    icon: '🧭',
    color: '#6366F1',
    role: 'Project Navigator',
    status: 'online',
    greeting:
      "Hi! I'm Navi, your project navigator. I specialize in task routing, phase transitions, and keeping your project workflow smooth. What project would you like to navigate?",
  },
  {
    id: 'sage',
    name: 'Sage',
    icon: '🔮',
    color: '#0EA5E9',
    role: 'Domain Expert',
    status: 'online',
    greeting:
      "Hello! I'm Sage, your domain expert. I provide technical guidance, best practices, and deep expertise for your project's domain. What technical challenge can I help with?",
  },
  {
    id: 'chrono',
    name: 'Chrono',
    icon: '⏱️',
    color: '#F59E0B',
    role: 'Timeline Analyst',
    status: 'online',
    greeting:
      "Greetings! I'm Chrono, your timeline analyst. I focus on scheduling, dependencies, and ensuring your project stays on track. How can I help with your timeline?",
  },
  // KB-specific agent (bm-kb module)
  {
    id: 'scribe',
    name: 'Scribe',
    icon: '📚',
    color: '#EC4899',
    role: 'Knowledge Specialist',
    status: 'online',
    greeting:
      "Hi! I'm Scribe, your knowledge base specialist. I can help verify content, manage documentation, and ensure your knowledge stays accurate and up-to-date. What would you like to document?",
  },
];

interface AgentSelectorProps {
  selectedAgent: ChatAgent;
  onAgentChange: (agent: ChatAgent) => void;
  agents?: ChatAgent[];
}

export function AgentSelector({
  selectedAgent,
  onAgentChange,
  agents = CHAT_AGENTS,
}: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleAgentSelect = (agent: ChatAgent) => {
    onAgentChange(agent);
    setIsOpen(false);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
      default:
        // Default to gray/offline for unknown or undefined statuses
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'busy':
        return 'Busy';
      case 'offline':
      default:
        // Default to offline for unknown or undefined statuses
        return 'Offline';
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex cursor-pointer items-center gap-2.5 rounded-md p-1.5 pr-2.5',
          'transition-colors duration-150',
          'hover:bg-[rgb(var(--color-bg-tertiary))]'
        )}
        aria-label={`Select AI agent. Current: ${selectedAgent.name}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {/* Agent Avatar with Status Indicator */}
        <div className="relative h-9 w-9 shrink-0">
          <div
            className="flex h-full w-full items-center justify-center rounded-full text-white"
            style={{ backgroundColor: selectedAgent.color }}
          >
            <span style={{ fontSize: '20px' }}>{selectedAgent.icon}</span>
          </div>
          {/* Online status dot */}
          <div
            className={cn(
              'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full',
              'border-2 border-[rgb(var(--color-bg-secondary))]',
              getStatusColor(selectedAgent.status)
            )}
          />
        </div>

        <div className="text-left">
          <p className="text-[15px] font-semibold leading-none text-[rgb(var(--color-text-primary))]">
            {selectedAgent.name}
          </p>
          <p
            className={cn(
              'text-xs',
              selectedAgent.status === 'online'
                ? 'text-green-500'
                : selectedAgent.status === 'busy'
                  ? 'text-yellow-500'
                  : 'text-gray-400'
            )}
          >
            {getStatusText(selectedAgent.status)}
          </p>
        </div>

        <ChevronDown
          className={cn(
            'h-4 w-4 text-[rgb(var(--color-text-secondary))] transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute left-0 top-full z-50 mt-1 w-64',
            'rounded-lg border border-[rgb(var(--color-border-default))]',
            'bg-[rgb(var(--color-bg-surface))] shadow-lg',
            'animate-in fade-in-0 zoom-in-95 duration-200'
          )}
          role="listbox"
        >
          <div className="p-2">
            <p className="px-2 py-1.5 text-xs font-medium text-[rgb(var(--color-text-muted))]">
              Select an Agent
            </p>
            {agents.map((agent) => {
              const isSelected = agent.id === selectedAgent.id;
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => handleAgentSelect(agent)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md p-2',
                    'transition-colors duration-150',
                    isSelected
                      ? 'bg-[rgb(var(--color-bg-muted))]'
                      : 'hover:bg-[rgb(var(--color-bg-tertiary))]'
                  )}
                  role="option"
                  aria-selected={isSelected}
                >
                  {/* Agent Avatar */}
                  <div className="relative h-8 w-8 shrink-0">
                    <div
                      className="flex h-full w-full items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: agent.color }}
                    >
                      <span style={{ fontSize: '16px' }}>{agent.icon}</span>
                    </div>
                    <div
                      className={cn(
                        'absolute bottom-0 right-0 h-2 w-2 rounded-full',
                        'border-2 border-[rgb(var(--color-bg-surface))]',
                        getStatusColor(agent.status)
                      )}
                    />
                  </div>

                  {/* Agent Info */}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-[rgb(var(--color-text-primary))]">
                      {agent.name}
                    </p>
                    <p className="text-xs text-[rgb(var(--color-text-muted))]">{agent.role}</p>
                  </div>

                  {/* Selected Checkmark */}
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
