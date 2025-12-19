# Story PM-04.7: Sage Estimation Calibration

**Epic:** PM-04 - AI Team: Navi, Sage, Chrono
**Status:** drafted
**Points:** 5

---

## User Story

As a **project manager**,
I want **Sage to learn from estimation accuracy over time**,
So that **future estimates improve based on actual vs estimated comparison**.

---

## Acceptance Criteria

### AC1: System Tracks Actual vs Estimated Hours
**Given** a task is completed with actual hours logged
**When** the task has an estimated hours value
**Then** the system calculates and stores the variance (actual - estimated)

### AC2: Sage Uses Historical Accuracy to Adjust Future Estimates
**Given** Sage is generating an estimate for a new task
**When** historical accuracy data exists for the project and task type
**Then** Sage applies a calibration factor to adjust the estimate based on past accuracy

### AC3: Users Can View Estimation Accuracy Dashboard
**Given** I am viewing estimation metrics for a project
**When** I request calibration data
**Then** I see:
- Overall calibration factor for the project
- Calibration factor per task type
- Number of completed tasks used for calibration
- Average variance (actual vs estimated)
- Improvement trend over time

### AC4: Calibration Improves Over Time with More Data
**Given** more tasks are completed with actual hours tracked
**When** Sage generates new estimates
**Then** the calibration factor becomes more accurate
**And** estimates align closer to actual completion times

---

## Technical Notes

### Calibration Concept

Sage learns from estimation accuracy by tracking the ratio of actual hours to estimated hours across completed tasks. This calibration factor is then applied to future estimates to improve accuracy.

**Formula:**
```
Calibration Factor = Average(Actual Hours / Estimated Hours)

Calibrated Estimate = Base Estimate × Calibration Factor
```

**Example:**
- Base estimate: 8 hours
- Historical data shows tasks of this type consistently take 1.2× longer than estimated
- Calibration factor: 1.2
- Calibrated estimate: 8 × 1.2 = 9.6 hours

### Calibration Granularity

Calibration is calculated at multiple levels:
1. **Project-level**: Overall calibration across all task types
2. **Task-type-level**: Specific calibration per task type (FEATURE, BUG, etc.)
3. **Weighted average**: Recent tasks weighted more heavily than older tasks

### Implementation Details

**Location:** `apps/api/src/pm/agents/estimation.service.ts`

Add calibration methods:

```typescript
/**
 * Get calibration factor for a project and task type
 * Returns the average ratio of actual/estimated hours
 */
async getCalibrationFactor(
  workspaceId: string,
  projectId: string,
  taskType?: TaskType,
): Promise<{
  factor: number;
  confidence: number;
  sampleSize: number;
  averageVariance: number;
}> {
  const where: any = {
    workspaceId,
    projectId,
    estimatedHours: { not: null, gt: 0 },
    actualHours: { not: null, gt: 0 },
    status: 'DONE',
  };

  if (taskType) {
    where.type = taskType;
  }

  const tasks = await this.prisma.task.findMany({
    where,
    select: {
      estimatedHours: true,
      actualHours: true,
      completedAt: true,
    },
    orderBy: { completedAt: 'desc' },
    take: 50, // Last 50 completed tasks
  });

  if (tasks.length === 0) {
    return {
      factor: 1.0, // Neutral calibration
      confidence: 0,
      sampleSize: 0,
      averageVariance: 0,
    };
  }

  // Calculate weighted average (recent tasks weighted more)
  let weightedSum = 0;
  let totalWeight = 0;
  let varianceSum = 0;

  tasks.forEach((task, index) => {
    const ratio = task.actualHours! / task.estimatedHours!;
    const variance = task.actualHours! - task.estimatedHours!;

    // Weight decreases linearly from 1.0 to 0.5 for older tasks
    const weight = 1.0 - (index / tasks.length) * 0.5;

    weightedSum += ratio * weight;
    totalWeight += weight;
    varianceSum += variance;
  });

  const calibrationFactor = weightedSum / totalWeight;
  const averageVariance = varianceSum / tasks.length;

  // Confidence increases with sample size (max 0.9)
  const confidence = Math.min(0.9, 0.4 + (tasks.length / 50) * 0.5);

  return {
    factor: Math.round(calibrationFactor * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    sampleSize: tasks.length,
    averageVariance: Math.round(averageVariance * 10) / 10,
  };
}

/**
 * Get calibration data by task type
 */
async getCalibrationByTaskType(
  workspaceId: string,
  projectId: string,
): Promise<
  Record<
    string,
    {
      factor: number;
      confidence: number;
      sampleSize: number;
      averageVariance: number;
    }
  >
> {
  // Get all task types in the project
  const taskTypes = await this.prisma.task.findMany({
    where: {
      workspaceId,
      projectId,
      status: 'DONE',
      estimatedHours: { not: null, gt: 0 },
      actualHours: { not: null, gt: 0 },
    },
    select: { type: true },
    distinct: ['type'],
  });

  const calibrationByType: Record<string, any> = {};

  for (const { type } of taskTypes) {
    calibrationByType[type] = await this.getCalibrationFactor(
      workspaceId,
      projectId,
      type,
    );
  }

  return calibrationByType;
}
```

### Enhanced Estimation with Calibration

Update the `calculateEstimate` method to apply calibration:

```typescript
/**
 * Calculate estimate using historical data or industry benchmarks
 * Now includes calibration factor from learning
 */
private async calculateEstimateWithCalibration(
  workspaceId: string,
  projectId: string,
  dto: EstimateTaskDto,
  similarTasks: SimilarTask[],
): Promise<SageEstimate> {
  // Get base estimate (existing logic)
  let estimate: SageEstimate;

  if (similarTasks.length > 0) {
    // Use historical data
    const validTasks = similarTasks.filter(
      (t) => t.actualHours !== null && t.storyPoints !== null,
    );

    if (validTasks.length > 0) {
      const avgHours =
        validTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0) /
        validTasks.length;
      const avgPoints =
        validTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0) /
        validTasks.length;

      const complexityMultiplier = this.analyzeComplexity(
        dto.title,
        dto.description || '',
      );

      // Apply calibration factor
      const calibration = await this.getCalibrationFactor(
        workspaceId,
        projectId,
        dto.type,
      );

      const baseHours = avgHours * complexityMultiplier;
      const calibratedHours = baseHours * calibration.factor;

      const confidence =
        validTasks.length >= 5 ? 'high' : ('medium' as const);

      // Adjust confidence based on calibration confidence
      const combinedConfidence = Math.min(
        0.9,
        0.6 + validTasks.length * 0.05 + calibration.confidence * 0.2,
      );

      estimate = {
        storyPoints: Math.round(avgPoints * complexityMultiplier),
        estimatedHours: Math.round(calibratedHours * 10) / 10,
        confidenceLevel: confidence,
        confidenceScore: Math.round(combinedConfidence * 100) / 100,
        basis: this.buildCalibrationBasis(
          validTasks.length,
          dto.type,
          avgHours,
          calibration,
        ),
        coldStart: false,
        similarTasks: validTasks.map((t) => t.id),
        complexityFactors: this.getComplexityFactors(
          dto.title,
          dto.description || '',
        ),
      };
    } else {
      estimate = this.getIndustryBenchmarkEstimate(dto);
    }
  } else {
    estimate = this.getIndustryBenchmarkEstimate(dto);
  }

  return estimate;
}

/**
 * Build basis message that includes calibration info
 */
private buildCalibrationBasis(
  taskCount: number,
  taskType: TaskType,
  avgHours: number,
  calibration: { factor: number; confidence: number; sampleSize: number },
): string {
  let basis = `Based on ${taskCount} similar ${taskType} tasks (avg ${avgHours.toFixed(1)}h)`;

  if (calibration.sampleSize > 0 && calibration.factor !== 1.0) {
    const adjustment = calibration.factor > 1.0 ? 'increased' : 'decreased';
    const percentage = Math.abs((calibration.factor - 1.0) * 100).toFixed(0);
    basis += `. Calibrated ${adjustment} by ${percentage}% based on ${calibration.sampleSize} completed tasks`;
  }

  return basis;
}
```

### API Endpoint

**Location:** `apps/api/src/pm/agents/agents.controller.ts`

Add calibration endpoint:

```typescript
@Get('estimation/calibration/:projectId')
async getCalibrationData(
  @GetWorkspace() workspaceId: string,
  @Param('projectId') projectId: string,
) {
  // Get overall calibration
  const overall = await this.estimationService.getCalibrationFactor(
    workspaceId,
    projectId,
  );

  // Get calibration by task type
  const byTaskType = await this.estimationService.getCalibrationByTaskType(
    workspaceId,
    projectId,
  );

  // Get estimation metrics for trend analysis
  const metrics = await this.estimationService.getEstimationMetrics(
    workspaceId,
    projectId,
  );

  return {
    overall,
    byTaskType,
    metrics,
  };
}
```

### Calibration Response Format

```typescript
interface CalibrationData {
  overall: {
    factor: number;
    confidence: number;
    sampleSize: number;
    averageVariance: number;
  };
  byTaskType: Record<
    string,
    {
      factor: number;
      confidence: number;
      sampleSize: number;
      averageVariance: number;
    }
  >;
  metrics: {
    averageError: number | null;
    averageAccuracy: number | null;
    totalEstimations: number;
  };
}
```

### Example Response

```json
{
  "overall": {
    "factor": 1.15,
    "confidence": 0.75,
    "sampleSize": 42,
    "averageVariance": 2.3
  },
  "byTaskType": {
    "FEATURE": {
      "factor": 1.25,
      "confidence": 0.8,
      "sampleSize": 20,
      "averageVariance": 3.5
    },
    "BUG": {
      "factor": 0.95,
      "confidence": 0.7,
      "sampleSize": 15,
      "averageVariance": -0.8
    },
    "TASK": {
      "factor": 1.1,
      "confidence": 0.65,
      "sampleSize": 7,
      "averageVariance": 1.2
    }
  },
  "metrics": {
    "averageError": 0.18,
    "averageAccuracy": 82,
    "totalEstimations": 42
  }
}
```

### Frontend Component: CalibrationDashboard

**Location:** `apps/web/src/components/pm/agents/CalibrationDashboard.tsx`

```typescript
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalibrationDashboardProps {
  projectId: string;
}

export function CalibrationDashboard({ projectId }: CalibrationDashboardProps) {
  const { data, isLoading } = useCalibrationData(projectId);

  if (isLoading) {
    return <div>Loading calibration data...</div>;
  }

  if (!data || data.overall.sampleSize === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">
          No calibration data available yet. Complete tasks with time tracking to see estimation accuracy.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Calibration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Overall Estimation Accuracy</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            label="Calibration Factor"
            value={data.overall.factor}
            icon={<Target className="w-5 h-5" />}
            description={getCalibrationDescription(data.overall.factor)}
          />

          <MetricCard
            label="Average Variance"
            value={`${data.overall.averageVariance > 0 ? '+' : ''}${data.overall.averageVariance}h`}
            icon={
              data.overall.averageVariance > 0 ? (
                <TrendingUp className="w-5 h-5 text-red-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-green-500" />
              )
            }
            description="Average difference from estimates"
          />

          <MetricCard
            label="Sample Size"
            value={data.overall.sampleSize}
            icon={<Target className="w-5 h-5" />}
            description={`Based on ${data.overall.sampleSize} completed tasks`}
          />
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Confidence:</span>
            <ConfidenceBadge confidence={data.overall.confidence} />
          </div>
        </div>
      </Card>

      {/* By Task Type */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Calibration by Task Type</h3>

        <div className="space-y-3">
          {Object.entries(data.byTaskType).map(([type, calibration]) => (
            <TaskTypeCalibrationRow
              key={type}
              taskType={type}
              calibration={calibration}
            />
          ))}
        </div>
      </Card>

      {/* Estimation Metrics */}
      {data.metrics.totalEstimations > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Estimation Performance</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              label="Average Accuracy"
              value={`${data.metrics.averageAccuracy}%`}
              icon={<Target className="w-5 h-5" />}
              description="How close estimates are to actuals"
            />

            <MetricCard
              label="Total Estimations"
              value={data.metrics.totalEstimations}
              icon={<Target className="w-5 h-5" />}
              description="Tasks with both estimated and actual hours"
            />
          </div>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-muted rounded-lg">{icon}</div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}

function TaskTypeCalibrationRow({ taskType, calibration }) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <Badge variant="outline">{taskType}</Badge>
        <div>
          <div className="font-medium">
            Factor: {calibration.factor}×
          </div>
          <div className="text-sm text-muted-foreground">
            {calibration.sampleSize} tasks
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className={cn(
          "text-sm font-medium",
          calibration.averageVariance > 0 ? "text-red-600" : "text-green-600"
        )}>
          {calibration.averageVariance > 0 ? '+' : ''}{calibration.averageVariance}h avg
        </div>
        <ConfidenceBadge confidence={calibration.confidence} />
      </div>
    </div>
  );
}

function ConfidenceBadge({ confidence }) {
  const level = confidence >= 0.75 ? 'high' : confidence >= 0.5 ? 'medium' : 'low';

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
      {Math.round(confidence * 100)}% confidence
    </Badge>
  );
}

function getCalibrationDescription(factor: number): string {
  if (factor === 1.0) {
    return 'Perfect estimation';
  } else if (factor > 1.0) {
    const percent = Math.round((factor - 1.0) * 100);
    return `Tasks take ${percent}% longer than estimated`;
  } else {
    const percent = Math.round((1.0 - factor) * 100);
    return `Tasks complete ${percent}% faster than estimated`;
  }
}

// Hook for fetching calibration data
function useCalibrationData(projectId: string) {
  // Implementation would use SWR or React Query
  // For now, placeholder
  return { data: null, isLoading: false };
}
```

---

## Dependencies

### Prerequisites

- **PM-04.5** (Sage Estimation Agent) - Core estimation logic
- **PM-04.6** (Sage Story Point Suggestions) - Suggestion infrastructure
- **PM-02.1** (Task Data Model) - Task fields for actual hours tracking
- **PM-04.7** (Chrono Time Tracking) - Actual hours logging

### Blocks

- None (this is a learning enhancement, not blocking other features)

---

## Tasks

### Backend Tasks
- [ ] Add `getCalibrationFactor()` method to `EstimationService`
- [ ] Add `getCalibrationByTaskType()` method
- [ ] Create `calculateEstimateWithCalibration()` method
- [ ] Update `estimateTask()` to use calibration
- [ ] Add `buildCalibrationBasis()` helper
- [ ] Add calibration endpoint to controller
- [ ] Add DTOs with validation
- [ ] Add unit tests for calibration logic

### Frontend Tasks
- [ ] Create `CalibrationDashboard.tsx` component
- [ ] Create `MetricCard` sub-component
- [ ] Create `TaskTypeCalibrationRow` sub-component
- [ ] Create `useCalibrationData` hook
- [ ] Add calibration view to project settings or insights page
- [ ] Add calibration indicator to estimation displays

### Integration Tasks
- [ ] Test calibration factor calculation with various datasets
- [ ] Test weighted average (recent tasks weighted more)
- [ ] Test calibration applied to estimates
- [ ] Test confidence scoring based on sample size
- [ ] Test empty state (no completed tasks)
- [ ] Test workspace isolation

---

## Testing Requirements

### Unit Tests

**Backend (NestJS):**
- `EstimationService.getCalibrationFactor()` calculates correct ratio
- Weighted average gives more weight to recent tasks
- Confidence increases with sample size
- Returns neutral factor (1.0) when no data available
- Task type filtering works correctly
- Calibration applied to estimates correctly

**Location:** `apps/api/src/pm/agents/estimation.service.spec.ts`

**Frontend (Vitest):**
- `CalibrationDashboard` renders calibration data
- Metric cards display correct values
- Task type rows show calibration per type
- Empty state displays when no data
- Confidence badges show correct colors

**Location:** `apps/web/src/components/pm/agents/CalibrationDashboard.test.tsx`

### Integration Tests

**API Endpoints:**
- `GET /api/pm/agents/estimation/calibration/:projectId` returns calibration data
- Overall calibration calculated correctly
- By-task-type calibration calculated correctly
- Workspace isolation enforced

**Location:** `apps/api/test/pm/agents/estimation.e2e-spec.ts`

### E2E Tests (Playwright)

**User Flows:**
1. Complete tasks with actual hours → view calibration dashboard → see calibration factors
2. Create new estimate → see calibration applied in reasoning
3. View calibration by task type → see different factors per type
4. Complete more tasks → see calibration confidence increase

**Location:** `apps/web/e2e/pm/agents/sage-calibration.spec.ts`

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] System tracks actual vs estimated hours
- [ ] Sage uses historical accuracy to adjust estimates
- [ ] Users can view estimation accuracy dashboard
- [ ] Calibration improves over time with more data
- [ ] Calibration factor calculation implemented
- [ ] Weighted average with recent task bias
- [ ] Calibration applied to estimates
- [ ] Calibration endpoint working
- [ ] Dashboard component complete
- [ ] Unit tests passing (backend + frontend)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated:
  - [ ] Calibration algorithm explanation
  - [ ] API endpoint docs
  - [ ] Dashboard usage guide
- [ ] Workspace isolation verified

---

## References

- [Epic Definition](../epics/epic-pm-04-ai-team-navi-sage-chrono.md)
- [Epic Tech Spec](../epics/epic-pm-04-tech-spec.md)
- [Story PM-04.5 (Sage Estimation Agent)](./pm-04-5-sage-estimation-agent.md)
- [Story PM-04.6 (Sage Story Point Suggestions)](./pm-04-6-sage-story-point-suggestions.md)
- [Module PRD](../PRD.md)
- [Module Architecture](../architecture.md)

---

## Dev Notes

### Calibration Algorithm

The calibration factor uses a weighted average where recent tasks have more weight:
- Most recent task: weight = 1.0
- Oldest task (in sample): weight = 0.5
- Linear decrease in between

This ensures that:
- Team learning from recent work is reflected
- Old patterns don't overly bias current estimates
- Gradual improvement is captured

### Sample Size Threshold

- 0-10 tasks: Low confidence (0.4-0.5)
- 11-25 tasks: Medium confidence (0.5-0.7)
- 26+ tasks: High confidence (0.7-0.9)

Confidence caps at 0.9 to maintain some uncertainty.

### Calibration Bounds

To prevent extreme adjustments, calibration factor is bounded:
- Minimum: 0.5 (tasks taking half the time)
- Maximum: 2.0 (tasks taking twice as long)

This prevents outliers from skewing the model too heavily.

### Integration with PM-04.5

The calibration enhances the existing estimation logic without replacing it:
1. Calculate base estimate (existing logic)
2. Fetch calibration factor for task type
3. Apply calibration to base estimate
4. Include calibration info in reasoning

### When Calibration is NOT Applied

Calibration is not applied when:
- Sample size < 5 (not enough data)
- Cold-start estimates (no historical data)
- User manually overrides estimate

### Future Enhancements

- Machine learning model for more sophisticated calibration
- Seasonal patterns (end-of-sprint rush, holiday slowdowns)
- Team member-specific calibration
- Integration with velocity tracking
- Calibration decay (older data becomes less relevant over time)

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
