# Story PM-04.6: Sage Story Point Suggestions

**Epic:** PM-04 - AI Team: Navi, Sage, Chrono
**Status:** drafted
**Points:** 5

---

## User Story

As a **project manager**,
I want **Sage to suggest story points when I create or edit tasks**,
So that **I can quickly estimate work without manual calculation while maintaining control**.

---

## Acceptance Criteria

### AC1: Sage Suggests Story Points for Tasks
**Given** I am creating or editing a task
**When** I provide a task title, description, and type
**Then** Sage automatically suggests story points based on complexity analysis

### AC2: Users Can Accept, Modify, or Reject Point Suggestions
**Given** Sage has provided a story point suggestion
**When** I view the suggestion
**Then** I can:
- Accept the suggestion (apply immediately)
- Modify the suggestion before applying
- Reject and enter my own value
- Dismiss the suggestion

### AC3: Suggestions Show Reasoning and Similar Task References
**Given** Sage provides a story point suggestion
**When** I view the suggestion details
**Then** I see:
- The suggested story point value
- Confidence level (low, medium, high)
- Reasoning explaining the estimate
- References to similar historical tasks (if available)
- Complexity factors identified in the task

### AC4: Point Suggestions Integrate with Task Detail Panel
**Given** I am on the task detail panel
**When** I click "Get Estimate" or "Suggest Points"
**Then** Sage analyzes the task and displays a suggestion card
**And** the suggestion seamlessly integrates with the task form

---

## Technical Notes

### Story Point Suggestion Flow

The story point suggestion feature builds on the existing estimation infrastructure from PM-04.5 but focuses specifically on story point suggestions with inline UI integration.

**Flow:**
```
User creates/edits task
         ↓
User clicks "Suggest Points" button
         ↓
Frontend: POST /api/pm/agents/estimation/suggest-points
  { taskId?, title, description, type, projectId }
         ↓
Backend: EstimationService.suggestStoryPoints()
  1. Check if task is new or existing
  2. Invoke Sage agent with focused story point prompt
  3. Return suggestion with reasoning
         ↓
Frontend: Display inline SuggestionCard
  → Shows: "5 points (Medium confidence)"
  → Reasoning: "Based on 3 similar FEATURE tasks"
  → Buttons: "Accept", "Edit", "Dismiss"
         ↓
User clicks "Accept"
         ↓
Frontend: Updates task form with story points
Backend: Logs suggestion acceptance (optional)
         ↓
User saves task with accepted points
```

### Backend Implementation

**Location:** `apps/api/src/pm/agents/estimation.service.ts`

Add story point suggestion method:

```typescript
/**
 * Suggest story points for a task (focused on points only)
 */
async suggestStoryPoints(
  workspaceId: string,
  userId: string,
  dto: {
    taskId?: string;  // Optional, for existing tasks
    title: string;
    description?: string;
    type: TaskType;
    projectId: string;
  }
): Promise<StoryPointSuggestion> {
  // Use existing estimateTask but format for story point focus
  const estimate = await this.estimateTask(workspaceId, userId, dto);

  // Create suggestion record for tracking
  const suggestion = await this.prisma.agentSuggestion.create({
    data: {
      workspaceId,
      projectId: dto.projectId,
      userId,
      agentName: 'sage',
      action: 'ESTIMATE_TASK',
      payload: {
        taskId: dto.taskId,
        storyPoints: estimate.storyPoints,
        estimatedHours: estimate.estimatedHours,
      },
      confidence: estimate.confidenceScore,
      reasoning: estimate.basis,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
    },
  });

  return {
    id: suggestion.id,
    storyPoints: estimate.storyPoints,
    estimatedHours: estimate.estimatedHours,
    confidenceLevel: estimate.confidenceLevel,
    confidenceScore: estimate.confidenceScore,
    reasoning: estimate.basis,
    coldStart: estimate.coldStart,
    complexityFactors: estimate.complexityFactors,
    similarTasks: estimate.similarTasks,
  };
}

/**
 * Accept story point suggestion
 */
async acceptStoryPointSuggestion(
  workspaceId: string,
  userId: string,
  suggestionId: string,
  overridePoints?: number  // Optional manual adjustment
): Promise<{ success: boolean }> {
  const suggestion = await this.prisma.agentSuggestion.findUnique({
    where: { id: suggestionId },
  });

  if (!suggestion || suggestion.workspaceId !== workspaceId) {
    throw new NotFoundException('Suggestion not found');
  }

  if (suggestion.status !== 'PENDING') {
    throw new BadRequestException('Suggestion already processed');
  }

  // Update suggestion status
  await this.prisma.agentSuggestion.update({
    where: { id: suggestionId },
    data: {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
    },
  });

  // If task exists, update it
  if (suggestion.payload['taskId']) {
    const taskId = suggestion.payload['taskId'];
    const pointsToApply = overridePoints !== undefined
      ? overridePoints
      : suggestion.payload['storyPoints'];

    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        storyPoints: pointsToApply,
        estimatedHours: suggestion.payload['estimatedHours'],
        confidenceScore: suggestion.confidence,
      },
    });
  }

  // Publish event
  await this.eventBus.publish({
    type: 'agent.suggestion.accepted',
    source: 'estimation.service',
    data: {
      suggestionId,
      agentName: 'sage',
      userId,
    },
  });

  return { success: true };
}

/**
 * Reject story point suggestion
 */
async rejectStoryPointSuggestion(
  workspaceId: string,
  suggestionId: string,
  reason?: string
): Promise<{ success: boolean }> {
  const suggestion = await this.prisma.agentSuggestion.findUnique({
    where: { id: suggestionId },
  });

  if (!suggestion || suggestion.workspaceId !== workspaceId) {
    throw new NotFoundException('Suggestion not found');
  }

  // Update suggestion status
  await this.prisma.agentSuggestion.update({
    where: { id: suggestionId },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
    },
  });

  // Publish event
  await this.eventBus.publish({
    type: 'agent.suggestion.rejected',
    source: 'estimation.service',
    data: {
      suggestionId,
      agentName: 'sage',
      reason,
    },
  });

  return { success: true };
}
```

**Type Definitions:**

```typescript
interface StoryPointSuggestion {
  id: string;
  storyPoints: number;
  estimatedHours: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  confidenceScore: number;
  reasoning: string;
  coldStart: boolean;
  complexityFactors: string[];
  similarTasks?: string[];
}
```

### API Endpoints

**Location:** `apps/api/src/pm/agents/agents.controller.ts`

Add story point suggestion endpoints:

```typescript
@Post('estimation/suggest-points')
async suggestStoryPoints(
  @GetWorkspace() workspaceId: string,
  @GetUser() user: User,
  @Body() dto: {
    taskId?: string;
    title: string;
    description?: string;
    type: TaskType;
    projectId: string;
  }
) {
  return this.estimationService.suggestStoryPoints(workspaceId, user.id, dto);
}

@Post('estimation/suggestions/:id/accept')
async acceptSuggestion(
  @GetWorkspace() workspaceId: string,
  @GetUser() user: User,
  @Param('id') suggestionId: string,
  @Body() body?: { overridePoints?: number }
) {
  return this.estimationService.acceptStoryPointSuggestion(
    workspaceId,
    user.id,
    suggestionId,
    body?.overridePoints
  );
}

@Post('estimation/suggestions/:id/reject')
async rejectSuggestion(
  @GetWorkspace() workspaceId: string,
  @Param('id') suggestionId: string,
  @Body() body?: { reason?: string }
) {
  return this.estimationService.rejectStoryPointSuggestion(
    workspaceId,
    suggestionId,
    body?.reason
  );
}
```

### Frontend Component: StoryPointSuggestionCard

**Location:** `apps/web/src/components/pm/agents/StoryPointSuggestionCard.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, X, Edit, Info, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoryPointSuggestion {
  id: string;
  storyPoints: number;
  estimatedHours: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  confidenceScore: number;
  reasoning: string;
  coldStart: boolean;
  complexityFactors: string[];
  similarTasks?: string[];
}

interface StoryPointSuggestionCardProps {
  suggestion: StoryPointSuggestion;
  onAccept: (suggestionId: string, overridePoints?: number) => Promise<void>;
  onReject: (suggestionId: string) => Promise<void>;
}

export function StoryPointSuggestionCard({
  suggestion,
  onAccept,
  onReject,
}: StoryPointSuggestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPoints, setEditedPoints] = useState(suggestion.storyPoints);
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      if (isEditing && editedPoints !== suggestion.storyPoints) {
        await onAccept(suggestion.id, editedPoints);
      } else {
        await onAccept(suggestion.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await onReject(suggestion.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 border-l-4 border-l-purple-500">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              SAGE SUGGESTS
            </span>
            <ConfidenceBadge level={suggestion.confidenceLevel} />
          </div>

          {isEditing ? (
            <div className="flex items-baseline gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                value={editedPoints}
                onChange={(e) => setEditedPoints(parseInt(e.target.value, 10))}
                className="w-20 h-10 text-2xl font-bold"
              />
              <span className="text-sm text-muted-foreground">story points</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{suggestion.storyPoints}</span>
              <span className="text-sm text-muted-foreground">story points</span>
              <span className="text-sm text-muted-foreground ml-2">
                (~{suggestion.estimatedHours}h)
              </span>
            </div>
          )}
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      <div className="space-y-2 mb-3">
        {/* Reasoning */}
        <div className="flex items-start gap-2 text-sm">
          <Info className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0" />
          <span className="text-muted-foreground">{suggestion.reasoning}</span>
        </div>

        {/* Cold Start Warning */}
        {suggestion.coldStart && (
          <div className="flex items-start gap-2 text-sm bg-yellow-50 dark:bg-yellow-950 p-2 rounded">
            <AlertCircle className="w-4 h-4 mt-0.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <span className="text-yellow-700 dark:text-yellow-300">
              No historical data available. Estimate based on industry benchmarks.
            </span>
          </div>
        )}

        {/* Complexity Factors */}
        {suggestion.complexityFactors.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <TrendingUp className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0" />
            <div>
              <span className="text-muted-foreground">Complexity: </span>
              <span className="text-foreground">
                {suggestion.complexityFactors.join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* Similar Tasks */}
        {suggestion.similarTasks && suggestion.similarTasks.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Based on {suggestion.similarTasks.length} similar task
            {suggestion.similarTasks.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleAccept}
          disabled={isLoading}
          className="flex-1"
        >
          <Check className="w-4 h-4 mr-1" />
          {isEditing ? 'Apply' : 'Accept'}
        </Button>
        {isEditing && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsEditing(false);
              setEditedPoints(suggestion.storyPoints);
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        {!isEditing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReject}
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-1" />
            Dismiss
          </Button>
        )}
      </div>
    </Card>
  );
}

function ConfidenceBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs',
        level === 'high' && 'border-green-500 text-green-700 dark:text-green-300',
        level === 'medium' && 'border-yellow-500 text-yellow-700 dark:text-yellow-300',
        level === 'low' && 'border-orange-500 text-orange-700 dark:text-orange-300'
      )}
    >
      {level} confidence
    </Badge>
  );
}
```

### Integration with Task Detail Panel

**Location:** `apps/web/src/components/pm/tasks/TaskDetailPanel.tsx`

Add story point suggestion trigger:

```typescript
'use client';

import { useState } from 'react';
import { StoryPointSuggestionCard } from '@/components/pm/agents/StoryPointSuggestionCard';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export function TaskDetailPanel({ task, onUpdate }) {
  const [suggestion, setSuggestion] = useState(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  const handleGetSuggestion = async () => {
    setIsLoadingSuggestion(true);
    try {
      const response = await fetch('/api/pm/agents/estimation/suggest-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task?.id,
          title: task?.title || '',
          description: task?.description || '',
          type: task?.type || 'TASK',
          projectId: task?.projectId || currentProjectId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestion(data);
      }
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const handleAcceptSuggestion = async (suggestionId: string, overridePoints?: number) => {
    const response = await fetch(`/api/pm/agents/estimation/suggestions/${suggestionId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overridePoints }),
    });

    if (response.ok) {
      // Update task form with suggested points
      const pointsToApply = overridePoints !== undefined ? overridePoints : suggestion.storyPoints;
      onUpdate({ storyPoints: pointsToApply });
      setSuggestion(null);
    }
  };

  const handleRejectSuggestion = async (suggestionId: string) => {
    await fetch(`/api/pm/agents/estimation/suggestions/${suggestionId}/reject`, {
      method: 'POST',
    });
    setSuggestion(null);
  };

  return (
    <div className="task-detail-panel">
      {/* ... existing task fields ... */}

      {/* Story Points Field */}
      <div className="form-field">
        <label>Story Points</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={task?.storyPoints || ''}
            onChange={(e) => onUpdate({ storyPoints: parseInt(e.target.value, 10) })}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleGetSuggestion}
            disabled={isLoadingSuggestion || !task?.title}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Suggest
          </Button>
        </div>
      </div>

      {/* Suggestion Card */}
      {suggestion && (
        <div className="mt-3">
          <StoryPointSuggestionCard
            suggestion={suggestion}
            onAccept={handleAcceptSuggestion}
            onReject={handleRejectSuggestion}
          />
        </div>
      )}

      {/* ... rest of task fields ... */}
    </div>
  );
}
```

---

## Dependencies

### Prerequisites

- **PM-04.5** (Sage Estimation Agent) - Core estimation logic and tools
- **PM-04.1** (Navi Agent Foundation) - Agent infrastructure
- **PM-02.2** (Task Detail Panel) - UI integration point

### Blocks

- **PM-04.7** (Chrono Time Tracking) - Independent feature

---

## Tasks

### Backend Tasks
- [ ] Add `suggestStoryPoints()` method to `EstimationService`
- [ ] Add `acceptStoryPointSuggestion()` method
- [ ] Add `rejectStoryPointSuggestion()` method
- [ ] Create suggestion records in `AgentSuggestion` table
- [ ] Add story point suggestion endpoints to controller
- [ ] Publish events for suggestion lifecycle
- [ ] Add DTOs with validation

### Frontend Tasks
- [ ] Create `StoryPointSuggestionCard.tsx` component
- [ ] Implement inline editing for point adjustment
- [ ] Add confidence badge with color-coded levels
- [ ] Implement cold-start warning display
- [ ] Add complexity factors display
- [ ] Integrate "Suggest Points" button in task detail panel
- [ ] Handle suggestion accept/reject actions
- [ ] Update task form with accepted points

### Integration Tasks
- [ ] Test suggestion request with various task types
- [ ] Test accept flow updates task correctly
- [ ] Test reject flow dismisses suggestion
- [ ] Test edit flow allows point modification
- [ ] Test suggestion expiry (24h)
- [ ] Test workspace isolation

---

## Testing Requirements

### Unit Tests

**Backend (NestJS):**
- `EstimationService.suggestStoryPoints()` creates suggestion
- `EstimationService.acceptStoryPointSuggestion()` updates task
- `EstimationService.rejectStoryPointSuggestion()` marks rejected
- Suggestion expiry logic working
- Workspace scoping enforced

**Location:** `apps/api/src/pm/agents/estimation.service.spec.ts`

**Frontend (Vitest):**
- `StoryPointSuggestionCard` renders suggestion correctly
- Edit mode toggles and updates points
- Accept button triggers callback with points
- Reject button triggers callback
- Confidence badges display correct colors
- Cold-start warning appears when needed

**Location:** `apps/web/src/components/pm/agents/StoryPointSuggestionCard.test.tsx`

### Integration Tests

**API Endpoints:**
- `POST /api/pm/agents/estimation/suggest-points` returns suggestion
- `POST /api/pm/agents/estimation/suggestions/:id/accept` updates task
- `POST /api/pm/agents/estimation/suggestions/:id/reject` marks rejected
- Workspace isolation enforced
- Events published correctly

**Location:** `apps/api/test/pm/agents/estimation.e2e-spec.ts`

### E2E Tests (Playwright)

**User Flows:**
1. Create task → click "Suggest Points" → Sage provides suggestion → accept
2. Create task → get suggestion → edit points → apply → task updated
3. Create task → get suggestion → dismiss → no changes applied
4. View suggestion → see cold-start warning (new project)
5. View suggestion → see similar tasks reference (existing data)

**Location:** `apps/web/e2e/pm/agents/sage-story-points.spec.ts`

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Sage suggests story points for tasks
- [ ] Users can accept, modify, or reject suggestions
- [ ] Suggestions show reasoning and similar tasks
- [ ] Point suggestions integrate with task detail panel
- [ ] Suggestion records tracked in database
- [ ] Accept flow updates task correctly
- [ ] Reject flow dismisses suggestion
- [ ] Edit mode allows point adjustment
- [ ] Unit tests passing (backend + frontend)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated:
  - [ ] Story point suggestion flow
  - [ ] API endpoint docs
  - [ ] Component usage guide
- [ ] Workspace isolation verified
- [ ] Event publishing working

---

## References

- [Epic Definition](../epics/epic-pm-04-ai-team-navi-sage-chrono.md)
- [Epic Tech Spec](../epics/epic-pm-04-tech-spec.md)
- [Story PM-04.5 (Sage Estimation Agent)](./pm-04-5-sage-estimation-agent.md)
- [Module PRD](../PRD.md)
- [Module Architecture](../architecture.md)
- [Sprint Status](../sprint-status.yaml)

---

## Dev Notes

### Suggestion Expiry

Suggestions auto-expire after 24 hours to keep the suggestion queue clean. Expired suggestions are marked with `status: 'EXPIRED'` but remain in the database for analytics.

### Override Tracking

When a user edits the suggested points before accepting:
- The original suggestion is stored
- The override value is recorded
- This helps Sage learn from user adjustments (PM-04.6)

### Inline vs Modal

This implementation uses inline suggestion cards within the task detail panel rather than a separate modal. This provides:
- Faster workflow (no context switch)
- Better visual continuity
- Easier comparison with existing task data

### Confidence Thresholds

Story point suggestions don't go through the approval queue (unlike task creation suggestions) because:
- Points are easily editable by the user
- Impact is low (just a planning metric)
- Users have final say on all estimates

### Multiple Suggestions

Users can request multiple suggestions for the same task (e.g., after editing the description). Each suggestion is tracked separately, and only the most recent one is displayed.

### Integration with PM-04.5

This story extends PM-04.5 by:
- Adding focused story point endpoints
- Creating inline UI components
- Tracking suggestion lifecycle
- Enabling quick acceptance workflow

The core estimation logic from PM-04.5 is reused without modification.

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
