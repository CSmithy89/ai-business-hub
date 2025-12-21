# Epic PM-05 Technical Specification: AI Team - Scope, Pulse, Herald

**Epic:** PM-05 - AI Team (Scope, Pulse, Herald)
**FRs Covered:** FR-5.5, FR-6.1, FR-6.2, FR-6.3, FR-6.4
**Stories:** 8 (PM-05.1 to PM-05.8)
**Created:** 2025-12-19
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

Epic PM-05 introduces the second wave of PM AI agents: Scope (phase management), Pulse (health monitoring), and Herald (reporting). These agents complement the PM-04 team (Navi, Sage, Chrono) by providing automated project health insights, phase transition assistance, and stakeholder reporting.

### Key Objectives

1. **Scope Agent** - Phase management assistant that helps users transition between phases cleanly, manages checkpoints, and prevents tasks from falling through cracks
2. **Pulse Agent** - Continuous health monitoring that detects risks (overdue tasks, blockers, overloaded team members) and alerts users proactively
3. **Herald Agent** - Automated report generation for standups, sprint summaries, and stakeholder updates with PDF export

### Technical Approach

- **Agno Framework** - Follow existing PM-04 patterns in `agents/pm/team.py`
- **Coordinated Team** - Scope, Pulse, Herald join existing Navi-led team
- **Background Jobs** - Pulse runs scheduled health checks (BullMQ), Herald generates reports on-demand or scheduled
- **Real-Time Updates** - WebSocket integration for health alerts and phase transitions
- **Dashboard Integration** - Health widgets and project dashboard for visibility

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PM AI Team (PM-05 Extension)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Frontend (Next.js)                                                         │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  New Components (PM-05)                                              │  │
│   │  • ProjectDashboard (widgets grid)                                   │  │
│   │  • HealthWidget (score, risks, trend)                                │  │
│   │  • PhaseTransitionModal (checklist, recommendations)                 │  │
│   │  • PhaseAnalyticsTab (burndown, velocity, charts)                    │  │
│   │  • ReportViewer (preview, PDF export)                                │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│                                     ▼                                        │
│   Backend (NestJS)                                                           │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  Extended PM Agents Module: apps/api/src/pm/agents/                 │  │
│   │  • phase.service.ts           - Phase transition logic               │  │
│   │  • health.service.ts          - Health monitoring logic              │  │
│   │  • reporting.service.ts       - Report generation                    │  │
│   │  • analytics.service.ts       - Phase analytics                      │  │
│   │  • notifications.cron.ts      - Checkpoint reminders                 │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│                                     ▼                                        │
│   Agent Layer (Python/Agno)                                                 │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  agents/pm/team.py - Extended PM Agent Team                          │  │
│   │                                                                       │  │
│   │  ┌────────────┐      ┌────────────┐      ┌────────────┐             │  │
│   │  │   Scope    │      │   Pulse    │      │  Herald    │             │  │
│   │  │  (Phase)   │      │  (Health)  │      │ (Reports)  │             │  │
│   │  └────────────┘      └────────────┘      └────────────┘             │  │
│   │                                                                       │  │
│   │  Tools:                                                               │  │
│   │  • analyze_phase_completion, suggest_phase_transition                │  │
│   │  • check_phase_checkpoint                                            │  │
│   │  • detect_risks, calculate_health_score                              │  │
│   │  • generate_standup_report, generate_sprint_summary                  │  │
│   │  • export_report_to_pdf                                              │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│                                     ▼                                        │
│   Data Layer (Prisma + PostgreSQL)                                          │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  New Models:                                                          │  │
│   │  • PhaseCheckpoint        - Checkpoint dates & reminders             │  │
│   │  • PhaseSnapshot          - Daily analytics snapshots                │  │
│   │  • RiskEntry              - Detected risks and alerts                │  │
│   │  • HealthScore            - Project health calculations              │  │
│   │  • Report                 - Generated reports (PDF/JSON)             │  │
│   │                                                                       │  │
│   │  Extended Models:                                                     │  │
│   │  • Phase                  - Add healthScore, checkpointDate          │  │
│   │  • Project                - Add healthScore, lastHealthCheck         │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Flow

**Phase Transition Flow:**
```
User clicks "Complete Phase" on phase detail page
         ↓
Frontend: Opens PhaseTransitionModal
         ↓
Backend: POST /api/pm/phases/:id/analyze-completion
  1. Invoke Scope agent
  2. Scope analyzes incomplete tasks
  3. Scope categorizes: complete, carry over, cancel
  4. Scope generates completion summary
         ↓
Frontend: Displays recommendations in modal
  → Incomplete tasks with actions (dropdown: complete/carry/cancel)
  → Summary preview
  → Next phase preview
         ↓
User reviews, edits, clicks "Confirm Transition"
         ↓
Backend: POST /api/pm/phases/:id/transition
  1. Execute bulk task updates
  2. Mark phase as COMPLETED
  3. Activate next phase (CURRENT)
  4. Publish phase.completed event
         ↓
Frontend: Navigate to next phase
```

**Health Monitoring Flow (Background):**
```
Cron Job (every 15 minutes)
         ↓
Backend: HealthService.runHealthCheck()
  1. For each active project:
     - Get project context
     - Invoke Pulse agent
     - Pulse checks: overdue tasks, blockers, team capacity, velocity
  2. Pulse detects risks:
     - 48h deadline warning
     - Blocker chains
     - Team member overloaded (>40h assigned this week)
     - Velocity drop (30% below baseline)
  3. Calculate health score (0-100)
         ↓
Backend: Store RiskEntry + HealthScore
         ↓
Backend: If severity is WARNING or CRITICAL:
  1. NotificationService.send()
  2. WebSocket broadcast to project room
         ↓
Frontend: Real-time notification
  → "Project health: 62/100 (Warning)"
  → Click → opens HealthWidget detail panel
```

**Report Generation Flow:**
```
User clicks "Generate Report" or scheduled trigger
         ↓
Backend: POST /api/pm/agents/reports/generate
  { projectId, reportType: 'daily_standup' | 'sprint_summary' | 'stakeholder' }
         ↓
Backend: ReportingService.generate()
  1. Get project + phase data
  2. Invoke Herald agent with report type
  3. Herald generates structured report:
     - Executive summary
     - Progress by phase
     - Key accomplishments
     - Blockers/risks
     - Next priorities
  4. Store Report record
         ↓
Backend: If PDF export requested:
  1. Render report markdown → HTML
  2. Puppeteer HTML → PDF
  3. Upload to S3/storage
  4. Return PDF URL
         ↓
Frontend: Display report preview or download PDF
```

---

## Agent Design

### Extended PM Team Structure

Following the pattern from `agents/pm/team.py`, extend with new agents:

```python
# agents/pm/team.py (updated)

def create_pm_team(
    session_id: str,
    user_id: str,
    workspace_id: str,
    project_id: str,
    model: Optional[str] = None,
    debug_mode: bool = False,
) -> Team:
    """Create extended PM agent team with 6 agents."""

    # ... (existing memory setup) ...

    # Existing agents (PM-04)
    navi = create_navi_agent(workspace_id, project_id, shared_memory, model)
    sage = create_sage_agent(workspace_id, project_id, shared_memory, model)
    chrono = create_chrono_agent(workspace_id, project_id, shared_memory, model)

    # New agents (PM-05)
    scope = create_scope_agent(workspace_id, project_id, shared_memory, model)
    pulse = create_pulse_agent(workspace_id, project_id, shared_memory, model)
    herald = create_herald_agent(workspace_id, project_id, shared_memory, model)

    return Team(
        name="PM Team",
        mode="coordinate",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        leader=navi,
        members=[sage, chrono, scope, pulse, herald],  # Full 6-agent team
        # ... (rest of config same as PM-04) ...
        instructions=[
            "You are the PM Team for HYVVE's Core-PM module.",
            "Your goal is to help users manage their projects effectively.",
            "Always suggest actions, never auto-execute (suggestion_mode: True).",
            "Use Knowledge Base search for context when appropriate (kb_rag_enabled: True).",
            "Scope handles phase management and transitions.",
            "Pulse monitors project health and detects risks proactively.",
            "Herald generates reports for stakeholders.",
        ],
    )
```

### Scope - Phase Management Agent

**Location:** `agents/pm/scope.py`

**Role:** Phase transition specialist, checkpoint manager

**Capabilities:**
- Analyze phase completion readiness
- Suggest task actions (complete, carry over, cancel)
- Generate phase completion summaries
- Track checkpoints and send reminders
- Prevent scope creep

**Tools:**
```python
tools = [
    analyze_phase_completion,   # Analyze incomplete tasks
    suggest_phase_transition,   # Generate transition plan
    check_phase_checkpoint,     # Check upcoming checkpoints
    detect_scope_changes,       # Track scope changes
    recommend_task_actions,     # Complete/carry/cancel suggestions
]
```

**Instructions:**
```python
SCOPE_INSTRUCTIONS = [
    "You are Scope, the phase management specialist.",
    "Help users transition between phases cleanly.",
    "When analyzing phase completion:",
    "  1. List all incomplete tasks",
    "  2. For each task, recommend: complete, carry over, or cancel",
    "  3. Provide reasoning for each recommendation",
    "  4. Generate phase completion summary",
    "Always ensure nothing falls through the cracks during transitions.",
    "Track checkpoints and send timely reminders (3 days, 1 day, day-of).",
    "Detect scope changes and alert users to prevent scope creep.",
    "Provide clear, actionable recommendations.",
]
```

**Phase Completion Analysis Output:**
```typescript
interface PhaseCompletionAnalysis {
  phaseId: string;
  phaseName: string;
  totalTasks: number;
  completedTasks: number;
  incompleteTasks: Task[];
  recommendations: {
    taskId: string;
    taskTitle: string;
    action: 'complete' | 'carry_over' | 'cancel';
    reasoning: string;
    suggestedPhase?: string;  // If carry_over
  }[];
  summary: {
    readyForCompletion: boolean;
    blockers: string[];
    nextPhasePreview: string;
    estimatedTimeToComplete?: string;
  };
}
```

### Pulse - Health Monitoring Agent

**Location:** `agents/pm/pulse.py`

**Role:** Continuous project health monitoring, risk detection

**Capabilities:**
- Monitor project health continuously (background job every 15min)
- Detect risks: overdue tasks, blockers, capacity issues, velocity drops
- Calculate health score (0-100)
- Send proactive alerts
- Explain health factors

**Tools:**
```python
tools = [
    detect_risks,               # Scan for risks
    calculate_health_score,     # Compute 0-100 score
    check_team_capacity,        # Detect overloaded members
    analyze_velocity,           # Compare velocity to baseline
    detect_blocker_chains,      # Find dependency chains
    get_overdue_tasks,          # Find tasks past due
]
```

**Instructions:**
```python
PULSE_INSTRUCTIONS = [
    "You are Pulse, the project health monitoring specialist.",
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
]
```

**Health Score Calculation:**
```typescript
interface HealthScore {
  score: number;  // 0-100
  level: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'improving' | 'stable' | 'declining';
  factors: {
    onTimeDelivery: number;      // % tasks completed on time
    blockerImpact: number;       // Blocker severity
    teamCapacity: number;        // Team utilization health
    velocityTrend: number;       // Velocity vs baseline
  };
  risks: RiskEntry[];
  suggestions: string[];
}

interface RiskEntry {
  id: string;
  projectId: string;
  type: 'deadline_warning' | 'blocker_chain' | 'capacity_overload' | 'velocity_drop';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  affectedTasks: string[];
  affectedUsers: string[];
  detectedAt: Date;
  resolvedAt?: Date;
}
```

### Herald - Report Generation Agent

**Location:** `agents/pm/herald.py`

**Role:** Automated report generation for various audiences

**Capabilities:**
- Generate daily standup reports
- Generate sprint summary reports
- Generate stakeholder update reports
- Export reports to PDF
- Schedule recurring reports

**Tools:**
```python
tools = [
    generate_standup_report,       # Daily standup format
    generate_sprint_summary,       # Sprint retrospective format
    generate_stakeholder_report,   # Executive summary format
    get_phase_accomplishments,     # List completed work
    get_phase_blockers,            # List current blockers
    get_next_priorities,           # Upcoming work
    format_report_markdown,        # Format output
]
```

**Instructions:**
```python
HERALD_INSTRUCTIONS = [
    "You are Herald, the automated reporting specialist.",
    "Generate clear, concise reports for different audiences.",
    "Report types:",
    "  • Daily Standup: What was done, what's next, blockers",
    "  • Sprint Summary: Goals, accomplishments, metrics, retrospective",
    "  • Stakeholder Update: Executive summary, progress, risks, timeline",
    "Use phase analytics and task data to generate accurate reports.",
    "Structure reports with clear sections and bullet points.",
    "Include relevant metrics (velocity, completion %, time spent).",
    "Highlight blockers and risks prominently.",
    "Provide actionable next steps.",
    "Support PDF export for distribution.",
]
```

**Report Structure:**
```typescript
interface Report {
  id: string;
  projectId: string;
  type: 'daily_standup' | 'sprint_summary' | 'stakeholder';
  title: string;
  generatedAt: Date;
  generatedBy: string;  // Agent or user ID
  content: {
    summary: string;
    sections: {
      heading: string;
      content: string;  // Markdown
    }[];
    metrics?: Record<string, any>;
  };
  format: 'markdown' | 'pdf';
  pdfUrl?: string;  // If exported to PDF
  scheduledReport?: {
    frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
    nextRunAt: Date;
  };
}
```

---

## Data Model Changes

### New Models

Add to `packages/db/prisma/schema.prisma`:

```prisma
// ============================================
// PM AGENTS - PHASE MANAGEMENT & HEALTH (PM-05)
// ============================================

/// PhaseCheckpoint - Milestone checkpoints within phases
model PhaseCheckpoint {
  id            String   @id @default(cuid())
  phaseId       String   @map("phase_id")
  name          String
  description   String?  @db.Text
  checkpointDate DateTime @map("checkpoint_date")

  // Status
  status        CheckpointStatus @default(PENDING)
  completedAt   DateTime? @map("completed_at")

  // Reminders
  remindAt3Days Boolean  @default(true) @map("remind_at_3_days")
  remindAt1Day  Boolean  @default(true) @map("remind_at_1_day")
  remindAtDayOf Boolean  @default(true) @map("remind_at_day_of")

  // Timestamps
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  phase         Phase    @relation(fields: [phaseId], references: [id], onDelete: Cascade)

  @@index([phaseId])
  @@index([checkpointDate])
  @@map("phase_checkpoints")
}

/// PhaseSnapshot - Daily analytics snapshots for burndown/burnup
model PhaseSnapshot {
  id              String   @id @default(cuid())
  phaseId         String   @map("phase_id")
  snapshotDate    DateTime @map("snapshot_date")

  // Metrics
  totalTasks      Int      @map("total_tasks")
  completedTasks  Int      @map("completed_tasks")
  totalPoints     Int      @map("total_points")
  completedPoints Int      @map("completed_points")

  // Scope tracking
  tasksAdded      Int      @default(0) @map("tasks_added")
  tasksRemoved    Int      @default(0) @map("tasks_removed")

  // Team metrics
  activeMembers   Int      @map("active_members")

  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")

  // Relations
  phase           Phase    @relation(fields: [phaseId], references: [id], onDelete: Cascade)

  @@unique([phaseId, snapshotDate])
  @@index([phaseId, snapshotDate])
  @@map("phase_snapshots")
}

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

/// Report - Generated project reports
model Report {
  id            String   @id @default(cuid())
  workspaceId   String   @map("workspace_id")
  projectId     String   @map("project_id")

  // Report details
  type          ReportType
  title         String
  content       Json     // Structured report content

  // Generation
  generatedBy   String   @map("generated_by")  // User ID or 'herald_agent'
  generatedAt   DateTime @default(now()) @map("generated_at")

  // Format
  format        ReportFormat @default(MARKDOWN)
  pdfUrl        String?  @map("pdf_url")

  // Scheduling (optional)
  isScheduled   Boolean  @default(false) @map("is_scheduled")
  frequency     ReportFrequency?
  nextRunAt     DateTime? @map("next_run_at")

  // Timestamps
  createdAt     DateTime @default(now()) @map("created_at")

  @@index([workspaceId, projectId])
  @@index([generatedAt])
  @@index([nextRunAt])
  @@map("reports")
}

// Enums
enum CheckpointStatus {
  PENDING
  COMPLETED
  CANCELLED
}

enum RiskType {
  DEADLINE_WARNING      // Task due in 48h
  BLOCKER_CHAIN         // Multiple tasks blocked
  CAPACITY_OVERLOAD     // Team member >40h assigned
  VELOCITY_DROP         // 30% below baseline
  SCOPE_CREEP           // Scope increased significantly
}

enum RiskSeverity {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

enum RiskStatus {
  IDENTIFIED
  ANALYZING
  MITIGATING
  MONITORING
  RESOLVED
  ACCEPTED
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

enum ReportType {
  DAILY_STANDUP
  SPRINT_SUMMARY
  STAKEHOLDER_UPDATE
  CUSTOM
}

enum ReportFormat {
  MARKDOWN
  PDF
}

enum ReportFrequency {
  DAILY
  WEEKLY
  BI_WEEKLY
  MONTHLY
}
```

### Extended Models

Extend existing models:

```prisma
model Phase {
  // ... existing fields ...

  // Health tracking (PM-05)
  healthScore     Int?     @map("health_score")  // Latest health score
  lastHealthCheck DateTime? @map("last_health_check")

  // Checkpoints
  checkpointDate  DateTime? @map("checkpoint_date")

  // Relations
  checkpoints     PhaseCheckpoint[]
  snapshots       PhaseSnapshot[]

  // ... rest of model ...
}

model Project {
  // ... existing fields ...

  // Health tracking (PM-05)
  healthScore     Int?     @map("health_score")  // Latest health score
  lastHealthCheck DateTime? @map("last_health_check")

  // ... rest of model ...
}
```

---

## API Endpoints

### Phase Management Endpoints

```yaml
# Base path: /api/pm/phases

POST /api/pm/phases/:id/analyze-completion
  Description: Analyze phase for completion readiness (Scope agent)
  Response:
    analysis: PhaseCompletionAnalysis
  Events: phase.analyzed

POST /api/pm/phases/:id/transition
  Description: Execute phase transition
  Body:
    taskActions: Array<{
      taskId: string
      action: 'complete' | 'carry_over' | 'cancel'
      targetPhaseId?: string  # If carry_over
    }>
    completionNote?: string
  Response:
    success: true
    completedPhase: Phase
    activePhase: Phase
  Events: phase.completed, phase.started

GET /api/pm/phases/:id/checkpoints
  Description: Get checkpoints for phase
  Response: PhaseCheckpoint[]

POST /api/pm/phases/:id/checkpoints
  Description: Create checkpoint
  Body:
    name: string
    checkpointDate: string
    description?: string
  Response: PhaseCheckpoint

PUT /api/pm/phases/:id/checkpoints/:checkpointId
  Description: Update checkpoint
  Body:
    status?: CheckpointStatus
    checkpointDate?: string
  Response: PhaseCheckpoint

GET /api/pm/phases/:id/analytics
  Description: Get phase analytics (burndown, velocity, etc.)
  Query:
    startDate?: string
    endDate?: string
  Response:
    snapshots: PhaseSnapshot[]
    burndown: Array<{ date: string, remaining: number }>
    burnup: Array<{ date: string, completed: number }>
    velocity: number
    scopeChanges: Array<{ date: string, added: number, removed: number }>
```

### Health Monitoring Endpoints

```yaml
# Base path: /api/pm/agents/health

GET /api/pm/agents/health/:projectId
  Description: Get latest health score for project
  Response: HealthScore

POST /api/pm/agents/health/:projectId/check
  Description: Trigger health check (invokes Pulse)
  Response: HealthScore
  Events: health.checked

GET /api/pm/agents/health/:projectId/history
  Description: Get health score history
  Query:
    days?: number (default: 30)
  Response: HealthScore[]

GET /api/pm/agents/health/:projectId/risks
  Description: Get active risks
  Query:
    severity?: 'info' | 'warning' | 'critical'
    status?: 'active' | 'acknowledged' | 'resolved'
  Response: RiskEntry[]

POST /api/pm/agents/health/:projectId/risks/:riskId/acknowledge
  Description: Acknowledge risk
  Response: RiskEntry

POST /api/pm/agents/health/:projectId/risks/:riskId/resolve
  Description: Mark risk as resolved
  Response: RiskEntry
```

### Dashboard Endpoints

```yaml
# Base path: /api/pm/dashboard

GET /api/pm/dashboard/:projectId
  Description: Get project dashboard data
  Response:
    project: Project
    health: HealthScore
    phases: Phase[]
    taskStats: {
      total: number
      byStatus: Record<TaskStatus, number>
      overdue: number
    }
    pendingApprovals: number
    recentActivity: TaskActivity[]
    teamWorkload: Array<{
      userId: string
      userName: string
      assignedTasks: number
      estimatedHours: number
    }>
```

### Reporting Endpoints

```yaml
# Base path: /api/pm/agents/reports

POST /api/pm/agents/reports/generate
  Description: Generate report (invokes Herald)
  Body:
    projectId: string
    type: ReportType
    format: 'markdown' | 'pdf'
  Response: Report

GET /api/pm/agents/reports/:projectId
  Description: List reports for project
  Query:
    type?: ReportType
    limit?: number
  Response: Report[]

GET /api/pm/agents/reports/:reportId
  Description: Get report details
  Response: Report

DELETE /api/pm/agents/reports/:reportId
  Description: Delete report
  Response: { success: true }

POST /api/pm/agents/reports/:reportId/export-pdf
  Description: Export report to PDF
  Response:
    pdfUrl: string

POST /api/pm/agents/reports/:projectId/schedule
  Description: Schedule recurring report
  Body:
    type: ReportType
    frequency: ReportFrequency
    recipients: string[]  # Email addresses
  Response: Report
```

---

## Frontend Components

### Component Structure

```
apps/web/src/components/pm/
├── dashboard/
│   ├── ProjectDashboard.tsx        # Main dashboard page
│   ├── HealthWidget.tsx            # Health score widget
│   ├── PhaseProgressWidget.tsx     # Phase progress chart
│   ├── TaskStatsWidget.tsx         # Task stats by status
│   ├── PendingApprovalsWidget.tsx  # Approval queue widget
│   ├── TeamWorkloadWidget.tsx      # Team capacity widget
│   └── RecentActivityWidget.tsx    # Activity feed widget
│
├── phases/
│   ├── PhaseTransitionModal.tsx    # Phase completion checklist
│   ├── PhaseAnalyticsTab.tsx       # Analytics charts
│   ├── PhaseCheckpointList.tsx     # Checkpoint management
│   └── CheckpointForm.tsx          # Create/edit checkpoint
│
├── health/
│   ├── HealthDetailPanel.tsx       # Expanded health view
│   ├── RiskList.tsx                # Active risks list
│   ├── RiskCard.tsx                # Individual risk display
│   └── HealthTrendChart.tsx        # Health over time chart
│
└── reports/
    ├── ReportViewer.tsx            # Report preview
    ├── ReportList.tsx              # List of reports
    ├── ReportScheduleModal.tsx     # Schedule recurring report
    └── ReportExportButton.tsx      # PDF export
```

### Key Components

#### ProjectDashboard Component

```typescript
// apps/web/src/components/pm/dashboard/ProjectDashboard.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { HealthWidget } from './HealthWidget';
import { PhaseProgressWidget } from './PhaseProgressWidget';
import { TaskStatsWidget } from './TaskStatsWidget';
import { PendingApprovalsWidget } from './PendingApprovalsWidget';
import { TeamWorkloadWidget } from './TeamWorkloadWidget';
import { RecentActivityWidget } from './RecentActivityWidget';

interface ProjectDashboardProps {
  projectId: string;
}

export function ProjectDashboard({ projectId }: ProjectDashboardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', projectId],
    queryFn: () => fetch(`/api/pm/dashboard/${projectId}`).then(r => r.json()),
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{data.project.name}</h1>
        <p className="text-muted-foreground">{data.project.description}</p>
      </div>

      {/* Widget Grid - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Health Widget - Full width on mobile, 1 col on tablet/desktop */}
        <div className="md:col-span-2 lg:col-span-1">
          <HealthWidget
            health={data.health}
            projectId={projectId}
          />
        </div>

        {/* Phase Progress */}
        <PhaseProgressWidget phases={data.phases} />

        {/* Task Stats */}
        <TaskStatsWidget stats={data.taskStats} />

        {/* Pending Approvals */}
        <PendingApprovalsWidget count={data.pendingApprovals} />

        {/* Team Workload */}
        <div className="md:col-span-2">
          <TeamWorkloadWidget workload={data.teamWorkload} />
        </div>

        {/* Recent Activity */}
        <div className="md:col-span-2 lg:col-span-1">
          <RecentActivityWidget activity={data.recentActivity} />
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-6 flex justify-end">
        <Button
          variant="outline"
          onClick={() => refetch()}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh All
        </Button>
      </div>
    </div>
  );
}
```

#### HealthWidget Component

```typescript
// apps/web/src/components/pm/dashboard/HealthWidget.tsx

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HealthDetailPanel } from '../health/HealthDetailPanel';

interface HealthWidgetProps {
  health: HealthScore;
  projectId: string;
}

export function HealthWidget({ health, projectId }: HealthWidgetProps) {
  const [showDetail, setShowDetail] = useState(false);

  const levelColors = {
    excellent: 'text-green-600 bg-green-50 border-green-200',
    good: 'text-blue-600 bg-blue-50 border-blue-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    critical: 'text-red-600 bg-red-50 border-red-200',
  };

  const TrendIcon = health.trend === 'improving' ? TrendingUp :
                    health.trend === 'declining' ? TrendingDown : Minus;

  return (
    <>
      <Card
        className={cn(
          "cursor-pointer transition-shadow hover:shadow-lg",
          levelColors[health.level]
        )}
        onClick={() => setShowDetail(true)}
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Project Health</span>
            <TrendIcon className="w-5 h-5" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-4xl font-bold">{health.score}</div>
              <div className="text-sm text-muted-foreground">/ 100</div>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              levelColors[health.level]
            )}>
              {health.level.toUpperCase()}
            </div>
          </div>

          {/* Risk Indicators */}
          {health.risks && health.risks.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{health.risks.length} active risk{health.risks.length > 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Factors Preview */}
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span>On-time delivery</span>
              <span className="font-medium">{(health.factors.onTimeDelivery * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Team capacity</span>
              <span className="font-medium">{(health.factors.teamCapacity * 100).toFixed(0)}%</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-4"
            onClick={(e) => {
              e.stopPropagation();
              setShowDetail(true);
            }}
          >
            View Details
          </Button>
        </CardContent>
      </Card>

      {/* Detail Panel */}
      {showDetail && (
        <HealthDetailPanel
          projectId={projectId}
          health={health}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}
```

#### PhaseTransitionModal Component

```typescript
// apps/web/src/components/pm/phases/PhaseTransitionModal.tsx

'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface PhaseTransitionModalProps {
  phaseId: string;
  onClose: () => void;
  onTransition: () => void;
}

export function PhaseTransitionModal({
  phaseId,
  onClose,
  onTransition,
}: PhaseTransitionModalProps) {
  const [taskActions, setTaskActions] = useState<Record<string, TaskAction>>({});
  const [note, setNote] = useState('');

  // Analyze phase completion (invoke Scope agent)
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['phase-analysis', phaseId],
    queryFn: () =>
      fetch(`/api/pm/phases/${phaseId}/analyze-completion`, {
        method: 'POST',
      }).then(r => r.json()),
  });

  // Transition mutation
  const transitionMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/pm/phases/${phaseId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskActions: Object.entries(taskActions).map(([taskId, action]) => ({
            taskId,
            ...action,
          })),
          completionNote: note,
        }),
      }).then(r => r.json()),
    onSuccess: () => {
      onTransition();
      onClose();
    },
  });

  if (isLoading) return <Dialog open><DialogContent>Analyzing phase...</DialogContent></Dialog>;

  const handleActionChange = (taskId: string, action: string) => {
    setTaskActions(prev => ({
      ...prev,
      [taskId]: { action },
    }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Phase: {analysis.phaseName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-accent p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Phase Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Tasks:</span>
                <span className="ml-2 font-medium">{analysis.totalTasks}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Completed:</span>
                <span className="ml-2 font-medium">{analysis.completedTasks}</span>
              </div>
            </div>
          </div>

          {/* Incomplete Tasks */}
          {analysis.incompleteTasks.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Incomplete Tasks</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose an action for each incomplete task:
              </p>

              <div className="space-y-3">
                {analysis.recommendations.map(rec => (
                  <div key={rec.taskId} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{rec.taskTitle}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {rec.reasoning}
                        </p>
                      </div>
                      <Select
                        value={taskActions[rec.taskId]?.action || rec.action}
                        onValueChange={(value) => handleActionChange(rec.taskId, value)}
                      >
                        <option value="complete">Complete Now</option>
                        <option value="carry_over">Carry to Next Phase</option>
                        <option value="cancel">Cancel</option>
                      </Select>
                    </div>

                    {/* Recommendation badge */}
                    <div className="text-xs text-muted-foreground">
                      Scope suggests: <span className="font-medium">{rec.action}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blockers */}
          {analysis.summary.blockers.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900">Blockers Detected</h4>
                  <ul className="mt-2 space-y-1 text-sm text-yellow-800">
                    {analysis.summary.blockers.map((blocker, i) => (
                      <li key={i}>• {blocker}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Next Phase Preview */}
          <div>
            <h3 className="font-semibold mb-2">Next Phase</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">{analysis.summary.nextPhasePreview}</p>
            </div>
          </div>

          {/* Completion Note */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Completion Note (Optional)
            </label>
            <Textarea
              placeholder="Add any notes about this phase completion..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => transitionMutation.mutate()}
            disabled={
              transitionMutation.isPending ||
              !analysis.summary.readyForCompletion
            }
          >
            {transitionMutation.isPending ? (
              'Completing...'
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Complete Phase
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### PhaseAnalyticsTab Component

```typescript
// apps/web/src/components/pm/phases/PhaseAnalyticsTab.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PhaseAnalyticsTabProps {
  phaseId: string;
}

export function PhaseAnalyticsTab({ phaseId }: PhaseAnalyticsTabProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['phase-analytics', phaseId],
    queryFn: () =>
      fetch(`/api/pm/phases/${phaseId}/analytics`).then(r => r.json()),
  });

  if (isLoading) return <div>Loading analytics...</div>;

  return (
    <div className="space-y-6">
      {/* Burndown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Burndown Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.burndown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="remaining"
                stroke="#8884d8"
                name="Remaining Tasks"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Burnup Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Burnup Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.burnup}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#82ca9d"
                name="Completed Tasks"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Velocity */}
      <Card>
        <CardHeader>
          <CardTitle>Velocity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data.velocity} points/week</div>
          <p className="text-sm text-muted-foreground mt-2">
            Based on last 4 weeks
          </p>
        </CardContent>
      </Card>

      {/* Scope Changes */}
      <Card>
        <CardHeader>
          <CardTitle>Scope Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.scopeChanges}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="added"
                stroke="#82ca9d"
                name="Tasks Added"
              />
              <Line
                type="monotone"
                dataKey="removed"
                stroke="#ff7c7c"
                name="Tasks Removed"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Integration Points

### Integration with PM-04 Agents

Scope, Pulse, and Herald join the existing PM team:

```typescript
// When user asks about phase completion:
Navi: "Let me ask Scope to analyze the phase for you."
  → Delegates to Scope agent
  → Scope returns PhaseCompletionAnalysis
  → Navi presents results to user

// When health alert triggered:
Pulse: (Background job detects risk)
  → Creates RiskEntry
  → Sends notification
  → User asks Navi "What's wrong?"
  → Navi: "Pulse detected a blocker chain. Let me get details..."
  → Navi fetches RiskEntry and explains

// When user requests report:
User: "Generate sprint summary"
Navi: "I'll have Herald prepare that report."
  → Delegates to Herald
  → Herald generates report
  → Returns to Navi
  → Navi presents preview with download link
```

### WebSocket Integration

Real-time updates for health and phase changes:

```typescript
// In RealtimeGateway
@SubscribeMessage('project:subscribe')
handleProjectSubscribe(client: Socket, payload: { projectId: string }) {
  client.join(`project:${payload.projectId}:health`);
  client.join(`project:${payload.projectId}:phases`);
}

// Health check emits
async runHealthCheck(projectId: string) {
  const health = await pulseAgent.calculateHealth(projectId);
  this.realtimeGateway.server
    .to(`project:${projectId}:health`)
    .emit('health:updated', health);

  // If critical risks, send notification
  if (health.level === 'critical') {
    this.realtimeGateway.server
      .to(`project:${projectId}:health`)
      .emit('health:alert', {
        severity: 'critical',
        message: health.explanation,
      });
  }
}

// Phase transition emits
async transitionPhase(phaseId: string) {
  const result = await executeTransition(phaseId);
  this.realtimeGateway.server
    .to(`project:${result.projectId}:phases`)
    .emit('phase:transitioned', {
      completedPhase: result.completedPhase,
      activePhase: result.activePhase,
    });
}
```

### Event Bus Integration

```typescript
export const PM05Events = {
  // Phase events
  PHASE_ANALYZED: 'pm.phase.analyzed',
  PHASE_COMPLETED: 'pm.phase.completed',
  PHASE_STARTED: 'pm.phase.started',
  CHECKPOINT_REMINDER: 'pm.checkpoint.reminder',

  // Health events
  HEALTH_CHECKED: 'pm.health.checked',
  HEALTH_ALERT: 'pm.health.alert',
  RISK_DETECTED: 'pm.risk.detected',
  RISK_RESOLVED: 'pm.risk.resolved',

  // Report events
  REPORT_GENERATED: 'pm.report.generated',
  REPORT_SCHEDULED: 'pm.report.scheduled',
} as const;
```

### Cron Jobs

```typescript
// apps/api/src/pm/agents/health.cron.ts

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HealthService } from './health.service';

@Injectable()
export class HealthCheckCron {
  constructor(private healthService: HealthService) {}

  @Cron(CronExpression.EVERY_15_MINUTES)
  async runHealthChecks() {
    const activeProjects = await this.getActiveProjects();

    for (const project of activeProjects) {
      await this.healthService.runHealthCheck(project.id);
    }
  }
}

// apps/api/src/pm/agents/checkpoint.cron.ts

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CheckpointService } from './checkpoint.service';

@Injectable()
export class CheckpointReminderCron {
  constructor(private checkpointService: CheckpointService) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendCheckpointReminders() {
    // Send reminders for checkpoints in next 3 days, 1 day, or today
    await this.checkpointService.sendReminders();
  }
}
```

---

## Story Breakdown with Technical Notes

### PM-05.1: Scope Agent - Phase Management

**Goal:** Create Scope agent for phase transition assistance.

**Implementation:**
1. Create `agents/pm/scope.py` with Agno agent
2. Implement tools: `analyze_phase_completion`, `suggest_phase_transition`, `recommend_task_actions`
3. Add `PhaseCheckpoint` model to Prisma
4. Implement phase analysis endpoint
5. Update `agents/pm/team.py` to include Scope

**Files:**
- `agents/pm/scope.py`
- `agents/pm/tools/phase_tools.py`
- `packages/db/prisma/schema.prisma` (add PhaseCheckpoint)
- `apps/api/src/pm/agents/phase.service.ts`

**Tests:**
- Scope analyzes incomplete tasks correctly
- Recommendations match task context
- Integration with Navi delegation

### PM-05.2: Scope Phase Transition Flow

**Goal:** Build guided phase transition UI with checklist.

**Implementation:**
1. Build `PhaseTransitionModal` component
2. Add transition API endpoint
3. Implement bulk task operations
4. Add WebSocket events for phase transitions
5. Update phase detail page with "Complete Phase" button

**Files:**
- `apps/web/src/components/pm/phases/PhaseTransitionModal.tsx`
- `apps/api/src/pm/phases/phases.controller.ts` (add transition endpoint)

**Tests:**
- Modal displays Scope recommendations
- User can override recommendations
- Bulk operations execute atomically
- Phase status updates correctly

### PM-05.3: Scope Checkpoint Reminders

**Goal:** Checkpoint tracking with automated reminders.

**Implementation:**
1. Add checkpoint CRUD endpoints
2. Build `PhaseCheckpointList` component
3. Implement reminder cron job
4. Add notification integration
5. Add checkpoint tracking to phase detail page

**Files:**
- `apps/api/src/pm/agents/checkpoint.service.ts`
- `apps/api/src/pm/agents/checkpoint.cron.ts`
- `apps/web/src/components/pm/phases/PhaseCheckpointList.tsx`

**Tests:**
- Checkpoints created and listed
- Reminders sent at correct times
- Notifications delivered

### PM-05.4: Pulse Agent - Health Monitoring

**Goal:** Create Pulse agent for continuous health monitoring.

**Implementation:**
1. Create `agents/pm/pulse.py` agent
2. Add `RiskEntry` and `HealthScore` models
3. Implement risk detection tools
4. Implement health score calculation
5. Add health check cron job
6. Build health API endpoints

**Files:**
- `agents/pm/pulse.py`
- `agents/pm/tools/health_tools.py`
- `packages/db/prisma/schema.prisma` (add RiskEntry, HealthScore)
- `apps/api/src/pm/agents/health.service.ts`
- `apps/api/src/pm/agents/health.cron.ts`

**Tests:**
- Pulse detects all risk types
- Health score calculated correctly
- Cron job runs on schedule
- Alerts sent for critical risks

### PM-05.5: Pulse Health Dashboard Widget

**Goal:** Health score widget with risk indicators.

**Implementation:**
1. Build `HealthWidget` component
2. Add `HealthDetailPanel` for expanded view
3. Build `RiskList` and `RiskCard` components
4. WebSocket integration for real-time updates
5. Add risk acknowledgement flow

**Files:**
- `apps/web/src/components/pm/dashboard/HealthWidget.tsx`
- `apps/web/src/components/pm/health/HealthDetailPanel.tsx`
- `apps/web/src/components/pm/health/RiskList.tsx`

**Tests:**
- Widget displays health score
- Color coding matches level
- Real-time updates work
- Detail panel opens correctly

### PM-05.6: Project Dashboard

**Goal:** Comprehensive project overview with widgets.

**Implementation:**
1. Build `ProjectDashboard` page component
2. Create widget components (phase progress, task stats, workload, activity)
3. Implement dashboard data endpoint
4. Add responsive grid layout
5. Add refresh functionality

**Files:**
- `apps/web/src/app/pm/projects/[id]/dashboard/page.tsx`
- `apps/web/src/components/pm/dashboard/ProjectDashboard.tsx`
- `apps/web/src/components/pm/dashboard/*Widget.tsx`
- `apps/api/src/pm/dashboard/dashboard.controller.ts`

**Tests:**
- All widgets load data
- Responsive layout works
- Refresh updates all widgets
- Navigation between widgets

### PM-05.7: Phase Analytics

**Goal:** Phase analytics with burndown, burnup, velocity.

**Implementation:**
1. Add `PhaseSnapshot` model
2. Implement snapshot generation (daily cron)
3. Build `PhaseAnalyticsTab` component
4. Add chart library (Recharts)
5. Implement analytics calculation service
6. Add analytics API endpoint

**Files:**
- `packages/db/prisma/schema.prisma` (add PhaseSnapshot)
- `apps/api/src/pm/agents/analytics.service.ts`
- `apps/api/src/pm/agents/analytics.cron.ts`
- `apps/web/src/components/pm/phases/PhaseAnalyticsTab.tsx`

**Tests:**
- Snapshots generated daily
- Charts render correctly
- Velocity calculated accurately
- Scope changes tracked

### PM-05.8: Herald Agent - Automated Reports

**Goal:** Report generation with PDF export.

**Implementation:**
1. Create `agents/pm/herald.py` agent
2. Add `Report` model
3. Implement report generation tools
4. Add PDF export (Puppeteer/similar)
5. Build `ReportViewer` and `ReportList` components
6. Add scheduling for recurring reports

**Files:**
- `agents/pm/herald.py`
- `agents/pm/tools/reporting_tools.py`
- `packages/db/prisma/schema.prisma` (add Report)
- `apps/api/src/pm/agents/reporting.service.ts`
- `apps/api/src/pm/agents/pdf-export.service.ts`
- `apps/web/src/components/pm/reports/ReportViewer.tsx`

**Tests:**
- All report types generate correctly
- PDF export works
- Scheduled reports run
- Reports include correct data

---

## Dependencies

### Prerequisites from Other Epics

**Required:**
- PM-01 (Projects, Phases) - Scope operates on phases
- PM-02 (Tasks) - Health monitoring needs task data
- PM-04 (Navi, Sage, Chrono) - Team integration

**Optional:**
- KB-02 (RAG) - Herald can pull KB context for reports
- PM-06 (Notifications) - Checkpoint reminders, health alerts

### External Dependencies

**NPM Packages:**
```json
{
  "@nestjs/schedule": "^4.0.0",  // Cron jobs
  "@nestjs/bullmq": "^10.0.0",    // Background jobs
  "recharts": "^2.10.0",          // Charts
  "puppeteer": "^21.0.0"          // PDF export
}
```

**Python Packages:**
```txt
# Same as PM-04
agno>=0.1.0
anthropic>=0.18.0
openai>=1.0.0
psycopg2-binary>=2.9.0
```

---

## Testing Strategy

### Unit Tests

**Backend:**
- PhaseService: Transition logic, checkpoint management
- HealthService: Health calculation, risk detection
- AnalyticsService: Snapshot generation, chart data
- ReportingService: Report generation, PDF export

**Agents:**
- Scope: Phase analysis, recommendations
- Pulse: Risk detection, health scoring
- Herald: Report generation, formatting

**Frontend:**
- HealthWidget: Display logic, color coding
- PhaseTransitionModal: Action selection, bulk updates
- PhaseAnalyticsTab: Chart rendering, data transformation

### Integration Tests

**API Endpoints:**
- POST /api/pm/phases/:id/analyze-completion → invokes Scope
- POST /api/pm/phases/:id/transition → executes transition
- POST /api/pm/agents/health/:id/check → invokes Pulse
- POST /api/pm/agents/reports/generate → invokes Herald

**Cron Jobs:**
- Health check runs every 15 minutes
- Snapshot generation runs daily
- Checkpoint reminders send at 8am

### E2E Tests

**User Flows:**
1. Complete phase → view recommendations → transition → verify next phase
2. View health widget → see risk → acknowledge → risk resolved
3. View analytics → see burndown → export chart
4. Generate report → preview → export PDF → download

**Critical Paths:**
- Phase transition: analyze → review → confirm → execute
- Health alert: detect → notify → acknowledge → resolve
- Report: generate → preview → export → schedule

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Cron job failures | Medium | High | Monitor cron execution, retry logic, alerting |
| PDF export performance | Medium | Medium | Queue PDF generation, cache results, timeout limits |
| Health score accuracy | Medium | Medium | Tune weights, user feedback, manual override |
| Chart library bundle size | Low | Low | Code splitting, lazy loading |

### Product Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Health alert fatigue | Medium | Medium | Smart thresholds, user preferences, snooze options |
| Phase transition confusion | Low | High | Clear UI, Scope explanations, preview before commit |
| Report noise | Medium | Low | Template customization, filter options |

---

## Performance Considerations

### Cron Job Optimization

- Health checks: Batch by workspace, parallel execution, 5min timeout
- Snapshots: Incremental updates, skip unchanged projects
- Reminders: Query only upcoming checkpoints (index on `checkpointDate`)

### Dashboard Loading

- Cache dashboard data (Redis, 1min TTL)
- Lazy load widgets
- Paginate activity feed

### PDF Generation

- Queue PDF generation (BullMQ)
- Cache generated PDFs (S3)
- Limit concurrent PDF jobs (3 max)

---

## Related Documentation

- [Epic Definition](./epic-pm-05-ai-team-scope-pulse-herald.md)
- [PM-04 Tech Spec](./epic-pm-04-tech-spec.md) - Previous AI team epic
- [Module PRD](../PRD.md)
- [Module Architecture](../architecture.md)
- [Sprint Status](../sprint-status.yaml)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-19 | Initial technical specification for Epic PM-05 |
