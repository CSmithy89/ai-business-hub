# Story PM-04.2: Navi Daily Briefing

**Epic:** PM-04 - AI Team: Navi, Sage, Chrono
**Status:** drafted
**Points:** 5

---

## User Story

As a **project user**,
I want **a morning summary of my project status**,
So that **I start the day informed**.

---

## Acceptance Criteria

### AC1: Daily Briefing Enabled in Preferences
**Given** daily briefing is enabled in preferences
**When** I log in (or at configured time)
**Then** notification shows with expandable briefing

### AC2: Briefing Contains Key Information
**Given** a daily briefing is generated
**When** I view the briefing
**Then** it includes:
- Tasks due today
- Overdue tasks
- Blockers detected
- Recent team activity
- AI recommendations

### AC3: One-Click Actions Available
**Given** I am viewing a daily briefing
**When** I see recommendations or tasks
**Then** one-click actions for common responses are available

### AC4: Snooze or Dismiss Options
**Given** a daily briefing notification is shown
**When** I don't want to view it now
**Then** I can snooze or dismiss the notification

---

## Technical Notes

### Briefing Generation Service

**Location:** `apps/api/src/pm/agents/briefing.service.ts`

Responsible for:
- Generating daily briefings via Navi agent
- Scheduling briefing generation via cron
- Storing briefing history
- Sending notifications (WebSocket + email)

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { AgentsService } from './agents.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { RealtimeGateway } from '@/realtime/realtime.gateway';

interface DailyBriefing {
  projectId: string;
  projectName: string;
  tasksDueToday: number;
  overdueTasks: number;
  blockers: string[];
  recommendations: string[];
  recentActivity: string[];
  generatedAt: Date;
}

@Injectable()
export class BriefingService {
  constructor(
    private prisma: PrismaService,
    private agentsService: AgentsService,
    private notificationsService: NotificationsService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  /**
   * Cron job: Generate daily briefings at 8am user timezone
   * Runs every hour and checks user preferences for timezone-based scheduling
   */
  @Cron(CronExpression.EVERY_HOUR)
  async generateScheduledBriefings() {
    // Get users with briefing enabled and matching current hour in their timezone
    const users = await this.getUsersForBriefing();

    for (const user of users) {
      await this.generateUserBriefings(user.id, user.workspaceId);
    }
  }

  /**
   * Generate briefings for all active projects for a user
   */
  async generateUserBriefings(userId: string, workspaceId: string) {
    // Get user's active projects
    const projects = await this.prisma.project.findMany({
      where: {
        workspaceId,
        members: {
          some: { userId },
        },
        status: 'ACTIVE',
      },
      include: {
        phases: true,
      },
    });

    const briefings: DailyBriefing[] = [];

    for (const project of projects) {
      const briefing = await this.generateProjectBriefing(
        workspaceId,
        project.id,
        userId
      );
      briefings.push(briefing);
    }

    // Send notification
    await this.sendBriefingNotification(userId, workspaceId, briefings);

    return briefings;
  }

  /**
   * Generate briefing for a specific project
   */
  async generateProjectBriefing(
    workspaceId: string,
    projectId: string,
    userId: string
  ): Promise<DailyBriefing> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            assignee: true,
            phase: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Calculate briefing data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasksDueToday = project.tasks.filter(
      (task) =>
        task.dueDate &&
        task.dueDate >= today &&
        task.dueDate < tomorrow &&
        task.status !== 'DONE'
    ).length;

    const overdueTasks = project.tasks.filter(
      (task) =>
        task.dueDate &&
        task.dueDate < today &&
        task.status !== 'DONE'
    ).length;

    // Detect blockers
    const blockers = project.tasks
      .filter(
        (task) =>
          task.status === 'IN_PROGRESS' &&
          (!task.assigneeId || task.priority === 'URGENT')
      )
      .map((task) => {
        if (!task.assigneeId) {
          return `Task "${task.title}" has no assignee`;
        }
        if (task.priority === 'URGENT') {
          return `Urgent task "${task.title}" is in progress`;
        }
        return '';
      })
      .filter(Boolean);

    // Get recent activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentActivity = await this.prisma.taskActivity.findMany({
      where: {
        task: { projectId },
        createdAt: { gte: yesterday },
      },
      include: {
        user: true,
        task: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const activitySummary = recentActivity.map(
      (activity) =>
        `${activity.user.name} ${activity.action} "${activity.task.title}"`
    );

    // Use Navi to generate AI recommendations
    const naviResponse = await this.agentsService.chat({
      workspaceId,
      projectId,
      userId,
      agentName: 'navi',
      message: `Generate daily briefing recommendations for this project. Current status: ${tasksDueToday} tasks due today, ${overdueTasks} overdue, ${blockers.length} blockers detected.`,
    });

    const recommendations = this.parseRecommendations(naviResponse.message);

    return {
      projectId,
      projectName: project.name,
      tasksDueToday,
      overdueTasks,
      blockers,
      recommendations,
      recentActivity: activitySummary,
      generatedAt: new Date(),
    };
  }

  /**
   * Send briefing notification via WebSocket and email
   */
  private async sendBriefingNotification(
    userId: string,
    workspaceId: string,
    briefings: DailyBriefing[]
  ) {
    // WebSocket notification to online users
    this.realtimeGateway.server
      .to(`user:${userId}`)
      .emit('briefing:daily', { briefings });

    // Check if user wants email notifications
    const userPrefs = await this.prisma.userPreference.findUnique({
      where: { userId },
    });

    if (userPrefs?.emailBriefing) {
      await this.notificationsService.sendEmail({
        to: userId,
        template: 'daily-briefing',
        data: { briefings },
      });
    }
  }

  /**
   * Parse AI recommendations from Navi response
   */
  private parseRecommendations(message: string): string[] {
    // Extract recommendations from Navi's response
    // Expected format: bullet points or numbered list
    const lines = message.split('\n');
    const recommendations = lines
      .filter((line) => line.trim().match(/^[-*•\d.]/))
      .map((line) => line.trim().replace(/^[-*•\d.]\s*/, ''))
      .filter(Boolean);

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  /**
   * Get users who should receive briefings at current hour
   */
  private async getUsersForBriefing() {
    const currentHour = new Date().getUTCHours();

    // Get users with briefing enabled and matching hour in their timezone
    // This is a simplified version - real implementation should handle timezones properly
    return this.prisma.user.findMany({
      where: {
        preferences: {
          dailyBriefingEnabled: true,
          dailyBriefingHour: currentHour,
        },
      },
      include: {
        workspaces: true,
      },
    });
  }

  /**
   * On-demand briefing generation (manual refresh)
   */
  async generateOnDemand(
    workspaceId: string,
    projectId: string,
    userId: string
  ): Promise<DailyBriefing> {
    return this.generateProjectBriefing(workspaceId, projectId, userId);
  }
}
```

### Navi Briefing Tool

**Location:** `agents/pm/tools/briefing_tools.py`

```python
from agno import tool
import requests
from datetime import datetime, timedelta

@tool
def generate_daily_briefing(project_id: str) -> dict:
    """
    Generate daily briefing recommendations for a project.

    Returns recommendations based on:
    - Tasks due today and overdue
    - Detected blockers
    - Recent team activity
    - Project health indicators
    """

    # Get project status
    response = requests.get(f"{API_URL}/api/pm/projects/{project_id}/status")
    status = response.json()

    recommendations = []

    # Check for overdue tasks
    if status.get('overdueTasks', 0) > 0:
        recommendations.append(
            f"You have {status['overdueTasks']} overdue tasks. Consider reviewing priorities."
        )

    # Check for tasks due today
    if status.get('tasksDueToday', 0) > 0:
        recommendations.append(
            f"{status['tasksDueToday']} tasks are due today. Review progress before end of day."
        )

    # Check for unassigned tasks
    tasks_response = requests.get(
        f"{API_URL}/api/pm/tasks",
        params={"projectId": project_id, "status": "TODO"}
    )
    tasks = tasks_response.json()
    unassigned = [t for t in tasks if not t.get('assigneeId')]

    if unassigned:
        recommendations.append(
            f"{len(unassigned)} tasks need assignment. Consider delegating to team members."
        )

    # Check for blocked tasks
    blocked = [t for t in tasks if t.get('status') == 'BLOCKED']
    if blocked:
        recommendations.append(
            f"{len(blocked)} tasks are blocked. Review dependencies and clear blockers."
        )

    # Check project velocity
    if status.get('tasksSummary', {}).get('inProgress', 0) > 10:
        recommendations.append(
            "High number of in-progress tasks. Consider focusing efforts or moving tasks to done."
        )

    return {
        'recommendations': recommendations[:5],  # Limit to top 5
        'generatedAt': datetime.utcnow().isoformat(),
    }
```

### Briefing Cron Job

**Location:** `apps/api/src/pm/agents/briefing.cron.ts`

Optional separate cron file if preferred:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BriefingService } from './briefing.service';

@Injectable()
export class BriefingCron {
  private readonly logger = new Logger(BriefingCron.name);

  constructor(private briefingService: BriefingService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleDailyBriefings() {
    this.logger.log('Running scheduled daily briefings');

    try {
      await this.briefingService.generateScheduledBriefings();
      this.logger.log('Daily briefings completed successfully');
    } catch (error) {
      this.logger.error('Failed to generate daily briefings', error);
    }
  }
}
```

### Frontend Component: DailyBriefing

**Location:** `apps/web/src/components/pm/agents/DailyBriefing.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Bell, ChevronDown, ChevronUp, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DailyBriefing {
  projectId: string;
  projectName: string;
  tasksDueToday: number;
  overdueTasks: number;
  blockers: string[];
  recommendations: string[];
  recentActivity: string[];
  generatedAt: string;
}

interface DailyBriefingProps {
  briefings: DailyBriefing[];
  onDismiss: () => void;
  onSnooze: () => void;
}

export function DailyBriefing({
  briefings,
  onDismiss,
  onSnooze,
}: DailyBriefingProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set()
  );

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  if (!isExpanded) {
    return (
      <Card className="fixed top-20 right-4 w-96 p-4 shadow-lg border-l-4 border-l-blue-500 bg-background">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold">Your Daily Briefing</h3>
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="p-1 hover:bg-accent rounded"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          {briefings.length} project{briefings.length !== 1 ? 's' : ''} with
          updates
        </p>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="flex-1"
          >
            View Briefing
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onSnooze}
          >
            <Clock className="w-4 h-4 mr-1" />
            Snooze
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="fixed top-20 right-4 w-[600px] max-h-[80vh] overflow-y-auto shadow-xl border-l-4 border-l-blue-500 bg-background">
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold">Your Daily Briefing</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 hover:bg-accent rounded"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-accent rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {briefings.map((briefing) => (
          <ProjectBriefing
            key={briefing.projectId}
            briefing={briefing}
            isExpanded={expandedProjects.has(briefing.projectId)}
            onToggle={() => toggleProject(briefing.projectId)}
          />
        ))}
      </div>
    </Card>
  );
}

function ProjectBriefing({
  briefing,
  isExpanded,
  onToggle,
}: {
  briefing: DailyBriefing;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border rounded-lg p-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <h4 className="font-medium">{briefing.projectName}</h4>
        <div className="flex items-center gap-2">
          <BriefingSummaryBadges briefing={briefing} />
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Tasks Due Today */}
          {briefing.tasksDueToday > 0 && (
            <Section
              title="Due Today"
              count={briefing.tasksDueToday}
              variant="info"
            />
          )}

          {/* Overdue Tasks */}
          {briefing.overdueTasks > 0 && (
            <Section
              title="Overdue"
              count={briefing.overdueTasks}
              variant="warning"
            />
          )}

          {/* Blockers */}
          {briefing.blockers.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-destructive">
                Blockers Detected ({briefing.blockers.length})
              </h5>
              <ul className="space-y-1">
                {briefing.blockers.map((blocker, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">
                    • {blocker}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recent Activity */}
          {briefing.recentActivity.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2">Recent Activity</h5>
              <ul className="space-y-1">
                {briefing.recentActivity.map((activity, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">
                    • {activity}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Recommendations */}
          {briefing.recommendations.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <h5 className="text-sm font-medium mb-2 text-blue-700 dark:text-blue-300">
                AI Recommendations
              </h5>
              <ul className="space-y-2">
                {briefing.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-blue-600 dark:text-blue-400"
                  >
                    • {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BriefingSummaryBadges({ briefing }: { briefing: DailyBriefing }) {
  return (
    <div className="flex items-center gap-1">
      {briefing.tasksDueToday > 0 && (
        <Badge variant="secondary" className="text-xs">
          {briefing.tasksDueToday} due
        </Badge>
      )}
      {briefing.overdueTasks > 0 && (
        <Badge variant="destructive" className="text-xs">
          {briefing.overdueTasks} overdue
        </Badge>
      )}
      {briefing.blockers.length > 0 && (
        <Badge variant="destructive" className="text-xs">
          {briefing.blockers.length} blockers
        </Badge>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  variant,
}: {
  title: string;
  count: number;
  variant: 'info' | 'warning';
}) {
  return (
    <div>
      <h5
        className={cn(
          'text-sm font-medium mb-2',
          variant === 'warning' && 'text-orange-600 dark:text-orange-400',
          variant === 'info' && 'text-blue-600 dark:text-blue-400'
        )}
      >
        {title} ({count})
      </h5>
    </div>
  );
}
```

### User Preferences Model Extension

**Location:** `packages/db/prisma/schema.prisma`

Extend `UserPreference` model to include briefing settings:

```prisma
model UserPreference {
  // ... existing fields ...

  // Daily Briefing
  dailyBriefingEnabled Boolean @default(true) @map("daily_briefing_enabled")
  dailyBriefingHour    Int     @default(8)    @map("daily_briefing_hour")  // 8am local time
  emailBriefing        Boolean @default(false) @map("email_briefing")       // Send via email

  // ... rest of model ...
}
```

### API Endpoints

**Location:** `apps/api/src/pm/agents/agents.controller.ts`

Add briefing endpoints:

```typescript
@Controller('pm/agents')
@UseGuards(AuthGuard, TenantGuard)
export class AgentsController {
  constructor(
    private agentsService: AgentsService,
    private briefingService: BriefingService,
  ) {}

  @Get('briefings/daily')
  async getDailyBriefing(
    @GetWorkspace() workspaceId: string,
    @GetUser() user: User,
  ) {
    return this.briefingService.generateUserBriefings(user.id, workspaceId);
  }

  @Post('briefings/generate')
  async generateBriefing(
    @GetWorkspace() workspaceId: string,
    @GetUser() user: User,
    @Body() body: { projectId: string },
  ) {
    return this.briefingService.generateOnDemand(
      workspaceId,
      body.projectId,
      user.id
    );
  }
}
```

---

## Dependencies

### Prerequisites

- **PM-04.1** (Navi Agent Foundation) - Navi agent must be available
- **PM-02.7** (Task State Machine) - Task status and due dates
- **PM-06.5** (In-App Notifications) - Notification delivery infrastructure

### Blocks

- None - This is a standalone feature within PM-04

---

## Tasks

### Backend Tasks
- [ ] Create `apps/api/src/pm/agents/briefing.service.ts`
- [ ] Implement `generateProjectBriefing()` method
- [ ] Implement `generateUserBriefings()` method
- [ ] Implement `generateScheduledBriefings()` cron job
- [ ] Add `@nestjs/schedule` dependency if not present
- [ ] Add briefing endpoints to `agents.controller.ts`
- [ ] Extend `UserPreference` model with briefing settings
- [ ] Create and run migration for user preference changes

### Agent Layer Tasks
- [ ] Create `agents/pm/tools/briefing_tools.py`
- [ ] Implement `generate_daily_briefing` tool
- [ ] Add tool to Navi agent's tools list
- [ ] Test briefing generation with various project states

### Frontend Tasks
- [ ] Create `apps/web/src/components/pm/agents/DailyBriefing.tsx`
- [ ] Implement collapsed/expanded states
- [ ] Implement snooze functionality (localStorage + timeout)
- [ ] Implement dismiss functionality
- [ ] Add WebSocket listener for `briefing:daily` event
- [ ] Add briefing preferences to user settings page

### Integration Tasks
- [ ] Test cron job scheduling (mock time for testing)
- [ ] Test WebSocket notification delivery
- [ ] Test email notification (if enabled)
- [ ] Test briefing with multiple projects
- [ ] Test briefing with no tasks/activity

---

## Testing Requirements

### Unit Tests

**Backend (NestJS):**
- `BriefingService.generateProjectBriefing()` calculates correct metrics
- `BriefingService.generateUserBriefings()` handles multiple projects
- `BriefingService.parseRecommendations()` extracts recommendations correctly
- Cron job triggers at correct intervals
- Workspace isolation enforced

**Location:** `apps/api/src/pm/agents/briefing.service.spec.ts`

**Agents (Python):**
- `generate_daily_briefing` tool returns valid recommendations
- Tool handles projects with no tasks
- Tool detects blockers correctly

**Location:** `agents/pm/tests/test_briefing_tools.py`

**Frontend (Vitest):**
- `DailyBriefing` component renders collapsed state
- `DailyBriefing` component expands/collapses correctly
- Project briefings toggle independently
- Snooze/dismiss buttons work

**Location:** `apps/web/src/components/pm/agents/DailyBriefing.test.tsx`

### Integration Tests

**API Endpoints:**
- `GET /api/pm/agents/briefings/daily` returns briefings for all user projects
- `POST /api/pm/agents/briefings/generate` generates on-demand briefing
- Briefing includes correct data (due today, overdue, blockers)
- WebSocket event sent on briefing generation

**Location:** `apps/api/test/pm/agents/briefing.e2e-spec.ts`

### E2E Tests (Playwright)

**User Flows:**
1. Login → briefing notification appears → expand → view details
2. Briefing shows tasks due today → click task → navigate to task detail
3. Click "Snooze" → briefing disappears → reappears after timeout
4. Click "Dismiss" → briefing disappears permanently
5. Settings → enable/disable daily briefing → verify preference saved

**Location:** `apps/web/e2e/pm/agents/daily-briefing.spec.ts`

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Daily briefing generated at configured time
- [ ] Briefing includes all required information (tasks, blockers, activity, recommendations)
- [ ] WebSocket notification sent to online users
- [ ] Email notification sent (if enabled in preferences)
- [ ] Snooze and dismiss functionality working
- [ ] One-click actions available (view task, view project)
- [ ] Unit tests passing (backend + agents + frontend)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated:
  - [ ] Cron job documentation
  - [ ] User preferences API docs
  - [ ] Briefing notification guide
- [ ] Workspace isolation verified
- [ ] Migration applied and tested

---

## References

- [Epic Definition](../epics/epic-pm-04-ai-team-navi-sage-chrono.md)
- [Epic Tech Spec](../epics/epic-pm-04-tech-spec.md)
- [Story PM-04.1 (Navi Foundation)](./pm-04-1-navi-agent-foundation.md)
- [Module PRD](../PRD.md)
- [Module Architecture](../architecture.md)
- [Sprint Status](../sprint-status.yaml)

---

## Dev Notes

### Cron Job Scheduling

The briefing cron job runs every hour and checks which users should receive briefings based on their timezone preferences. To handle timezones properly:

1. Store user's timezone in `UserPreference` (e.g., "America/New_York")
2. Convert configured hour (e.g., 8am) to UTC based on user's timezone
3. Run cron every hour and check which users match current UTC hour
4. Generate and send briefings for matching users

For MVP, simplified approach:
- Run at fixed UTC hour (e.g., 8am UTC)
- Add timezone support in Phase 2

### Snooze Functionality

Snooze implementation:
- Client-side: Store snooze timestamp in localStorage
- Re-check on every page load
- Show briefing again after snooze timeout (default: 1 hour)
- Server doesn't need to track snooze state

### Notification Delivery

Priority order:
1. WebSocket (if user online) - instant delivery
2. Email (if enabled in preferences) - fallback for offline users

WebSocket room: `user:{userId}` (existing infrastructure)

### Briefing History

Optional enhancement (Phase 2):
- Store generated briefings in database
- Allow viewing past briefings
- Track which briefings were viewed/dismissed

For MVP: Generate fresh briefing on each request (no persistence)

### AI Recommendations Format

Navi should return recommendations in a consistent format:
```
Here are my recommendations:
- Assign the 3 unassigned tasks to team members
- Review the 2 blocked tasks and clear dependencies
- Focus on completing in-progress tasks before starting new ones
```

The `parseRecommendations()` method extracts bullet points automatically.

### One-Click Actions

Quick actions to implement:
- View task → navigate to task detail
- View project → navigate to project page
- Assign task → open task assignment modal
- Complete task → mark task as done (with confirmation)

Add in follow-up story (PM-04.3) - keep PM-04.2 focused on briefing generation and display.

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
