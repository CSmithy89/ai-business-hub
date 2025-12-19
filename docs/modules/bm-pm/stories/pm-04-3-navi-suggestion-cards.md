# Story PM-04.3: Navi Suggestion Cards

**Epic:** PM-04 - AI Team: Navi, Sage, Chrono
**Status:** drafted
**Points:** 5

---

## User Story

As a **project user**,
I want **contextual suggestion cards from Navi**,
So that **I can quickly act on AI recommendations**.

---

## Acceptance Criteria

### AC1: Navi Displays Suggestion Cards Based on Project Context
**Given** I am on a project page
**When** Navi analyzes the project state
**Then** relevant suggestion cards appear showing actionable recommendations

### AC2: Cards Show Actionable Recommendations with One-Click Actions
**Given** a suggestion card is displayed
**When** I review the suggestion
**Then** I see:
- Clear action description
- Reasoning/basis for suggestion
- Confidence score
- One-click action buttons (Accept, Edit, Dismiss)

### AC3: Cards Can Be Dismissed or Snoozed
**Given** I see a suggestion card
**When** I don't want to act on it now
**Then** I can dismiss it permanently or snooze for later review

### AC4: Card Priority Determines Visibility Order
**Given** multiple suggestion cards exist
**When** they are displayed
**Then** cards are ordered by priority/confidence score with highest first

---

## Technical Notes

### SuggestionCard Component

**Location:** `apps/web/src/components/pm/agents/SuggestionCard.tsx`

Main component for displaying and interacting with suggestions:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Edit, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestionCardProps {
  suggestion: AgentSuggestion;
  onAccept: () => Promise<void>;
  onReject: (reason?: string) => Promise<void>;
  onEdit: () => void;
  onSnooze?: () => Promise<void>;
}

export function SuggestionCard({
  suggestion,
  onAccept,
  onReject,
  onEdit,
  onSnooze
}: SuggestionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await onAccept();
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await onReject(rejectReason || undefined);
      setShowRejectReason(false);
      setRejectReason('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSnooze = async () => {
    if (!onSnooze) return;
    setIsLoading(true);
    try {
      await onSnooze();
    } finally {
      setIsLoading(false);
    }
  };

  const actionLabel = getActionLabel(suggestion.action);
  const confidenceColor = getConfidenceColor(suggestion.confidence);
  const priorityLevel = getPriorityLevel(suggestion);

  return (
    <Card className={cn(
      "p-4 mb-3 border-l-4 transition-all hover:shadow-md",
      confidenceColor
    )}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            {suggestion.agentName}
          </span>
          {priorityLevel && (
            <Badge variant={priorityLevel === 'high' ? 'destructive' : 'secondary'}>
              {priorityLevel} priority
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{(suggestion.confidence * 100).toFixed(0)}% confidence</span>
          <ConfidenceIndicator confidence={suggestion.confidence} />
        </div>
      </div>

      <h4 className="font-medium mb-2">{actionLabel}</h4>

      <div className="mb-3 text-sm bg-accent/50 p-3 rounded-md">
        <SuggestionPreview
          action={suggestion.action}
          payload={suggestion.payload}
        />
      </div>

      <div className="text-xs text-muted-foreground mb-3 italic">
        <span className="font-medium">Why: </span>
        {suggestion.reasoning}
      </div>

      {!showRejectReason ? (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isLoading}
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-1" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            disabled={isLoading}
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          {onSnooze && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSnooze}
              disabled={isLoading}
              title="Snooze for 4 hours"
            >
              <Clock className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowRejectReason(true)}
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Why are you rejecting? (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-md"
            disabled={isLoading}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={isLoading}
              className="flex-1"
            >
              Confirm Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRejectReason(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="mt-2 text-xs text-muted-foreground">
        Created {formatRelativeTime(suggestion.createdAt)}
      </div>
    </Card>
  );
}

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const level = confidence >= 0.85 ? 'high' : confidence >= 0.6 ? 'medium' : 'low';
  const color = level === 'high' ? 'text-green-500' : level === 'medium' ? 'text-yellow-500' : 'text-orange-500';

  return (
    <div className={cn("flex items-center gap-1", color)}>
      {level === 'high' && '⬤⬤⬤'}
      {level === 'medium' && '⬤⬤○'}
      {level === 'low' && '⬤○○'}
    </div>
  );
}

function SuggestionPreview({ action, payload }: { action: string; payload: any }) {
  switch (action) {
    case 'CREATE_TASK':
      return (
        <div>
          <div className="font-medium">{payload.title}</div>
          {payload.description && (
            <div className="text-muted-foreground mt-1">{payload.description}</div>
          )}
          {(payload.phase || payload.priority) && (
            <div className="flex gap-2 mt-2">
              {payload.phase && <Badge variant="outline">{payload.phase}</Badge>}
              {payload.priority && <Badge variant="outline">{payload.priority}</Badge>}
            </div>
          )}
        </div>
      );

    case 'ASSIGN_TASK':
      return (
        <div>
          Assign <span className="font-medium">{payload.taskTitle}</span> to{' '}
          <span className="font-medium">{payload.assigneeName}</span>
        </div>
      );

    case 'MOVE_TO_PHASE':
      return (
        <div>
          Move <span className="font-medium">{payload.taskTitle}</span> to{' '}
          <span className="font-medium">{payload.phaseName}</span>
        </div>
      );

    case 'SET_PRIORITY':
      return (
        <div>
          Set priority of <span className="font-medium">{payload.taskTitle}</span> to{' '}
          <Badge variant={payload.priority === 'URGENT' ? 'destructive' : 'secondary'}>
            {payload.priority}
          </Badge>
        </div>
      );

    case 'UPDATE_TASK':
      return (
        <div>
          <div className="font-medium">Update: {payload.taskTitle}</div>
          <div className="text-muted-foreground mt-1">
            Changes: {Object.keys(payload.changes).join(', ')}
          </div>
        </div>
      );

    default:
      return <div>{JSON.stringify(payload)}</div>;
  }
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    CREATE_TASK: 'Create Task',
    UPDATE_TASK: 'Update Task',
    ASSIGN_TASK: 'Assign Task',
    MOVE_TO_PHASE: 'Move to Phase',
    SET_PRIORITY: 'Set Priority',
    ESTIMATE_TASK: 'Estimate Task',
    START_TIMER: 'Start Timer',
    STOP_TIMER: 'Stop Timer',
  };
  return labels[action] || action;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.85) return 'border-l-green-500';
  if (confidence >= 0.6) return 'border-l-yellow-500';
  return 'border-l-orange-500';
}

function getPriorityLevel(suggestion: any): 'high' | 'medium' | 'low' | null {
  // Calculate priority based on suggestion metadata
  if (suggestion.payload?.priority === 'URGENT') return 'high';
  if (suggestion.confidence >= 0.85) return 'high';
  if (suggestion.confidence >= 0.6) return 'medium';
  return 'low';
}

function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
```

### SuggestionsList Component

**Location:** `apps/web/src/components/pm/agents/SuggestionsList.tsx`

Container for displaying multiple suggestion cards:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { SuggestionCard } from './SuggestionCard';
import { useSuggestions } from '@/hooks/pm/useSuggestions';
import { Loader2 } from 'lucide-react';

interface SuggestionsListProps {
  projectId: string;
  limit?: number;
}

export function SuggestionsList({ projectId, limit = 10 }: SuggestionsListProps) {
  const {
    suggestions,
    isLoading,
    acceptSuggestion,
    rejectSuggestion,
    snoozeSuggestion,
    refreshSuggestions,
  } = useSuggestions({ projectId, status: 'PENDING', limit });

  const [editingSuggestion, setEditingSuggestion] = useState<string | null>(null);

  // Sort by priority: confidence score + urgency
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const aPriority = calculatePriority(a);
    const bPriority = calculatePriority(b);
    return bPriority - aPriority;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>No suggestions at this time.</p>
        <p className="text-sm mt-1">Navi will suggest actions as needed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">
          Suggestions ({suggestions.length})
        </h3>
        <button
          onClick={refreshSuggestions}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Refresh
        </button>
      </div>

      {sortedSuggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          onAccept={async () => {
            await acceptSuggestion(suggestion.id);
            refreshSuggestions();
          }}
          onReject={async (reason) => {
            await rejectSuggestion(suggestion.id, reason);
            refreshSuggestions();
          }}
          onEdit={() => setEditingSuggestion(suggestion.id)}
          onSnooze={async () => {
            await snoozeSuggestion(suggestion.id);
            refreshSuggestions();
          }}
        />
      ))}

      {editingSuggestion && (
        <EditSuggestionModal
          suggestionId={editingSuggestion}
          onClose={() => setEditingSuggestion(null)}
          onSave={async () => {
            setEditingSuggestion(null);
            refreshSuggestions();
          }}
        />
      )}
    </div>
  );
}

function calculatePriority(suggestion: any): number {
  // Higher score = higher priority
  let priority = suggestion.confidence * 100;

  // Boost for urgent actions
  if (suggestion.payload?.priority === 'URGENT') {
    priority += 50;
  }

  // Boost for overdue-related suggestions
  if (suggestion.reasoning?.includes('overdue')) {
    priority += 30;
  }

  // Boost for blocking issues
  if (suggestion.reasoning?.includes('blocked') || suggestion.reasoning?.includes('blocker')) {
    priority += 40;
  }

  // Decay based on age (older suggestions get lower priority)
  const age = Date.now() - new Date(suggestion.createdAt).getTime();
  const ageHours = age / (1000 * 60 * 60);
  priority -= ageHours * 2; // Reduce by 2 points per hour

  return priority;
}
```

### Backend: SuggestionService

**Location:** `apps/api/src/pm/agents/suggestion.service.ts`

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { EventBusService } from '@/event-bus/event-bus.service';
import { RealtimeGateway } from '@/realtime/realtime.gateway';
import { SuggestionAction, SuggestionStatus } from '@prisma/client';

@Injectable()
export class SuggestionService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  /**
   * Create a new suggestion from agent
   */
  async createSuggestion(params: {
    workspaceId: string;
    projectId: string;
    userId: string;
    agentName: string;
    action: SuggestionAction;
    payload: any;
    confidence: number;
    reasoning: string;
  }) {
    const suggestion = await this.prisma.agentSuggestion.create({
      data: {
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        userId: params.userId,
        agentName: params.agentName,
        action: params.action,
        payload: params.payload,
        confidence: params.confidence,
        reasoning: params.reasoning,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Publish event
    await this.eventBus.publish({
      type: 'agent.suggestion.created',
      source: `agent:${params.agentName}`,
      data: suggestion,
      userId: params.userId,
    });

    // Send WebSocket notification
    this.realtimeGateway.server
      .to(`project:${params.projectId}`)
      .emit('suggestion:created', suggestion);

    return suggestion;
  }

  /**
   * Get suggestions for user/project
   */
  async getSuggestions(params: {
    workspaceId: string;
    projectId?: string;
    userId?: string;
    agentName?: string;
    status?: SuggestionStatus;
    limit?: number;
  }) {
    const where: any = {
      workspaceId: params.workspaceId,
    };

    if (params.projectId) where.projectId = params.projectId;
    if (params.userId) where.userId = params.userId;
    if (params.agentName) where.agentName = params.agentName;
    if (params.status) where.status = params.status;

    // Filter out expired suggestions
    where.expiresAt = { gte: new Date() };

    return this.prisma.agentSuggestion.findMany({
      where,
      orderBy: [
        { confidence: 'desc' },
        { createdAt: 'desc' },
      ],
      take: params.limit || 50,
    });
  }

  /**
   * Accept suggestion and execute action
   */
  async acceptSuggestion(
    suggestionId: string,
    workspaceId: string,
    userId: string,
  ) {
    const suggestion = await this.prisma.agentSuggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    if (suggestion.workspaceId !== workspaceId) {
      throw new ForbiddenException('Access denied');
    }

    if (suggestion.status !== 'PENDING') {
      throw new ForbiddenException('Suggestion already processed');
    }

    // Update status
    await this.prisma.agentSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    // Execute the suggested action
    const result = await this.executeSuggestion(suggestion);

    // Publish event
    await this.eventBus.publish({
      type: 'agent.suggestion.accepted',
      source: `agent:${suggestion.agentName}`,
      data: { suggestion, result },
      userId,
    });

    return { success: true, result };
  }

  /**
   * Reject suggestion
   */
  async rejectSuggestion(
    suggestionId: string,
    workspaceId: string,
    userId: string,
    reason?: string,
  ) {
    const suggestion = await this.prisma.agentSuggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    if (suggestion.workspaceId !== workspaceId) {
      throw new ForbiddenException('Access denied');
    }

    // Update status
    await this.prisma.agentSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        payload: {
          ...suggestion.payload,
          rejectionReason: reason,
        },
      },
    });

    // Publish event
    await this.eventBus.publish({
      type: 'agent.suggestion.rejected',
      source: `agent:${suggestion.agentName}`,
      data: { suggestion, reason },
      userId,
    });

    return { success: true };
  }

  /**
   * Snooze suggestion (hide for 4 hours)
   */
  async snoozeSuggestion(
    suggestionId: string,
    workspaceId: string,
    userId: string,
  ) {
    const suggestion = await this.prisma.agentSuggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    if (suggestion.workspaceId !== workspaceId) {
      throw new ForbiddenException('Access denied');
    }

    // Store snooze timestamp in payload
    await this.prisma.agentSuggestion.update({
      where: { id: suggestionId },
      data: {
        payload: {
          ...suggestion.payload,
          snoozedUntil: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
          snoozedBy: userId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Execute the suggested action
   */
  private async executeSuggestion(suggestion: any) {
    switch (suggestion.action) {
      case 'CREATE_TASK':
        return this.executeCreateTask(suggestion);

      case 'UPDATE_TASK':
        return this.executeUpdateTask(suggestion);

      case 'ASSIGN_TASK':
        return this.executeAssignTask(suggestion);

      case 'MOVE_TO_PHASE':
        return this.executeMoveToPhase(suggestion);

      case 'SET_PRIORITY':
        return this.executeSetPriority(suggestion);

      default:
        throw new Error(`Unknown action: ${suggestion.action}`);
    }
  }

  private async executeCreateTask(suggestion: any) {
    const { projectId, workspaceId } = suggestion;
    const { title, description, phaseId, priority, assigneeId } = suggestion.payload;

    const task = await this.prisma.task.create({
      data: {
        workspaceId,
        projectId,
        title,
        description,
        phaseId,
        priority,
        assigneeId,
        status: 'TODO',
      },
    });

    await this.eventBus.publish({
      type: 'task.created',
      source: 'suggestion',
      data: task,
      userId: suggestion.userId,
    });

    return task;
  }

  private async executeUpdateTask(suggestion: any) {
    const { taskId, changes } = suggestion.payload;

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: changes,
    });

    await this.eventBus.publish({
      type: 'task.updated',
      source: 'suggestion',
      data: task,
      userId: suggestion.userId,
    });

    return task;
  }

  private async executeAssignTask(suggestion: any) {
    const { taskId, assigneeId } = suggestion.payload;

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { assigneeId },
    });

    await this.eventBus.publish({
      type: 'task.assigned',
      source: 'suggestion',
      data: task,
      userId: suggestion.userId,
    });

    return task;
  }

  private async executeMoveToPhase(suggestion: any) {
    const { taskId, phaseId } = suggestion.payload;

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { phaseId },
    });

    await this.eventBus.publish({
      type: 'task.moved',
      source: 'suggestion',
      data: task,
      userId: suggestion.userId,
    });

    return task;
  }

  private async executeSetPriority(suggestion: any) {
    const { taskId, priority } = suggestion.payload;

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { priority },
    });

    await this.eventBus.publish({
      type: 'task.updated',
      source: 'suggestion',
      data: task,
      userId: suggestion.userId,
    });

    return task;
  }

  /**
   * Clean up expired suggestions (cron job)
   */
  async cleanupExpiredSuggestions() {
    const result = await this.prisma.agentSuggestion.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return result;
  }
}
```

### Navi Suggestion Tools

**Location:** `agents/pm/tools/suggestion_tools.py`

```python
from agno import tool
import requests

@tool
def create_task_suggestion(
    project_id: str,
    title: str,
    description: str = None,
    phase_id: str = None,
    priority: str = 'MEDIUM',
    assignee_id: str = None,
    reasoning: str = None,
    confidence: float = 0.7
) -> dict:
    """
    Suggest creating a new task.

    Returns a suggestion object that the user must approve.
    """

    suggestion = {
        'action': 'CREATE_TASK',
        'payload': {
            'title': title,
            'description': description,
            'phaseId': phase_id,
            'priority': priority,
            'assigneeId': assignee_id,
        },
        'confidence': confidence,
        'reasoning': reasoning or f"Suggested task: {title}",
    }

    return suggestion


@tool
def assign_task_suggestion(
    task_id: str,
    assignee_id: str,
    reasoning: str = None,
    confidence: float = 0.75
) -> dict:
    """
    Suggest assigning a task to a team member.
    """

    # Get task details
    response = requests.get(f"{API_URL}/api/pm/tasks/{task_id}")
    task = response.json()

    # Get assignee details
    response = requests.get(f"{API_URL}/api/users/{assignee_id}")
    assignee = response.json()

    suggestion = {
        'action': 'ASSIGN_TASK',
        'payload': {
            'taskId': task_id,
            'taskTitle': task['title'],
            'assigneeId': assignee_id,
            'assigneeName': assignee['name'],
        },
        'confidence': confidence,
        'reasoning': reasoning or f"Assign to {assignee['name']} based on availability and skills",
    }

    return suggestion


@tool
def set_priority_suggestion(
    task_id: str,
    priority: str,
    reasoning: str = None,
    confidence: float = 0.8
) -> dict:
    """
    Suggest changing task priority.

    Priority: 'URGENT', 'HIGH', 'MEDIUM', 'LOW'
    """

    # Get task details
    response = requests.get(f"{API_URL}/api/pm/tasks/{task_id}")
    task = response.json()

    suggestion = {
        'action': 'SET_PRIORITY',
        'payload': {
            'taskId': task_id,
            'taskTitle': task['title'],
            'priority': priority,
            'currentPriority': task.get('priority'),
        },
        'confidence': confidence,
        'reasoning': reasoning or f"Adjust priority to {priority} based on deadlines and dependencies",
    }

    return suggestion


@tool
def move_to_phase_suggestion(
    task_id: str,
    phase_id: str,
    reasoning: str = None,
    confidence: float = 0.7
) -> dict:
    """
    Suggest moving a task to a different phase.
    """

    # Get task and phase details
    response = requests.get(f"{API_URL}/api/pm/tasks/{task_id}")
    task = response.json()

    response = requests.get(f"{API_URL}/api/pm/phases/{phase_id}")
    phase = response.json()

    suggestion = {
        'action': 'MOVE_TO_PHASE',
        'payload': {
            'taskId': task_id,
            'taskTitle': task['title'],
            'phaseId': phase_id,
            'phaseName': phase['name'],
            'currentPhaseId': task.get('phaseId'),
        },
        'confidence': confidence,
        'reasoning': reasoning or f"Move to {phase['name']} based on task status and workflow",
    }

    return suggestion
```

### API Endpoints

**Location:** `apps/api/src/pm/agents/agents.controller.ts`

Add suggestion endpoints:

```typescript
@Controller('pm/agents')
@UseGuards(AuthGuard, TenantGuard)
export class AgentsController {
  constructor(
    private agentsService: AgentsService,
    private suggestionService: SuggestionService,
  ) {}

  @Get('suggestions')
  async getSuggestions(
    @GetWorkspace() workspaceId: string,
    @GetUser() user: User,
    @Query() query: GetSuggestionsDto,
  ) {
    return this.suggestionService.getSuggestions({
      workspaceId,
      projectId: query.projectId,
      userId: query.userId || user.id,
      agentName: query.agentName,
      status: query.status || 'PENDING',
      limit: query.limit,
    });
  }

  @Post('suggestions/:id/accept')
  async acceptSuggestion(
    @GetWorkspace() workspaceId: string,
    @GetUser() user: User,
    @Param('id') suggestionId: string,
  ) {
    return this.suggestionService.acceptSuggestion(
      suggestionId,
      workspaceId,
      user.id,
    );
  }

  @Post('suggestions/:id/reject')
  async rejectSuggestion(
    @GetWorkspace() workspaceId: string,
    @GetUser() user: User,
    @Param('id') suggestionId: string,
    @Body() body: RejectSuggestionDto,
  ) {
    return this.suggestionService.rejectSuggestion(
      suggestionId,
      workspaceId,
      user.id,
      body.reason,
    );
  }

  @Post('suggestions/:id/snooze')
  async snoozeSuggestion(
    @GetWorkspace() workspaceId: string,
    @GetUser() user: User,
    @Param('id') suggestionId: string,
  ) {
    return this.suggestionService.snoozeSuggestion(
      suggestionId,
      workspaceId,
      user.id,
    );
  }

  @Delete('suggestions/:id')
  async dismissSuggestion(
    @GetWorkspace() workspaceId: string,
    @GetUser() user: User,
    @Param('id') suggestionId: string,
  ) {
    // Dismiss is the same as reject without a reason
    return this.suggestionService.rejectSuggestion(
      suggestionId,
      workspaceId,
      user.id,
      'Dismissed by user',
    );
  }
}
```

### Custom Hook

**Location:** `apps/web/src/hooks/pm/useSuggestions.ts`

```typescript
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface UseSuggestionsParams {
  projectId?: string;
  agentName?: string;
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  limit?: number;
}

export function useSuggestions(params: UseSuggestionsParams) {
  const queryClient = useQueryClient();

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['suggestions', params],
    queryFn: async () => {
      const response = await api.get('/pm/agents/suggestions', { params });
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  const acceptMutation = useMutation({
    mutationFn: (suggestionId: string) =>
      api.post(`/pm/agents/suggestions/${suggestionId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ suggestionId, reason }: { suggestionId: string; reason?: string }) =>
      api.post(`/pm/agents/suggestions/${suggestionId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });

  const snoozeMutation = useMutation({
    mutationFn: (suggestionId: string) =>
      api.post(`/pm/agents/suggestions/${suggestionId}/snooze`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });

  return {
    suggestions,
    isLoading,
    acceptSuggestion: acceptMutation.mutateAsync,
    rejectSuggestion: (suggestionId: string, reason?: string) =>
      rejectMutation.mutateAsync({ suggestionId, reason }),
    snoozeSuggestion: snoozeMutation.mutateAsync,
    refreshSuggestions: () =>
      queryClient.invalidateQueries({ queryKey: ['suggestions'] }),
  };
}
```

---

## Dependencies

### Prerequisites

- **PM-04.1** (Navi Agent Foundation) - Navi agent must exist
- **PM-04.2** (Navi Daily Briefing) - Uses similar card UI patterns
- **PM-02.1** (Task Data Model) - Task operations for execution

### Blocks

- **PM-04.4** (Navi Chat Commands) - Will use suggestion cards for command responses

---

## Tasks

### Backend Tasks
- [ ] Create `apps/api/src/pm/agents/suggestion.service.ts`
- [ ] Implement `createSuggestion()` method
- [ ] Implement `getSuggestions()` with filtering and sorting
- [ ] Implement `acceptSuggestion()` with action execution
- [ ] Implement `rejectSuggestion()` with optional reason
- [ ] Implement `snoozeSuggestion()` with 4-hour delay
- [ ] Add `executeSuggestion()` router for different action types
- [ ] Add suggestion endpoints to `agents.controller.ts`
- [ ] Create DTOs: `GetSuggestionsDto`, `RejectSuggestionDto`
- [ ] Add cron job for cleaning up expired suggestions

### Agent Layer Tasks
- [ ] Create `agents/pm/tools/suggestion_tools.py`
- [ ] Implement `create_task_suggestion` tool
- [ ] Implement `assign_task_suggestion` tool
- [ ] Implement `set_priority_suggestion` tool
- [ ] Implement `move_to_phase_suggestion` tool
- [ ] Add suggestion tools to Navi's tools list
- [ ] Update Navi instructions to use suggestion tools

### Frontend Tasks
- [ ] Create `apps/web/src/components/pm/agents/SuggestionCard.tsx`
- [ ] Create `apps/web/src/components/pm/agents/SuggestionsList.tsx`
- [ ] Create `apps/web/src/components/pm/agents/EditSuggestionModal.tsx`
- [ ] Create `apps/web/src/hooks/pm/useSuggestions.ts`
- [ ] Implement confidence indicator UI
- [ ] Implement priority calculation and sorting
- [ ] Add snooze functionality with localStorage sync
- [ ] Add WebSocket listener for `suggestion:created` event
- [ ] Integrate SuggestionsList into project pages

### Integration Tasks
- [ ] Test suggestion creation from agent
- [ ] Test acceptance flow end-to-end
- [ ] Test rejection with reason logging
- [ ] Test snooze functionality
- [ ] Test priority sorting algorithm
- [ ] Test WebSocket real-time updates
- [ ] Test expiration cleanup cron job

---

## Testing Requirements

### Unit Tests

**Backend (NestJS):**
- `SuggestionService.createSuggestion()` creates suggestion with expiry
- `SuggestionService.acceptSuggestion()` executes correct action
- `SuggestionService.rejectSuggestion()` updates status and logs reason
- `SuggestionService.snoozeSuggestion()` sets 4-hour delay
- `SuggestionService.executeSuggestion()` routes to correct executor
- Priority calculation includes confidence, urgency, age
- Workspace isolation enforced

**Location:** `apps/api/src/pm/agents/suggestion.service.spec.ts`

**Agents (Python):**
- `create_task_suggestion` returns valid suggestion object
- `assign_task_suggestion` includes assignee details
- `set_priority_suggestion` validates priority values
- Tools return proper confidence scores

**Location:** `agents/pm/tests/test_suggestion_tools.py`

**Frontend (Vitest):**
- `SuggestionCard` displays all required information
- Accept/reject/snooze buttons work correctly
- Confidence indicator shows correct level
- Priority sorting works correctly
- `useSuggestions` hook fetches and updates data

**Location:** `apps/web/src/components/pm/agents/SuggestionCard.test.tsx`

### Integration Tests

**API Endpoints:**
- `GET /api/pm/agents/suggestions` returns filtered suggestions
- `POST /api/pm/agents/suggestions/:id/accept` creates task
- `POST /api/pm/agents/suggestions/:id/reject` updates status
- `POST /api/pm/agents/suggestions/:id/snooze` sets delay
- WebSocket event sent on suggestion creation
- Expired suggestions cleaned up by cron

**Location:** `apps/api/test/pm/agents/suggestion.e2e-spec.ts`

### E2E Tests (Playwright)

**User Flows:**
1. Agent creates suggestion → card appears → user accepts → task created
2. View suggestion → click "Edit" → modify → accept → task created with changes
3. View suggestion → click "Dismiss" → card disappears
4. View suggestion → click "Snooze" → card disappears → reappears after 4 hours
5. Multiple suggestions → sorted by priority → highest confidence first

**Location:** `apps/web/e2e/pm/agents/suggestion-cards.spec.ts`

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Suggestion cards display based on project context
- [ ] Cards show action, reasoning, and confidence
- [ ] Accept/reject/snooze functionality working
- [ ] Priority sorting implemented
- [ ] WebSocket real-time updates working
- [ ] Expired suggestions auto-cleanup
- [ ] Unit tests passing (backend + agents + frontend)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated:
  - [ ] Suggestion workflow documentation
  - [ ] API endpoint docs
  - [ ] Agent tool docs
- [ ] Workspace isolation verified
- [ ] No regressions in existing features

---

## References

- [Epic Definition](../epics/epic-pm-04-ai-team-navi-sage-chrono.md)
- [Epic Tech Spec](../epics/epic-pm-04-tech-spec.md)
- [Story PM-04.1 (Navi Foundation)](./pm-04-1-navi-agent-foundation.md)
- [Story PM-04.2 (Navi Daily Briefing)](./pm-04-2-navi-daily-briefing.md)
- [Module PRD](../PRD.md)
- [Module Architecture](../architecture.md)
- [Sprint Status](../sprint-status.yaml)

---

## Dev Notes

### Suggestion Lifecycle

```
1. Agent generates suggestion → SuggestionService.createSuggestion()
2. Suggestion stored with status=PENDING, expiresAt=24h
3. WebSocket notification sent to project room
4. Frontend displays SuggestionCard
5. User action:
   a. Accept → execute action, status=ACCEPTED
   b. Reject → status=REJECTED, log reason
   c. Snooze → hidden for 4 hours
   d. Dismiss → status=REJECTED
6. After 24h → cron job sets status=EXPIRED
```

### Priority Calculation

Suggestions are sorted by a composite priority score:

```
priority = confidence * 100
         + (urgent_boost = 50 if URGENT)
         + (overdue_boost = 30 if overdue mentioned)
         + (blocker_boost = 40 if blocker mentioned)
         - (age_penalty = 2 points/hour)
```

This ensures:
- High confidence suggestions appear first
- Urgent/blocking issues prioritized
- Older suggestions decay over time

### Snooze Implementation

Snooze is client-side with server-side storage:
- Server stores `snoozedUntil` timestamp in payload
- Client filters out snoozed suggestions
- After snooze expires, suggestion reappears
- User can snooze multiple times

### Expiration Strategy

- All suggestions expire after 24 hours
- Cron job runs hourly to mark expired suggestions
- Expired suggestions no longer visible
- Keeps database clean and relevant

### Edit Suggestion Flow

When user clicks "Edit":
1. Open modal with pre-filled values from suggestion.payload
2. User modifies fields
3. On save: reject original suggestion, create new one with modified payload
4. New suggestion has same confidence but updated reasoning

### Confidence Thresholds

- **High (≥85%)**: Green indicator, 3 filled circles
- **Medium (60-84%)**: Yellow indicator, 2 filled circles
- **Low (<60%)**: Orange indicator, 1 filled circle

Consider routing low-confidence suggestions through approval queue (future enhancement).

### WebSocket Events

Subscribe to project room:
```typescript
socket.emit('project:subscribe', { projectId });
socket.on('suggestion:created', handleNewSuggestion);
```

Real-time updates ensure users see suggestions immediately without refresh.

---

## Dev Agent Record

### Context Reference
- TBD - Will be created during story-context workflow

### Agent Model Used
- TBD

### Completion Notes List
- TBD

### File List
- TBD

---

## Senior Developer Review

**Reviewer:** TBD
**Date:** TBD
**Review Status:** PENDING

### Summary
TBD

### Code Quality
TBD

### Security
TBD

### Architecture
TBD

### Testing
TBD

### Acceptance Criteria Verification
TBD

### Issues Found
TBD

### Recommendations
TBD

### Decision
TBD
