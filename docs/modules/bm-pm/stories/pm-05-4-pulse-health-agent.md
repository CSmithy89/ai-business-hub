# Story PM-05.4: Pulse Agent - Health Monitoring

**Epic:** PM-05 - AI Team: Scope, Pulse, Herald
**Status:** review
**Points:** 8

---

## User Story

As a **project user**,
I want **continuous project health monitoring**,
So that **I'm warned of issues early**.

---

## Acceptance Criteria

### AC1: Continuous Health Monitoring
**Given** Pulse monitors project continuously
**When** risk detected (overdue, blocked, overloaded)
**Then** notification sent to relevant users

### AC2: Risk Detection Types
**Given** Pulse is running health checks
**When** analyzing project state
**Then** detects risk types: 48-hour deadline warning, blocker chain detected, team member overloaded, velocity drop

### AC3: Severity Levels
**Given** risk is detected
**When** risk is created
**Then** assigned severity: info, warning, critical

---

## Technical Notes

### Agent Implementation

**Location:** `agents/pm/pulse.py`

Following the pattern from `agents/pm/scope.py` and `agents/pm/team.py`:

```python
from agno import Agent, Memory
from agno.storage import PostgresStorage
from agents.pm.tools import health_tools

def create_pulse_agent(
    workspace_id: str,
    project_id: str,
    shared_memory: Memory,
    model: Optional[str] = None,
) -> Agent:
    """Create Pulse agent for project health monitoring."""

    return Agent(
        name="Pulse",
        role="Project Health Monitoring Specialist",
        instructions=[
            "You are Pulse, the project health monitoring specialist for HYVVE projects.",
            "Continuously monitor project health and detect risks early.",
            "Risk types to detect:",
            "  • 48-hour deadline warning: Tasks due in next 48 hours",
            "  • Blocker chain detected: 3+ tasks blocked by same dependency",
            "  • Team member overloaded: >40 hours assigned this week",
            "  • Velocity drop: 30% below 4-week baseline",
            "Health score calculation (0-100):",
            "  • 85-100: Excellent (green)",
            "  • 70-84: Good (blue)",
            "  • 50-69: Warning (yellow)",
            "  • 0-49: Critical (red)",
            "Factors: on-time delivery, blocker count, team capacity, velocity trend.",
            "Send alerts for WARNING and CRITICAL levels.",
            "Provide clear explanations of health factors and improvement suggestions.",
        ],
        tools=[
            health_tools.detect_risks,
            health_tools.calculate_health_score,
            health_tools.check_team_capacity,
            health_tools.analyze_velocity,
            health_tools.detect_blocker_chains,
            health_tools.get_overdue_tasks,
        ],
        memory=shared_memory,
        model=model or "anthropic/claude-sonnet-4-20250514",
        markdown=True,
        add_datetime_to_instructions=True,
    )
```

**Team Integration:**

Update `agents/pm/team.py` to include Pulse in the PM team:

```python
def create_pm_team(
    session_id: str,
    user_id: str,
    workspace_id: str,
    project_id: str,
    model: Optional[str] = None,
    debug_mode: bool = False,
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
    navi = create_navi_agent(workspace_id, project_id, shared_memory, model)
    sage = create_sage_agent(workspace_id, project_id, shared_memory, model)
    chrono = create_chrono_agent(workspace_id, project_id, shared_memory, model)
    scope = create_scope_agent(workspace_id, project_id, shared_memory, model)
    pulse = create_pulse_agent(workspace_id, project_id, shared_memory, model)

    return Team(
        name="PM Team",
        mode="coordinate",
        leader=navi,
        members=[sage, chrono, scope, pulse],  # Added Pulse
        memory=shared_memory,
        session_id=session_id,
        user_id=user_id,
        instructions=[
            "You are the PM Team for HYVVE's Core-PM module.",
            "Your goal is to help users manage their projects effectively.",
            "Always suggest actions, never auto-execute (suggestion_mode: True).",
            "Use Knowledge Base search for context when appropriate (kb_rag_enabled: True).",
            "Scope handles phase management and transitions.",
            "Pulse monitors project health and detects risks proactively.",
        ],
    )
```

### Agent Tools

**Location:** `agents/pm/tools/health_tools.py`

```python
from agno import tool
import httpx
from typing import List, Dict, Optional
import os
from datetime import datetime

API_URL = os.getenv("API_URL", "http://localhost:3000")
AGENT_SERVICE_TOKEN = os.getenv("AGENT_SERVICE_TOKEN", "")

if not AGENT_SERVICE_TOKEN:
    import logging
    logging.warning("AGENT_SERVICE_TOKEN not set - agent API calls may fail")

@tool
def detect_risks(
    workspace_id: str,
    project_id: str
) -> Dict[str, any]:
    """
    Detect all types of project risks.

    Scans for:
    - Tasks due in next 48 hours
    - Blocker chains (3+ tasks blocked by same issue)
    - Team members with >40h assigned this week
    - Velocity drop (30% below 4-week baseline)

    Args:
        workspace_id: Workspace identifier
        project_id: Project to analyze

    Returns:
        Dict with detected risks:
        {
            "risks": [
                {
                    "type": "deadline_warning" | "blocker_chain" | "capacity_overload" | "velocity_drop",
                    "severity": "info" | "warning" | "critical",
                    "title": str,
                    "description": str,
                    "affectedTasks": [str],
                    "affectedUsers": [str]
                }
            ]
        }

    Raises:
        httpx.HTTPStatusError: If API request fails
    """
    with httpx.Client(timeout=30.0) as client:
        try:
            response = client.post(
                f"{API_URL}/api/pm/agents/health/{project_id}/detect-risks",
                headers={
                    "Authorization": f"Bearer {AGENT_SERVICE_TOKEN}",
                    "x-workspace-id": workspace_id,
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            return {
                "error": f"HTTP {e.response.status_code}",
                "message": str(e),
                "risks": []
            }
        except Exception as e:
            return {
                "error": "Request failed",
                "message": str(e),
                "risks": []
            }

@tool
def calculate_health_score(
    workspace_id: str,
    project_id: str
) -> Dict[str, any]:
    """
    Calculate project health score (0-100).

    Health factors:
    - On-time delivery (% tasks completed by due date)
    - Blocker impact (severity of blocking issues)
    - Team capacity (utilization health)
    - Velocity trend (vs 4-week baseline)

    Score levels:
    - 85-100: Excellent (green)
    - 70-84: Good (blue)
    - 50-69: Warning (yellow)
    - 0-49: Critical (red)

    Args:
        workspace_id: Workspace identifier
        project_id: Project to analyze

    Returns:
        Dict with health score:
        {
            "score": int (0-100),
            "level": "excellent" | "good" | "warning" | "critical",
            "trend": "improving" | "stable" | "declining",
            "factors": {
                "onTimeDelivery": float (0-1),
                "blockerImpact": float (0-1),
                "teamCapacity": float (0-1),
                "velocityTrend": float (0-1)
            },
            "explanation": str,
            "suggestions": [str]
        }

    Raises:
        httpx.HTTPStatusError: If API request fails
    """
    with httpx.Client(timeout=30.0) as client:
        try:
            response = client.post(
                f"{API_URL}/api/pm/agents/health/{project_id}/calculate-score",
                headers={
                    "Authorization": f"Bearer {AGENT_SERVICE_TOKEN}",
                    "x-workspace-id": workspace_id,
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            return {
                "error": f"HTTP {e.response.status_code}",
                "message": str(e),
                "score": 50,
                "level": "warning",
                "trend": "stable"
            }
        except Exception as e:
            return {
                "error": "Request failed",
                "message": str(e),
                "score": 50,
                "level": "warning",
                "trend": "stable"
            }

@tool
def check_team_capacity(
    workspace_id: str,
    project_id: str
) -> Dict[str, any]:
    """
    Check if any team members are overloaded.

    Overload threshold: >40 hours assigned this week

    Args:
        workspace_id: Workspace identifier
        project_id: Project to analyze

    Returns:
        Dict with capacity info:
        {
            "overloadedMembers": [
                {
                    "userId": str,
                    "userName": str,
                    "assignedHours": float,
                    "threshold": 40,
                    "overloadPercent": float
                }
            ],
            "teamHealth": "healthy" | "at_capacity" | "overloaded"
        }

    Raises:
        httpx.HTTPStatusError: If API request fails
    """
    with httpx.Client(timeout=30.0) as client:
        try:
            response = client.get(
                f"{API_URL}/api/pm/agents/health/{project_id}/team-capacity",
                headers={
                    "Authorization": f"Bearer {AGENT_SERVICE_TOKEN}",
                    "x-workspace-id": workspace_id,
                },
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            return {
                "error": f"HTTP {e.response.status_code}",
                "message": str(e),
                "overloadedMembers": [],
                "teamHealth": "healthy"
            }
        except Exception as e:
            return {
                "error": "Request failed",
                "message": str(e),
                "overloadedMembers": [],
                "teamHealth": "healthy"
            }

@tool
def analyze_velocity(
    workspace_id: str,
    project_id: str
) -> Dict[str, any]:
    """
    Analyze project velocity vs baseline.

    Compares current velocity (last week) to 4-week baseline.
    Velocity drop alert: >30% below baseline

    Args:
        workspace_id: Workspace identifier
        project_id: Project to analyze

    Returns:
        Dict with velocity analysis:
        {
            "currentVelocity": float,
            "baselineVelocity": float,
            "changePercent": float,
            "trend": "up" | "stable" | "down",
            "alert": bool (true if >30% drop)
        }

    Raises:
        httpx.HTTPStatusError: If API request fails
    """
    with httpx.Client(timeout=30.0) as client:
        try:
            response = client.get(
                f"{API_URL}/api/pm/agents/health/{project_id}/velocity",
                headers={
                    "Authorization": f"Bearer {AGENT_SERVICE_TOKEN}",
                    "x-workspace-id": workspace_id,
                },
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            return {
                "error": f"HTTP {e.response.status_code}",
                "message": str(e),
                "currentVelocity": 0,
                "baselineVelocity": 0,
                "trend": "stable",
                "alert": False
            }
        except Exception as e:
            return {
                "error": "Request failed",
                "message": str(e),
                "currentVelocity": 0,
                "baselineVelocity": 0,
                "trend": "stable",
                "alert": False
            }

@tool
def detect_blocker_chains(
    workspace_id: str,
    project_id: str
) -> Dict[str, any]:
    """
    Detect blocker chains (3+ tasks blocked by same dependency).

    Args:
        workspace_id: Workspace identifier
        project_id: Project to analyze

    Returns:
        Dict with blocker chains:
        {
            "chains": [
                {
                    "blockerId": str,
                    "blockerTitle": str,
                    "blockedTasks": [
                        {
                            "id": str,
                            "title": str,
                            "assignee": str
                        }
                    ],
                    "severity": "warning" | "critical"
                }
            ]
        }

    Raises:
        httpx.HTTPStatusError: If API request fails
    """
    with httpx.Client(timeout=30.0) as client:
        try:
            response = client.get(
                f"{API_URL}/api/pm/agents/health/{project_id}/blocker-chains",
                headers={
                    "Authorization": f"Bearer {AGENT_SERVICE_TOKEN}",
                    "x-workspace-id": workspace_id,
                },
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            return {
                "error": f"HTTP {e.response.status_code}",
                "message": str(e),
                "chains": []
            }
        except Exception as e:
            return {
                "error": "Request failed",
                "message": str(e),
                "chains": []
            }

@tool
def get_overdue_tasks(
    workspace_id: str,
    project_id: str
) -> Dict[str, any]:
    """
    Get tasks that are overdue or due within 48 hours.

    Args:
        workspace_id: Workspace identifier
        project_id: Project to analyze

    Returns:
        Dict with overdue and upcoming tasks:
        {
            "overdue": [
                {
                    "id": str,
                    "title": str,
                    "dueDate": str,
                    "daysOverdue": int,
                    "assignee": str
                }
            ],
            "dueSoon": [
                {
                    "id": str,
                    "title": str,
                    "dueDate": str,
                    "hoursRemaining": float,
                    "assignee": str
                }
            ]
        }

    Raises:
        httpx.HTTPStatusError: If API request fails
    """
    with httpx.Client(timeout=30.0) as client:
        try:
            response = client.get(
                f"{API_URL}/api/pm/agents/health/{project_id}/overdue-tasks",
                headers={
                    "Authorization": f"Bearer {AGENT_SERVICE_TOKEN}",
                    "x-workspace-id": workspace_id,
                },
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            return {
                "error": f"HTTP {e.response.status_code}",
                "message": str(e),
                "overdue": [],
                "dueSoon": []
            }
        except Exception as e:
            return {
                "error": "Request failed",
                "message": str(e),
                "overdue": [],
                "dueSoon": []
            }
```

### Data Models

**Location:** `packages/db/prisma/schema.prisma`

Add RiskEntry and HealthScore models:

```prisma
/// RiskEntry - Detected project risks and alerts
model RiskEntry {
  id            String   @id @default(cuid())
  workspaceId   String   @map("workspace_id")
  projectId     String   @map("project_id")

  // Risk details
  type          RiskType
  severity      RiskSeverity
  title         String
  description   String   @db.Text

  // Affected entities
  affectedTasks String[] @map("affected_tasks")  // Array of task IDs
  affectedUsers String[] @map("affected_users")  // Array of user IDs

  // Status
  status        RiskStatus @default(ACTIVE)
  detectedAt    DateTime @default(now()) @map("detected_at")
  resolvedAt    DateTime? @map("resolved_at")
  acknowledgedBy String? @map("acknowledged_by")
  acknowledgedAt DateTime? @map("acknowledged_at")

  // Timestamps
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@index([workspaceId, projectId])
  @@index([status, severity])
  @@index([detectedAt])
  @@map("risk_entries")
}

/// HealthScore - Project health calculations
model HealthScore {
  id            String   @id @default(cuid())
  workspaceId   String   @map("workspace_id")
  projectId     String   @map("project_id")

  // Score
  score         Int      // 0-100
  level         HealthLevel
  trend         HealthTrend

  // Factor breakdown
  onTimeDelivery   Float  @map("on_time_delivery")    // 0-1
  blockerImpact    Float  @map("blocker_impact")      // 0-1
  teamCapacity     Float  @map("team_capacity")       // 0-1
  velocityTrend    Float  @map("velocity_trend")      // 0-1

  // Metadata
  riskCount     Int      @map("risk_count")
  explanation   String   @db.Text

  // Timestamps
  calculatedAt  DateTime @default(now()) @map("calculated_at")

  @@index([workspaceId, projectId, calculatedAt])
  @@map("health_scores")
}

// Enums
enum RiskType {
  DEADLINE_WARNING      // Task due in 48h
  BLOCKER_CHAIN         // Multiple tasks blocked
  CAPACITY_OVERLOAD     // Team member >40h assigned
  VELOCITY_DROP         // 30% below baseline
  SCOPE_CREEP           // Scope increased significantly
}

enum RiskSeverity {
  INFO
  WARNING
  CRITICAL
}

enum RiskStatus {
  ACTIVE
  ACKNOWLEDGED
  RESOLVED
  DISMISSED
}

enum HealthLevel {
  EXCELLENT  // 85-100
  GOOD       // 70-84
  WARNING    // 50-69
  CRITICAL   // 0-49
}

enum HealthTrend {
  IMPROVING
  STABLE
  DECLINING
}
```

Extend Project model:

```prisma
model Project {
  // ... existing fields ...

  // Health tracking (PM-05)
  healthScore     Int?     @map("health_score")  // Latest health score
  lastHealthCheck DateTime? @map("last_health_check")

  // ... rest of model ...
}
```

### Backend Services

**Location:** `apps/api/src/pm/agents/health.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { AgentOSService } from '@/modules/agent-os/agent-os.service';
import { NotificationService } from '@/modules/notifications/notification.service';
import { RiskType, RiskSeverity, RiskStatus, HealthLevel, HealthTrend } from '@prisma/client';

interface HealthScore {
  score: number;  // 0-100
  level: HealthLevel;
  trend: HealthTrend;
  factors: {
    onTimeDelivery: number;      // 0-1
    blockerImpact: number;       // 0-1
    teamCapacity: number;        // 0-1
    velocityTrend: number;       // 0-1
  };
  riskCount: number;
  explanation: string;
  suggestions: string[];
}

interface RiskEntry {
  type: RiskType;
  severity: RiskSeverity;
  title: string;
  description: string;
  affectedTasks: string[];
  affectedUsers: string[];
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private prisma: PrismaService,
    private agentOS: AgentOSService,
    private notifications: NotificationService,
  ) {}

  async runHealthCheck(
    workspaceId: string,
    projectId: string,
    userId: string
  ): Promise<HealthScore> {
    this.logger.log(`Running health check for project ${projectId}`);

    try {
      // 1. Get project context
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          tasks: {
            where: { deletedAt: null },
            include: {
              assignee: true,
              blockedBy: true,
            },
          },
          phases: {
            include: {
              tasks: {
                where: { deletedAt: null },
              },
            },
          },
          team: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!project || project.workspaceId !== workspaceId) {
        throw new Error('Project not found');
      }

      // 2. Invoke Pulse agent for analysis
      const agentResponse = await this.agentOS.invokeAgent({
        workspaceId,
        sessionId: `health-check-${projectId}`,
        userId,
        agentName: 'pulse',
        projectId: project.id,
        message: `Run comprehensive health check for project "${project.name}".
          Total tasks: ${project.tasks.length}
          Active phases: ${project.phases.filter(p => p.status === 'CURRENT').length}
          Team size: ${project.team.length}

          Detect risks and calculate health score.`,
      });

      // 3. Parse agent response or generate basic analysis
      const healthScore = this.parseHealthScore(agentResponse, project);
      const risks = this.detectRisks(project);

      // 4. Store health score
      await this.prisma.healthScore.create({
        data: {
          workspaceId,
          projectId: project.id,
          score: healthScore.score,
          level: healthScore.level,
          trend: healthScore.trend,
          onTimeDelivery: healthScore.factors.onTimeDelivery,
          blockerImpact: healthScore.factors.blockerImpact,
          teamCapacity: healthScore.factors.teamCapacity,
          velocityTrend: healthScore.factors.velocityTrend,
          riskCount: risks.length,
          explanation: healthScore.explanation,
        },
      });

      // 5. Store risks
      for (const risk of risks) {
        await this.prisma.riskEntry.create({
          data: {
            workspaceId,
            projectId: project.id,
            type: risk.type,
            severity: risk.severity,
            title: risk.title,
            description: risk.description,
            affectedTasks: risk.affectedTasks,
            affectedUsers: risk.affectedUsers,
            status: RiskStatus.ACTIVE,
          },
        });
      }

      // 6. Send notifications for WARNING/CRITICAL risks
      const criticalRisks = risks.filter(r =>
        r.severity === RiskSeverity.WARNING || r.severity === RiskSeverity.CRITICAL
      );

      if (criticalRisks.length > 0) {
        await this.sendHealthAlerts(workspaceId, project.id, healthScore, criticalRisks);
      }

      // 7. Update project health score
      await this.prisma.project.update({
        where: { id: project.id },
        data: {
          healthScore: healthScore.score,
          lastHealthCheck: new Date(),
        },
      });

      return healthScore;
    } catch (error) {
      this.logger.error(`Health check failed for project ${projectId}:`, error);
      throw error;
    }
  }

  private parseHealthScore(agentResponse: any, project: any): HealthScore {
    // Calculate basic health factors
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.status === 'DONE').length;
    const overdueTasks = project.tasks.filter(t =>
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
    ).length;
    const blockedTasks = project.tasks.filter(t => t.status === 'BLOCKED').length;

    // On-time delivery factor (0-1)
    const onTimeDelivery = totalTasks > 0
      ? Math.max(0, (totalTasks - overdueTasks) / totalTasks)
      : 1;

    // Blocker impact factor (0-1)
    const blockerImpact = totalTasks > 0
      ? Math.max(0, 1 - (blockedTasks / totalTasks))
      : 1;

    // Team capacity factor (0-1) - simplified, can be enhanced with actual capacity data
    const teamCapacity = 0.8;  // Default assumption

    // Velocity trend factor (0-1) - simplified, requires historical data
    const velocityTrend = completedTasks > 0 ? 0.75 : 0.5;

    // Calculate overall score (0-100)
    const score = Math.round(
      (onTimeDelivery * 30) +      // 30% weight
      (blockerImpact * 25) +        // 25% weight
      (teamCapacity * 25) +         // 25% weight
      (velocityTrend * 20)          // 20% weight
    ) * 100;

    // Determine level
    const level = score >= 85 ? HealthLevel.EXCELLENT :
                  score >= 70 ? HealthLevel.GOOD :
                  score >= 50 ? HealthLevel.WARNING :
                  HealthLevel.CRITICAL;

    // Determine trend (simplified - compare to previous score if available)
    const trend = HealthTrend.STABLE;

    // Generate explanation
    const explanation = `Project health score is ${score}/100 (${level}). ` +
      `${onTimeDelivery < 0.8 ? 'On-time delivery needs improvement. ' : ''}` +
      `${blockerImpact < 0.8 ? 'Too many blocked tasks. ' : ''}` +
      `${velocityTrend < 0.6 ? 'Velocity has dropped. ' : ''}`;

    // Suggestions
    const suggestions: string[] = [];
    if (onTimeDelivery < 0.8) {
      suggestions.push('Review overdue tasks and adjust deadlines or priorities');
    }
    if (blockerImpact < 0.8) {
      suggestions.push('Address blocking issues to unblock dependent tasks');
    }
    if (velocityTrend < 0.6) {
      suggestions.push('Investigate velocity drop - consider team capacity or scope changes');
    }

    return {
      score,
      level,
      trend,
      factors: {
        onTimeDelivery,
        blockerImpact,
        teamCapacity,
        velocityTrend,
      },
      riskCount: 0,  // Will be updated after risk detection
      explanation,
      suggestions,
    };
  }

  private detectRisks(project: any): RiskEntry[] {
    const risks: RiskEntry[] = [];
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Detect 48-hour deadline warnings
    const dueSoon = project.tasks.filter(t =>
      t.dueDate &&
      new Date(t.dueDate) <= in48Hours &&
      new Date(t.dueDate) >= now &&
      t.status !== 'DONE'
    );

    if (dueSoon.length > 0) {
      risks.push({
        type: RiskType.DEADLINE_WARNING,
        severity: dueSoon.length > 5 ? RiskSeverity.CRITICAL : RiskSeverity.WARNING,
        title: `${dueSoon.length} task${dueSoon.length > 1 ? 's' : ''} due within 48 hours`,
        description: `Tasks: ${dueSoon.map(t => t.title).join(', ')}`,
        affectedTasks: dueSoon.map(t => t.id),
        affectedUsers: [...new Set(dueSoon.map(t => t.assigneeId).filter(Boolean))],
      });
    }

    // Detect blocker chains (3+ tasks blocked by same dependency)
    const blockerChains = new Map<string, any[]>();
    project.tasks.forEach(task => {
      if (task.blockedBy && task.blockedBy.length > 0) {
        task.blockedBy.forEach(blocker => {
          if (!blockerChains.has(blocker.id)) {
            blockerChains.set(blocker.id, []);
          }
          blockerChains.get(blocker.id).push(task);
        });
      }
    });

    blockerChains.forEach((blockedTasks, blockerId) => {
      if (blockedTasks.length >= 3) {
        const blocker = project.tasks.find(t => t.id === blockerId);
        risks.push({
          type: RiskType.BLOCKER_CHAIN,
          severity: blockedTasks.length >= 5 ? RiskSeverity.CRITICAL : RiskSeverity.WARNING,
          title: `${blockedTasks.length} tasks blocked by "${blocker?.title || 'Unknown'}"`,
          description: `Blocked tasks: ${blockedTasks.map(t => t.title).join(', ')}`,
          affectedTasks: blockedTasks.map(t => t.id),
          affectedUsers: [...new Set(blockedTasks.map(t => t.assigneeId).filter(Boolean))],
        });
      }
    });

    // Detect team capacity overload (>40h assigned this week)
    const teamWorkload = new Map<string, number>();
    project.tasks.forEach(task => {
      if (task.assigneeId && task.estimatedHours && task.status !== 'DONE') {
        const current = teamWorkload.get(task.assigneeId) || 0;
        teamWorkload.set(task.assigneeId, current + task.estimatedHours);
      }
    });

    teamWorkload.forEach((hours, userId) => {
      if (hours > 40) {
        const user = project.team.find(m => m.userId === userId)?.user;
        risks.push({
          type: RiskType.CAPACITY_OVERLOAD,
          severity: hours > 60 ? RiskSeverity.CRITICAL : RiskSeverity.WARNING,
          title: `${user?.name || 'Team member'} overloaded with ${hours}h assigned`,
          description: `Assigned work exceeds healthy capacity (40h/week threshold)`,
          affectedTasks: project.tasks.filter(t => t.assigneeId === userId).map(t => t.id),
          affectedUsers: [userId],
        });
      }
    });

    return risks;
  }

  private async sendHealthAlerts(
    workspaceId: string,
    projectId: string,
    healthScore: HealthScore,
    risks: RiskEntry[]
  ) {
    // Get project team members
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          include: { user: true },
        },
      },
    });

    if (!project) return;

    // Send notification to all team members
    for (const member of project.team) {
      await this.notifications.send({
        workspaceId,
        userId: member.userId,
        type: 'health_alert',
        title: `Project health: ${healthScore.score}/100 (${healthScore.level})`,
        message: `${risks.length} risk${risks.length > 1 ? 's' : ''} detected. ${healthScore.explanation}`,
        metadata: {
          projectId,
          healthScore: healthScore.score,
          level: healthScore.level,
          risks: risks.map(r => ({ type: r.type, severity: r.severity, title: r.title })),
        },
      });
    }
  }

  async getLatestHealthScore(
    workspaceId: string,
    projectId: string
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.workspaceId !== workspaceId) {
      throw new Error('Project not found');
    }

    return this.prisma.healthScore.findFirst({
      where: { projectId },
      orderBy: { calculatedAt: 'desc' },
    });
  }

  async getActiveRisks(
    workspaceId: string,
    projectId: string
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.workspaceId !== workspaceId) {
      throw new Error('Project not found');
    }

    return this.prisma.riskEntry.findMany({
      where: {
        projectId,
        status: RiskStatus.ACTIVE,
      },
      orderBy: [
        { severity: 'desc' },
        { detectedAt: 'desc' },
      ],
    });
  }
}
```

### Cron Job

**Location:** `apps/api/src/pm/agents/health.cron.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/common/services/prisma.service';
import { HealthService } from './health.service';

@Injectable()
export class HealthCheckCron {
  private readonly logger = new Logger(HealthCheckCron.name);

  constructor(
    private prisma: PrismaService,
    private healthService: HealthService,
  ) {}

  @Cron(CronExpression.EVERY_15_MINUTES)
  async runHealthChecks() {
    this.logger.log('Starting scheduled health checks');

    try {
      // Get all active projects
      const activeProjects = await this.prisma.project.findMany({
        where: {
          status: 'ACTIVE',
          deletedAt: null,
        },
        include: {
          workspace: true,
        },
      });

      this.logger.log(`Found ${activeProjects.length} active projects`);

      // Run health check for each project
      for (const project of activeProjects) {
        try {
          await this.healthService.runHealthCheck(
            project.workspaceId,
            project.id,
            'system'  // System user for scheduled checks
          );
          this.logger.log(`Health check completed for project ${project.id}`);
        } catch (error) {
          this.logger.error(`Health check failed for project ${project.id}:`, error);
        }
      }

      this.logger.log('Scheduled health checks completed');
    } catch (error) {
      this.logger.error('Health check cron job failed:', error);
    }
  }
}
```

### API Endpoints

**Location:** `apps/api/src/pm/agents/health.controller.ts`

```typescript
import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentWorkspace } from '@/common/decorators/workspace.decorator';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { HealthService } from './health.service';
import type { User } from '@prisma/client';

@Controller('pm/agents/health')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiTags('PM Agents - Health')
@ApiBearerAuth()
export class HealthController {
  constructor(
    private healthService: HealthService,
  ) {}

  @Post(':projectId/check')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Trigger health check for project' })
  async triggerHealthCheck(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
  ) {
    return this.healthService.runHealthCheck(workspaceId, projectId, user.id);
  }

  @Get(':projectId')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get latest health score for project' })
  async getLatestHealthScore(
    @CurrentWorkspace() workspaceId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.healthService.getLatestHealthScore(workspaceId, projectId);
  }

  @Get(':projectId/risks')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get active risks for project' })
  async getActiveRisks(
    @CurrentWorkspace() workspaceId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.healthService.getActiveRisks(workspaceId, projectId);
  }
}
```

---

## Dependencies

### Prerequisites

- **PM-01.2** (Phase CRUD API) - Health monitoring operates on projects/phases
- **PM-02.1** (Task Data Model) - Pulse analyzes tasks for risk detection
- **PM-04.1** (Navi Agent Foundation) - Pulse joins PM agent team

### Blocks

- **PM-05.5** (Pulse Health Dashboard Widget) - Builds on health score foundation
- **PM-06** (Real-Time & Notifications) - Uses health alerts

---

## Tasks

### Backend Tasks
- [ ] Create `apps/api/src/pm/agents/health.service.ts`
- [ ] Create `apps/api/src/pm/agents/health.controller.ts`
- [ ] Create `apps/api/src/pm/agents/health.cron.ts`
- [ ] Add `RiskEntry` and `HealthScore` models to Prisma schema
- [ ] Extend `Project` model with health tracking fields
- [ ] Create and run migration for risk and health tables
- [ ] Register `HealthCheckCron` in AgentsModule
- [ ] Configure BullMQ for scheduled health checks (15-min intervals)

### Agent Layer Tasks
- [ ] Create `agents/pm/pulse.py` with `create_pulse_agent()`
- [ ] Update `agents/pm/team.py` to include Pulse in PM team
- [ ] Implement `agents/pm/tools/health_tools.py`:
  - [ ] `detect_risks` tool
  - [ ] `calculate_health_score` tool
  - [ ] `check_team_capacity` tool
  - [ ] `analyze_velocity` tool
  - [ ] `detect_blocker_chains` tool
  - [ ] `get_overdue_tasks` tool
- [ ] Configure Pulse agent instructions and tools
- [ ] Test Pulse agent with existing PM team memory

### Integration Tasks
- [ ] Test health check cron job runs every 15 minutes
- [ ] Verify risk detection for all risk types
- [ ] Test health score calculation accuracy
- [ ] Verify notifications sent for WARNING/CRITICAL risks
- [ ] Test workspace scoping on all health queries
- [ ] Verify Pulse integrates with Navi delegation

---

## Testing Requirements

### Unit Tests

**Backend (NestJS):**
- `HealthService.runHealthCheck()` calculates health score correctly
- `HealthService.detectRisks()` identifies all risk types
- Risk severity assigned correctly (info/warning/critical)
- Workspace scoping enforced on all health queries
- Notifications sent only for WARNING/CRITICAL risks

**Location:** `apps/api/src/pm/agents/health.service.spec.ts`

**Agents (Python):**
- Pulse responds to health check request
- `detect_risks` tool calls API and returns risks
- `calculate_health_score` tool returns valid score (0-100)
- `check_team_capacity` identifies overloaded members (>40h)
- `analyze_velocity` detects velocity drops (>30% below baseline)
- `detect_blocker_chains` finds chains of 3+ tasks

**Location:** `agents/pm/tests/test_pulse.py`

### Integration Tests

**API Endpoints:**
- `POST /api/pm/agents/health/:id/check` invokes Pulse and returns health score
- `GET /api/pm/agents/health/:id` returns latest health score
- `GET /api/pm/agents/health/:id/risks` returns active risks filtered by severity
- Health checks create `HealthScore` and `RiskEntry` records
- Workspace isolation enforced

**Location:** `apps/api/test/pm/agents/health.e2e-spec.ts`

**Cron Jobs:**
- Health check cron runs every 15 minutes
- All active projects checked
- Errors logged but don't crash cron job

**Location:** `apps/api/test/pm/agents/health.cron.spec.ts`

### E2E Tests (Playwright)

**User Flows:**
1. Navigate to project dashboard → see health widget → health score displayed
2. Health alert triggered → notification received → click to view risks
3. View active risks → see risk types and severities → acknowledge risk
4. Ask Navi about project health → Navi delegates to Pulse for analysis

**Location:** `apps/web/e2e/pm/agents/pulse.spec.ts`

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Pulse agent monitors project health continuously
- [ ] All risk types detected (deadline, blocker chain, overload, velocity drop)
- [ ] Severity levels assigned correctly (info, warning, critical)
- [ ] Notifications sent for WARNING/CRITICAL risks
- [ ] RiskEntry and HealthScore models created and migration applied
- [ ] Project model extended with health tracking fields
- [ ] Health check cron job runs every 15 minutes
- [ ] Unit tests passing (backend + agents)
- [ ] Integration tests passing
- [ ] E2E tests passing (or deferred to PM-05.5)
- [ ] Code reviewed and approved
- [ ] Documentation updated:
  - [ ] API endpoint docs
  - [ ] Agent tool docs
  - [ ] Health score calculation docs
  - [ ] Risk detection algorithm docs
- [ ] Workspace isolation verified
- [ ] Pulse agent integrated with PM team

---

## Implementation Summary

### Completed Files

**Database Schema:**
- `/home/chris/projects/work/Ai Bussiness Hub/packages/db/prisma/schema.prisma`
  - Extended existing RiskEntry model with health monitoring fields (riskType, affectedTasks, affectedUsers, detectedAt, acknowledgedBy, acknowledgedAt)
  - Added HealthScore model for project health calculations
  - Added HealthLevel and HealthTrend enums
  - Extended Project model with healthScore and lastHealthCheck fields
  - Migration created: `20251219112243_add_health_monitoring`

**Pulse Agent (Python/Agno):**
- `/home/chris/projects/work/Ai Bussiness Hub/agents/pm/pulse.py` - Pulse agent implementation
- `/home/chris/projects/work/Ai Bussiness Hub/agents/pm/tools/health_tools.py` - Health monitoring tools (6 tools implemented)
- `/home/chris/projects/work/Ai Bussiness Hub/agents/pm/team.py` - Updated to include Pulse in PM team

**Backend Services (NestJS):**
- `/home/chris/projects/work/Ai Bussiness Hub/apps/api/src/pm/agents/health.service.ts` - Health monitoring service
- `/home/chris/projects/work/Ai Bussiness Hub/apps/api/src/pm/agents/health.controller.ts` - Health API endpoints
- `/home/chris/projects/work/Ai Bussiness Hub/apps/api/src/pm/agents/health.cron.ts` - Scheduled health check cron (15-min intervals)
- `/home/chris/projects/work/Ai Bussiness Hub/apps/api/src/pm/agents/agents.module.ts` - Registered HealthService, HealthController, and HealthCheckCron

### Implementation Notes

**Database Design:**
- Reused existing RiskEntry model and extended it with health monitoring fields
- Used existing RiskSeverity and RiskStatus enums (compatible with both manual and automated risk tracking)
- Added riskType field as String instead of enum to maintain compatibility with existing risk tracking
- HealthScore model tracks historical health calculations with factor breakdown

**Agent Tools:**
- All 6 health tools implemented with proper error handling
- Tools use httpx.Client with 30-second timeout
- Graceful degradation on API failures (return error objects instead of raising exceptions)
- AGENT_SERVICE_TOKEN authentication for internal API calls

**Health Score Calculation:**
- Weighted factors: On-time delivery (30%), Blocker impact (25%), Team capacity (25%), Velocity trend (20%)
- Score levels: EXCELLENT (85-100), GOOD (70-84), WARNING (50-69), CRITICAL (0-49)
- Simplified velocity calculation for PM-05.4 (full velocity tracking with PhaseSnapshot in PM-05.7)

**Risk Detection:**
- Implemented 2 of 4 risk types: DEADLINE_WARNING and CAPACITY_OVERLOAD
- BLOCKER_CHAIN detection requires task dependency implementation (deferred)
- VELOCITY_DROP implemented in velocity analysis endpoint
- Severity levels: CRITICAL (5+ tasks/60h+/50%+ drop), HIGH/WARNING (thresholds in between)

**Cron Job:**
- Runs every 15 minutes using @Cron(CronExpression.EVERY_15_MINUTES)
- Processes all active projects (status: ACTIVE, deletedAt: null)
- Error handling: Logs failures but continues processing remaining projects
- Uses 'system' user for scheduled checks

**API Endpoints:**
- User-facing: `/api/pm/agents/health/:projectId/check`, `/:projectId`, `/:projectId/risks`
- Risk management: `/:projectId/risks/:riskId/acknowledge`, `/:projectId/risks/:riskId/resolve`
- Agent tools: `/detect-risks`, `/calculate-score`, `/team-capacity`, `/velocity`, `/blocker-chains`, `/overdue-tasks`
- All endpoints enforce workspace scoping via TenantGuard

**Team Integration:**
- Pulse added as 4th member of PM team (Navi, Sage, Chrono, Scope, Pulse)
- Navi can delegate health-related questions to Pulse
- Shared memory enables context sharing across team members

### Known Limitations

1. **Blocker Chain Detection:** Not fully implemented - requires task dependency tracking (blockedBy relation)
2. **Velocity Baseline:** Simplified calculation - full implementation requires PhaseSnapshot data (PM-05.7)
3. **Notification Service:** Health alerts reference NotificationService but notification sending not implemented in this story
4. **Trend Calculation:** Health trend currently hardcoded as STABLE - requires comparison with previous health scores

### Next Steps

1. Implement notification sending in HealthService.sendHealthAlerts()
2. Add task dependency support for blocker chain detection
3. Implement trend calculation by comparing with previous HealthScore
4. Add UI components (PM-05.5 - Pulse Health Dashboard Widget)
5. Add E2E tests (deferred to PM-05.5)

---

## References

- [Epic Definition](../epics/epic-pm-05-ai-team-scope-pulse-herald.md)
- [Epic Tech Spec](../epics/epic-pm-05-tech-spec.md)
- [Module PRD](../PRD.md)
- [Module Architecture](../architecture.md)
- [Sprint Status](../sprint-status.yaml)
- [PM Team Pattern](../../../../agents/pm/team.py)
- [Scope Agent Story](./pm-05-1-scope-agent-phase-management.md)

---
