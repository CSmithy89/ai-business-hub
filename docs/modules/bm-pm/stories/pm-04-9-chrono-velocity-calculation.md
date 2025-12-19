# Story PM-04.9: Chrono Velocity Calculation

**Epic:** PM-04 - AI Team: Navi, Sage, Chrono
**Status:** drafted
**Points:** 5

---

## User Story

As a **project manager**,
I want **Chrono to calculate team velocity metrics**,
So that **I can understand team performance and forecast sprint capacity accurately**.

---

## Acceptance Criteria

### AC1: Story Points Velocity Calculation
**Given** a project has completed tasks with story points
**When** I request velocity data
**Then** Chrono calculates story points completed per time period (2-week sprints)

### AC2: Hours Per Point Average
**Given** tasks have both story points and actual hours logged
**When** Chrono calculates velocity
**Then** hours per story point average is calculated for estimation calibration

### AC3: Velocity Trends Tracked
**Given** a project has multiple sprint periods of data
**When** I request velocity trends
**Then** Chrono provides week-by-week velocity showing trends over time

### AC4: Velocity Dashboard Data
**Given** I am viewing project metrics
**When** I access the velocity dashboard
**Then** I can see current velocity, trends, and hours per point metrics

---

## Technical Notes

### Velocity Calculation Logic

**2-Week Sprint Periods:**
- Sprint = 14 days (2 weeks)
- Calculate from project start or configurable sprint start date
- Include only completed tasks (status: DONE, CLOSED, etc.)

**Story Points Velocity:**
```typescript
interface VelocityPeriod {
  periodStart: Date;
  periodEnd: Date;
  storyPointsCompleted: number;
  tasksCompleted: number;
  hoursLogged: number;
}

interface ProjectVelocity {
  currentVelocity: number; // Last sprint points completed
  avgVelocity: number; // Average over all sprints
  avgHoursPerPoint: number; // Hours/point ratio
  periods: VelocityPeriod[];
}
```

**Hours Per Point Calculation:**
```typescript
// For each completed task with both story points and actual hours
avgHoursPerPoint = totalActualHours / totalStoryPoints
```

**Velocity Trend:**
```typescript
interface VelocityTrend {
  week: number; // Week number from project start
  weekStart: Date;
  weekEnd: Date;
  pointsCompleted: number;
  trend: 'up' | 'down' | 'stable'; // Compared to previous week
}
```

### Backend Service Implementation

**Location:** `apps/api/src/pm/agents/time-tracking.service.ts`

Add velocity methods to TimeTrackingService:

```typescript
/**
 * Calculate project velocity over time periods
 */
async calculateProjectVelocity(
  workspaceId: string,
  projectId: string,
  periods: number = 6, // Default last 6 sprints
): Promise<ProjectVelocity> {
  // Get project start date or use first completed task date
  const project = await this.prisma.project.findUnique({
    where: { id: projectId },
    select: { createdAt: true },
  });

  const startDate = project?.createdAt || new Date();
  const now = new Date();

  // Calculate sprint periods (2 weeks each)
  const sprintDurationMs = 14 * 24 * 60 * 60 * 1000;
  const velocityPeriods: VelocityPeriod[] = [];

  for (let i = 0; i < periods; i++) {
    const periodStart = new Date(now.getTime() - (i + 1) * sprintDurationMs);
    const periodEnd = new Date(now.getTime() - i * sprintDurationMs);

    // Get completed tasks in this period
    const tasks = await this.prisma.task.findMany({
      where: {
        workspaceId,
        projectId,
        status: { in: ['DONE', 'CLOSED'] },
        completedAt: {
          gte: periodStart,
          lt: periodEnd,
        },
      },
      select: {
        storyPoints: true,
        actualHours: true,
      },
    });

    const storyPoints = tasks.reduce(
      (sum, task) => sum + (task.storyPoints || 0),
      0
    );

    const hours = tasks.reduce(
      (sum, task) => sum + (task.actualHours || 0),
      0
    );

    velocityPeriods.push({
      periodStart,
      periodEnd,
      storyPointsCompleted: storyPoints,
      tasksCompleted: tasks.length,
      hoursLogged: hours,
    });
  }

  // Calculate averages
  const totalPoints = velocityPeriods.reduce(
    (sum, p) => sum + p.storyPointsCompleted,
    0
  );
  const totalHours = velocityPeriods.reduce(
    (sum, p) => sum + p.hoursLogged,
    0
  );

  return {
    currentVelocity: velocityPeriods[0]?.storyPointsCompleted || 0,
    avgVelocity: totalPoints / periods,
    avgHoursPerPoint: totalPoints > 0 ? totalHours / totalPoints : 0,
    periods: velocityPeriods.reverse(), // Oldest first
  };
}

/**
 * Get velocity trends over weeks
 */
async getVelocityTrends(
  workspaceId: string,
  projectId: string,
  weeks: number = 12,
): Promise<VelocityTrend[]> {
  const now = new Date();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const trends: VelocityTrend[] = [];
  let previousPoints = 0;

  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(now.getTime() - (i + 1) * weekMs);
    const weekEnd = new Date(now.getTime() - i * weekMs);

    // Get completed tasks in this week
    const tasks = await this.prisma.task.findMany({
      where: {
        workspaceId,
        projectId,
        status: { in: ['DONE', 'CLOSED'] },
        completedAt: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      select: {
        storyPoints: true,
      },
    });

    const pointsCompleted = tasks.reduce(
      (sum, task) => sum + (task.storyPoints || 0),
      0
    );

    // Determine trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (i < weeks - 1) {
      // Not the last (oldest) week
      if (pointsCompleted > previousPoints) {
        trend = 'up';
      } else if (pointsCompleted < previousPoints) {
        trend = 'down';
      }
    }

    trends.push({
      week: weeks - i,
      weekStart,
      weekEnd,
      pointsCompleted,
      trend,
    });

    previousPoints = pointsCompleted;
  }

  return trends.reverse(); // Oldest first
}

/**
 * Get hours per story point average for project
 */
async getHoursPerPointAverage(
  workspaceId: string,
  projectId: string,
): Promise<number> {
  const tasks = await this.prisma.task.findMany({
    where: {
      workspaceId,
      projectId,
      status: { in: ['DONE', 'CLOSED'] },
      storyPoints: { not: null },
      actualHours: { gt: 0 },
    },
    select: {
      storyPoints: true,
      actualHours: true,
    },
  });

  const totalPoints = tasks.reduce(
    (sum, task) => sum + (task.storyPoints || 0),
    0
  );

  const totalHours = tasks.reduce(
    (sum, task) => sum + (task.actualHours || 0),
    0
  );

  return totalPoints > 0 ? totalHours / totalPoints : 0;
}
```

### Python Agent Tools

**Location:** `agents/pm/tools/time_tracking_tools.py`

Add velocity tools:

```python
@tool
def get_velocity(
    project_id: str,
    workspace_id: str,
    periods: int = 6,
) -> dict:
    """
    Get project velocity metrics over sprint periods.

    Args:
        project_id: Project ID to calculate velocity for
        workspace_id: Workspace ID for multi-tenant scoping
        periods: Number of 2-week sprint periods to analyze (default 6 = 12 weeks)

    Returns:
        Velocity metrics with current velocity, average, hours per point
    """
    try:
        response = requests.get(
            f"{API_URL}/api/pm/agents/time/velocity/{project_id}",
            params={'periods': periods},
            headers={'X-Workspace-ID': workspace_id},
            timeout=10,
        )

        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching velocity: {e}")
        return {
            'currentVelocity': 0,
            'avgVelocity': 0,
            'avgHoursPerPoint': 0,
            'periods': [],
        }


@tool
def get_velocity_trend(
    project_id: str,
    workspace_id: str,
    weeks: int = 12,
) -> List[dict]:
    """
    Get weekly velocity trends for a project.

    Args:
        project_id: Project ID to get trends for
        workspace_id: Workspace ID for multi-tenant scoping
        weeks: Number of weeks to analyze (default 12)

    Returns:
        List of weekly velocity data showing trend over time
    """
    try:
        response = requests.get(
            f"{API_URL}/api/pm/agents/time/velocity/{project_id}/trends",
            params={'weeks': weeks},
            headers={'X-Workspace-ID': workspace_id},
            timeout=10,
        )

        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching velocity trends: {e}")
        return []
```

### Controller Endpoints

**Location:** `apps/api/src/pm/agents/agents.controller.ts`

Add velocity endpoints:

```typescript
@Get('time/velocity/:projectId')
@ApiOperation({ summary: 'Get project velocity metrics' })
@ApiResponse({
  status: 200,
  description: 'Project velocity calculated',
  schema: {
    properties: {
      currentVelocity: { type: 'number', description: 'Story points in last sprint' },
      avgVelocity: { type: 'number', description: 'Average story points per sprint' },
      avgHoursPerPoint: { type: 'number', description: 'Average hours per story point' },
      periods: {
        type: 'array',
        items: {
          properties: {
            periodStart: { type: 'string', format: 'date-time' },
            periodEnd: { type: 'string', format: 'date-time' },
            storyPointsCompleted: { type: 'number' },
            tasksCompleted: { type: 'number' },
            hoursLogged: { type: 'number' },
          },
        },
      },
    },
  },
})
async getProjectVelocity(
  @CurrentWorkspace() workspaceId: string,
  @Param('projectId') projectId: string,
  @Query('periods') periods?: string,
) {
  return this.timeTrackingService.calculateProjectVelocity(
    workspaceId,
    projectId,
    periods ? parseInt(periods, 10) : 6,
  );
}

@Get('time/velocity/:projectId/trends')
@ApiOperation({ summary: 'Get weekly velocity trends' })
@ApiResponse({
  status: 200,
  description: 'Velocity trends retrieved',
  schema: {
    type: 'array',
    items: {
      properties: {
        week: { type: 'number' },
        weekStart: { type: 'string', format: 'date-time' },
        weekEnd: { type: 'string', format: 'date-time' },
        pointsCompleted: { type: 'number' },
        trend: { type: 'string', enum: ['up', 'down', 'stable'] },
      },
    },
  },
})
async getVelocityTrends(
  @CurrentWorkspace() workspaceId: string,
  @Param('projectId') projectId: string,
  @Query('weeks') weeks?: string,
) {
  return this.timeTrackingService.getVelocityTrends(
    workspaceId,
    projectId,
    weeks ? parseInt(weeks, 10) : 12,
  );
}
```

### Update Chrono Agent

**Location:** `agents/pm/chrono.py`

Update Chrono's tools list to include velocity tools:

```python
from agents.pm.tools.time_tracking_tools import (
    start_timer,
    stop_timer,
    log_time,
    get_time_entries,
    get_active_timers,
    suggest_time_entries,
    get_velocity,  # NEW
    get_velocity_trend,  # NEW
)

def create_chrono_agent(...) -> Agent:
    return Agent(
        name="Chrono",
        role="Time Tracking Specialist",
        instructions=[
            # ... existing instructions ...
            "Calculate team velocity based on completed story points per sprint (2 weeks).",
            "Track hours per story point to help calibrate estimates.",
            "Provide velocity trends to show team performance over time.",
        ],
        tools=[
            start_timer,
            stop_timer,
            log_time,
            get_time_entries,
            get_active_timers,
            suggest_time_entries,
            get_velocity,  # NEW
            get_velocity_trend,  # NEW
        ],
        # ... rest of config ...
    )
```

---

## Dependencies

### Prerequisites

- **PM-04.8** (Chrono Time Tracking) - Time tracking infrastructure
- **PM-02.1** (Task Data Model) - Task status and story points
- **PM-02.7** (Task State Machine) - Task completion tracking

### Blocks

- None (Final story in PM-04 epic)

---

## Tasks

### Backend Tasks
- [ ] Add `calculateProjectVelocity()` method to TimeTrackingService
- [ ] Add `getVelocityTrends()` method to TimeTrackingService
- [ ] Add `getHoursPerPointAverage()` method to TimeTrackingService
- [ ] Add velocity endpoints to agents.controller.ts:
  - [ ] GET /pm/agents/time/velocity/:projectId
  - [ ] GET /pm/agents/time/velocity/:projectId/trends
- [ ] Add API documentation with Swagger decorators

### Agent Layer Tasks
- [ ] Add `get_velocity` tool to time_tracking_tools.py
- [ ] Add `get_velocity_trend` tool to time_tracking_tools.py
- [ ] Update Chrono agent to include velocity tools
- [ ] Update Chrono instructions to mention velocity capabilities

### Integration Tasks
- [ ] Test velocity calculation with sample data
- [ ] Verify 2-week sprint period logic
- [ ] Test hours per point average calculation
- [ ] Test velocity trends with multiple weeks
- [ ] Verify workspace isolation

---

## Testing Requirements

### Unit Tests

**Backend (NestJS):**
- `TimeTrackingService.calculateProjectVelocity()`:
  - Calculates story points per 2-week period
  - Handles projects with no completed tasks
  - Correctly sums hours and points
  - Returns correct number of periods
- `TimeTrackingService.getVelocityTrends()`:
  - Calculates weekly velocity correctly
  - Determines trend (up/down/stable) accurately
  - Handles edge cases (first week, no data)
- `TimeTrackingService.getHoursPerPointAverage()`:
  - Calculates average hours per point
  - Handles tasks without story points
  - Returns 0 when no data available

**Location:** `apps/api/src/pm/agents/time-tracking.service.spec.ts`

**Agents (Python):**
- `get_velocity` tool fetches velocity data
- `get_velocity_trend` tool fetches trends
- Tools handle API errors gracefully
- Tools format data correctly for Chrono

**Location:** `agents/pm/tests/test_time_tracking_tools.py`

### Integration Tests

**API Endpoints:**
- `GET /api/pm/agents/time/velocity/:projectId`:
  - Returns velocity metrics
  - Respects workspace isolation
  - Accepts periods parameter
- `GET /api/pm/agents/time/velocity/:projectId/trends`:
  - Returns weekly trends
  - Respects workspace isolation
  - Accepts weeks parameter
- Both endpoints require authentication

**Location:** `apps/api/test/pm/agents/time-tracking.e2e-spec.ts`

### E2E Tests (Playwright)

**User Flows:**
1. Complete tasks over multiple sprints
2. Request velocity metrics
3. View velocity dashboard with trends
4. See hours per point average
5. Chrono explains velocity data in chat

**Location:** `apps/web/e2e/pm/agents/chrono-velocity.spec.ts`

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Chrono calculates story points per sprint period
- [ ] Hours per story point average calculated
- [ ] Velocity trends tracked over time
- [ ] Velocity dashboard data accessible via API
- [ ] Unit tests passing (backend + agents)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated:
  - [ ] Velocity calculation algorithm
  - [ ] API documentation
  - [ ] Chrono capabilities
- [ ] Workspace isolation verified
- [ ] TypeScript type checking passes

---

## References

- [Epic Definition](../epics/epic-pm-04-ai-team-navi-sage-chrono.md)
- [Epic Tech Spec](../epics/epic-pm-04-tech-spec.md)
- [Story PM-04.8 (Chrono Time Tracking)](./pm-04-8-chrono-time-tracking.md)
- [Module PRD](../PRD.md)
- [Module Architecture](../architecture.md)
- [Sprint Status](../sprint-status.yaml)

---

## Dev Notes

### Sprint Period Definition

2-week sprints (14 days) are standard for velocity calculation. This aligns with common agile practices and provides enough data points for meaningful trends.

### Velocity Calculation

Velocity is calculated by summing story points for tasks completed within each sprint period. Only tasks with status DONE or CLOSED are included.

### Hours Per Point

The hours per point metric helps calibrate future estimates. It's calculated as:
```
avgHoursPerPoint = totalActualHours / totalStoryPoints
```

Only tasks with both story points and actual hours logged are included.

### Trend Detection

Trends compare current week to previous week:
- **up**: More points completed than previous week
- **down**: Fewer points completed than previous week
- **stable**: Same number of points

### Performance Considerations

For projects with many completed tasks, consider:
- Indexing on completedAt field
- Caching velocity calculations
- Pre-calculating metrics nightly for large projects

### Future Enhancements (Phase 2)

- Custom sprint duration configuration
- Velocity forecasting using ML
- Burndown/burnup charts
- Velocity comparison across projects
- Team member velocity contributions
- Velocity-based capacity planning
- Sprint planning AI suggestions

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
