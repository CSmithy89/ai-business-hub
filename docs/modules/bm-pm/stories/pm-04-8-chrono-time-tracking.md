# Story PM-04.8: Chrono Time Tracking

**Epic:** PM-04 - AI Team: Navi, Sage, Chrono
**Status:** drafted
**Points:** 8

---

## User Story

As a **project user**,
I want **AI-assisted time tracking with Chrono**,
So that **I can accurately track time spent on tasks and get intelligent logging suggestions**.

---

## Acceptance Criteria

### AC1: Chrono Agent Initialization
**Given** I am on a project page
**When** I interact with time tracking features
**Then** Chrono agent is available and responds to time tracking requests

### AC2: Start/Stop Time Tracking
**Given** I am working on a task
**When** I start a timer on the task
**Then** time entry is created and tracks elapsed time
**And** when I stop the timer, duration is calculated and recorded

### AC3: Time Entries Recorded
**Given** I log time on a task
**When** I view the task
**Then** all time entries are displayed with user, duration, and description

### AC4: Smart Time Logging Suggestions
**Given** I have been working on tasks
**When** Chrono analyzes my activity
**Then** Chrono suggests time entries based on task updates and activity patterns

---

## Technical Notes

### Chrono Agent Implementation

**Location:** `agents/pm/chrono.py`

Following the pattern from `agents/pm/sage.py`:

```python
from agno import Agent, Memory
from agno.models.anthropic import Claude
from agents.pm.tools import time_tracking_tools

def create_chrono_agent(
    workspace_id: str,
    project_id: str,
    shared_memory: Memory,
    model: Optional[str] = None,
) -> Agent:
    """Create Chrono agent for time tracking."""

    return Agent(
        name="Chrono",
        role="Time Tracking Specialist",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=[
            "You are Chrono, the time tracking specialist for HYVVE projects.",
            "Help users track time spent on tasks accurately and effortlessly.",
            "Suggest time logging based on activity patterns and task updates.",
            "Never auto-log time without user confirmation.",
            "Provide insights on time allocation and productivity patterns.",
            "Support both manual time entry and timer-based tracking.",
            "Round time entries to reasonable increments (0.25h minimum).",
            "Detect when users forget to stop timers and suggest corrections.",
        ],
        tools=[
            time_tracking_tools.start_timer,
            time_tracking_tools.stop_timer,
            time_tracking_tools.log_time,
            time_tracking_tools.get_time_entries,
            time_tracking_tools.get_active_timers,
            time_tracking_tools.suggest_time_entries,
        ],
        memory=shared_memory,
        add_datetime_to_instructions=True,
        markdown=True,
    )
```

### Time Tracking Tools

**Location:** `agents/pm/tools/time_tracking_tools.py`

```python
from agno import tool
import requests
from typing import Optional, List
from datetime import datetime
import os

API_URL = os.getenv('API_BASE_URL', 'http://localhost:3000')

@tool
def start_timer(
    task_id: str,
    workspace_id: str,
    description: Optional[str] = None
) -> dict:
    """
    Start a timer for a task.

    Args:
        task_id: Task ID to track time for
        workspace_id: Workspace ID for multi-tenant scoping
        description: Optional description of what you're working on

    Returns:
        Active timer details
    """
    response = requests.post(
        f"{API_URL}/api/pm/agents/time/start",
        json={
            'taskId': task_id,
            'workspaceId': workspace_id,
            'description': description,
        },
        headers={'X-Workspace-ID': workspace_id}
    )

    response.raise_for_status()
    return response.json()

@tool
def stop_timer(
    task_id: str,
    workspace_id: str,
) -> dict:
    """
    Stop the active timer for a task.

    Args:
        task_id: Task ID with active timer
        workspace_id: Workspace ID for multi-tenant scoping

    Returns:
        Completed time entry with duration
    """
    response = requests.post(
        f"{API_URL}/api/pm/agents/time/stop",
        json={
            'taskId': task_id,
            'workspaceId': workspace_id,
        },
        headers={'X-Workspace-ID': workspace_id}
    )

    response.raise_for_status()
    return response.json()

@tool
def log_time(
    task_id: str,
    workspace_id: str,
    hours: float,
    description: Optional[str] = None,
    date: Optional[str] = None,
) -> dict:
    """
    Log time manually for a task.

    Args:
        task_id: Task ID to log time for
        workspace_id: Workspace ID for multi-tenant scoping
        hours: Hours to log (minimum 0.25h)
        description: Optional description of work done
        date: Optional date for the entry (ISO format, defaults to today)

    Returns:
        Created time entry
    """
    response = requests.post(
        f"{API_URL}/api/pm/agents/time/log",
        json={
            'taskId': task_id,
            'workspaceId': workspace_id,
            'hours': hours,
            'description': description,
            'date': date,
        },
        headers={'X-Workspace-ID': workspace_id}
    )

    response.raise_for_status()
    return response.json()

@tool
def get_time_entries(
    task_id: str,
    workspace_id: str,
) -> List[dict]:
    """
    Get all time entries for a task.

    Args:
        task_id: Task ID to get entries for
        workspace_id: Workspace ID for multi-tenant scoping

    Returns:
        List of time entries with user, duration, description
    """
    response = requests.get(
        f"{API_URL}/api/pm/agents/time/entries/{task_id}",
        headers={'X-Workspace-ID': workspace_id}
    )

    response.raise_for_status()
    return response.json()

@tool
def get_active_timers(
    workspace_id: str,
    project_id: Optional[str] = None,
) -> List[dict]:
    """
    Get all active timers for the workspace or project.

    Args:
        workspace_id: Workspace ID for multi-tenant scoping
        project_id: Optional project ID to filter by

    Returns:
        List of active timers with task details and elapsed time
    """
    params = {}
    if project_id:
        params['projectId'] = project_id

    response = requests.get(
        f"{API_URL}/api/pm/agents/time/active",
        params=params,
        headers={'X-Workspace-ID': workspace_id}
    )

    response.raise_for_status()
    return response.json()

@tool
def suggest_time_entries(
    workspace_id: str,
    project_id: str,
    user_id: str,
) -> List[dict]:
    """
    Get AI suggestions for time entries based on activity.

    Args:
        workspace_id: Workspace ID for multi-tenant scoping
        project_id: Project ID to analyze
        user_id: User ID to analyze activity for

    Returns:
        List of suggested time entries with task, hours, reasoning
    """
    response = requests.post(
        f"{API_URL}/api/pm/agents/time/suggest",
        json={
            'workspaceId': workspace_id,
            'projectId': project_id,
            'userId': user_id,
        },
        headers={'X-Workspace-ID': workspace_id}
    )

    response.raise_for_status()
    return response.json()
```

### Database Schema

**Location:** `packages/db/prisma/schema.prisma`

Add TimeEntry model:

```prisma
/// TimeEntry - Time tracking for tasks
model TimeEntry {
  id          String    @id @default(cuid())
  workspaceId String    @map("workspace_id")
  taskId      String    @map("task_id")
  userId      String    @map("user_id")

  description String?   @db.Text

  // Time tracking
  startTime   DateTime? @map("start_time")
  endTime     DateTime? @map("end_time")
  duration    Float     // Hours (calculated or manual)

  // Manual vs timer
  isTimer     Boolean   @default(false) @map("is_timer")

  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@index([workspaceId])
  @@index([taskId])
  @@index([userId])
  @@index([startTime])
  @@index([workspaceId, taskId])
  @@index([workspaceId, userId, startTime])
  @@map("time_entries")
}
```

### Backend Service

**Location:** `apps/api/src/pm/agents/time-tracking.service.ts`

```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

interface StartTimerDto {
  taskId: string;
  workspaceId: string;
  description?: string;
}

interface StopTimerDto {
  taskId: string;
  workspaceId: string;
}

interface LogTimeDto {
  taskId: string;
  workspaceId: string;
  hours: number;
  description?: string;
  date?: string;
}

@Injectable()
export class TimeTrackingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Start a timer for a task
   */
  async startTimer(userId: string, dto: StartTimerDto) {
    // Check for existing active timer on this task
    const existing = await this.prisma.timeEntry.findFirst({
      where: {
        workspaceId: dto.workspaceId,
        taskId: dto.taskId,
        userId,
        isTimer: true,
        endTime: null,
      },
    });

    if (existing) {
      throw new BadRequestException('Timer already running for this task');
    }

    // Create timer entry
    const entry = await this.prisma.timeEntry.create({
      data: {
        workspaceId: dto.workspaceId,
        taskId: dto.taskId,
        userId,
        description: dto.description,
        startTime: new Date(),
        isTimer: true,
        duration: 0, // Will be calculated on stop
      },
    });

    return entry;
  }

  /**
   * Stop an active timer
   */
  async stopTimer(userId: string, dto: StopTimerDto) {
    const entry = await this.prisma.timeEntry.findFirst({
      where: {
        workspaceId: dto.workspaceId,
        taskId: dto.taskId,
        userId,
        isTimer: true,
        endTime: null,
      },
    });

    if (!entry) {
      throw new NotFoundException('No active timer found for this task');
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - entry.startTime!.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    // Round to nearest 0.25h
    const roundedHours = Math.round(durationHours * 4) / 4;

    const updated = await this.prisma.timeEntry.update({
      where: { id: entry.id },
      data: {
        endTime,
        duration: roundedHours,
      },
    });

    // Update task actualHours
    await this.updateTaskActualHours(dto.taskId, dto.workspaceId);

    return updated;
  }

  /**
   * Log time manually
   */
  async logTime(userId: string, dto: LogTimeDto) {
    if (dto.hours < 0.25) {
      throw new BadRequestException('Minimum time entry is 0.25 hours');
    }

    const startTime = dto.date ? new Date(dto.date) : new Date();
    startTime.setHours(9, 0, 0, 0); // Default to 9 AM

    const entry = await this.prisma.timeEntry.create({
      data: {
        workspaceId: dto.workspaceId,
        taskId: dto.taskId,
        userId,
        description: dto.description,
        startTime,
        endTime: startTime, // Manual entries don't have real time range
        duration: dto.hours,
        isTimer: false,
      },
    });

    // Update task actualHours
    await this.updateTaskActualHours(dto.taskId, dto.workspaceId);

    return entry;
  }

  /**
   * Get time entries for a task
   */
  async getTimeEntries(workspaceId: string, taskId: string) {
    return this.prisma.timeEntry.findMany({
      where: {
        workspaceId,
        taskId,
      },
      orderBy: { startTime: 'desc' },
    });
  }

  /**
   * Get active timers
   */
  async getActiveTimers(workspaceId: string, projectId?: string) {
    const where: any = {
      workspaceId,
      isTimer: true,
      endTime: null,
    };

    if (projectId) {
      where.task = {
        projectId,
      };
    }

    return this.prisma.timeEntry.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            taskNumber: true,
            projectId: true,
          },
        },
      },
    });
  }

  /**
   * Generate time logging suggestions based on activity
   */
  async suggestTimeEntries(
    workspaceId: string,
    projectId: string,
    userId: string,
  ) {
    // Find tasks the user has worked on recently (updated) without time entries
    const recentTasks = await this.prisma.task.findMany({
      where: {
        workspaceId,
        projectId,
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
        OR: [
          { assigneeId: userId },
          {
            activities: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        _count: {
          select: {
            timeEntries: {
              where: {
                userId,
                startTime: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            },
            activities: {
              where: {
                userId,
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            },
          },
        },
      },
      take: 10,
    });

    // Filter to tasks with activity but no time logged
    const suggestions = recentTasks
      .filter((task) => task._count.activities > 0 && task._count.timeEntries === 0)
      .map((task) => ({
        taskId: task.id,
        taskTitle: task.title,
        taskNumber: task.taskNumber,
        suggestedHours: this.estimateHoursFromActivity(task._count.activities),
        reasoning: `${task._count.activities} activities recorded, but no time logged`,
        confidence: task._count.activities >= 3 ? 'medium' : 'low',
      }));

    return suggestions;
  }

  /**
   * Update task actualHours from time entries
   */
  private async updateTaskActualHours(taskId: string, workspaceId: string) {
    const entries = await this.prisma.timeEntry.findMany({
      where: {
        workspaceId,
        taskId,
        endTime: { not: null },
      },
    });

    const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);

    await this.prisma.task.update({
      where: { id: taskId },
      data: { actualHours: totalHours },
    });
  }

  /**
   * Estimate hours from activity count
   */
  private estimateHoursFromActivity(activityCount: number): number {
    // Simple heuristic: 0.5h per activity, max 4h
    const estimated = activityCount * 0.5;
    return Math.min(4, Math.round(estimated * 4) / 4);
  }
}
```

### Controller Endpoints

**Location:** `apps/api/src/pm/agents/agents.controller.ts`

Add time tracking endpoints:

```typescript
@Controller('pm/agents')
@UseGuards(AuthGuard, TenantGuard)
export class AgentsController {
  constructor(
    private agentsService: AgentsService,
    private timeTrackingService: TimeTrackingService,
  ) {}

  @Post('time/start')
  async startTimer(
    @GetWorkspace() workspaceId: string,
    @GetUser() user: User,
    @Body() body: { taskId: string; description?: string }
  ) {
    return this.timeTrackingService.startTimer(user.id, {
      taskId: body.taskId,
      workspaceId,
      description: body.description,
    });
  }

  @Post('time/stop')
  async stopTimer(
    @GetWorkspace() workspaceId: string,
    @GetUser() user: User,
    @Body() body: { taskId: string }
  ) {
    return this.timeTrackingService.stopTimer(user.id, {
      taskId: body.taskId,
      workspaceId,
    });
  }

  @Post('time/log')
  async logTime(
    @GetWorkspace() workspaceId: string,
    @GetUser() user: User,
    @Body() body: { taskId: string; hours: number; description?: string; date?: string }
  ) {
    return this.timeTrackingService.logTime(user.id, {
      taskId: body.taskId,
      workspaceId,
      hours: body.hours,
      description: body.description,
      date: body.date,
    });
  }

  @Get('time/entries/:taskId')
  async getTimeEntries(
    @GetWorkspace() workspaceId: string,
    @Param('taskId') taskId: string
  ) {
    return this.timeTrackingService.getTimeEntries(workspaceId, taskId);
  }

  @Get('time/active')
  async getActiveTimers(
    @GetWorkspace() workspaceId: string,
    @Query('projectId') projectId?: string
  ) {
    return this.timeTrackingService.getActiveTimers(workspaceId, projectId);
  }

  @Post('time/suggest')
  async suggestTimeEntries(
    @GetWorkspace() workspaceId: string,
    @Body() body: { projectId: string; userId: string }
  ) {
    return this.timeTrackingService.suggestTimeEntries(
      workspaceId,
      body.projectId,
      body.userId
    );
  }
}
```

### Update PM Team Factory

**Location:** `agents/pm/team.py`

Add Chrono to the team:

```python
from .chrono import create_chrono_agent

def create_pm_team(...) -> Team:
    # ... existing code ...

    # Create agents
    navi = create_navi_agent(workspace_id, project_id, shared_memory, model)
    sage = create_sage_agent(workspace_id, project_id, shared_memory, model)
    chrono = create_chrono_agent(workspace_id, project_id, shared_memory, model)  # NEW

    return Team(
        name="PM Team",
        mode="coordinate",
        leader=navi,
        members=[sage, chrono],  # Add Chrono
        # ... rest of config ...
    )
```

---

## Dependencies

### Prerequisites

- **PM-04.1** (Navi Agent Foundation) - Agent infrastructure and team factory
- **PM-02.1** (Task Data Model) - Task model with actualHours field
- **PM-02.9** (Task Activities) - Activity tracking for time suggestions

### Blocks

- None (Final agent in PM-04 epic)

---

## Tasks

### Database Tasks
- [ ] Add `TimeEntry` model to Prisma schema
- [ ] Add relation to Task model
- [ ] Create and run migration

### Backend Tasks
- [ ] Create `apps/api/src/pm/agents/time-tracking.service.ts`
- [ ] Implement `startTimer()` method
- [ ] Implement `stopTimer()` method with duration calculation
- [ ] Implement `logTime()` method with validation
- [ ] Implement `getTimeEntries()` method
- [ ] Implement `getActiveTimers()` method
- [ ] Implement `suggestTimeEntries()` method
- [ ] Update `agents.controller.ts` with time endpoints
- [ ] Update `agents.module.ts` to include TimeTrackingService

### Agent Layer Tasks
- [ ] Create `agents/pm/chrono.py` with `create_chrono_agent()`
- [ ] Create `agents/pm/tools/time_tracking_tools.py`:
  - [ ] `start_timer` tool
  - [ ] `stop_timer` tool
  - [ ] `log_time` tool
  - [ ] `get_time_entries` tool
  - [ ] `get_active_timers` tool
  - [ ] `suggest_time_entries` tool
- [ ] Update `agents/pm/team.py` to include Chrono
- [ ] Configure Chrono with shared memory

### Integration Tasks
- [ ] Test timer start/stop functionality
- [ ] Test manual time logging
- [ ] Test time entry retrieval
- [ ] Test active timers tracking
- [ ] Test time suggestions based on activity
- [ ] Verify actualHours updates on tasks

---

## Testing Requirements

### Unit Tests

**Backend (NestJS):**
- `TimeTrackingService.startTimer()` creates timer entry
- `TimeTrackingService.stopTimer()` calculates duration correctly
- `TimeTrackingService.logTime()` validates minimum hours
- `TimeTrackingService.updateTaskActualHours()` sums correctly
- `TimeTrackingService.suggestTimeEntries()` finds relevant tasks
- Workspace scoping enforced on all queries

**Location:** `apps/api/src/pm/agents/time-tracking.service.spec.ts`

**Agents (Python):**
- Chrono responds to time tracking requests
- `start_timer` tool creates timer
- `stop_timer` tool calculates duration
- `log_time` tool validates hours
- `get_time_entries` tool returns entries
- `suggest_time_entries` tool provides suggestions

**Location:** `agents/pm/tests/test_chrono.py`

### Integration Tests

**API Endpoints:**
- `POST /api/pm/agents/time/start` starts timer
- `POST /api/pm/agents/time/stop` stops timer and calculates duration
- `POST /api/pm/agents/time/log` logs time manually
- `GET /api/pm/agents/time/entries/:taskId` returns time entries
- `GET /api/pm/agents/time/active` returns active timers
- `POST /api/pm/agents/time/suggest` returns suggestions
- Workspace isolation enforced

**Location:** `apps/api/test/pm/agents/time-tracking.e2e-spec.ts`

### E2E Tests (Playwright)

**User Flows:**
1. Start timer on task → timer shows as active
2. Stop timer → duration calculated and recorded
3. Log time manually → entry created
4. View task → all time entries displayed
5. View suggestions → Chrono suggests missing time entries

**Location:** `apps/web/e2e/pm/agents/chrono-time-tracking.spec.ts`

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Chrono agent responds to time tracking requests
- [ ] Users can start/stop timers on tasks
- [ ] Time entries recorded with task association
- [ ] Chrono suggests time logging based on activity
- [ ] Task actualHours updated from time entries
- [ ] Unit tests passing (backend + agents)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated:
  - [ ] Chrono agent documentation
  - [ ] Time tracking API docs
  - [ ] Time suggestion algorithm
- [ ] Workspace isolation verified
- [ ] Migration applied and tested
- [ ] Chrono added to PM team factory

---

## References

- [Epic Definition](../epics/epic-pm-04-ai-team-navi-sage-chrono.md)
- [Epic Tech Spec](../epics/epic-pm-04-tech-spec.md)
- [Story PM-04.1 (Navi Foundation)](./pm-04-1-navi-agent-foundation.md)
- [Story PM-04.5 (Sage Estimation)](./pm-04-5-sage-estimation-agent.md)
- [Module PRD](../PRD.md)
- [Module Architecture](../architecture.md)
- [Sprint Status](../sprint-status.yaml)

---

## Dev Notes

### Timer Rounding

Timers are rounded to the nearest 0.25h (15 minutes) for practical time tracking. This prevents excessive precision while maintaining accuracy.

### Manual Time Entry

Manual entries have a minimum of 0.25h to prevent spam logging. The `date` field allows backdating entries.

### Activity-Based Suggestions

Chrono analyzes task activities in the last 7 days to suggest missing time entries. Heuristic: 0.5h per activity, capped at 4h per task.

### Task actualHours Update

Every time a time entry is created or stopped, the task's `actualHours` field is recalculated as the sum of all time entry durations.

### Active Timer Tracking

Only one active timer per task per user is allowed. Starting a new timer on the same task throws an error.

### Future Enhancements (Phase 2)

- Time entry editing/deletion
- Time reports and analytics
- Calendar integration for automatic tracking
- Idle detection and reminder prompts
- Pomodoro timer integration
- Weekly time summaries
- Time approval workflows for billing

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
