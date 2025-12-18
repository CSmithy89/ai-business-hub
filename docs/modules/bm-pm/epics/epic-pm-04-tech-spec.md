# Epic PM-04 Technical Specification: AI Team - Navi, Sage, Chrono

**Epic:** PM-04 - AI Team (Navi, Sage, Chrono)
**FRs Covered:** FR-5.1, FR-5.2, FR-5.3, FR-5.4, FR-6.3 (partial)
**Stories:** 9 (PM-04.1 to PM-04.9)
**Created:** 2025-12-18
**Status:** Technical Context

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Agent Design](#agent-design)
4. [Data Model Changes](#data-model-changes)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Integration Points](#integration-points)
8. [Story Breakdown with Technical Notes](#story-breakdown-with-technical-notes)
9. [Dependencies](#dependencies)
10. [Testing Strategy](#testing-strategy)
11. [Risk Assessment](#risk-assessment)

---

## Executive Summary

Epic PM-04 introduces the first wave of AI agents for project management: Navi (orchestration), Sage (estimation), and Chrono (time tracking). These agents provide intelligent assistance while maintaining the core principle of human oversight through suggestion mode and approval queues.

### Key Objectives

1. **Navi Agent** - PM orchestration assistant that helps users manage their projects through natural language commands, daily briefings, and contextual suggestions
2. **Sage Agent** - Estimation specialist that provides AI-powered task estimates and learns from actual vs estimated time to improve accuracy
3. **Chrono Agent** - Time tracking assistant that manages timers, generates reports, and provides insights into where time is spent

### Technical Approach

- **Agno Framework** - Use Agno for agent implementation following existing patterns in `agents/planning/team.py`
- **Suggestion Mode** - Agents suggest actions but never auto-execute; human approval required
- **KB Context** - Navi uses RAG to pull context from Knowledge Base (KB-02 prerequisite)
- **Shared Storage** - Agents share PostgreSQL storage for team context and learning
- **BYOAI Integration** - All agents use workspace-configured AI providers

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PM AI Team (PM-04)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Frontend (Next.js)                                                         │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  Agent Panel UI                                                       │  │
│   │  • AgentChatPanel (minimizable, persistent)                          │  │
│   │  • AgentSelector (Navi, Sage, Chrono)                               │  │
│   │  • SuggestionCard (preview, edit, accept/reject)                    │  │
│   │  • DailyBriefing (notification + expandable)                        │  │
│   │  • TimeTracker (timer controls, time entries)                       │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│                                     ▼                                        │
│   Backend (NestJS)                                                           │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  PM Agents Module: apps/api/src/pm/agents/                           │  │
│   │  • agents.service.ts          - Agent invocation & routing           │  │
│   │  • chat.service.ts            - Conversation history management      │  │
│   │  • suggestion.service.ts      - Suggestion lifecycle                 │  │
│   │  • briefing.service.ts        - Daily briefing generation            │  │
│   │  • time-tracking.service.ts   - Timer state & time entries          │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│                                     ▼                                        │
│   Agent Layer (Python/Agno)                                                 │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  agents/pm/team.py - PM Agent Team Factory                           │  │
│   │                                                                       │  │
│   │  ┌────────────┐      ┌────────────┐      ┌────────────┐             │  │
│   │  │   Navi     │      │    Sage    │      │  Chrono    │             │  │
│   │  │ (Orchestr) │      │ (Estimate) │      │  (Timer)   │             │  │
│   │  └────────────┘      └────────────┘      └────────────┘             │  │
│   │                                                                       │  │
│   │  Tools:                                                               │  │
│   │  • get_project_status, list_tasks, search_kb                        │  │
│   │  • create_task, update_task, assign_task                            │  │
│   │  • estimate_task, get_similar_tasks                                 │  │
│   │  • start_timer, stop_timer, log_time                                │  │
│   │  • generate_briefing, generate_report                                │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│                                     ▼                                        │
│   Data Layer (Prisma + PostgreSQL)                                          │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  New Models:                                                          │  │
│   │  • AgentConversation      - Chat history per agent per project       │  │
│   │  • AgentSuggestion        - Suggested actions awaiting approval      │  │
│   │  • TimeEntry              - Time tracking records                    │  │
│   │  • TimerState             - Active timer state                       │  │
│   │  • EstimationMetric       - Accuracy tracking for Sage learning     │  │
│   │                                                                       │  │
│   │  Extended Models:                                                     │  │
│   │  • Task                   - Add estimatedHours, actualHours          │  │
│   │  • Task                   - Add confidenceScore (from Sage)          │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Flow

**User Interaction Flow:**
```
User types "Create a task for API design review"
         ↓
Frontend: POST /api/pm/agents/chat { agent: 'navi', message: '...' }
         ↓
Backend: AgentsService.chat()
  1. Load conversation history
  2. Invoke Navi agent (Python via Agno)
  3. Navi parses intent: "create_task"
  4. Navi generates suggestion (not execution)
         ↓
Backend: SuggestionService.create()
  1. Create AgentSuggestion record
  2. Publish agent.suggestion event
         ↓
Frontend: Displays SuggestionCard
  → Preview: "Task: API design review"
  → Buttons: "Create", "Edit & Create", "Dismiss"
         ↓
User clicks "Create"
         ↓
Frontend: POST /api/pm/agents/suggestions/:id/accept
         ↓
Backend: SuggestionService.accept()
  1. Execute suggested action (create task)
  2. Log acceptance in suggestion history
  3. Publish task.created event
         ↓
Frontend: Navigate to new task
```

**Daily Briefing Flow:**
```
Cron Job (8am user's timezone)
         ↓
Backend: BriefingService.generateDailyBriefing()
  1. Get user's active projects
  2. Invoke Navi agent for each project
  3. Generate briefing: tasks due, blockers, recommendations
         ↓
Backend: NotificationService.send()
  1. WebSocket to online users
  2. Email if user is offline (preference)
         ↓
Frontend: Notification banner
  → "Your daily briefing is ready"
  → Click → expands briefing panel
```

---

## Agent Design

### Agent Team Structure

Following the pattern from `agents/planning/team.py`:

```python
# agents/pm/team.py

def create_pm_team(
    session_id: str,
    user_id: str,
    workspace_id: str,
    project_id: str,
) -> Team:
    """Create PM agent team for a project."""

    # Shared memory for team context
    shared_memory = Memory(
        db=PostgresStorage(
            table_name=f"pm_agent_memory_{workspace_id}",
            schema="agent_memory"
        ),
        namespace=f"project:{project_id}"
    )

    # Create agents
    navi = create_navi_agent(workspace_id, project_id, shared_memory)
    sage = create_sage_agent(workspace_id, project_id, shared_memory)
    chrono = create_chrono_agent(workspace_id, project_id, shared_memory)

    return Team(
        name="PM Team",
        mode="coordinate",
        leader=navi,
        members=[sage, chrono],
        memory=shared_memory,
        session_id=session_id,
        user_id=user_id,
        settings={
            "suggestion_mode": True,  # Never auto-execute
            "confidence_threshold": 0.85,
            "kb_rag_enabled": True,
        }
    )
```

### Navi - PM Orchestration Agent

**Location:** `agents/pm/navi.py`

**Role:** Team leader, orchestrates PM operations, provides contextual help

**Capabilities:**
- Answer questions about project status
- Parse natural language commands
- Generate task suggestions (not execute)
- Generate daily briefings
- Search KB for relevant context
- Coordinate with Sage and Chrono

**Tools:**
```python
tools = [
    get_project_status,      # Get project overview
    list_tasks,              # List tasks with filters
    search_kb,               # RAG search in KB (KB-02)
    create_task_suggestion,  # Suggest task creation
    update_task_suggestion,  # Suggest task update
    assign_task_suggestion,  # Suggest assignment
    move_task_suggestion,    # Suggest status change
    set_priority_suggestion, # Suggest priority change
    generate_daily_briefing, # Create briefing content
]
```

**Instructions:**
```python
NAVI_INSTRUCTIONS = [
    "You are Navi, the PM orchestration assistant for HYVVE projects.",
    "Help users manage their projects through natural language conversation.",
    "Always suggest actions, never execute directly.",
    "Use KB search to provide context-aware answers.",
    "Generate daily briefings highlighting tasks due, blockers, and recommendations.",
    "Delegate estimation questions to Sage.",
    "Delegate time tracking to Chrono.",
    "Keep responses concise and actionable.",
]
```

**Suggestion Format:**
```typescript
interface NaviSuggestion {
  action: 'create_task' | 'update_task' | 'assign_task' | 'move_to_phase' | 'set_priority';
  confidence: number;  // 0-1
  preview: {
    title?: string;
    description?: string;
    assignee?: string;
    phase?: string;
    priority?: string;
  };
  reasoning: string;  // Why this suggestion
}
```

### Sage - Estimation Agent

**Location:** `agents/pm/sage.py`

**Role:** Task estimation specialist, learns from actuals

**Capabilities:**
- Estimate story points and hours for tasks
- Learn from actual vs estimated time
- Provide confidence scores
- Suggest cold-start defaults for new projects
- Find similar historical tasks

**Tools:**
```python
tools = [
    estimate_task,           # Generate estimate
    get_similar_tasks,       # Find comparable tasks
    calculate_velocity,      # Team velocity
    get_estimation_metrics,  # Historical accuracy
    update_estimation_model, # Learn from actuals
]
```

**Instructions:**
```python
SAGE_INSTRUCTIONS = [
    "You are Sage, the task estimation specialist.",
    "Provide story point and hour estimates based on task description and type.",
    "Use historical data when available.",
    "For new projects, use industry benchmarks with 'low' confidence.",
    "Show basis for estimates: 'Based on similar tasks in this project'.",
    "Learn from actual vs estimated time to improve accuracy.",
    "Provide three confidence levels: low (cold-start), medium (some data), high (strong pattern).",
]
```

**Estimation Output:**
```typescript
interface SageEstimate {
  storyPoints: number;
  estimatedHours: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  confidenceScore: number;  // 0-1
  basis: string;  // "Based on 5 similar tasks (avg 8h)"
  coldStart: boolean;  // True if no historical data
  similarTasks?: string[];  // IDs of similar tasks
}
```

**Learning Algorithm:**
```python
def update_estimation_accuracy(task_id: str):
    """Update Sage's learning model after task completion."""

    # Get task with estimates and actuals
    task = get_task_with_metrics(task_id)

    # Calculate error
    error_hours = task.actualHours - task.estimatedHours
    error_points = task.actualStoryPoints - task.storyPoints

    # Store metric
    EstimationMetric.create({
        'taskId': task_id,
        'taskType': task.type,
        'estimatedHours': task.estimatedHours,
        'actualHours': task.actualHours,
        'errorHours': error_hours,
        'errorPercentage': error_hours / task.estimatedHours,
        'projectId': task.projectId,
    })

    # Adjust future estimates for this task type
    update_task_type_baseline(task.projectId, task.type, error_hours)
```

### Chrono - Time Tracking Agent

**Location:** `agents/pm/chrono.py`

**Role:** Time tracking and reporting

**Capabilities:**
- Manage timer state (start/stop)
- Log time entries
- Generate time reports
- Compare estimated vs actual
- Detect stale tasks (no activity)

**Tools:**
```python
tools = [
    start_timer,             # Start timer for task
    stop_timer,              # Stop timer, log entry
    log_manual_time,         # Manual time entry
    get_time_entries,        # Get entries for task/project
    generate_time_report,    # Time by task/phase/member
    get_active_timers,       # Get running timers
    detect_stale_tasks,      # Find tasks with no recent activity
]
```

**Instructions:**
```python
CHRONO_INSTRUCTIONS = [
    "You are Chrono, the time tracking assistant.",
    "Help users track time spent on tasks.",
    "Manage timer state across sessions (persisted in DB).",
    "Generate reports showing time by task, phase, and team member.",
    "Compare estimated vs actual time.",
    "Alert users to tasks with no recent activity.",
    "Support manual time entry with optional notes.",
]
```

**Timer State Management:**
```typescript
interface TimerState {
  id: string;
  taskId: string;
  userId: string;
  startedAt: Date;
  description?: string;  // Optional note about what's being worked on
  // On stop:
  endedAt?: Date;
  durationSeconds?: number;
}

interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  durationSeconds: number;
  note?: string;
  startedAt: Date;
  endedAt: Date;
  createdAt: Date;
}
```

---

## Data Model Changes

### New Models

Add to `packages/db/prisma/schema.prisma`:

```prisma
// ============================================
// PM AGENTS (PM-04)
// ============================================

/// AgentConversation - Chat history per agent per project
model AgentConversation {
  id          String   @id @default(cuid())
  workspaceId String   @map("workspace_id")
  projectId   String   @map("project_id")
  userId      String   @map("user_id")
  agentName   String   @map("agent_name")  // 'navi', 'sage', 'chrono'

  // Conversation
  role        ConversationRole  // 'user' | 'agent'
  message     String   @db.Text
  metadata    Json?    // Agent response metadata, tool calls, etc.

  // Timestamps
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([workspaceId, projectId, agentName])
  @@index([userId, agentName])
  @@index([createdAt])
  @@map("agent_conversations")
}

/// AgentSuggestion - Suggested actions awaiting approval
model AgentSuggestion {
  id          String   @id @default(cuid())
  workspaceId String   @map("workspace_id")
  projectId   String   @map("project_id")
  userId      String   @map("user_id")
  agentName   String   @map("agent_name")

  // Suggestion
  action      SuggestionAction
  payload     Json     // Action-specific data (e.g., task fields)
  confidence  Float    // 0-1 confidence score
  reasoning   String   @db.Text

  // Status
  status      SuggestionStatus @default(PENDING)
  acceptedAt  DateTime? @map("accepted_at")
  rejectedAt  DateTime? @map("rejected_at")

  // Timestamps
  createdAt   DateTime @default(now()) @map("created_at")
  expiresAt   DateTime @map("expires_at")  // Auto-expire after 24h

  @@index([workspaceId, projectId])
  @@index([userId, status])
  @@index([agentName, status])
  @@index([createdAt])
  @@map("agent_suggestions")
}

/// TimeEntry - Time tracking records
model TimeEntry {
  id              String   @id @default(cuid())
  workspaceId     String   @map("workspace_id")
  taskId          String   @map("task_id")
  userId          String   @map("user_id")

  // Time
  durationSeconds Int      @map("duration_seconds")
  startedAt       DateTime @map("started_at")
  endedAt         DateTime @map("ended_at")

  // Notes
  note            String?  @db.VarChar(500)

  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")

  // Relations
  task            Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
  @@index([taskId])
  @@index([userId])
  @@index([startedAt])
  @@map("time_entries")
}

/// TimerState - Active timer state (only one per user at a time)
model TimerState {
  id          String   @id @default(cuid())
  workspaceId String   @map("workspace_id")
  taskId      String   @map("task_id")
  userId      String   @map("user_id")

  // Timer
  startedAt   DateTime @map("started_at")
  description String?  @db.VarChar(200)

  // Timestamps
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  task        Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@unique([userId])  // Only one timer per user
  @@index([workspaceId])
  @@index([taskId])
  @@map("timer_states")
}

/// EstimationMetric - Historical estimation accuracy for Sage learning
model EstimationMetric {
  id                String   @id @default(cuid())
  workspaceId       String   @map("workspace_id")
  projectId         String   @map("project_id")
  taskId            String   @map("task_id")
  taskType          TaskType @map("task_type")

  // Estimates
  estimatedHours    Float?   @map("estimated_hours")
  estimatedPoints   Int?     @map("estimated_points")
  confidenceScore   Float?   @map("confidence_score")

  // Actuals
  actualHours       Float?   @map("actual_hours")
  actualPoints      Int?     @map("actual_points")

  // Error
  errorHours        Float?   @map("error_hours")
  errorPercentage   Float?   @map("error_percentage")

  // Timestamps
  createdAt         DateTime @default(now()) @map("created_at")

  @@index([workspaceId, projectId, taskType])
  @@index([taskId])
  @@index([createdAt])
  @@map("estimation_metrics")
}

// Enums
enum ConversationRole {
  USER
  AGENT
}

enum SuggestionAction {
  CREATE_TASK
  UPDATE_TASK
  ASSIGN_TASK
  MOVE_TO_PHASE
  SET_PRIORITY
  ESTIMATE_TASK
  START_TIMER
  STOP_TIMER
}

enum SuggestionStatus {
  PENDING
  ACCEPTED
  REJECTED
  EXPIRED
}
```

### Extended Models

Extend existing Task model:

```prisma
model Task {
  // ... existing fields ...

  // Estimation (from Sage)
  storyPoints     Int?
  estimatedHours  Float?   @map("estimated_hours")
  actualHours     Float?   @map("actual_hours")
  confidenceScore Float?   @map("confidence_score")  // From Sage

  // Relations
  timeEntries     TimeEntry[]
  timerStates     TimerState[]

  // ... rest of model ...
}
```

---

## API Endpoints

### Agent Chat Endpoints

```yaml
# Base path: /api/pm/agents

POST /api/pm/agents/chat
  Description: Send message to an agent
  Body:
    projectId: string
    agentName: 'navi' | 'sage' | 'chrono'
    message: string
  Response:
    conversationId: string
    response: string
    suggestions?: AgentSuggestion[]
    metadata?: Record<string, any>
  Events: agent.message.sent

GET /api/pm/agents/conversations/:projectId
  Description: Get conversation history for project
  Query:
    agentName?: 'navi' | 'sage' | 'chrono'
    limit?: number
  Response: AgentConversation[]

DELETE /api/pm/agents/conversations/:projectId
  Description: Clear conversation history
  Response: { success: true }
```

### Suggestion Endpoints

```yaml
# Base path: /api/pm/agents/suggestions

GET /api/pm/agents/suggestions
  Description: Get pending suggestions for user
  Query:
    projectId?: string
    agentName?: string
    status?: 'pending' | 'accepted' | 'rejected'
  Response: AgentSuggestion[]

POST /api/pm/agents/suggestions/:id/accept
  Description: Accept and execute suggestion
  Response:
    success: true
    result: any  # Result of executed action
  Events: suggestion.accepted, task.created (or other action event)

POST /api/pm/agents/suggestions/:id/reject
  Description: Reject suggestion
  Body:
    reason?: string
  Response: { success: true }
  Events: suggestion.rejected

DELETE /api/pm/agents/suggestions/:id
  Description: Dismiss suggestion
  Response: { success: true }
```

### Briefing Endpoints

```yaml
# Base path: /api/pm/agents/briefings

GET /api/pm/agents/briefings/daily
  Description: Get today's daily briefing for all projects
  Response:
    briefings: Array<{
      projectId: string
      projectName: string
      tasksDueToday: number
      overdueTasks: number
      blockers: string[]
      recommendations: string[]
      recentActivity: string[]
    }>
    generatedAt: string

POST /api/pm/agents/briefings/generate
  Description: Regenerate briefing on demand
  Body:
    projectId: string
  Response: Briefing
```

### Time Tracking Endpoints

```yaml
# Base path: /api/pm/agents/time

POST /api/pm/agents/time/start
  Description: Start timer for a task
  Body:
    taskId: string
    description?: string
  Response: TimerState
  Events: timer.started

POST /api/pm/agents/time/stop
  Description: Stop active timer
  Body:
    note?: string
  Response:
    timerState: TimerState
    timeEntry: TimeEntry
  Events: timer.stopped, time.logged

POST /api/pm/agents/time/log
  Description: Manually log time
  Body:
    taskId: string
    durationSeconds: number
    note?: string
    startedAt?: string
  Response: TimeEntry
  Events: time.logged

GET /api/pm/agents/time/entries
  Description: Get time entries
  Query:
    taskId?: string
    projectId?: string
    userId?: string
    startDate?: string
    endDate?: string
  Response: TimeEntry[]

GET /api/pm/agents/time/active
  Description: Get active timer for current user
  Response: TimerState | null

GET /api/pm/agents/time/reports/:projectId
  Description: Generate time report
  Query:
    groupBy: 'task' | 'phase' | 'member'
    startDate?: string
    endDate?: string
  Response:
    groups: Array<{
      name: string
      totalSeconds: number
      estimatedHours?: number
      variance?: number
    }>
    totalSeconds: number
```

### Estimation Endpoints

```yaml
# Base path: /api/pm/agents/estimation

POST /api/pm/agents/estimation/estimate
  Description: Get Sage estimate for a task
  Body:
    title: string
    description?: string
    type: TaskType
    projectId: string
  Response: SageEstimate

GET /api/pm/agents/estimation/metrics/:projectId
  Description: Get estimation accuracy metrics
  Response:
    averageError: number
    averageAccuracy: number
    totalEstimations: number
    byTaskType: Record<TaskType, {
      avgError: number
      avgAccuracy: number
      count: number
    }>
```

---

## Frontend Components

### Component Structure

```
apps/web/src/components/pm/agents/
├── AgentPanel.tsx              # Main agent panel (minimizable)
├── AgentSelector.tsx           # Switch between Navi/Sage/Chrono
├── AgentChat.tsx               # Chat interface
├── SuggestionCard.tsx          # Action preview/approval
├── DailyBriefing.tsx           # Briefing display
├── TimeTracker.tsx             # Timer controls
├── TimeEntryList.tsx           # Time entry history
├── TimeReportChart.tsx         # Time reports visualization
└── EstimationDisplay.tsx       # Show Sage estimates
```

### Key Components

#### AgentPanel Component

```typescript
// apps/web/src/components/pm/agents/AgentPanel.tsx

'use client';

import { useState } from 'react';
import { Minimize2, Maximize2 } from 'lucide-react';
import { AgentSelector } from './AgentSelector';
import { AgentChat } from './AgentChat';
import { cn } from '@/lib/utils';

type AgentName = 'navi' | 'sage' | 'chrono';

interface AgentPanelProps {
  projectId: string;
}

export function AgentPanel({ projectId }: AgentPanelProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentName>('navi');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 bg-background border rounded-lg shadow-xl transition-all",
        isMinimized ? "w-80 h-14" : "w-96 h-[600px]"
      )}
    >
      <div className="flex items-center justify-between p-3 border-b">
        <AgentSelector
          selected={selectedAgent}
          onSelect={setSelectedAgent}
        />

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-accent rounded"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-accent rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <AgentChat
          projectId={projectId}
          agentName={selectedAgent}
        />
      )}
    </div>
  );
}
```

#### SuggestionCard Component

```typescript
// apps/web/src/components/pm/agents/SuggestionCard.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, X, Edit } from 'lucide-react';

interface SuggestionCardProps {
  suggestion: AgentSuggestion;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
  onEdit: () => void;
}

export function SuggestionCard({
  suggestion,
  onAccept,
  onReject,
  onEdit
}: SuggestionCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await onAccept();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 mb-3 border-l-4 border-l-blue-500">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-medium text-muted-foreground">
            {suggestion.agentName.toUpperCase()} suggests
          </span>
          <h4 className="font-medium">{getActionLabel(suggestion.action)}</h4>
        </div>
        <div className="text-xs text-muted-foreground">
          {(suggestion.confidence * 100).toFixed(0)}% confidence
        </div>
      </div>

      <div className="mb-3 text-sm">
        <SuggestionPreview
          action={suggestion.action}
          payload={suggestion.payload}
        />
      </div>

      <div className="text-xs text-muted-foreground mb-3">
        {suggestion.reasoning}
      </div>

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
        <Button
          size="sm"
          variant="ghost"
          onClick={onReject}
          disabled={isLoading}
        >
          <X className="w-4 h-4 mr-1" />
          Dismiss
        </Button>
      </div>
    </Card>
  );
}
```

#### TimeTracker Component

```typescript
// apps/web/src/components/pm/agents/TimeTracker.tsx

'use client';

import { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/utils';

interface TimeTrackerProps {
  taskId: string;
  onStart: () => Promise<void>;
  onStop: (note?: string) => Promise<void>;
}

export function TimeTracker({ taskId, onStart, onStop }: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Fetch active timer on mount
  useEffect(() => {
    fetchActiveTimer();
  }, [taskId]);

  // Update elapsed time every second
  useEffect(() => {
    if (!isRunning || !startedAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const seconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
      setElapsed(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, startedAt]);

  const handleStart = async () => {
    await onStart();
    setIsRunning(true);
    setStartedAt(new Date());
  };

  const handleStop = async () => {
    const note = prompt('Add a note about this time entry (optional):');
    await onStop(note || undefined);
    setIsRunning(false);
    setStartedAt(null);
    setElapsed(0);
  };

  return (
    <div className="flex items-center gap-3">
      {isRunning ? (
        <>
          <div className="text-2xl font-mono font-bold">
            {formatDuration(elapsed)}
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleStop}
          >
            <Square className="w-4 h-4 mr-1" />
            Stop
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          onClick={handleStart}
        >
          <Play className="w-4 h-4 mr-1" />
          Start Timer
        </Button>
      )}
    </div>
  );
}
```

---

## Integration Points

### Integration with Approval Queue

Suggestions flow through existing approval infrastructure:

```typescript
// When suggestion is accepted with confidence < 85%
if (suggestion.confidence < 0.85) {
  // Route to approval queue
  await approvalService.createApprovalItem({
    type: 'agent_suggestion',
    entityId: suggestion.id,
    metadata: {
      agentName: suggestion.agentName,
      action: suggestion.action,
      payload: suggestion.payload,
      reasoning: suggestion.reasoning,
    },
    confidence: suggestion.confidence,
  });
} else {
  // Execute directly
  await executeSuggestion(suggestion);
}
```

### Integration with KB (KB-02 Prerequisite)

Navi uses RAG to pull context:

```python
# In Navi agent tools

@tool
def search_kb(query: str, project_id: str) -> str:
    """Search Knowledge Base for relevant context."""

    # Call KB RAG endpoint
    response = requests.post(
        f"{API_URL}/api/kb/rag/query",
        json={
            "query": query,
            "projectId": project_id,
            "topK": 3,
        }
    )

    results = response.json()

    # Format for agent context
    context = "\n\n".join([
        f"[{r['pageTitle']}]\n{r['chunkText']}"
        for r in results
    ])

    return context
```

### Event Bus Integration

Agents publish events:

```typescript
export const AgentEvents = {
  MESSAGE_SENT: 'agent.message.sent',
  SUGGESTION_CREATED: 'agent.suggestion.created',
  SUGGESTION_ACCEPTED: 'agent.suggestion.accepted',
  SUGGESTION_REJECTED: 'agent.suggestion.rejected',
  BRIEFING_GENERATED: 'agent.briefing.generated',
  TIMER_STARTED: 'agent.timer.started',
  TIMER_STOPPED: 'agent.timer.stopped',
  TIME_LOGGED: 'agent.time.logged',
  ESTIMATION_CREATED: 'agent.estimation.created',
  ESTIMATION_UPDATED: 'agent.estimation.updated',
} as const;
```

### WebSocket Integration

Real-time updates for agent responses and suggestions:

```typescript
// In RealtimeGateway
@SubscribeMessage('agent:subscribe')
handleAgentSubscribe(client: Socket, payload: { projectId: string }) {
  client.join(`project:${payload.projectId}:agents`);
}

// In AgentsService
async sendAgentResponse(projectId: string, response: any) {
  this.realtimeGateway.server
    .to(`project:${projectId}:agents`)
    .emit('agent:response', response);
}
```

---

## Story Breakdown with Technical Notes

### PM-04.1: Navi Agent Foundation

**Goal:** Create Navi agent with basic PM orchestration capabilities.

**Implementation:**
1. Create `agents/pm/navi.py` with Agno agent definition
2. Implement tools: `get_project_status`, `list_tasks`, `search_kb`
3. Create `agents/pm/team.py` factory pattern
4. Add `apps/api/src/pm/agents/agents.service.ts` for invocation
5. Implement chat endpoint: `POST /api/pm/agents/chat`

**Files:**
- `agents/pm/navi.py`
- `agents/pm/team.py`
- `agents/pm/tools/pm_tools.py`
- `apps/api/src/pm/agents/agents.module.ts`
- `apps/api/src/pm/agents/agents.service.ts`
- `apps/api/src/pm/agents/agents.controller.ts`

**Tests:**
- Navi responds to "What tasks are due today?"
- Navi uses KB search for context
- Agent invocation logs conversation history

### PM-04.2: Navi Suggestion Mode

**Goal:** Navi suggests actions without auto-executing.

**Implementation:**
1. Add `AgentSuggestion` model to Prisma
2. Implement `SuggestionService` for lifecycle
3. Create suggestion tools for Navi
4. Build `SuggestionCard` component
5. Add acceptance/rejection endpoints

**Files:**
- `packages/db/prisma/schema.prisma` (add AgentSuggestion)
- `apps/api/src/pm/agents/suggestion.service.ts`
- `apps/web/src/components/pm/agents/SuggestionCard.tsx`

**Tests:**
- Navi creates suggestion instead of executing
- User can accept/reject/edit suggestion
- Accepted suggestions execute correctly
- Rejected suggestions are logged

### PM-04.3: Navi Chat Commands

**Goal:** Parse natural language commands and maintain context.

**Implementation:**
1. Enhance Navi with intent parsing
2. Add multi-turn conversation support
3. Implement command tools: `create_task`, `update_task`, `assign_to`, `set_priority`
4. Build `AgentChat` component
5. Add conversation history storage

**Files:**
- `agents/pm/tools/command_tools.py`
- `apps/api/src/pm/agents/chat.service.ts`
- `apps/web/src/components/pm/agents/AgentChat.tsx`

**Tests:**
- "Create a task for API review" → creates suggestion
- "Assign it to John" → maintains context, suggests assignment
- Conversation history persists across sessions

### PM-04.4: Navi Daily Briefing

**Goal:** Generate morning summary with tasks, blockers, recommendations.

**Implementation:**
1. Add `BriefingService` for generation
2. Create cron job for scheduled generation
3. Implement `generate_daily_briefing` tool
4. Build `DailyBriefing` component
5. Add notification integration

**Files:**
- `apps/api/src/pm/agents/briefing.service.ts`
- `apps/api/src/pm/agents/briefing.cron.ts`
- `apps/web/src/components/pm/agents/DailyBriefing.tsx`

**Tests:**
- Briefing includes tasks due today
- Briefing detects blockers (no assignee, dependencies)
- Notification sent at configured time

### PM-04.5: Sage Agent - Task Estimation

**Goal:** AI-powered estimation with cold-start handling.

**Implementation:**
1. Create `agents/pm/sage.py` agent
2. Implement estimation algorithm (similar tasks, baselines)
3. Add `estimate_task` tool
4. Build estimation API endpoints
5. Create `EstimationDisplay` component

**Files:**
- `agents/pm/sage.py`
- `agents/pm/tools/estimation_tools.py`
- `apps/api/src/pm/agents/estimation.service.ts`
- `apps/web/src/components/pm/agents/EstimationDisplay.tsx`

**Tests:**
- Cold-start estimates use industry benchmarks
- Similar tasks used as basis when available
- Confidence score reflects data quality

### PM-04.6: Sage Estimation Learning

**Goal:** Learn from actual vs estimated to improve accuracy.

**Implementation:**
1. Add `EstimationMetric` model
2. Implement learning algorithm
3. Update estimates on task completion
4. Show accuracy metrics in UI
5. Adjust baselines per project

**Files:**
- `packages/db/prisma/schema.prisma` (add EstimationMetric)
- `apps/api/src/pm/agents/estimation-learning.service.ts`

**Tests:**
- Metrics stored on task completion
- Future estimates adjust based on error
- Accuracy improves over time

### PM-04.7: Chrono Agent - Time Tracking

**Goal:** Timer management and time entry logging.

**Implementation:**
1. Create `agents/pm/chrono.py` agent
2. Add `TimerState` and `TimeEntry` models
3. Implement timer tools: `start_timer`, `stop_timer`, `log_manual_time`
4. Build `TimeTracker` component
5. Add time tracking API endpoints

**Files:**
- `agents/pm/chrono.py`
- `agents/pm/tools/time_tools.py`
- `packages/db/prisma/schema.prisma` (add TimerState, TimeEntry)
- `apps/api/src/pm/agents/time-tracking.service.ts`
- `apps/web/src/components/pm/agents/TimeTracker.tsx`

**Tests:**
- Timer persists across page navigation
- Only one timer per user at a time
- Manual time entry works
- Time entries visible in task activity

### PM-04.8: Chrono Time Reports

**Goal:** Generate reports comparing estimated vs actual.

**Implementation:**
1. Implement report generation logic
2. Add grouping (task, phase, member)
3. Calculate variance and trends
4. Build `TimeReportChart` component
5. Add CSV export

**Files:**
- `apps/api/src/pm/agents/time-reporting.service.ts`
- `apps/web/src/components/pm/agents/TimeReportChart.tsx`

**Tests:**
- Report groups by task/phase/member
- Variance calculated correctly
- CSV export includes all data

### PM-04.9: Agent Panel UI

**Goal:** Unified panel for all agent interactions.

**Implementation:**
1. Build `AgentPanel` container component
2. Add `AgentSelector` for switching agents
3. Implement minimizable/persistent state
4. Add conversation history per agent
5. WebSocket integration for real-time responses

**Files:**
- `apps/web/src/components/pm/agents/AgentPanel.tsx`
- `apps/web/src/components/pm/agents/AgentSelector.tsx`

**Tests:**
- Panel minimizes without losing state
- Agent switching preserves conversation
- Real-time responses appear instantly
- Panel accessible from all project pages

---

## Dependencies

### Prerequisites from Other Epics

**Required:**
- PM-01 (Projects, Phases) - Agents need project context
- PM-02 (Tasks) - Agents operate on tasks
- KB-02 (RAG) - Navi uses semantic search for context

**Optional:**
- PM-03 (Views) - Agents can suggest saved views
- PM-06 (Notifications) - Daily briefing delivery

### External Dependencies

**NPM Packages (Backend):**
```json
{
  "@nestjs/schedule": "^4.0.0",  // For cron jobs
  "@nestjs/bullmq": "^10.0.0"     // For background jobs
}
```

**Python Packages (Agents):**
```txt
agno>=0.1.0
anthropic>=0.18.0
openai>=1.0.0
psycopg2-binary>=2.9.0
```

### Infrastructure

- PostgreSQL 16+ (existing)
- Redis (for BullMQ queues)
- Python 3.12+ runtime
- FastAPI for agent API (or integrate with NestJS)

---

## Testing Strategy

### Unit Tests

**Backend (NestJS):**
- AgentsService: Agent invocation, conversation storage
- SuggestionService: Lifecycle, acceptance/rejection
- BriefingService: Generation logic
- TimeTrackingService: Timer state management
- EstimationService: Learning algorithm

**Agents (Python):**
- Navi: Intent parsing, KB search
- Sage: Estimation algorithm, similarity matching
- Chrono: Timer operations, report generation

**Frontend (Vitest):**
- AgentPanel: Minimize/maximize, state persistence
- SuggestionCard: Accept/reject/edit actions
- TimeTracker: Timer display, formatting

### Integration Tests

**API Endpoints:**
- POST /api/pm/agents/chat → invokes agent, returns response
- POST /api/pm/agents/suggestions/:id/accept → executes action
- POST /api/pm/agents/time/start → creates TimerState
- GET /api/pm/agents/briefings/daily → generates briefing

**Event Publishing:**
- Verify agent.suggestion.created event
- Verify timer.started event
- Verify suggestion.accepted event

### E2E Tests (Playwright)

**User Flows:**
1. Open agent panel → chat with Navi → accept suggestion → task created
2. Start timer → work on task → stop timer → time logged
3. View daily briefing → click task → navigate to task detail
4. Request estimate from Sage → see confidence score → override estimate

**Critical Paths:**
- Full suggestion lifecycle: create → preview → accept → execute
- Timer lifecycle: start → navigate → stop → log entry
- Learning: complete task → Sage updates model → next estimate improved

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Agno framework stability | Medium | High | Pin versions, extensive testing, fallback to direct API calls |
| Python-NestJS integration | Medium | Medium | Use FastAPI as agent API layer, clear interface contract |
| Agent response latency | High | Medium | Async processing, streaming responses, timeout handling |
| KB-02 not ready | Medium | High | Make KB search optional, graceful degradation |
| Estimation accuracy | High | Low | Clear "cold-start" messaging, allow overrides |

### Product Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users don't trust AI suggestions | Medium | Medium | Always show reasoning, allow editing, track acceptance rate |
| Suggestion fatigue | Medium | Medium | Smart filtering, confidence thresholds, user preferences |
| Timer state sync issues | Low | High | Persist to DB immediately, client-side reconciliation |
| Briefing noise | Medium | Low | User preferences, smart prioritization, summary controls |

### Mitigation Strategies

1. **Incremental Rollout:**
   - PM-04.1: Navi foundation (no actions, just Q&A)
   - PM-04.2-3: Add suggestions (opt-in beta)
   - PM-04.4-9: Full feature set (general availability)

2. **User Control:**
   - Global setting: "Enable AI suggestions"
   - Per-project setting: "Suggestion mode" vs "Auto-execute mode"
   - Confidence threshold slider (default 85%)

3. **Monitoring:**
   - Track suggestion acceptance rate
   - Monitor agent response times
   - Alert on estimation error > 50%
   - Track timer sync failures

4. **Fallbacks:**
   - If KB-02 not available, skip RAG search
   - If agent times out, return "processing" message
   - If Sage unavailable, show manual estimate form
   - If timer state lost, allow manual reconstruction

---

## Performance Considerations

### Agent Response Time

**Target:** <3s P95 for agent responses

**Optimizations:**
- Cache KB embeddings in Redis
- Pre-load project context on panel open
- Stream responses for long outputs
- Timeout after 10s with "still processing" message

### Database Queries

**Optimization:**
- Index on `agent_conversations(workspace_id, project_id, created_at)`
- Index on `agent_suggestions(user_id, status, expires_at)`
- Index on `time_entries(task_id, started_at)`
- Limit conversation history to last 50 messages

### WebSocket Scaling

- Reuse existing `RealtimeGateway` infrastructure
- Room-based subscriptions: `project:{id}:agents`
- Throttle suggestion broadcasts (max 1/sec)

---

## Security Considerations

### Multi-Tenancy

- All agent operations scoped to `workspaceId`
- Conversation history isolated per project
- Suggestions only visible to project team members
- Time entries linked to user, validated against project access

### Input Validation

- Sanitize all chat messages before agent invocation
- Validate suggestion payloads against schema
- Rate limit agent API calls (10/min per user)
- Prevent SQL injection in custom queries

### Data Privacy

- Agent conversations stored encrypted at rest
- No cross-workspace data leakage in suggestions
- KB search respects page permissions
- Time entries only visible to project team

---

## Related Documentation

- [Epic Definition](./epic-pm-04-ai-team-navi-sage-chrono.md) - Epic and stories
- [Module PRD](../PRD.md) - Core-PM product requirements
- [Module Architecture](../architecture.md) - Overall architecture
- [Sprint Status](../sprint-status.yaml) - Epic and story tracking
- [Agno Team Pattern](../../../../agents/planning/team.py) - Reference implementation
- [KB-02 Spec](./epic-kb-02-tech-spec.md) - RAG integration
- [Approval Queue](../../../../apps/api/src/approvals/) - Approval integration

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-18 | Initial technical specification for Epic PM-04 |
