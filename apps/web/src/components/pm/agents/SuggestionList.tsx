/**
 * Suggestion List Component
 *
 * Story: PM-12.1 - Agent UI Components
 *
 * Container component for listing pending suggestions with filtering,
 * empty state handling, and tabbed interface for different statuses.
 */

'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Lightbulb,
  Bell,
  Loader2,
  Filter,
  ChevronDown,
  Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSuggestions } from '@/hooks/use-suggestions';
import { SuggestionCard, type Suggestion } from './SuggestionCard';
import {
  AGENT_CONFIG,
  type AgentName,
  type SuggestionType,
  suggestionTypeLabels,
  getAgentConfig,
} from './constants';

// ============================================================================
// Types
// ============================================================================

interface SuggestionListProps {
  projectId: string;
  className?: string;
}

interface SuggestionListPanelProps extends SuggestionListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FilterType = 'all' | SuggestionType;
type FilterAgent = 'all' | AgentName;

// ============================================================================
// Filter Components
// ============================================================================

interface FilterBarProps {
  typeFilter: FilterType;
  agentFilter: FilterAgent;
  onTypeChange: (type: FilterType) => void;
  onAgentChange: (agent: FilterAgent) => void;
}

function FilterBar({
  typeFilter,
  agentFilter,
  onTypeChange,
  onAgentChange,
}: FilterBarProps) {
  const typeLabel = typeFilter === 'all'
    ? 'All Types'
    : suggestionTypeLabels[typeFilter] || typeFilter;

  const agentLabel = agentFilter === 'all'
    ? 'All Agents'
    : getAgentConfig(agentFilter).name;

  return (
    <div className="flex items-center gap-2 p-3 border-b">
      <Filter className="w-4 h-4 text-muted-foreground" />

      {/* Type Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            {typeLabel}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onTypeChange('all')}>
            All Types
          </DropdownMenuItem>
          {(Object.keys(suggestionTypeLabels) as SuggestionType[]).map((type) => (
            <DropdownMenuItem key={type} onClick={() => onTypeChange(type)}>
              {suggestionTypeLabels[type]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Agent Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            {agentFilter !== 'all' && (
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getAgentConfig(agentFilter).color }}
              />
            )}
            {agentLabel}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onAgentChange('all')}>
            All Agents
          </DropdownMenuItem>
          {(Object.keys(AGENT_CONFIG) as AgentName[]).map((name) => {
            const config = AGENT_CONFIG[name];
            return (
              <DropdownMenuItem key={name} onClick={() => onAgentChange(name)}>
                <span
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: config.color }}
                />
                {config.name}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

interface EmptyStateProps {
  type: 'pending' | 'snoozed' | 'resolved';
}

function EmptyState({ type }: EmptyStateProps) {
  const messages = {
    pending: {
      title: 'No pending suggestions',
      description: 'AI agents will suggest actions as they analyze your project.',
    },
    snoozed: {
      title: 'No snoozed suggestions',
      description: 'Snoozed suggestions will appear here.',
    },
    resolved: {
      title: 'No resolved suggestions',
      description: 'Accepted and rejected suggestions will appear here.',
    },
  };

  const { title, description } = messages[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox className="w-12 h-12 text-muted-foreground/50 mb-4" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">{description}</p>
    </div>
  );
}

// ============================================================================
// Suggestion List Content
// ============================================================================

interface ListContentProps {
  suggestions: Suggestion[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onSnooze: (id: string, hours: number) => void;
  isLoading: boolean;
  actionLoading?: string | null;
  emptyType: 'pending' | 'snoozed' | 'resolved';
  readOnly?: boolean;
}

function ListContent({
  suggestions,
  onAccept,
  onReject,
  onSnooze,
  isLoading,
  actionLoading,
  emptyType,
  readOnly,
}: ListContentProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return <EmptyState type={emptyType} />;
  }

  return (
    <div className="space-y-3 p-4">
      {suggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          onAccept={() => onAccept(suggestion.id)}
          onReject={() => onReject(suggestion.id)}
          onSnooze={(hours) => onSnooze(suggestion.id, hours)}
          isLoading={actionLoading === suggestion.id}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Suggestion List Panel (Sheet)
// ============================================================================

/**
 * Suggestion List Panel
 *
 * Slide-out panel with tabbed interface for viewing and managing
 * suggestions by status (Pending, Snoozed, Resolved).
 */
export function SuggestionListPanel({
  projectId,
  open,
  onOpenChange,
  className,
}: SuggestionListPanelProps) {
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [agentFilter, setAgentFilter] = useState<FilterAgent>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const {
    sortedPendingSuggestions,
    snoozedSuggestions,
    resolvedSuggestions,
    isLoading,
    acceptMutation,
    rejectMutation,
    snoozeMutation,
  } = useSuggestions(projectId);

  // Apply filters
  const filterSuggestions = (suggestions: Suggestion[]) => {
    return suggestions.filter((s) => {
      if (typeFilter !== 'all' && s.type !== typeFilter) return false;
      if (agentFilter !== 'all' && s.sourceAgent !== agentFilter) return false;
      return true;
    });
  };

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    try {
      await acceptMutation.mutateAsync(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await rejectMutation.mutateAsync({ suggestionId: id });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSnooze = async (id: string, hours: number) => {
    setActionLoading(id);
    try {
      await snoozeMutation.mutateAsync({ suggestionId: id, hours });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn('w-full sm:max-w-lg p-0 flex flex-col', className)}
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Suggestions
            {sortedPendingSuggestions.length > 0 && (
              <Badge variant="secondary">{sortedPendingSuggestions.length}</Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Review and manage AI-generated suggestions for your project.
          </SheetDescription>
        </SheetHeader>

        <FilterBar
          typeFilter={typeFilter}
          agentFilter={agentFilter}
          onTypeChange={setTypeFilter}
          onAgentChange={setAgentFilter}
        />

        <Tabs defaultValue="pending" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-2" style={{ width: 'calc(100% - 32px)' }}>
            <TabsTrigger value="pending" className="gap-1">
              Pending
              {filterSuggestions(sortedPendingSuggestions).length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {filterSuggestions(sortedPendingSuggestions).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="snoozed" className="gap-1">
              Snoozed
              {filterSuggestions(snoozedSuggestions).length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {filterSuggestions(snoozedSuggestions).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <ListContent
                suggestions={filterSuggestions(sortedPendingSuggestions)}
                onAccept={handleAccept}
                onReject={handleReject}
                onSnooze={handleSnooze}
                isLoading={isLoading}
                actionLoading={actionLoading}
                emptyType="pending"
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="snoozed" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <ListContent
                suggestions={filterSuggestions(snoozedSuggestions)}
                onAccept={handleAccept}
                onReject={handleReject}
                onSnooze={handleSnooze}
                isLoading={isLoading}
                actionLoading={actionLoading}
                emptyType="snoozed"
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="resolved" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <ListContent
                suggestions={filterSuggestions(resolvedSuggestions)}
                onAccept={handleAccept}
                onReject={handleReject}
                onSnooze={handleSnooze}
                isLoading={isLoading}
                actionLoading={actionLoading}
                emptyType="resolved"
                readOnly
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// Suggestion List Trigger
// ============================================================================

/**
 * Trigger button for opening the suggestion list panel.
 * Shows pending count badge.
 */
export function SuggestionListTrigger({
  projectId,
  className,
}: SuggestionListProps) {
  const [open, setOpen] = useState(false);
  const { pendingCount, isLoading } = useSuggestions(projectId);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn('relative gap-2', className)}
        onClick={() => setOpen(true)}
      >
        <Bell className="w-4 h-4" />
        <span className="hidden sm:inline">Suggestions</span>
        {pendingCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 px-1.5 min-w-[20px] flex items-center justify-center"
          >
            {pendingCount}
          </Badge>
        )}
        {isLoading && (
          <Loader2 className="w-3 h-3 animate-spin absolute -top-1 -right-1" />
        )}
      </Button>

      <SuggestionListPanel
        projectId={projectId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

// ============================================================================
// Inline Suggestion List
// ============================================================================

/**
 * Inline suggestion list for embedding directly in pages.
 * Shows pending suggestions with action buttons.
 */
export function SuggestionListInline({
  projectId,
  className,
}: SuggestionListProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const {
    sortedPendingSuggestions,
    isLoading,
    acceptMutation,
    rejectMutation,
    snoozeMutation,
  } = useSuggestions(projectId);

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    try {
      await acceptMutation.mutateAsync(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await rejectMutation.mutateAsync({ suggestionId: id });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSnooze = async (id: string, hours: number) => {
    setActionLoading(id);
    try {
      await snoozeMutation.mutateAsync({ suggestionId: id, hours });
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sortedPendingSuggestions.length === 0) {
    return null; // Don't show anything if no pending suggestions
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-medium">
          {sortedPendingSuggestions.length} pending suggestion
          {sortedPendingSuggestions.length !== 1 ? 's' : ''}
        </span>
      </div>
      {sortedPendingSuggestions.slice(0, 3).map((suggestion) => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          onAccept={() => handleAccept(suggestion.id)}
          onReject={() => handleReject(suggestion.id)}
          onSnooze={(hours) => handleSnooze(suggestion.id, hours)}
          isLoading={actionLoading === suggestion.id}
        />
      ))}
      {sortedPendingSuggestions.length > 3 && (
        <Button variant="ghost" size="sm" className="w-full">
          View all {sortedPendingSuggestions.length} suggestions
        </Button>
      )}
    </div>
  );
}
