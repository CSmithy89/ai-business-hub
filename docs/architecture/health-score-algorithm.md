# Health Score Weighting Algorithm

## Overview

The project health score is a composite metric (0-100) that provides a quick assessment of project status. It combines four weighted factors to produce a single score.

## Algorithm

The health score is calculated as:

```
score = (onTimeDelivery * 30) + (blockerImpact * 25) + (teamCapacity * 25) + (velocityTrend * 20)
```

Each factor is normalized to a value between 0 and 1, then weighted to sum to 100.

## Factors

### 1. On-Time Delivery (30% weight)

Measures the proportion of tasks that are not overdue.

```
onTimeDelivery = (totalTasks - overdueTasks) / totalTasks
```

- A task is overdue if: `dueDate < now AND status != DONE`
- If no tasks exist, defaults to 1.0

**Rationale:** On-time delivery is the most visible indicator of project health and directly impacts stakeholder confidence.

### 2. Blocker Impact (25% weight)

Measures the proportion of tasks that are not blocked by dependencies.

```
blockerImpact = 1 - (blockedTasks / totalTasks)
```

- A task is blocked if it has one or more `BLOCKED_BY` relations
- If no tasks exist, defaults to 1.0

**Rationale:** Blocked tasks indicate bottlenecks that can cascade and delay the entire project.

### 3. Team Capacity (25% weight)

Measures the average workload balance across team members.

For each team member, a capacity score is calculated based on estimated hours of incomplete tasks:

| Hours | Score | Interpretation |
|-------|-------|----------------|
| 32-40 | 1.0 | Ideal workload |
| > 40 | `max(0, 1 - (hours - 40) / 40)` | Overloaded (penalty) |
| < 32 | `hours / 32` | Underutilized |

The team capacity is the average of all member scores. If no team data, defaults to 0.8.

**Rationale:** Overloaded team members lead to burnout and quality issues; underutilized members indicate inefficient resource allocation.

### 4. Velocity Trend (20% weight)

Compares recent velocity (last 7 days) to the historical baseline (last 28 days).

```
currentVelocity = tasksCompletedLast7Days
baselineVelocity = tasksCompletedLast28Days / 4

velocityTrend = min(1.0, currentVelocity / baselineVelocity)
```

Special cases:
- If baseline is 0 but current > 0: defaults to 0.75
- If baseline is 0 and current is 0: defaults to 0.5

**Rationale:** Velocity trend is a lagging indicator but provides insight into sustainable pace and potential burnout.

## Health Levels

The score maps to levels for quick interpretation:

| Score Range | Level |
|-------------|-------|
| 85-100 | EXCELLENT |
| 70-84 | GOOD |
| 50-69 | WARNING |
| 0-49 | CRITICAL |

## Trend Calculation

The trend is determined by comparing the current score to the most recent previous score:

| Condition | Trend |
|-----------|-------|
| Score increased by >= 5 points | IMPROVING |
| Score decreased by >= 5 points | DECLINING |
| Change within 5 points | STABLE |
| No previous score | STABLE |

## Implementation Details

- File: `apps/api/src/pm/agents/health.service.ts`
- Method: `calculateHealthScore()`
- Health checks run every 15 minutes via cron job
- Historical scores stored in `HealthScore` table

## Example Calculation

Given:
- 100 tasks total
- 10 overdue tasks (onTimeDelivery = 0.9)
- 5 blocked tasks (blockerImpact = 0.95)
- Team members averaging 38 hours (teamCapacity = 1.0)
- 10 completed last week, 32 completed last month (velocityTrend = 1.0)

```
score = (0.9 * 30) + (0.95 * 25) + (1.0 * 25) + (1.0 * 20)
      = 27 + 23.75 + 25 + 20
      = 95.75 (rounded to 96)
      = EXCELLENT
```

## References

- PM-05 Epic: Pulse Health Monitoring Agent
- Implementation: apps/api/src/pm/agents/health.service.ts
