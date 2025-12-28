/**
 * Agent Panel Component
 *
 * Story: PM-12.1 - Agent UI Components
 *
 * Collapsible chat interface for interacting with PM agents.
 * Features agent selector, message history, and real-time streaming responses.
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  Bot,
  User,
  Square,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAgentChat, type ChatMessage } from '@/hooks/use-agent-chat';
import {
  AGENT_CONFIG,
  type AgentName,
  getAgentConfig,
} from './constants';

// ============================================================================
// Types
// ============================================================================

interface AgentPanelProps {
  projectId: string;
  defaultAgent?: AgentName;
  collapsed?: boolean;
  onSuggestionCreated?: (suggestion: unknown) => void;
  className?: string;
}

interface MessageBubbleProps {
  message: ChatMessage;
  agentName: AgentName;
}

// ============================================================================
// Message Bubble Component
// ============================================================================

function MessageBubble({ message, agentName }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const config = getAgentConfig(agentName);

  return (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-lg',
        isUser ? 'bg-muted/50' : cn(config.bgColor, config.borderColor, 'border')
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary' : config.badgeColor
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <config.Icon className={cn('w-4 h-4', config.iconColor)} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">
            {isUser ? 'You' : config.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.timestamp), 'h:mm a')}
          </span>
          {message.isStreaming && (
            <Badge variant="secondary" className="text-xs">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Thinking...
            </Badge>
          )}
        </div>
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content || (
            <span className="text-muted-foreground italic">
              <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
              Generating response...
            </span>
          )}
        </div>
        {message.error && (
          <p className="mt-1 text-xs text-destructive">
            Failed to send. Click retry to try again.
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Agent Selector Component
// ============================================================================

interface AgentSelectorProps {
  selected: AgentName;
  onSelect: (agent: AgentName) => void;
  disabled?: boolean;
}

function AgentSelector({ selected, onSelect, disabled }: AgentSelectorProps) {
  const config = getAgentConfig(selected);
  const agentNames = Object.keys(AGENT_CONFIG) as AgentName[];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2"
          disabled={disabled}
        >
          <config.Icon className={cn('w-4 h-4', config.iconColor)} />
          <span>{config.name}</span>
          <Badge variant="secondary" className="text-xs">
            {config.role}
          </Badge>
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {agentNames.map((name) => {
          const agentConfig = AGENT_CONFIG[name];
          return (
            <DropdownMenuItem
              key={name}
              onClick={() => onSelect(name)}
              className={cn(
                'gap-3 cursor-pointer',
                name === selected && 'bg-accent'
              )}
            >
              <agentConfig.Icon className={cn('w-4 h-4', agentConfig.iconColor)} />
              <div className="flex-1">
                <div className="font-medium">{agentConfig.name}</div>
                <div className="text-xs text-muted-foreground">
                  {agentConfig.role}
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Inline Chat Panel (Collapsible)
// ============================================================================

interface InlinePanelProps extends AgentPanelProps {
  selectedAgent: AgentName;
  onAgentChange: (agent: AgentName) => void;
}

function InlinePanel({
  projectId,
  selectedAgent,
  onAgentChange,
  collapsed: initialCollapsed = true,
  className,
}: InlinePanelProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    stopStreaming,
  } = useAgentChat(projectId, selectedAgent);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when expanded
  useEffect(() => {
    if (!collapsed && inputRef.current) {
      inputRef.current.focus();
    }
  }, [collapsed]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isLoading || isStreaming) return;
    sendMessage(inputValue.trim());
    setInputValue('');
  }, [inputValue, isLoading, isStreaming, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const config = getAgentConfig(selectedAgent);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader
        className={cn(
          'cursor-pointer transition-colors hover:bg-muted/50',
          config.bgColor
        )}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.badgeColor)}>
              <config.Icon className={cn('w-5 h-5', config.iconColor)} />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {config.name}
                <Badge variant="outline" className="text-xs font-normal">
                  {config.role}
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {collapsed ? 'Click to chat' : config.description}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            {collapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="p-0">
          {/* Agent Selector */}
          <div className="p-3 border-b">
            <AgentSelector
              selected={selectedAgent}
              onSelect={onAgentChange}
              disabled={isLoading || isStreaming}
            />
          </div>

          {/* Messages */}
          <ScrollArea className="h-[300px] p-4" ref={scrollRef}>
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">{config.greeting}</p>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    agentName={selectedAgent}
                  />
                ))
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${config.name}...`}
                disabled={isLoading}
                className="flex-1"
              />
              {isStreaming ? (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={stopStreaming}
                  title="Stop generating"
                >
                  <Square className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  title="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ============================================================================
// Sheet Panel (Mobile/Overlay)
// ============================================================================

interface SheetPanelProps extends AgentPanelProps {
  selectedAgent: AgentName;
  onAgentChange: (agent: AgentName) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SheetPanel({
  projectId,
  selectedAgent,
  onAgentChange,
  open,
  onOpenChange,
}: SheetPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    stopStreaming,
  } = useAgentChat(projectId, selectedAgent);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isLoading || isStreaming) return;
    sendMessage(inputValue.trim());
    setInputValue('');
  }, [inputValue, isLoading, isStreaming, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const config = getAgentConfig(selectedAgent);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className={cn('p-4 border-b', config.bgColor)}>
          <SheetTitle className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.badgeColor)}>
              <config.Icon className={cn('w-5 h-5', config.iconColor)} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {config.name}
                <Badge variant="outline" className="text-xs font-normal">
                  {config.role}
                </Badge>
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Agent Selector */}
        <div className="p-3 border-b">
          <AgentSelector
            selected={selectedAgent}
            onSelect={onAgentChange}
            disabled={isLoading || isStreaming}
          />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">{config.greeting}</p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  agentName={selectedAgent}
                />
              ))
            )}
          </div>
        </div>

        {/* Input */}
        <div className="p-3 border-t mt-auto">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${config.name}...`}
              disabled={isLoading}
              className="flex-1"
            />
            {isStreaming ? (
              <Button
                variant="destructive"
                size="icon"
                onClick={stopStreaming}
                title="Stop generating"
              >
                <Square className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                title="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// Main Agent Panel Component
// ============================================================================

/**
 * Agent Panel Component
 *
 * Provides a chat interface for interacting with PM agents.
 * Supports both inline (collapsible card) and overlay (sheet) modes.
 *
 * @param projectId - Project ID for context
 * @param defaultAgent - Initial agent to select (default: 'navi')
 * @param collapsed - Start collapsed (default: true)
 * @param onSuggestionCreated - Callback when agent creates a suggestion
 * @param className - Additional CSS classes
 *
 * @example
 * ```tsx
 * <AgentPanel projectId="proj_123" defaultAgent="sage" />
 * ```
 */
export function AgentPanel({
  projectId,
  defaultAgent = 'navi',
  collapsed = true,
  onSuggestionCreated,
  className,
}: AgentPanelProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentName>(defaultAgent);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleAgentChange = (agent: AgentName) => {
    setSelectedAgent(agent);
  };

  return (
    <>
      {/* Desktop: Inline panel */}
      <div className={cn('hidden md:block', className)}>
        <InlinePanel
          projectId={projectId}
          selectedAgent={selectedAgent}
          onAgentChange={handleAgentChange}
          collapsed={collapsed}
          onSuggestionCreated={onSuggestionCreated}
        />
      </div>

      {/* Mobile: FAB + Sheet */}
      <div className="md:hidden">
        <Button
          size="lg"
          className={cn(
            'fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg z-50',
            getAgentConfig(selectedAgent).badgeColor
          )}
          onClick={() => setSheetOpen(true)}
        >
          <MessageSquare className="w-6 h-6" />
        </Button>

        <SheetPanel
          projectId={projectId}
          selectedAgent={selectedAgent}
          onAgentChange={handleAgentChange}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onSuggestionCreated={onSuggestionCreated}
        />
      </div>
    </>
  );
}

/**
 * Standalone trigger button for opening agent panel sheet.
 * Useful for integrating in toolbars or menus.
 */
export function AgentPanelTrigger({
  projectId,
  defaultAgent = 'navi',
  className,
}: Pick<AgentPanelProps, 'projectId' | 'defaultAgent' | 'className'>) {
  const [selectedAgent, setSelectedAgent] = useState<AgentName>(defaultAgent);
  const [open, setOpen] = useState(false);
  const config = getAgentConfig(selectedAgent);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn('gap-2', className)}
        onClick={() => setOpen(true)}
      >
        <config.Icon className={cn('w-4 h-4', config.iconColor)} />
        <span>Chat with {config.name}</span>
      </Button>

      <SheetPanel
        projectId={projectId}
        selectedAgent={selectedAgent}
        onAgentChange={setSelectedAgent}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
