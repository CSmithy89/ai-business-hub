# Story PM-04.5: Sage Estimation Agent

**Epic:** PM-04 - AI Team: Navi, Sage, Chrono
**Status:** drafted
**Points:** 8

---

## User Story

As a **project manager**,
I want **AI-powered task estimation with confidence levels**,
So that **I can plan projects accurately even without historical data**.

---

## Acceptance Criteria

### AC1: Sage Agent Initialization
**Given** I am on a project page
**When** I request an estimate for a task
**Then** Sage agent is available and responds with estimation

### AC2: Task Complexity Analysis
**Given** I provide a task description
**When** Sage analyzes the task
**Then** Sage identifies complexity factors (type, scope, dependencies)

### AC3: Confidence Levels Provided
**Given** Sage generates an estimate
**When** I view the estimate
**Then** it includes a confidence level (low, medium, high) with reasoning

### AC4: Historical Data Consideration
**Given** the project has completed tasks
**When** Sage estimates a new task
**Then** Sage uses similar historical tasks to inform the estimate

---

## Technical Notes

### Sage Agent Implementation

**Location:** `agents/pm/sage.py`

Following the pattern from `agents/pm/navi.py`:

```python
from agno import Agent, Memory
from agno.storage import PostgresStorage
from agents.pm.tools import estimation_tools

def create_sage_agent(
    workspace_id: str,
    project_id: str,
    shared_memory: Memory
) -> Agent:
    """Create Sage agent for task estimation."""

    return Agent(
        name="Sage",
        role="Task Estimation Specialist",
        instructions=[
            "You are Sage, the task estimation specialist for HYVVE projects.",
            "Provide story point and hour estimates based on task description and type.",
            "Use historical data when available to inform your estimates.",
            "For new projects with no history, use industry benchmarks with 'low' confidence.",
            "Always explain the basis for your estimates.",
            "Learn from actual vs estimated time to improve accuracy.",
            "Provide three confidence levels: low (cold-start), medium (some data), high (strong pattern).",
            "Consider task type, complexity, scope, and dependencies in your analysis.",
        ],
        tools=[
            estimation_tools.estimate_task,
            estimation_tools.get_similar_tasks,
            estimation_tools.calculate_velocity,
            estimation_tools.get_estimation_metrics,
        ],
        memory=shared_memory,
        model="anthropic/claude-3-5-sonnet-20250122",  # Use workspace BYOAI config
    )
```

### Estimation Tools

**Location:** `agents/pm/tools/estimation_tools.py`

```python
from agno import tool
import requests
from typing import Optional, List
from datetime import datetime

API_URL = os.getenv('API_BASE_URL', 'http://localhost:3000')

@tool
def estimate_task(
    task_title: str,
    task_description: str,
    task_type: str,
    project_id: str
) -> dict:
    """
    Generate story point and hour estimates for a task.

    Args:
        task_title: Task title
        task_description: Detailed task description
        task_type: Type of task (FEATURE, BUG, CHORE, etc.)
        project_id: Project ID for historical context

    Returns:
        Estimation with confidence level and reasoning
    """

    # Get similar tasks from project history
    similar_tasks = get_similar_tasks_internal(
        project_id,
        task_type,
        task_title,
        task_description
    )

    # Calculate baseline estimates
    if similar_tasks:
        # Use historical data
        avg_hours = sum(t['actualHours'] for t in similar_tasks if t.get('actualHours')) / len(similar_tasks)
        avg_points = sum(t['storyPoints'] for t in similar_tasks if t.get('storyPoints')) / len(similar_tasks)
        confidence = 'high' if len(similar_tasks) >= 5 else 'medium'
        confidence_score = min(0.9, 0.6 + (len(similar_tasks) * 0.05))

        basis = f"Based on {len(similar_tasks)} similar {task_type} tasks in this project (avg {avg_hours:.1f}h)"
        cold_start = False
    else:
        # Use industry benchmarks (cold-start)
        benchmarks = get_industry_benchmarks(task_type)
        avg_hours = benchmarks['hours']
        avg_points = benchmarks['points']
        confidence = 'low'
        confidence_score = 0.4

        basis = f"Based on industry benchmarks for {task_type} tasks (no historical data available)"
        cold_start = True

    # Adjust for complexity indicators in description
    complexity_multiplier = analyze_complexity(task_title, task_description)
    estimated_hours = avg_hours * complexity_multiplier
    story_points = int(avg_points * complexity_multiplier)

    return {
        'storyPoints': story_points,
        'estimatedHours': round(estimated_hours, 1),
        'confidenceLevel': confidence,
        'confidenceScore': round(confidence_score, 2),
        'basis': basis,
        'coldStart': cold_start,
        'similarTasks': [t['id'] for t in similar_tasks] if similar_tasks else None,
        'complexityFactors': get_complexity_factors(task_title, task_description),
    }

@tool
def get_similar_tasks(project_id: str, task_type: str, search_query: str) -> List[dict]:
    """
    Find similar historical tasks for estimation reference.

    Args:
        project_id: Project ID
        task_type: Type of task to search for
        search_query: Search query (task title or description keywords)

    Returns:
        List of similar completed tasks with estimates and actuals
    """

    response = requests.post(
        f"{API_URL}/api/pm/agents/estimation/similar",
        json={
            'projectId': project_id,
            'taskType': task_type,
            'query': search_query,
            'limit': 10,
        }
    )

    if response.status_code == 404:
        return []

    response.raise_for_status()
    return response.json()

@tool
def calculate_velocity(project_id: str, sprint_count: int = 3) -> dict:
    """
    Calculate team velocity for the project.

    Args:
        project_id: Project ID
        sprint_count: Number of recent sprints to analyze

    Returns:
        Velocity metrics (points per sprint, hours per sprint)
    """

    response = requests.get(
        f"{API_URL}/api/pm/agents/estimation/velocity/{project_id}",
        params={'sprints': sprint_count}
    )

    if response.status_code == 404:
        return {
            'avgPointsPerSprint': None,
            'avgHoursPerSprint': None,
            'sprintCount': 0,
        }

    response.raise_for_status()
    return response.json()

@tool
def get_estimation_metrics(project_id: str, task_type: Optional[str] = None) -> dict:
    """
    Get historical estimation accuracy metrics.

    Args:
        project_id: Project ID
        task_type: Optional task type to filter by

    Returns:
        Accuracy metrics (average error, accuracy percentage)
    """

    params = {'projectId': project_id}
    if task_type:
        params['taskType'] = task_type

    response = requests.get(
        f"{API_URL}/api/pm/agents/estimation/metrics",
        params=params
    )

    if response.status_code == 404:
        return {
            'averageError': None,
            'averageAccuracy': None,
            'totalEstimations': 0,
        }

    response.raise_for_status()
    return response.json()

# Helper functions (not exposed as tools)

def get_similar_tasks_internal(
    project_id: str,
    task_type: str,
    title: str,
    description: str
) -> List[dict]:
    """Internal helper to find similar tasks."""

    # Combine title and description for search
    search_query = f"{title} {description}"[:200]

    try:
        return get_similar_tasks(project_id, task_type, search_query)
    except Exception as e:
        print(f"Error fetching similar tasks: {e}")
        return []

def get_industry_benchmarks(task_type: str) -> dict:
    """Get industry benchmark estimates for task types."""

    # Industry benchmarks based on common task types
    benchmarks = {
        'FEATURE': {'hours': 16, 'points': 5},
        'BUG': {'hours': 4, 'points': 2},
        'CHORE': {'hours': 2, 'points': 1},
        'RESEARCH': {'hours': 8, 'points': 3},
        'DOCUMENTATION': {'hours': 4, 'points': 2},
        'TESTING': {'hours': 8, 'points': 3},
        'REFACTORING': {'hours': 12, 'points': 5},
        'DESIGN': {'hours': 12, 'points': 5},
    }

    return benchmarks.get(task_type, {'hours': 8, 'points': 3})

def analyze_complexity(title: str, description: str) -> float:
    """
    Analyze task complexity and return multiplier (0.5 to 2.0).

    Looks for complexity indicators:
    - Simple: "fix", "update", "minor", "quick"
    - Complex: "implement", "integrate", "migrate", "redesign", "complex"
    - Very Complex: "architecture", "system", "end-to-end", "full"
    """

    text = f"{title} {description}".lower()

    # Simple indicators (reduce estimate)
    simple_keywords = ['fix', 'update', 'minor', 'quick', 'simple', 'small', 'typo']
    simple_count = sum(1 for kw in simple_keywords if kw in text)

    # Complex indicators (increase estimate)
    complex_keywords = [
        'implement', 'integrate', 'migrate', 'redesign', 'complex',
        'architecture', 'system', 'end-to-end', 'full', 'complete',
        'refactor', 'rewrite', 'new', 'multiple', 'all'
    ]
    complex_count = sum(1 for kw in complex_keywords if kw in text)

    # Calculate multiplier
    if simple_count > complex_count:
        return 0.7  # Simpler than average
    elif complex_count > simple_count:
        return 1.5  # More complex than average
    else:
        return 1.0  # Average complexity

def get_complexity_factors(title: str, description: str) -> List[str]:
    """Extract complexity factors for transparency."""

    text = f"{title} {description}".lower()
    factors = []

    if 'integrate' in text or 'integration' in text:
        factors.append('Integration required')
    if 'migrate' in text or 'migration' in text:
        factors.append('Data migration involved')
    if 'architecture' in text or 'architectural' in text:
        factors.append('Architectural changes')
    if 'multiple' in text:
        factors.append('Multiple components affected')
    if 'new' in text:
        factors.append('New functionality (higher uncertainty)')
    if 'fix' in text or 'bug' in text:
        factors.append('Bug fix (potentially simpler)')
    if 'simple' in text or 'minor' in text:
        factors.append('Marked as simple/minor')

    return factors if factors else ['Standard complexity']
```

### Backend Integration

**Location:** `apps/api/src/pm/agents/estimation.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AgentsService } from './agents.service';

interface EstimateTaskDto {
  title: string;
  description?: string;
  type: TaskType;
  projectId: string;
}

interface SageEstimate {
  storyPoints: number;
  estimatedHours: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  confidenceScore: number;
  basis: string;
  coldStart: boolean;
  similarTasks?: string[];
  complexityFactors: string[];
}

@Injectable()
export class EstimationService {
  constructor(
    private prisma: PrismaService,
    private agentsService: AgentsService,
  ) {}

  /**
   * Get estimate from Sage agent
   */
  async estimateTask(
    workspaceId: string,
    userId: string,
    dto: EstimateTaskDto
  ): Promise<SageEstimate> {
    // Invoke Sage agent
    const response = await this.agentsService.chat({
      workspaceId,
      projectId: dto.projectId,
      userId,
      agentName: 'sage',
      message: `Estimate this task: Title: "${dto.title}", Description: "${dto.description || 'N/A'}", Type: ${dto.type}`,
    });

    // Parse estimation from Sage's response
    // Response metadata should contain structured estimate
    const estimate = response.metadata?.estimate as SageEstimate;

    if (!estimate) {
      throw new Error('Sage failed to generate estimate');
    }

    return estimate;
  }

  /**
   * Find similar completed tasks for estimation reference
   */
  async findSimilarTasks(
    workspaceId: string,
    projectId: string,
    taskType: string,
    query: string,
    limit: number = 10
  ) {
    // Use full-text search on task titles/descriptions
    const tasks = await this.prisma.task.findMany({
      where: {
        workspaceId,
        projectId,
        type: taskType as any,
        status: 'DONE',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        actualHours: { not: null },
      },
      select: {
        id: true,
        title: true,
        type: true,
        storyPoints: true,
        estimatedHours: true,
        actualHours: true,
      },
      take: limit,
      orderBy: { completedAt: 'desc' },
    });

    return tasks;
  }

  /**
   * Calculate team velocity
   */
  async calculateVelocity(
    workspaceId: string,
    projectId: string,
    sprintCount: number = 3
  ) {
    // For MVP, calculate based on completed tasks in time windows
    // Proper sprint support would come from PM-02 (Task Management)

    const completedTasks = await this.prisma.task.findMany({
      where: {
        workspaceId,
        projectId,
        status: 'DONE',
        completedAt: { not: null },
      },
      select: {
        storyPoints: true,
        actualHours: true,
        completedAt: true,
      },
      orderBy: { completedAt: 'desc' },
      take: 50, // Last 50 completed tasks
    });

    if (completedTasks.length === 0) {
      return {
        avgPointsPerSprint: null,
        avgHoursPerSprint: null,
        sprintCount: 0,
      };
    }

    const totalPoints = completedTasks.reduce(
      (sum, t) => sum + (t.storyPoints || 0),
      0
    );
    const totalHours = completedTasks.reduce(
      (sum, t) => sum + (t.actualHours || 0),
      0
    );

    // Simplified: assume 2-week sprints, calculate velocity
    const weeksOfData = completedTasks.length > 0 ?
      Math.ceil(
        (new Date().getTime() - completedTasks[completedTasks.length - 1].completedAt!.getTime()) /
        (1000 * 60 * 60 * 24 * 7)
      ) : 0;

    const sprintsCompleted = Math.max(1, Math.floor(weeksOfData / 2));

    return {
      avgPointsPerSprint: Math.round(totalPoints / sprintsCompleted),
      avgHoursPerSprint: Math.round(totalHours / sprintsCompleted),
      sprintCount: sprintsCompleted,
    };
  }

  /**
   * Get estimation accuracy metrics
   */
  async getEstimationMetrics(
    workspaceId: string,
    projectId: string,
    taskType?: string
  ) {
    const where: any = {
      workspaceId,
      projectId,
      estimatedHours: { not: null },
      actualHours: { not: null },
    };

    if (taskType) {
      where.type = taskType;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      select: {
        estimatedHours: true,
        actualHours: true,
      },
    });

    if (tasks.length === 0) {
      return {
        averageError: null,
        averageAccuracy: null,
        totalEstimations: 0,
      };
    }

    const errors = tasks.map((t) =>
      Math.abs((t.actualHours! - t.estimatedHours!) / t.estimatedHours!)
    );
    const avgError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    const avgAccuracy = 1 - avgError;

    return {
      averageError: Math.round(avgError * 100) / 100,
      averageAccuracy: Math.round(avgAccuracy * 100),
      totalEstimations: tasks.length,
    };
  }
}
```

### API Endpoints

**Location:** `apps/api/src/pm/agents/agents.controller.ts`

Add estimation endpoints:

```typescript
@Controller('pm/agents')
@UseGuards(AuthGuard, TenantGuard)
export class AgentsController {
  constructor(
    private agentsService: AgentsService,
    private estimationService: EstimationService,
  ) {}

  @Post('estimation/estimate')
  async estimateTask(
    @GetWorkspace() workspaceId: string,
    @GetUser() user: User,
    @Body() dto: EstimateTaskDto
  ) {
    return this.estimationService.estimateTask(workspaceId, user.id, dto);
  }

  @Post('estimation/similar')
  async findSimilarTasks(
    @GetWorkspace() workspaceId: string,
    @Body() body: {
      projectId: string;
      taskType: string;
      query: string;
      limit?: number;
    }
  ) {
    return this.estimationService.findSimilarTasks(
      workspaceId,
      body.projectId,
      body.taskType,
      body.query,
      body.limit
    );
  }

  @Get('estimation/velocity/:projectId')
  async calculateVelocity(
    @GetWorkspace() workspaceId: string,
    @Param('projectId') projectId: string,
    @Query('sprints') sprints?: number
  ) {
    return this.estimationService.calculateVelocity(
      workspaceId,
      projectId,
      sprints ? parseInt(sprints as any, 10) : 3
    );
  }

  @Get('estimation/metrics')
  async getEstimationMetrics(
    @GetWorkspace() workspaceId: string,
    @Query('projectId') projectId: string,
    @Query('taskType') taskType?: string
  ) {
    return this.estimationService.getEstimationMetrics(
      workspaceId,
      projectId,
      taskType
    );
  }
}
```

### Frontend Component: EstimationDisplay

**Location:** `apps/web/src/components/pm/agents/EstimationDisplay.tsx`

```typescript
'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Info, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SageEstimate {
  storyPoints: number;
  estimatedHours: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  confidenceScore: number;
  basis: string;
  coldStart: boolean;
  similarTasks?: string[];
  complexityFactors: string[];
}

interface EstimationDisplayProps {
  estimate: SageEstimate;
  onOverride?: () => void;
}

export function EstimationDisplay({ estimate, onOverride }: EstimationDisplayProps) {
  return (
    <Card className="p-4 border-l-4 border-l-purple-500">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              SAGE ESTIMATION
            </span>
            <ConfidenceBadge level={estimate.confidenceLevel} />
          </div>
          <div className="flex items-baseline gap-4">
            <div>
              <span className="text-2xl font-bold">{estimate.storyPoints}</span>
              <span className="text-sm text-muted-foreground ml-1">points</span>
            </div>
            <div>
              <span className="text-2xl font-bold">{estimate.estimatedHours}</span>
              <span className="text-sm text-muted-foreground ml-1">hours</span>
            </div>
          </div>
        </div>

        {onOverride && (
          <button
            onClick={onOverride}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Override
          </button>
        )}
      </div>

      <div className="space-y-2">
        {/* Basis */}
        <div className="flex items-start gap-2 text-sm">
          <Info className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0" />
          <span className="text-muted-foreground">{estimate.basis}</span>
        </div>

        {/* Cold Start Warning */}
        {estimate.coldStart && (
          <div className="flex items-start gap-2 text-sm bg-yellow-50 dark:bg-yellow-950 p-2 rounded">
            <AlertCircle className="w-4 h-4 mt-0.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <span className="text-yellow-700 dark:text-yellow-300">
              No historical data available. Estimate based on industry benchmarks.
            </span>
          </div>
        )}

        {/* Complexity Factors */}
        {estimate.complexityFactors.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <TrendingUp className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0" />
            <div>
              <span className="text-muted-foreground">Complexity factors: </span>
              <span className="text-foreground">
                {estimate.complexityFactors.join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* Similar Tasks */}
        {estimate.similarTasks && estimate.similarTasks.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Based on {estimate.similarTasks.length} similar task
            {estimate.similarTasks.length !== 1 ? 's' : ''}
          </div>
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

### Update PM Team Factory

**Location:** `agents/pm/team.py`

Add Sage to the team:

```python
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
    sage = create_sage_agent(workspace_id, project_id, shared_memory)  # NEW

    return Team(
        name="PM Team",
        mode="coordinate",
        leader=navi,
        members=[sage],  # Add Sage to team
        memory=shared_memory,
        session_id=session_id,
        user_id=user_id,
        settings={
            "suggestion_mode": True,
            "confidence_threshold": 0.85,
            "kb_rag_enabled": True,
        }
    )
```

---

## Dependencies

### Prerequisites

- **PM-04.1** (Navi Agent Foundation) - Agent infrastructure and team factory
- **PM-02.3** (Task CRUD) - Task model with estimation fields
- **PM-02.7** (Task State Machine) - Task completion tracking for learning

### Blocks

- **PM-04.6** (Sage Estimation Learning) - Builds on this foundation

---

## Tasks

### Backend Tasks
- [ ] Create `apps/api/src/pm/agents/estimation.service.ts`
- [ ] Implement `estimateTask()` method with Sage invocation
- [ ] Implement `findSimilarTasks()` with full-text search
- [ ] Implement `calculateVelocity()` for team velocity
- [ ] Implement `getEstimationMetrics()` for accuracy tracking
- [ ] Add estimation endpoints to `agents.controller.ts`
- [ ] Add DTOs with validation (`EstimateTaskDto`)

### Agent Layer Tasks
- [ ] Create `agents/pm/sage.py` with `create_sage_agent()`
- [ ] Create `agents/pm/tools/estimation_tools.py`:
  - [ ] `estimate_task` tool with complexity analysis
  - [ ] `get_similar_tasks` tool
  - [ ] `calculate_velocity` tool
  - [ ] `get_estimation_metrics` tool
- [ ] Implement helper functions (benchmarks, complexity analysis)
- [ ] Update `agents/pm/team.py` to include Sage
- [ ] Configure Sage with shared memory

### Frontend Tasks
- [ ] Create `apps/web/src/components/pm/agents/EstimationDisplay.tsx`
- [ ] Implement confidence badge with visual indicators
- [ ] Implement cold-start warning display
- [ ] Implement complexity factors display
- [ ] Add "Override" functionality to edit estimates
- [ ] Integrate with task creation/edit forms

### Integration Tasks
- [ ] Test Sage agent responds to estimation requests
- [ ] Test cold-start estimates (no historical data)
- [ ] Test historical data usage when available
- [ ] Test complexity analysis with various task descriptions
- [ ] Test similar tasks search functionality

---

## Testing Requirements

### Unit Tests

**Backend (NestJS):**
- `EstimationService.estimateTask()` invokes Sage correctly
- `EstimationService.findSimilarTasks()` returns relevant tasks
- `EstimationService.calculateVelocity()` calculates correctly
- `EstimationService.getEstimationMetrics()` returns accuracy data
- Workspace scoping enforced on all queries

**Location:** `apps/api/src/pm/agents/estimation.service.spec.ts`

**Agents (Python):**
- `estimate_task` tool returns valid estimates
- Cold-start uses industry benchmarks with low confidence
- Historical data increases confidence level
- Complexity analysis adjusts estimates appropriately
- `get_similar_tasks` filters by type and searches correctly

**Location:** `agents/pm/tests/test_sage.py`

**Frontend (Vitest):**
- `EstimationDisplay` renders estimates correctly
- Confidence badges show correct colors and text
- Cold-start warning appears when `coldStart: true`
- Complexity factors display properly
- Override button triggers callback

**Location:** `apps/web/src/components/pm/agents/EstimationDisplay.test.tsx`

### Integration Tests

**API Endpoints:**
- `POST /api/pm/agents/estimation/estimate` returns Sage estimate
- `POST /api/pm/agents/estimation/similar` finds similar tasks
- `GET /api/pm/agents/estimation/velocity/:projectId` calculates velocity
- `GET /api/pm/agents/estimation/metrics` returns accuracy metrics
- Workspace isolation enforced

**Location:** `apps/api/test/pm/agents/estimation.e2e-spec.ts`

### E2E Tests (Playwright)

**User Flows:**
1. Create task → request estimate → Sage provides estimate with confidence
2. View estimate → see cold-start warning (new project)
3. Complete tasks → create similar task → estimate uses historical data
4. View estimate → complexity factors displayed
5. Override estimate → edit values → save

**Location:** `apps/web/e2e/pm/agents/sage-estimation.spec.ts`

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Sage agent responds to estimation requests
- [ ] Task complexity analysis working
- [ ] Confidence levels provided with reasoning
- [ ] Historical data used when available
- [ ] Cold-start estimates use industry benchmarks
- [ ] Similar tasks search functional
- [ ] Velocity calculation working
- [ ] Estimation metrics tracking working
- [ ] Unit tests passing (backend + agents + frontend)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated:
  - [ ] Sage agent documentation
  - [ ] Estimation API docs
  - [ ] Cold-start behavior guide
- [ ] Workspace isolation verified
- [ ] Sage added to PM team factory

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

### Industry Benchmarks

Cold-start estimates use these benchmarks:
- FEATURE: 16h, 5 points
- BUG: 4h, 2 points
- CHORE: 2h, 1 point
- RESEARCH: 8h, 3 points
- DOCUMENTATION: 4h, 2 points
- TESTING: 8h, 3 points
- REFACTORING: 12h, 5 points
- DESIGN: 12h, 5 points

These should be tunable via workspace settings in Phase 2.

### Complexity Analysis

Complexity multipliers:
- Simple (0.7x): Contains "fix", "update", "minor", "quick"
- Average (1.0x): Default
- Complex (1.5x): Contains "implement", "integrate", "migrate", "complex"

Factors are shown to users for transparency.

### Confidence Scoring

Confidence levels based on data availability:
- **Low (0.3-0.5)**: Cold-start, no historical data
- **Medium (0.6-0.75)**: 1-4 similar tasks found
- **High (0.8-0.9)**: 5+ similar tasks found

Confidence score increases with more historical data (up to 0.9 max).

### Similar Tasks Search

Search criteria:
1. Same project
2. Same task type
3. Completed (status = DONE)
4. Has actualHours recorded
5. Title/description text similarity

Returns top 10 most recent matches.

### Velocity Calculation

Simplified velocity for MVP:
- Last 50 completed tasks
- Calculate average points/hours per 2-week sprint
- Proper sprint support in PM-02 (Phase 2)

### Override Functionality

When user overrides Sage's estimate:
- Store override flag on task
- Don't use overridden tasks for future learning (PM-04.6)
- Show "Manually adjusted" badge in estimation history

### Future Enhancements (Phase 2)

- Machine learning model for better accuracy
- Team-specific velocity tracking
- Seasonal patterns (holidays, sprint cycles)
- Integration with external tools (Jira, Linear)
- Estimation confidence trends over time
- Custom benchmark configuration per workspace

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
