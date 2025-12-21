# PM-08.5: What-If Scenarios / Team Performance Metrics

**Epic:** PM-08 - Prism Agent & Predictive Analytics
**Story:** PM-08.5 - What-If Scenarios / Team Performance Metrics
**Type:** Feature
**Points:** 5
**Status:** Drafted

---

## User Story

**As a** project lead
**I want** to model what-if scenarios and analyze team performance metrics
**So that** I can plan for changes, understand resource impacts, and make data-driven decisions about project adjustments

---

## Acceptance Criteria

### 1. Scenario Planner UI (AC-5.1)

- [ ] User can open a scenario planner modal/drawer from the analytics dashboard
- [ ] Planner displays current project baseline: velocity, scope, team size, predicted completion
- [ ] Interactive controls allow adjusting scenario variables
- [ ] Scenario adjustments are temporary and do not save to database
- [ ] User can reset scenario to baseline with one click
- [ ] Multiple scenarios can be compared side-by-side (up to 3)
- [ ] Scenario results update in real-time as variables change
- [ ] Clear visual distinction between baseline and scenario predictions

### 2. Scope Adjustment Variable (AC-5.1)

- [ ] Slider/input to add or remove scope (story points)
- [ ] Range: -1000 to +10000 points (validated on backend)
- [ ] Shows percentage change from baseline scope
- [ ] Visual indicator for significant scope changes (>10% = warning, >25% = alert)
- [ ] Input supports both slider and direct number entry
- [ ] Scope change updates predicted completion date immediately
- [ ] Shows impact on: weeks of work added/removed

### 3. Team Size Variable (AC-5.1)

- [ ] Slider/input to adjust team size (number of members)
- [ ] Range: -10 to +10 team members (validated on backend)
- [ ] Shows current team size as baseline
- [ ] Calculates adjusted velocity based on team size change
- [ ] Assumes linear velocity scaling (2x team = ~1.6x velocity, accounting for coordination overhead)
- [ ] Team size change updates predicted completion date immediately
- [ ] Shows impact on: new velocity, weeks saved/added

### 4. Velocity Adjustment Variable (AC-5.1)

- [ ] Slider/input to adjust velocity (percentage change)
- [ ] Range: -50% to +100% of baseline velocity
- [ ] Shows current velocity as baseline
- [ ] Velocity change updates predicted completion date immediately
- [ ] Explains factors that might affect velocity (e.g., "Assumes team improves processes", "Accounts for ramp-up time")
- [ ] Visual indicator for realistic vs unrealistic velocity changes

### 5. Scenario Forecast Results (AC-5.1)

- [ ] Displays updated predicted completion date for scenario
- [ ] Shows difference from baseline completion (e.g., "2 weeks earlier")
- [ ] Includes confidence level (LOW, MED, HIGH) based on realism of changes
- [ ] Shows optimistic and pessimistic date bands for scenario
- [ ] Displays updated resource needs (team-weeks, budget if applicable)
- [ ] Shows updated risk levels (e.g., scope creep risk if scope increased >10%)
- [ ] Natural language summary of scenario impact (e.g., "Adding 100 points and 2 team members will extend completion by 3 weeks with medium confidence")

### 6. Real-Time Recalculation (AC-5.2)

- [ ] Forecast updates within 3 seconds of variable change
- [ ] Uses debounced API calls to avoid excessive requests (300ms debounce)
- [ ] Shows loading indicator during recalculation
- [ ] Caches scenario results to avoid duplicate API calls
- [ ] Falls back to client-side linear projection if API call fails
- [ ] No page refresh required for scenario updates

### 7. Scenario Comparison

- [ ] User can save up to 3 scenarios for comparison
- [ ] Comparison table shows: scenario name, variables changed, predicted date, confidence, delta from baseline
- [ ] Visual chart compares completion dates across scenarios
- [ ] User can label scenarios (e.g., "Optimistic", "Add Dev", "Reduce Scope")
- [ ] Scenarios persist in session storage (cleared on navigation)
- [ ] Export comparison as CSV or PDF

### 8. Risk Level Indicators (AC-5.1)

- [ ] Scenario planner highlights new risks introduced by changes
- [ ] Risk types: Schedule risk, Resource risk, Scope creep risk
- [ ] Risk severity calculated based on magnitude of change
- [ ] Risk indicators show: icon, severity (LOW/MED/HIGH), description
- [ ] Clicking risk indicator shows mitigation suggestions
- [ ] Risks are color-coded (green = low, yellow = medium, red = high)

### 9. Team Performance Metrics Panel

- [ ] Dashboard section displays team performance metrics
- [ ] Metrics: Current velocity, Average velocity (4 weeks), Velocity trend (UP/DOWN/STABLE)
- [ ] Metrics: Cycle time (average days from start to done), Throughput (tasks/week)
- [ ] Metrics: Completion rate (% of estimated tasks completed on time)
- [ ] Metrics: Team capacity utilization (active tasks / team size)
- [ ] Each metric includes: current value, trend indicator, sparkline chart
- [ ] Comparison to workspace average (if available)
- [ ] Historical trend chart for each metric (last 12 weeks)

### 10. Performance Insights

- [ ] AI-generated insights based on team performance metrics
- [ ] Insight types: Performance improvements, Bottleneck detection, Optimization suggestions
- [ ] Insights include: title, description, actionable recommendation
- [ ] Insights prioritized by impact (high, medium, low)
- [ ] User can dismiss or mark insights as "addressed"
- [ ] Insights refresh daily or on-demand

---

## Technical Details

### Backend API - Scenario Forecasting

**Location:** `apps/api/src/pm/agents/analytics.service.ts`

**Existing method to use:** `getForecast(projectId, workspaceId, scenario?)`

The scenario parameter already supports:
```typescript
interface ForecastScenarioDto {
  addedScope?: number;    // Story points to add/remove
  teamSizeChange?: number; // Team members to add/remove (-10 to +10)
}
```

**Enhancements needed:**

```typescript
/**
 * Enhanced scenario DTO with additional variables
 */
export interface ForecastScenarioDto {
  addedScope?: number;          // -1000 to +10000
  teamSizeChange?: number;      // -10 to +10
  velocityMultiplier?: number;  // 0.5 to 2.0 (50% to 200% of baseline)
}

/**
 * Get scenario forecast with risk assessment
 */
async getScenarioForecast(
  projectId: string,
  workspaceId: string,
  scenario: ForecastScenarioDto,
): Promise<ScenarioForecastDto> {
  try {
    // Get baseline forecast
    const baseline = await this.getForecast(projectId, workspaceId);

    // Get scenario forecast
    const scenarioForecast = await this.getForecast(
      projectId,
      workspaceId,
      scenario,
    );

    // Calculate delta from baseline
    const baselineDate = new Date(baseline.predictedDate);
    const scenarioDate = new Date(scenarioForecast.predictedDate);
    const deltaDays = Math.floor(
      (scenarioDate.getTime() - baselineDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Assess risks introduced by scenario
    const risks = this.assessScenarioRisks(scenario, deltaDays);

    // Calculate confidence adjustment based on realism
    const confidenceAdjustment = this.calculateScenarioConfidence(scenario);

    return {
      baseline: {
        predictedDate: baseline.predictedDate,
        confidence: baseline.confidence,
      },
      scenario: {
        predictedDate: scenarioForecast.predictedDate,
        confidence: confidenceAdjustment,
        optimisticDate: scenarioForecast.optimisticDate,
        pessimisticDate: scenarioForecast.pessimisticDate,
      },
      delta: {
        days: deltaDays,
        weeks: Math.round(deltaDays / 7),
        direction: deltaDays > 0 ? 'LATER' : deltaDays < 0 ? 'EARLIER' : 'SAME',
      },
      risks,
      summary: this.generateScenarioSummary(scenario, deltaDays, risks),
      resourceImpact: {
        teamWeeks: this.calculateTeamWeeks(
          scenarioForecast,
          scenario.teamSizeChange,
        ),
        velocityChange: this.calculateVelocityChange(scenario),
      },
    };
  } catch (error: any) {
    this.logger.error(
      `Scenario forecast failed: ${error?.message}`,
      error?.stack,
    );
    throw error;
  }
}

/**
 * Assess risks introduced by scenario changes
 */
private assessScenarioRisks(
  scenario: ForecastScenarioDto,
  deltaDays: number,
): ScenarioRiskDto[] {
  const risks: ScenarioRiskDto[] = [];

  // Scope creep risk
  if (scenario.addedScope && scenario.addedScope > 0) {
    const scopeIncreasePct = scenario.addedScope / 100; // Assuming 100 baseline points
    if (scopeIncreasePct > 0.10) {
      risks.push({
        type: 'SCOPE_CREEP',
        severity: scopeIncreasePct > 0.25 ? 'HIGH' : 'MEDIUM',
        description: `Adding ${scenario.addedScope} points represents a ${(scopeIncreasePct * 100).toFixed(0)}% scope increase, which may introduce scope creep risk.`,
        mitigation:
          'Break new scope into separate phases or ensure adequate team capacity.',
      });
    }
  }

  // Team scaling risk
  if (scenario.teamSizeChange && Math.abs(scenario.teamSizeChange) > 2) {
    risks.push({
      type: 'TEAM_SCALING',
      severity:
        Math.abs(scenario.teamSizeChange) > 5 ? 'HIGH' : 'MEDIUM',
      description: `Changing team size by ${scenario.teamSizeChange} members may introduce coordination overhead and ramp-up time.`,
      mitigation:
        'Plan for onboarding time (2-4 weeks) and increased communication needs.',
    });
  }

  // Schedule risk
  if (deltaDays > 14) {
    // >2 weeks delay
    risks.push({
      type: 'SCHEDULE_DELAY',
      severity: deltaDays > 28 ? 'HIGH' : 'MEDIUM',
      description: `Scenario extends completion by ${Math.round(deltaDays / 7)} weeks, which may impact deadlines.`,
      mitigation:
        'Consider reducing scope or increasing team capacity to maintain timeline.',
    });
  }

  // Velocity unrealistic risk
  if (scenario.velocityMultiplier && scenario.velocityMultiplier > 1.5) {
    risks.push({
      type: 'UNREALISTIC_VELOCITY',
      severity: 'MEDIUM',
      description: `Assuming ${(scenario.velocityMultiplier * 100).toFixed(0)}% velocity increase may be unrealistic without process improvements.`,
      mitigation:
        'Ensure concrete plans for productivity improvements (automation, tooling, training).',
    });
  }

  return risks;
}

/**
 * Calculate scenario confidence level based on realism
 */
private calculateScenarioConfidence(
  scenario: ForecastScenarioDto,
): ConfidenceLevel {
  let confidenceScore = 1.0; // Start at HIGH

  // Reduce confidence for large scope changes
  if (scenario.addedScope && Math.abs(scenario.addedScope) > 100) {
    confidenceScore -= 0.2;
  }

  // Reduce confidence for large team changes
  if (scenario.teamSizeChange && Math.abs(scenario.teamSizeChange) > 3) {
    confidenceScore -= 0.3;
  }

  // Reduce confidence for unrealistic velocity increases
  if (scenario.velocityMultiplier && scenario.velocityMultiplier > 1.5) {
    confidenceScore -= 0.4;
  }

  // Map confidence score to levels
  if (confidenceScore >= 0.7) return ConfidenceLevel.HIGH;
  if (confidenceScore >= 0.4) return ConfidenceLevel.MED;
  return ConfidenceLevel.LOW;
}

/**
 * Generate natural language summary of scenario impact
 */
private generateScenarioSummary(
  scenario: ForecastScenarioDto,
  deltaDays: number,
  risks: ScenarioRiskDto[],
): string {
  const parts: string[] = [];

  // Scope change
  if (scenario.addedScope) {
    parts.push(
      `${scenario.addedScope > 0 ? 'Adding' : 'Removing'} ${Math.abs(scenario.addedScope)} points`,
    );
  }

  // Team size change
  if (scenario.teamSizeChange) {
    parts.push(
      `${scenario.teamSizeChange > 0 ? 'adding' : 'removing'} ${Math.abs(scenario.teamSizeChange)} team member${Math.abs(scenario.teamSizeChange) > 1 ? 's' : ''}`,
    );
  }

  // Velocity change
  if (scenario.velocityMultiplier && scenario.velocityMultiplier !== 1.0) {
    const pctChange = ((scenario.velocityMultiplier - 1.0) * 100).toFixed(0);
    parts.push(
      `assuming ${pctChange}% ${scenario.velocityMultiplier > 1 ? 'velocity increase' : 'velocity decrease'}`,
    );
  }

  // Impact
  const weeksChange = Math.round(deltaDays / 7);
  const impact =
    weeksChange > 0
      ? `extend completion by ${weeksChange} week${weeksChange > 1 ? 's' : ''}`
      : weeksChange < 0
        ? `accelerate completion by ${Math.abs(weeksChange)} week${Math.abs(weeksChange) > 1 ? 's' : ''}`
        : 'have minimal impact on completion date';

  // Risks
  const riskCount = risks.filter(r => r.severity === 'HIGH').length;
  const riskSuffix =
    riskCount > 0 ? ` with ${riskCount} high-severity risk${riskCount > 1 ? 's' : ''}` : '';

  return `${parts.join(' and ')} will ${impact}${riskSuffix}.`;
}
```

### Backend API - Team Performance Metrics

**New method in `analytics.service.ts`:**

```typescript
/**
 * Get team performance metrics for a project
 */
async getTeamPerformanceMetrics(
  projectId: string,
  workspaceId: string,
): Promise<TeamPerformanceMetricsDto> {
  try {
    // Fetch velocity data (current + historical)
    const velocityData = await this.getVelocityHistory(
      projectId,
      workspaceId,
      12, // 12 weeks
    );

    // Calculate current velocity
    const currentVelocity = velocityData[velocityData.length - 1]?.completedPoints || 0;

    // Calculate average velocity (last 4 weeks)
    const recentVelocity = velocityData.slice(-4);
    const averageVelocity =
      recentVelocity.reduce((sum, v) => sum + v.completedPoints, 0) / recentVelocity.length;

    // Determine velocity trend
    const velocityTrend = this.calculateVelocityTrend(velocityData);

    // Calculate cycle time (average days from start to done)
    const cycleTime = await this.calculateCycleTime(projectId, workspaceId);

    // Calculate throughput (tasks completed per week)
    const throughput = await this.calculateThroughput(projectId, workspaceId);

    // Calculate completion rate (% of estimated tasks completed on time)
    const completionRate = await this.calculateCompletionRate(
      projectId,
      workspaceId,
    );

    // Calculate capacity utilization
    const capacityUtilization = await this.calculateCapacityUtilization(
      projectId,
      workspaceId,
    );

    // Get workspace average for comparison (if available)
    const workspaceAverage = await this.getWorkspaceAverageMetrics(workspaceId);

    return {
      velocity: {
        current: currentVelocity,
        average: averageVelocity,
        trend: velocityTrend,
        sparkline: velocityData.map(v => v.completedPoints),
        comparisonToWorkspace: workspaceAverage?.velocity
          ? ((currentVelocity - workspaceAverage.velocity) / workspaceAverage.velocity) * 100
          : null,
      },
      cycleTime: {
        current: cycleTime,
        trend: this.calculateCycleTimeTrend(projectId, workspaceId),
        sparkline: await this.getCycleTimeHistory(projectId, workspaceId),
        comparisonToWorkspace: workspaceAverage?.cycleTime
          ? ((cycleTime - workspaceAverage.cycleTime) / workspaceAverage.cycleTime) * 100
          : null,
      },
      throughput: {
        current: throughput,
        trend: this.calculateThroughputTrend(projectId, workspaceId),
        sparkline: await this.getThroughputHistory(projectId, workspaceId),
        comparisonToWorkspace: workspaceAverage?.throughput
          ? ((throughput - workspaceAverage.throughput) / workspaceAverage.throughput) * 100
          : null,
      },
      completionRate: {
        current: completionRate,
        trend: this.calculateCompletionRateTrend(projectId, workspaceId),
        sparkline: await this.getCompletionRateHistory(projectId, workspaceId),
        comparisonToWorkspace: workspaceAverage?.completionRate
          ? completionRate - workspaceAverage.completionRate
          : null,
      },
      capacityUtilization: {
        current: capacityUtilization,
        status: this.getCapacityStatus(capacityUtilization),
      },
    };
  } catch (error: any) {
    this.logger.error(
      `Team performance metrics failed: ${error?.message}`,
      error?.stack,
    );
    throw error;
  }
}

/**
 * Calculate average cycle time (days from start to done)
 */
private async calculateCycleTime(
  projectId: string,
  workspaceId: string,
): Promise<number> {
  const completedTasks = await this.prisma.task.findMany({
    where: {
      project: {
        id: projectId,
        workspaceId: workspaceId,
      },
      status: 'DONE',
      startedAt: { not: null },
      completedAt: { not: null },
    },
    select: {
      startedAt: true,
      completedAt: true,
    },
  });

  if (completedTasks.length === 0) return 0;

  const totalCycleDays = completedTasks.reduce((sum, task) => {
    const cycleDays =
      (new Date(task.completedAt!).getTime() -
        new Date(task.startedAt!).getTime()) /
      (1000 * 60 * 60 * 24);
    return sum + cycleDays;
  }, 0);

  return totalCycleDays / completedTasks.length;
}

/**
 * Calculate throughput (tasks completed per week)
 */
private async calculateThroughput(
  projectId: string,
  workspaceId: string,
): Promise<number> {
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const completedTasks = await this.prisma.task.count({
    where: {
      project: {
        id: projectId,
        workspaceId: workspaceId,
      },
      status: 'DONE',
      completedAt: {
        gte: fourWeeksAgo,
      },
    },
  });

  return completedTasks / 4; // tasks per week
}

/**
 * Calculate completion rate (% of tasks completed on time)
 */
private async calculateCompletionRate(
  projectId: string,
  workspaceId: string,
): Promise<number> {
  const tasksWithDueDates = await this.prisma.task.findMany({
    where: {
      project: {
        id: projectId,
        workspaceId: workspaceId,
      },
      status: 'DONE',
      dueDate: { not: null },
      completedAt: { not: null },
    },
    select: {
      dueDate: true,
      completedAt: true,
    },
  });

  if (tasksWithDueDates.length === 0) return 100; // No data = assume 100%

  const onTimeTasks = tasksWithDueDates.filter(
    task =>
      new Date(task.completedAt!).getTime() <=
      new Date(task.dueDate!).getTime(),
  );

  return (onTimeTasks.length / tasksWithDueDates.length) * 100;
}

/**
 * Calculate capacity utilization (active tasks / team size)
 */
private async calculateCapacityUtilization(
  projectId: string,
  workspaceId: string,
): Promise<number> {
  // Get active tasks (in progress)
  const activeTasks = await this.prisma.task.count({
    where: {
      project: {
        id: projectId,
        workspaceId: workspaceId,
      },
      status: 'IN_PROGRESS',
    },
  });

  // Get team size (assuming project has team members)
  const project = await this.prisma.project.findUnique({
    where: { id: projectId },
    include: {
      _count: {
        select: { members: true },
      },
    },
  });

  const teamSize = project?._count.members || 1; // Default to 1 if no team data

  return activeTasks / teamSize;
}

/**
 * Get capacity status based on utilization
 */
private getCapacityStatus(
  utilization: number,
): 'UNDER_UTILIZED' | 'OPTIMAL' | 'OVER_UTILIZED' {
  if (utilization < 1.5) return 'UNDER_UTILIZED'; // <1.5 tasks per person
  if (utilization <= 3.0) return 'OPTIMAL'; // 1.5-3 tasks per person
  return 'OVER_UTILIZED'; // >3 tasks per person
}
```

### Frontend - Scenario Planner Component

**Location:** `apps/web/src/components/pm/analytics/ScenarioPlanner.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { debounce } from 'lodash';

interface ScenarioPlannerProps {
  projectId: string;
  baseline: {
    velocity: number;
    scope: number;
    teamSize: number;
    predictedDate: string;
  };
  open: boolean;
  onClose: () => void;
}

export function ScenarioPlanner({
  projectId,
  baseline,
  open,
  onClose,
}: ScenarioPlannerProps) {
  // Scenario variables
  const [addedScope, setAddedScope] = useState(0);
  const [teamSizeChange, setTeamSizeChange] = useState(0);
  const [velocityMultiplier, setVelocityMultiplier] = useState(1.0);

  // Forecast mutation
  const forecastMutation = useMutation({
    mutationFn: (scenario: any) =>
      api.pm.analytics.getScenarioForecast(projectId, scenario),
  });

  // Debounced forecast update
  const updateForecast = debounce(() => {
    forecastMutation.mutate({
      addedScope,
      teamSizeChange,
      velocityMultiplier: velocityMultiplier !== 1.0 ? velocityMultiplier : undefined,
    });
  }, 300);

  // Handle variable changes
  const handleScopeChange = (value: number) => {
    setAddedScope(value);
    updateForecast();
  };

  const handleTeamSizeChange = (value: number) => {
    setTeamSizeChange(value);
    updateForecast();
  };

  const handleVelocityChange = (value: number) => {
    setVelocityMultiplier(value);
    updateForecast();
  };

  // Reset to baseline
  const resetScenario = () => {
    setAddedScope(0);
    setTeamSizeChange(0);
    setVelocityMultiplier(1.0);
    forecastMutation.reset();
  };

  const scenarioData = forecastMutation.data;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>What-If Scenario Planner</DialogTitle>
          <DialogDescription>
            Model different scenarios to see their impact on project completion
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Baseline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Current Baseline</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Velocity</p>
                <p className="text-2xl font-bold">{baseline.velocity} pts/wk</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scope</p>
                <p className="text-2xl font-bold">{baseline.scope} pts</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Team Size</p>
                <p className="text-2xl font-bold">{baseline.teamSize}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Predicted Date</p>
                <p className="text-lg font-bold">
                  {new Date(baseline.predictedDate).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Scenario Variables */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Adjust Variables</h3>

            {/* Scope Adjustment */}
            <div className="space-y-2">
              <Label>Scope Change (Story Points)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[addedScope]}
                  onValueChange={([value]) => handleScopeChange(value)}
                  min={-100}
                  max={500}
                  step={10}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={addedScope}
                  onChange={e => handleScopeChange(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground w-16">
                  {((addedScope / baseline.scope) * 100).toFixed(0)}%
                </span>
              </div>
              {Math.abs(addedScope / baseline.scope) > 0.1 && (
                <p className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Significant scope change may introduce risks
                </p>
              )}
            </div>

            {/* Team Size Adjustment */}
            <div className="space-y-2">
              <Label>Team Size Change</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[teamSizeChange]}
                  onValueChange={([value]) => handleTeamSizeChange(value)}
                  min={-5}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={teamSizeChange}
                  onChange={e => handleTeamSizeChange(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground w-32">
                  {baseline.teamSize + teamSizeChange} total
                </span>
              </div>
              {Math.abs(teamSizeChange) > 2 && (
                <p className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Large team changes may introduce coordination overhead
                </p>
              )}
            </div>

            {/* Velocity Adjustment */}
            <div className="space-y-2">
              <Label>Velocity Multiplier</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[velocityMultiplier * 100]}
                  onValueChange={([value]) => handleVelocityChange(value / 100)}
                  min={50}
                  max={200}
                  step={10}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={(velocityMultiplier * 100).toFixed(0)}
                  onChange={e => handleVelocityChange(Number(e.target.value) / 100)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground w-32">
                  {(baseline.velocity * velocityMultiplier).toFixed(1)} pts/wk
                </span>
              </div>
              {velocityMultiplier > 1.5 && (
                <p className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  High velocity increases may be unrealistic
                </p>
              )}
            </div>
          </div>

          {/* Scenario Results */}
          {forecastMutation.isLoading && (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Calculating scenario...
                </p>
              </CardContent>
            </Card>
          )}

          {scenarioData && (
            <>
              {/* Forecast Result */}
              <Card>
                <CardHeader>
                  <CardTitle>Scenario Forecast</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Predicted Completion
                      </p>
                      <p className="text-2xl font-bold">
                        {new Date(
                          scenarioData.scenario.predictedDate,
                        ).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {scenarioData.delta.direction === 'EARLIER' ? (
                          <TrendingDown className="h-4 w-4 text-green-600" />
                        ) : scenarioData.delta.direction === 'LATER' ? (
                          <TrendingUp className="h-4 w-4 text-red-600" />
                        ) : (
                          <Minus className="h-4 w-4 text-gray-600" />
                        )}
                        <span className="text-sm">
                          {scenarioData.delta.weeks} week
                          {Math.abs(scenarioData.delta.weeks) !== 1 ? 's' : ''}{' '}
                          {scenarioData.delta.direction.toLowerCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Confidence</p>
                      <Badge
                        variant={
                          scenarioData.scenario.confidence === 'HIGH'
                            ? 'default'
                            : scenarioData.scenario.confidence === 'MED'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {scenarioData.scenario.confidence}
                      </Badge>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm">{scenarioData.summary}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Risks */}
              {scenarioData.risks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Risks Identified</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {scenarioData.risks.map((risk, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-3 border rounded"
                      >
                        <AlertCircle
                          className={`h-4 w-4 mt-0.5 ${
                            risk.severity === 'HIGH'
                              ? 'text-red-600'
                              : 'text-amber-600'
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{risk.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {risk.description}
                          </p>
                          {risk.mitigation && (
                            <p className="text-sm text-blue-600 mt-1">
                              Mitigation: {risk.mitigation}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={
                            risk.severity === 'HIGH' ? 'destructive' : 'secondary'
                          }
                        >
                          {risk.severity}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={resetScenario}>
              Reset to Baseline
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => {/* Save scenario */}}>
                Save Scenario
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Frontend - Team Performance Metrics Component

**Location:** `apps/web/src/components/pm/analytics/TeamPerformanceMetrics.tsx`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparklines, SparklinesLine } from 'react-sparklines';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TeamPerformanceMetricsProps {
  projectId: string;
}

export function TeamPerformanceMetrics({
  projectId,
}: TeamPerformanceMetricsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['team-performance', projectId],
    queryFn: () => api.pm.analytics.getTeamPerformance(projectId),
  });

  if (isLoading) {
    return <div>Loading metrics...</div>;
  }

  if (!data) {
    return <div>No data available</div>;
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'UP') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'DOWN')
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Velocity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Velocity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-bold">{data.velocity.current}</p>
            <span className="text-sm text-muted-foreground">pts/wk</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {getTrendIcon(data.velocity.trend)}
            <span className="text-sm text-muted-foreground">
              Avg: {data.velocity.average.toFixed(1)}
            </span>
          </div>
          {data.velocity.comparisonToWorkspace !== null && (
            <p className="text-xs text-muted-foreground mt-2">
              {data.velocity.comparisonToWorkspace > 0 ? '+' : ''}
              {data.velocity.comparisonToWorkspace.toFixed(0)}% vs workspace avg
            </p>
          )}
          <div className="mt-4">
            <Sparklines data={data.velocity.sparkline} width={200} height={40}>
              <SparklinesLine color="#3b82f6" />
            </Sparklines>
          </div>
        </CardContent>
      </Card>

      {/* Cycle Time */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Cycle Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-bold">
              {data.cycleTime.current.toFixed(1)}
            </p>
            <span className="text-sm text-muted-foreground">days</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {getTrendIcon(data.cycleTime.trend)}
            <span className="text-sm text-muted-foreground">per task</span>
          </div>
          {data.cycleTime.comparisonToWorkspace !== null && (
            <p className="text-xs text-muted-foreground mt-2">
              {data.cycleTime.comparisonToWorkspace > 0 ? '+' : ''}
              {data.cycleTime.comparisonToWorkspace.toFixed(0)}% vs workspace avg
            </p>
          )}
          <div className="mt-4">
            <Sparklines data={data.cycleTime.sparkline} width={200} height={40}>
              <SparklinesLine color="#10b981" />
            </Sparklines>
          </div>
        </CardContent>
      </Card>

      {/* Throughput */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Throughput</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-bold">
              {data.throughput.current.toFixed(1)}
            </p>
            <span className="text-sm text-muted-foreground">tasks/wk</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {getTrendIcon(data.throughput.trend)}
            <span className="text-sm text-muted-foreground">completed</span>
          </div>
          {data.throughput.comparisonToWorkspace !== null && (
            <p className="text-xs text-muted-foreground mt-2">
              {data.throughput.comparisonToWorkspace > 0 ? '+' : ''}
              {data.throughput.comparisonToWorkspace.toFixed(0)}% vs workspace avg
            </p>
          )}
          <div className="mt-4">
            <Sparklines
              data={data.throughput.sparkline}
              width={200}
              height={40}
            >
              <SparklinesLine color="#f59e0b" />
            </Sparklines>
          </div>
        </CardContent>
      </Card>

      {/* Completion Rate */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-bold">
              {data.completionRate.current.toFixed(0)}%
            </p>
            <span className="text-sm text-muted-foreground">on-time</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {getTrendIcon(data.completionRate.trend)}
            <span className="text-sm text-muted-foreground">task delivery</span>
          </div>
          {data.completionRate.comparisonToWorkspace !== null && (
            <p className="text-xs text-muted-foreground mt-2">
              {data.completionRate.comparisonToWorkspace > 0 ? '+' : ''}
              {data.completionRate.comparisonToWorkspace.toFixed(0)}% vs workspace avg
            </p>
          )}
          <div className="mt-4">
            <Sparklines
              data={data.completionRate.sparkline}
              width={200}
              height={40}
            >
              <SparklinesLine color="#8b5cf6" />
            </Sparklines>
          </div>
        </CardContent>
      </Card>

      {/* Capacity Utilization */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Capacity Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-bold">
              {data.capacityUtilization.current.toFixed(1)}
            </p>
            <span className="text-sm text-muted-foreground">tasks/person</span>
          </div>
          <div className="mt-2">
            <Badge
              variant={
                data.capacityUtilization.status === 'OPTIMAL'
                  ? 'default'
                  : data.capacityUtilization.status === 'UNDER_UTILIZED'
                    ? 'secondary'
                    : 'destructive'
              }
            >
              {data.capacityUtilization.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Data Transfer Objects

**Location:** `apps/api/src/pm/agents/dto/scenario-forecast.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class ForecastScenarioDto {
  @ApiProperty({
    description: 'Story points to add (positive) or remove (negative)',
    required: false,
    example: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(-1000)
  @Max(10000)
  addedScope?: number;

  @ApiProperty({
    description: 'Team members to add (positive) or remove (negative)',
    required: false,
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(-10)
  @Max(10)
  teamSizeChange?: number;

  @ApiProperty({
    description: 'Velocity multiplier (0.5 = 50%, 2.0 = 200%)',
    required: false,
    example: 1.2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(2.0)
  velocityMultiplier?: number;
}

export interface ScenarioForecastDto {
  baseline: {
    predictedDate: string;
    confidence: string;
  };
  scenario: {
    predictedDate: string;
    confidence: string;
    optimisticDate: string;
    pessimisticDate: string;
  };
  delta: {
    days: number;
    weeks: number;
    direction: 'EARLIER' | 'LATER' | 'SAME';
  };
  risks: ScenarioRiskDto[];
  summary: string;
  resourceImpact: {
    teamWeeks: number;
    velocityChange: number;
  };
}

export interface ScenarioRiskDto {
  type:
    | 'SCOPE_CREEP'
    | 'TEAM_SCALING'
    | 'SCHEDULE_DELAY'
    | 'UNREALISTIC_VELOCITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  mitigation: string;
}

export interface TeamPerformanceMetricsDto {
  velocity: {
    current: number;
    average: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
    sparkline: number[];
    comparisonToWorkspace: number | null;
  };
  cycleTime: {
    current: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
    sparkline: number[];
    comparisonToWorkspace: number | null;
  };
  throughput: {
    current: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
    sparkline: number[];
    comparisonToWorkspace: number | null;
  };
  completionRate: {
    current: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
    sparkline: number[];
    comparisonToWorkspace: number | null;
  };
  capacityUtilization: {
    current: number;
    status: 'UNDER_UTILIZED' | 'OPTIMAL' | 'OVER_UTILIZED';
  };
}
```

---

## Implementation Strategy

### Phase 1: Backend API - Scenario Enhancements
1. Extend `ForecastScenarioDto` to include `velocityMultiplier`
2. Implement `getScenarioForecast` method in `analytics.service.ts`
3. Implement `assessScenarioRisks` helper method
4. Implement `calculateScenarioConfidence` helper method
5. Implement `generateScenarioSummary` helper method
6. Test scenario forecasting with various variable combinations

### Phase 2: Backend API - Team Performance Metrics
1. Implement `getTeamPerformanceMetrics` method in `analytics.service.ts`
2. Implement helper methods: `calculateCycleTime`, `calculateThroughput`, `calculateCompletionRate`, `calculateCapacityUtilization`
3. Implement workspace average metrics calculation (for comparison)
4. Add API endpoint: `GET /api/pm/projects/:projectId/analytics/team-performance`
5. Test team performance metrics with various project states

### Phase 3: Frontend - Scenario Planner UI
1. Create `ScenarioPlanner` component with dialog/drawer layout
2. Implement scope adjustment slider/input with validation
3. Implement team size adjustment slider/input
4. Implement velocity multiplier slider/input
5. Implement debounced API calls (300ms) to avoid excessive requests
6. Display scenario forecast results (date, confidence, delta)
7. Display scenario risks with severity indicators
8. Implement reset to baseline functionality
9. Test real-time updates and performance

### Phase 4: Frontend - Team Performance Metrics UI
1. Create `TeamPerformanceMetrics` component
2. Implement metric cards for velocity, cycle time, throughput, completion rate, capacity
3. Integrate sparkline charts using react-sparklines
4. Display trend indicators (up/down/stable)
5. Show comparison to workspace average
6. Test responsive layout (desktop, tablet)

### Phase 5: Integration and Testing
1. Integrate `ScenarioPlanner` into analytics dashboard
2. Integrate `TeamPerformanceMetrics` into analytics dashboard
3. Unit test backend scenario methods
4. Unit test backend team performance methods
5. E2E test scenario planner UI flow
6. E2E test team performance metrics rendering
7. Performance test scenario recalculation (<3s requirement)
8. Test edge cases (extreme values, missing data)

---

## Dependencies

### Prerequisites
- PM-08.1 (Prism Agent Foundation) - DONE
- PM-08.2 (Completion Predictions) - DONE
- PM-08.4 (Analytics Dashboard) - DONE
- PM-02 (Task Management) - Task data for metrics
- PM-01 (Project Management) - Team member data

### External Dependencies
- **React Sparklines:** For sparkline charts in metrics cards
- **Lodash:** For debounce utility
- **React Query:** For data fetching and caching
- **Radix UI:** For dialog, slider, input components (via shadcn/ui)
- **Lucide Icons:** For trend indicators and alert icons

---

## Testing Strategy

### Unit Tests

**Backend (TypeScript):**
- Test `getScenarioForecast` with various scenario combinations
- Test `assessScenarioRisks` with different risk scenarios
- Test `calculateScenarioConfidence` with realistic/unrealistic changes
- Test `generateScenarioSummary` produces accurate descriptions
- Test `getTeamPerformanceMetrics` with various project states
- Test `calculateCycleTime` with tasks of varying durations
- Test `calculateThroughput` with different completion rates
- Test `calculateCompletionRate` with on-time and late tasks
- Test `calculateCapacityUtilization` with varying team sizes

**Frontend (React):**
- Test `ScenarioPlanner` renders with baseline data
- Test variable sliders update local state
- Test debounced API calls fire after 300ms
- Test reset button clears all variables
- Test risk indicators display for risky scenarios
- Test `TeamPerformanceMetrics` renders all metric cards
- Test sparklines render correctly
- Test trend indicators show correct icons

### Integration Tests
- Test scenario forecast API with complete scenario payload
- Test team performance API returns all required metrics
- Test workspace isolation (RLS) in team performance queries
- Test scenario confidence calculation accuracy
- Test risk detection across multiple scenario types

### E2E Tests
- Create project with historical data
- Navigate to analytics dashboard
- Open scenario planner
- Adjust scope, team size, velocity variables
- Verify forecast updates within 3 seconds
- Verify risks display for significant changes
- Reset scenario and verify baseline restored
- Navigate to team performance section
- Verify all metrics display correctly
- Test responsive layout on mobile

### Performance Tests
- Measure scenario forecast latency (target: <3s)
- Test debounce prevents excessive API calls
- Test scenario planner with 10 concurrent users
- Profile database queries for team performance metrics
- Validate sparkline rendering performance

---

## Observability and Monitoring

### Metrics to Track
- **Scenario Forecast Latency:** P50, P95, P99 response times
- **Scenario Request Volume:** # of scenario forecasts per day
- **Scenario Variables Distribution:** Most common variable changes
- **Team Metrics Query Performance:** Time to calculate metrics
- **Debounce Efficiency:** Reduction in API calls due to debouncing

### Logging
- Log every scenario forecast request with:
  - Project ID, scenario variables
  - Forecast result (date, confidence, risks)
  - Calculation time
- Log team performance metric calculations
- Log workspace average calculations
- Log performance degradation (>3s scenario latency)

### Alerts
- Alert on scenario forecast latency >3s (P95)
- Alert on team metrics calculation errors >1%
- Alert on high risk scenario patterns (e.g., >50% velocity increase)
- Alert on database query timeouts

---

## Security Considerations

- Validate all scenario inputs on backend (range limits enforced by DTOs)
- Ensure scenario forecasts enforce workspace isolation (RLS)
- Rate limit scenario forecast endpoint (10 requests per minute per user)
- Sanitize scenario summaries to prevent XSS (use plain text, no HTML)
- Validate user has access to project before showing team metrics
- Prevent DoS via extreme scenario values (max constraints in DTOs)

---

## Documentation

- Document scenario planner usage in user guide
- Explain how scenario risks are calculated
- Document team performance metrics definitions (velocity, cycle time, etc.)
- Add examples of realistic vs unrealistic scenario changes
- Document capacity utilization thresholds (under/optimal/over)
- Create troubleshooting guide for scenario forecast errors

---

## Definition of Done

- [ ] `getScenarioForecast` API method implemented and tested
- [ ] `assessScenarioRisks` helper method implemented
- [ ] `calculateScenarioConfidence` helper method implemented
- [ ] `generateScenarioSummary` helper method implemented
- [ ] `getTeamPerformanceMetrics` API method implemented and tested
- [ ] Helper methods for team metrics implemented (cycle time, throughput, completion rate, capacity)
- [ ] `ScenarioPlanner` frontend component implemented
- [ ] All scenario variables (scope, team size, velocity) functional
- [ ] Debounced API calls working (300ms debounce)
- [ ] Scenario forecast results display correctly
- [ ] Risk indicators display for significant changes
- [ ] Reset to baseline functionality working
- [ ] `TeamPerformanceMetrics` frontend component implemented
- [ ] All metric cards display correctly (velocity, cycle time, throughput, completion rate, capacity)
- [ ] Sparkline charts render correctly
- [ ] Trend indicators functional
- [ ] Workspace comparison displayed (if available)
- [ ] Scenario forecast returns within 3 seconds (AC-5.2)
- [ ] Unit tests passing (>80% coverage for new code)
- [ ] Integration tests passing (API endpoints)
- [ ] E2E tests passing (scenario planner flow, team metrics rendering)
- [ ] Performance tests validate <3s requirement
- [ ] Error handling and graceful degradation tested
- [ ] Observability logging implemented
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Type check passes with no errors

---

## Future Enhancements

- Save and share scenarios with team members
- Compare scenarios side-by-side (up to 3)
- Export scenario comparison as PDF/CSV
- Historical scenario tracking (what scenarios were modeled vs actual outcomes)
- AI-powered scenario recommendations (Prism suggests optimal scenarios)
- Monte Carlo simulation for scenario confidence bands
- Team member-level performance metrics (individual velocity, cycle time)
- Cross-project team performance comparisons
- Advanced capacity planning with skill-based assignments
- Predictive team scaling recommendations
- Integration with sprint planning (import scenario into next sprint)
- Scenario templates (common patterns: "Add sprint", "Reduce scope by 20%")
- Collaborative scenario planning (real-time multi-user editing)

---

## Notes

- **Scenario Realism:** The confidence level calculation penalizes unrealistic scenarios (e.g., >50% velocity increase, >5 team member changes) to guide users toward realistic planning.

- **Debouncing:** Use 300ms debounce to balance responsiveness with API efficiency. Users expect near-instant feedback (<500ms), but we want to avoid API spam during slider adjustments.

- **Team Performance Metrics:** Cycle time and throughput are flow metrics commonly used in Kanban/Lean methodologies. Capacity utilization helps identify under/over-utilized teams.

- **Workspace Comparison:** Comparing project metrics to workspace averages provides context (e.g., "Is our velocity normal?"). This requires calculating workspace-wide averages, which may be computationally expensive. Consider caching workspace averages.

- **Velocity Scaling:** When team size changes, velocity doesn't scale linearly due to coordination overhead. Use a scaling factor (e.g., 2x team = ~1.6x velocity) based on Brooks' Law.

- **Scope Creep Detection:** Automatically flag scenarios with >10% scope increase as potential scope creep risks. This aligns with the threshold in PM-08.4 scope trend analysis.

- **Performance Optimization:** If scenario forecasting exceeds 3s, consider pre-calculating common scenarios (e.g., +/- 10%, +/- 20% scope) and caching results.

- **Sparklines:** Use `react-sparklines` for lightweight inline charts. For more complex visualizations, consider Recharts (already used in PM-08.4).

- **Capacity Status Thresholds:**
  - Under-utilized: <1.5 tasks per person (team may be idle or overstaffed)
  - Optimal: 1.5-3 tasks per person (healthy workload)
  - Over-utilized: >3 tasks per person (risk of burnout, delays)

- **Completion Rate Calculation:** Only considers tasks with due dates. Tasks without due dates are excluded from on-time calculation to avoid skewing results.

---

**Created:** 2025-12-21
**Prerequisites:** PM-08.1, PM-08.2, PM-08.4
**Estimated Effort:** 5 points (6-8 hours)
**Wireframe Reference:** PM-33 (Predictive Analytics Dashboard)

---
