# BATCH-18: Phase 3 PM Vision Feature Wireframes

**Batch Number:** 18
**Module:** Core-PM (Platform Core)
**Focus:** Phase 3 Vision Feature Wireframes
**Total Wireframes:** 6
**Priority:** P3 (Vision/Future)

---

## References

| Document | Path | Purpose |
|----------|------|---------|
| Core-PM PRD | `docs/modules/bm-pm/PRD.md` | Feature requirements (Phase 3, lines 353-413) |
| Core-PM Architecture | `docs/modules/bm-pm/architecture.md` | Technical specs |
| Style Guide | `docs/design/STYLE-GUIDE.md` | Brand guidelines |

---

## Wireframe List

| ID | Name | File | Priority | PRD Reference |
|----|------|------|----------|---------------|
| PM-32 | Workflow Builder | `pm-workflow-builder.excalidraw` | P3 | Phase 3, lines 359-362 |
| PM-33 | Predictive Analytics (Prism) | `pm-predictive-analytics.excalidraw` | P3 | Phase 3, lines 364-367 |
| PM-34 | API & Webhooks Configuration | `pm-api-webhooks.excalidraw` | P3 | Phase 3, lines 369-372 |
| PM-35 | Task Templates Library | `pm-task-templates.excalidraw` | P3 | Phase 3, lines 374-376 |
| PM-36 | OKR & Goals Tracking | `pm-okr-goals.excalidraw` | P3 | Phase 3, lines 378-381 |
| PM-37 | Enterprise Audit & Compliance | `pm-audit-compliance.excalidraw` | P3 | Phase 3, lines 383-386 |

---

## Shared Design Context

### Color Palette
```
Primary Background:     #FFFBF5 (Warm Cream)
Card Background:        #FFFFFF (Pure White)
Border Color:           #f1ebe4 (Warm Border)
Text Primary:           #1a1a2e (Deep Navy)
Text Secondary:         #6b7280 (Gray 500)

PM Theme Color:         #FF9F43 (Sunny Orange) - Atlas agent
Prism Color:            #EC4899 (Pink) - Analytics agent
Success:                #22C55E (Green 500)
Warning:                #F59E0B (Amber 500)
Error:                  #EF4444 (Red 500)
Focus Ring:             #FF6B6B (Coral)
```

### Phase Colors (for Workflow Builder)
```
BUILD Mode:             #3B82F6 (Blue 500)
OPERATE Mode:           #22C55E (Green 500)
Custom Phase:           #8B5CF6 (Purple 500)
```

### Typography
```
Font Family:            Inter
Page Title:             24px / 700 weight / #1a1a2e
Section Heading:        18px / 600 weight / #1a1a2e
Body Text:              14px / 400 weight / #374151
Caption/Meta:           12px / 400 weight / #6b7280
Code/API:               14px / 400 weight / monospace
```

---

## PM-32: Workflow Builder (NEW)

**File:** `pm-workflow-builder.excalidraw`
**Priority:** P3 (Vision)
**PRD Reference:** Phase 3, lines 359-362
**Goal:** Design a visual workflow builder for creating custom BMAD workflows with drag-drop phase creation, custom templates, and a workflow marketplace.

### Feature Requirements (from PRD)
```
1. **Workflow Builder**
   - User-defined BMAD workflows
   - Custom phase templates
   - Workflow marketplace
```

### Layout Structure

```
+------------------------------------------------------------------------------+
|  WORKFLOW BUILDER                                                              |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | Workflow: Custom Product Launch            [Save] [Preview] [Publish]    | |
|  | Last edited: 2 min ago by Sarah Chen                          [Settings] | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | TOOLBAR                                                                   | |
|  | +----------------------------------------------------------------------+ | |
|  | | [+ Add Phase]  [+ Add Gate]  [+ Add Loop]  |  [Undo] [Redo]  [Zoom] | | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +--------------------------------+ +---------------------------------------+ |
|  | PHASE LIBRARY                  | | WORKFLOW CANVAS                       | |
|  | ------------------------------ | | ------------------------------------- | |
|  |                                | |                                       | |
|  | STANDARD PHASES                | |  START                                | |
|  | +----------------------------+ | |    |                                  | |
|  | | [Brief]      [Brainstorm] | | |    v                                  | |
|  | | [Require]    [Design]     | | |  +--------+                           | |
|  | | [Implement]  [Test]       | | |  | Brief  |                           | |
|  | | [Deploy]     [Review]     | | |  | 3 days |                           | |
|  | +----------------------------+ | |  +--------+                           | |
|  |                                | |    |                                  | |
|  | OPERATE LOOPS                  | |    | Gate: Approval                   | |
|  | +----------------------------+ | |    v                                  | |
|  | | [Grow]  [Optimize] [Scale] | | |  +--------+      +--------+          | |
|  | +----------------------------+ | |  | Design | ---> | Review |          | |
|  |                                | |  | 5 days |      | 2 days |          | |
|  | CUSTOM PHASES                  | |  +--------+      +--------+          | |
|  | +----------------------------+ | |    |                |                 | |
|  | | [Research]   [Validate]   | | |    |    <-----------+                 | |
|  | | [Pilot]      [Launch]     | | |    | (if rejected)                    | |
|  | | [+ Create New]            | | |    v                                  | |
|  | +----------------------------+ | |  +--------+                           | |
|  |                                | |  |Implement|                          | |
|  | GATES                          | |  | 10 days|                           | |
|  | +----------------------------+ | |  +--------+                           | |
|  | | [Approval]   [Milestone]  | | |    |                                  | |
|  | | [Quality]    [Budget]     | | |    v                                  | |
|  | +----------------------------+ | |  +--------+      +--------+          | |
|  |                                | |  | Test   | ---> | Deploy |          | |
|  | CONNECTORS                     | |  | 5 days |      | 2 days |          | |
|  | +----------------------------+ | |  +--------+      +--------+          | |
|  | | [---] Sequential          | | |                       |               | |
|  | | [-->] Conditional         | | |                       v               | |
|  | | [<->] Bidirectional       | | |                     END               | |
|  | +----------------------------+ | |                                       | |
|  |                                | | Total: 27 days                        | |
|  +--------------------------------+ +---------------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | PHASE PROPERTIES (Selected: Design)                                       | |
|  | +----------------------------------------------------------------------+ | |
|  | |                                                                       | | |
|  | | Name: [Design                    ]   Duration: [5] days               | | |
|  | |                                                                       | | |
|  | | Description:                                                          | | |
|  | | [Create UI/UX designs, wireframes, and technical specifications    ]  | | |
|  | |                                                                       | | |
|  | | Entry Criteria:                      Exit Criteria:                   | | |
|  | | [x] Brief approved                   [x] Designs reviewed             | | |
|  | | [x] Requirements documented          [x] Tech spec approved           | | |
|  | | [ ] Budget allocated                 [ ] Stakeholder sign-off         | | |
|  | |                                                                       | | |
|  | | Assigned Agent: [Navi v]             Checklist Template: [Design v]   | | |
|  | |                                                                       | | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Workflow Marketplace

```
+------------------------------------------------------------------------------+
|  WORKFLOW MARKETPLACE                                                          |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | Browse Workflow Templates                        [Search...            ] | |
|  | -----------------------------------------------------------------------  | |
|  |                                                                           | |
|  | FILTER: [All Categories v]  [All Industries v]  [Sort: Popular v]        | |
|  |                                                                           | |
|  | ═══════════════════════════════════════════════════════════════════════  | |
|  |                                                                           | |
|  | FEATURED                                                                  | |
|  | +-------------+ +-------------+ +-------------+ +-------------+          | |
|  | |             | |             | |             | |             |          | |
|  | | Agile       | | Waterfall   | | Design      | | Marketing   |          | |
|  | | Sprint      | | Classic     | | Sprint      | | Campaign    |          | |
|  | |             | |             | |             | |             |          | |
|  | | 7 phases    | | 5 phases    | | 4 phases    | | 6 phases    |          | |
|  | | 14 days     | | 30 days     | | 10 days     | | 21 days     |          | |
|  | |             | |             | |             | |             |          | |
|  | | ★★★★★ 4.8   | | ★★★★☆ 4.2   | | ★★★★★ 4.9   | | ★★★★☆ 4.5   |          | |
|  | | 2.3k uses   | | 1.1k uses   | | 890 uses    | | 650 uses    |          | |
|  | |             | |             | |             | |             |          | |
|  | | [Preview]   | | [Preview]   | | [Preview]   | | [Preview]   |          | |
|  | | [Use]       | | [Use]       | | [Use]       | | [Use]       |          | |
|  | +-------------+ +-------------+ +-------------+ +-------------+          | |
|  |                                                                           | |
|  | ═══════════════════════════════════════════════════════════════════════  | |
|  |                                                                           | |
|  | COMMUNITY                                                                 | |
|  | +-----------------------------------------------------------------------+ | |
|  | | SaaS Product Launch          | By: TechStartup Co    | ★★★★★ 4.7     | | |
|  | | 8 phases • 45 days           | 234 uses              | [Preview][Use]| | |
|  | +-----------------------------------------------------------------------+ | |
|  | | Hardware Development          | By: MakerLabs        | ★★★★☆ 4.3     | | |
|  | | 12 phases • 90 days          | 89 uses               | [Preview][Use]| | |
|  | +-----------------------------------------------------------------------+ | |
|  |                                                                           | |
|  | [Load More]                                                               | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Key Elements

1. **Toolbar**
   - Add Phase, Gate, Loop buttons
   - Undo/Redo
   - Zoom controls
   - Save/Preview/Publish

2. **Phase Library (Left Panel)**
   - Standard BMAD phases
   - Operate loops
   - Custom phases
   - Gates (approval points)
   - Connectors

3. **Workflow Canvas**
   - Visual flowchart
   - Drag-drop phases
   - Connection lines
   - Duration labels
   - Conditional paths

4. **Phase Properties**
   - Name and duration
   - Description
   - Entry/exit criteria
   - Assigned agent
   - Checklist template

5. **Marketplace**
   - Featured templates
   - Community submissions
   - Ratings and usage stats
   - Preview/Use actions
   - Category filters

### Style Notes

- Phases are rounded rectangles with phase color
- Gates are diamond shapes
- Loops shown as circular arrows
- Active selection has coral border
- Canvas has grid background
- Drag preview shows ghost element

---

## PM-33: Predictive Analytics (Prism) (NEW)

**File:** `pm-predictive-analytics.excalidraw`
**Priority:** P3 (Vision)
**PRD Reference:** Phase 3, lines 364-367
**Goal:** Design Prism's predictive analytics dashboard with ML-based completion forecasting, resource optimization suggestions, and quality scoring.

### Feature Requirements (from PRD)
```
2. **Predictive Analytics (Prism)**
   - ML-based completion forecasting
   - Resource optimization suggestions
   - Quality scoring based on approval patterns
```

### Layout Structure

```
+------------------------------------------------------------------------------+
|  PREDICTIVE ANALYTICS (PRISM)                                                  |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | 🩷 Prism Analytics Dashboard                      [Last 30 Days v] [...]  | |
|  | AI-powered insights and predictions                                       | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | PREDICTION SUMMARY                                                        | |
|  | +----------------------------------------------------------------------+ | |
|  | | +---------------+ +---------------+ +---------------+ +---------------+| | |
|  | | |    87%        | |   Dec 28      | |    92%        | |    $45K       || | |
|  | | | Confidence    | | Predicted     | | Quality       | | Projected     || | |
|  | | | Score         | | Completion    | | Score         | | Savings       || | |
|  | | | ↑ 3% vs last  | | 2 days early  | | ↓ 1% vs avg   | | from optimize || | |
|  | | +---------------+ +---------------+ +---------------+ +---------------+| | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +-------------------------------------+ +----------------------------------+ |
|  | COMPLETION FORECAST                 | | RISK PREDICTION                  | |
|  | ----------------------------------- | | -------------------------------- | |
|  |                                     | |                                  | |
|  | PROJECT          PREDICTED   CONF   | | RISK            PROB    IMPACT  | |
|  | ----------------------------------- | | -------------------------------- | |
|  | Website v2.0     Dec 28      87%   | | Scope creep     45%     High    | |
|  |   [▓▓▓▓▓▓▓▓░░]   on track          | | Resource gap    30%     Medium  | |
|  |                                     | | Tech debt       25%     Low     | |
|  | API Platform     Jan 15      72%   | | Deadline slip   20%     High    | |
|  |   [▓▓▓▓▓▓░░░░]   at risk           | |                                  | |
|  |                                     | | -------------------------------- | |
|  | Mobile App       Feb 01      94%   | |                                  | |
|  |   [▓▓▓▓▓▓▓▓▓░]   on track          | | 🩷 PRISM INSIGHT                 | |
|  |                                     | | "Based on approval patterns,    | |
|  | Confidence bands:                   | |  AUTH stories have 2x rejection | |
|  | [===] High (>85%)                   | |  rate. Consider extra review."  | |
|  | [===] Medium (70-85%)               | |                                  | |
|  | [===] Low (<70%)                    | | [View Details]                   | |
|  +-------------------------------------+ +----------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | ML COMPLETION FORECAST CHART                                              | |
|  | +----------------------------------------------------------------------+ | |
|  | |                                                                       | | |
|  | | Progress                                                              | | |
|  | | 100% ┤                                         ╭──────────── Optimistic| | |
|  | |      │                                    ╭───╯                       | | |
|  | |  80% ┤                               ╭───╯                            | | |
|  | |      │                          ╭───╯ ←── Most Likely (87%)           | | |
|  | |  60% ┤                     ╭───╯                                      | | |
|  | |      │                ╭───╯                                           | | |
|  | |  40% ┤           ╭───╯           ╲                                    | | |
|  | |      │      ╭───╯                 ╲──────────── Pessimistic           | | |
|  | |  20% ┤ ╭───╯ ← Current (42%)                                          | | |
|  | |      │╯                                                               | | |
|  | |   0% ┼─────────┬─────────┬─────────┬─────────┬─────────              | | |
|  | |      Dec 10   Dec 17    Dec 24    Dec 31    Jan 7                     | | |
|  | |               Today              Target                               | | |
|  | |                                  (Dec 30)                             | | |
|  | |                                                                       | | |
|  | | Shaded area = confidence interval                                     | | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | RESOURCE OPTIMIZATION SUGGESTIONS                                         | |
|  | +----------------------------------------------------------------------+ | |
|  | |                                                                       | | |
|  | | 🩷 PRISM RECOMMENDATIONS                              [Apply All]     | | |
|  | | ───────────────────────────────────────────────────────────────────── | | |
|  | |                                                                       | | |
|  | | 1. REBALANCE WORKLOAD                                    [Apply]     | | |
|  | |    ┌─────────────────────────────────────────────────────────────┐   | | |
|  | |    │ John Martinez is at 120% capacity while Maya has 40% free.  │   | | |
|  | |    │ Suggest moving AUTH-456 and AUTH-457 to Maya.               │   | | |
|  | |    │                                                              │   | | |
|  | |    │ Impact: Reduces John's load, improves timeline by 2 days    │   | | |
|  | |    └─────────────────────────────────────────────────────────────┘   | | |
|  | |                                                                       | | |
|  | | 2. PARALLELIZE TASKS                                     [Apply]     | | |
|  | |    ┌─────────────────────────────────────────────────────────────┐   | | |
|  | |    │ AUTH-125 and AUTH-126 have no dependencies. Running them    │   | | |
|  | |    │ in parallel could save 3 days.                              │   | | |
|  | |    │                                                              │   | | |
|  | |    │ Impact: Timeline improvement, no resource conflict          │   | | |
|  | |    └─────────────────────────────────────────────────────────────┘   | | |
|  | |                                                                       | | |
|  | | 3. REDUCE SCOPE (Optional)                               [Review]    | | |
|  | |    ┌─────────────────────────────────────────────────────────────┐   | | |
|  | |    │ 3 P2 features could be moved to next sprint without         │   | | |
|  | |    │ affecting core delivery.                                    │   | | |
|  | |    │                                                              │   | | |
|  | |    │ Impact: 95% confidence of on-time delivery (vs current 87%) │   | | |
|  | |    └─────────────────────────────────────────────────────────────┘   | | |
|  | |                                                                       | | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | QUALITY SCORING                                                           | |
|  | +----------------------------------------------------------------------+ | |
|  | |                                                                       | | |
|  | | Quality Score based on approval patterns and rework rates             | | |
|  | |                                                                       | | |
|  | | TEAM MEMBER         APPROVAL RATE    REWORK RATE    QUALITY SCORE     | | |
|  | | ───────────────────────────────────────────────────────────────────── | | |
|  | | Sarah Chen          95%              5%             ★★★★★ 98         | | |
|  | | John Martinez       88%              12%            ★★★★☆ 85         | | |
|  | | Maya Johnson        92%              8%             ★★★★★ 91         | | |
|  | | Alex Kim            78%              22%            ★★★☆☆ 72         | | |
|  | |                                                                       | | |
|  | | TASK TYPE           APPROVAL RATE    AVG ITERATIONS  QUALITY SCORE    | | |
|  | | ───────────────────────────────────────────────────────────────────── | | |
|  | | Feature             85%              1.3             ★★★★☆ 88        | | |
|  | | Bug Fix             92%              1.1             ★★★★★ 94        | | |
|  | | Tech Debt           78%              1.8             ★★★☆☆ 75        | | |
|  | | Documentation       96%              1.0             ★★★★★ 97        | | |
|  | |                                                                       | | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Key Elements

1. **Prediction Summary Cards**
   - Confidence score
   - Predicted completion date
   - Quality score
   - Projected savings

2. **Completion Forecast**
   - Per-project predictions
   - Confidence levels
   - Visual progress bars

3. **Risk Prediction**
   - Risk type and probability
   - Impact assessment
   - Prism insights

4. **ML Forecast Chart**
   - Optimistic/Most Likely/Pessimistic lines
   - Confidence interval shading
   - Current progress marker
   - Target date marker

5. **Resource Optimization**
   - AI-generated recommendations
   - Workload rebalancing
   - Parallelization suggestions
   - Scope reduction options
   - One-click apply actions

6. **Quality Scoring**
   - Per-team-member scores
   - Per-task-type scores
   - Approval and rework rates
   - Star ratings

### Style Notes

- Prism sections use pink accent (#EC4899)
- Confidence bands use gradient fill
- High confidence: Green
- Medium confidence: Amber
- Low confidence: Red
- Recommendations have action buttons
- Quality stars match score color

---

## PM-34: API & Webhooks Configuration (NEW)

**File:** `pm-api-webhooks.excalidraw`
**Priority:** P3 (Vision)
**PRD Reference:** Phase 3, lines 369-372
**Goal:** Design the API key management, webhook configuration, and Zapier integration settings interface.

### Feature Requirements (from PRD)
```
3. **External Integrations**
   - Public REST API
   - Webhooks
   - Zapier integration
```

### Layout Structure

```
+------------------------------------------------------------------------------+
|  API & INTEGRATIONS                                                            |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | Developer Settings                                    [Documentation]    | |
|  | -----------------------------------------------------------------------  | |
|  |                                                                           | |
|  | [API Keys]  [Webhooks]  [Zapier]  [OAuth Apps]                            | |
|  | ________                                                                  | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | API KEYS                                                                  | |
|  | +----------------------------------------------------------------------+ | |
|  | |                                                                       | | |
|  | | Your API keys grant access to the HYVVE API. Keep them secure.        | | |
|  | |                                                                       | | |
|  | | +-------------------------------------------------------------------+ | | |
|  | | | NAME              CREATED       LAST USED      PERMISSIONS         | | | |
|  | | | ----------------------------------------------------------------- | | | |
|  | | | Production Key    Dec 01, 2024  2 min ago      Full Access        | | | |
|  | | | sk-hyvve-prod-*** [Copy]                       [Revoke]           | | | |
|  | | | ----------------------------------------------------------------- | | | |
|  | | | Development Key   Dec 10, 2024  1 hour ago     Read Only          | | | |
|  | | | sk-hyvve-dev-***  [Copy]                       [Revoke]           | | | |
|  | | | ----------------------------------------------------------------- | | | |
|  | | | CI/CD Key         Dec 15, 2024  Never          Tasks Only         | | | |
|  | | | sk-hyvve-ci-***   [Copy]                       [Revoke]           | | | |
|  | | +-------------------------------------------------------------------+ | | |
|  | |                                                                       | | |
|  | | [+ Create API Key]                                                    | | |
|  | |                                                                       | | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | API USAGE                                                                 | |
|  | +----------------------------------------------------------------------+ | |
|  | |                                                                       | | |
|  | | This Month: 45,230 / 100,000 requests (45%)                           | | |
|  | | [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]                   | | |
|  | |                                                                       | | |
|  | | ENDPOINT              CALLS     AVG LATENCY    ERROR RATE             | | |
|  | | ───────────────────────────────────────────────────────────────────── | | |
|  | | GET /tasks            18,450    45ms           0.1%                   | | |
|  | | POST /tasks           12,300    120ms          0.3%                   | | |
|  | | GET /projects         8,200     38ms           0.0%                   | | |
|  | | PATCH /tasks          6,280     95ms           0.2%                   | | |
|  | |                                                                       | | |
|  | | [View Full Analytics]                                                  | | |
|  | |                                                                       | | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Webhooks Tab

```
+------------------------------------------------------------------------------+
|  WEBHOOKS                                                                      |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | Webhooks notify your services when events occur in HYVVE.                 | |
|  | +----------------------------------------------------------------------+ | |
|  | |                                                                       | | |
|  | | CONFIGURED WEBHOOKS                                                   | | |
|  | | +-------------------------------------------------------------------+ | | |
|  | | |                                                                    | | | |
|  | | | Task Updates Webhook                              [Active]        | | | |
|  | | | https://api.myapp.com/webhooks/hyvve                              | | | |
|  | | | Events: task.created, task.updated, task.completed                | | | |
|  | | | Last triggered: 5 min ago • 99.8% success rate                    | | | |
|  | | |                                              [Edit] [Test] [Delete]| | | |
|  | | |                                                                    | | | |
|  | | | ------------------------------------------------------------------ | | | |
|  | | |                                                                    | | | |
|  | | | Slack Notifications                               [Active]        | | | |
|  | | | https://hooks.slack.com/services/T00/B00/XXX                       | | | |
|  | | | Events: task.blocked, sprint.completed                            | | | |
|  | | | Last triggered: 2 hours ago • 100% success rate                   | | | |
|  | | |                                              [Edit] [Test] [Delete]| | | |
|  | | |                                                                    | | | |
|  | | | ------------------------------------------------------------------ | | | |
|  | | |                                                                    | | | |
|  | | | Analytics Pipeline                                [Paused]        | | | |
|  | | | https://analytics.internal/ingest                                 | | | |
|  | | | Events: All events                                                | | | |
|  | | | Paused: Connection errors                                         | | | |
|  | | |                                       [Resume] [Edit] [Test] [Delete]| | |
|  | | |                                                                    | | | |
|  | | +-------------------------------------------------------------------+ | | |
|  | |                                                                       | | |
|  | | [+ Create Webhook]                                                    | | |
|  | |                                                                       | | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | AVAILABLE EVENTS                                                          | |
|  | +----------------------------------------------------------------------+ | |
|  | |                                                                       | | |
|  | | TASKS                         PROJECTS              SPRINTS           | | |
|  | | task.created                  project.created       sprint.started    | | |
|  | | task.updated                  project.updated       sprint.completed  | | |
|  | | task.deleted                  project.deleted       sprint.extended   | | |
|  | | task.completed                project.archived                        | | |
|  | | task.blocked                                        AGENTS            | | |
|  | | task.assigned                 COMMENTS              agent.suggestion  | | |
|  | |                               comment.created       agent.action      | | |
|  | | APPROVALS                     comment.resolved      agent.error       | | |
|  | | approval.requested                                                    | | |
|  | | approval.approved                                                     | | |
|  | | approval.rejected                                                     | | |
|  | |                                                                       | | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Create Webhook Modal

```
+------------------------------------------------------------------------------+
|  CREATE WEBHOOK                                                                |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  |                                                              [x]          | |
|  |  Create Webhook                                                           | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  Name *                                                                   | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | Task Updates Webhook                                               |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  Endpoint URL *                                                           | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | https://api.myapp.com/webhooks/hyvve                               |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  SELECT EVENTS                                                            | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | [x] All events (not recommended for production)                    |   | |
|  |  |                                                                    |   | |
|  |  | Or select specific events:                                         |   | |
|  |  |                                                                    |   | |
|  |  | TASKS                                                              |   | |
|  |  | [x] task.created    [x] task.updated    [ ] task.deleted          |   | |
|  |  | [x] task.completed  [ ] task.blocked    [ ] task.assigned         |   | |
|  |  |                                                                    |   | |
|  |  | PROJECTS                                                           |   | |
|  |  | [ ] project.created  [ ] project.updated  [ ] project.deleted     |   | |
|  |  |                                                                    |   | |
|  |  | SPRINTS                                                            |   | |
|  |  | [ ] sprint.started  [ ] sprint.completed  [ ] sprint.extended     |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  SECURITY                                                                 | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | Secret Key (for signature verification):                           |   | |
|  |  | [whsec_****************************]  [Regenerate]  [Show]         |   | |
|  |  |                                                                    |   | |
|  |  | We'll include a X-HYVVE-Signature header with each request.        |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |                                    [Cancel]  [Create Webhook]             | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Key Elements

1. **API Keys Section**
   - List of API keys
   - Key name and prefix (masked)
   - Created date, last used
   - Permission level
   - Copy/Revoke actions

2. **API Usage**
   - Monthly request count
   - Usage bar
   - Per-endpoint analytics
   - Latency and error rates

3. **Webhooks List**
   - Webhook name and URL
   - Subscribed events
   - Status (Active/Paused)
   - Success rate
   - Edit/Test/Delete actions

4. **Available Events**
   - Categorized event list
   - Tasks, Projects, Sprints
   - Approvals, Comments, Agents

5. **Create Webhook Modal**
   - Name and URL inputs
   - Event selection checkboxes
   - Secret key for verification
   - Security information

### Style Notes

- API keys shown with masked suffix (sk-hyvve-***)
- Copy button uses clipboard icon
- Active webhooks: Green badge
- Paused webhooks: Gray badge
- Test button sends sample payload
- Secret keys masked by default

---

## PM-35: Task Templates Library (NEW)

**File:** `pm-task-templates.excalidraw`
**Priority:** P3 (Vision)
**PRD Reference:** Phase 3, lines 374-376
**Goal:** Design a task templates library with reusable task structures, template creation, and one-click task generation.

### Feature Requirements (from PRD)
```
4. **Advanced Collaboration**
   - Task templates library
   - Cross-product dependencies
```

### Layout Structure

```
+------------------------------------------------------------------------------+
|  TASK TEMPLATES LIBRARY                                                        |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | Task Templates                                [+ Create Template] [...]   | |
|  | -----------------------------------------------------------------------  | |
|  |                                                                           | |
|  | [Search templates...                                           ] [Filter]| |
|  |                                                                           | |
|  | [My Templates]  [Team Templates]  [Library]                               | |
|  | ______________                                                            | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | MY TEMPLATES (5)                                                          | |
|  | +----------------------------------------------------------------------+ | |
|  | |                                                                       | | |
|  | | +---------------------------+ +---------------------------+           | | |
|  | | | Bug Fix Template          | | Feature Implementation     |           | | |
|  | | | ───────────────────────── | | ───────────────────────── |           | | |
|  | | |                           | |                           |           | | |
|  | | | 5 subtasks                | | 8 subtasks                |           | | |
|  | | | Est: 3 story points       | | Est: 8 story points       |           | | |
|  | | |                           | |                           |           | | |
|  | | | Tags: bug, fix            | | Tags: feature, dev        |           | | |
|  | | |                           | |                           |           | | |
|  | | | Used 23 times             | | Used 45 times             |           | | |
|  | | |                           | |                           |           | | |
|  | | | [Use] [Edit] [Share]      | | [Use] [Edit] [Share]      |           | | |
|  | | +---------------------------+ +---------------------------+           | | |
|  | |                                                                       | | |
|  | | +---------------------------+ +---------------------------+           | | |
|  | | | Code Review Checklist     | | Sprint Planning Tasks     |           | | |
|  | | | ───────────────────────── | | ───────────────────────── |           | | |
|  | | | 7 subtasks                | | 4 subtasks                |           | | |
|  | | | Est: 2 story points       | | Est: 1 story point        |           | | |
|  | | | Used 12 times             | | Used 8 times              |           | | |
|  | | | [Use] [Edit] [Share]      | | [Use] [Edit] [Share]      |           | | |
|  | | +---------------------------+ +---------------------------+           | | |
|  | |                                                                       | | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | TEMPLATE PREVIEW (Selected: Feature Implementation)                       | |
|  | +----------------------------------------------------------------------+ | |
|  | |                                                              [x]      | | |
|  | | Feature Implementation Template                                       | | |
|  | | ───────────────────────────────────────────────────────────────────── | | |
|  | |                                                                       | | |
|  | | TEMPLATE STRUCTURE                                                    | | |
|  | | +-------------------------------------------------------------------+ | | |
|  | | |                                                                    | | | |
|  | | | Parent Task: [Feature: {title}]                                   | | | |
|  | | |                                                                    | | | |
|  | | | Subtasks:                                                          | | | |
|  | | | ☐ 1. Requirements clarification        [1 pt]                     | | | |
|  | | | ☐ 2. Technical design                  [2 pts]                    | | | |
|  | | | ☐ 3. Implementation                    [3 pts]                    | | | |
|  | | | ☐ 4. Unit tests                        [1 pt]                     | | | |
|  | | | ☐ 5. Integration tests                 [1 pt]                     | | | |
|  | | | ☐ 6. Code review                       [0 pts]                    | | | |
|  | | | ☐ 7. Documentation                     [0 pts]                    | | | |
|  | | | ☐ 8. QA verification                   [0 pts]                    | | | |
|  | | |                                                                    | | | |
|  | | | Total: 8 story points                                              | | | |
|  | | |                                                                    | | | |
|  | | +-------------------------------------------------------------------+ | | |
|  | |                                                                       | | |
|  | | DEFAULT VALUES                                                        | | |
|  | | +-------------------------------------------------------------------+ | | |
|  | | | Priority: Medium          Assignee: (inherits from parent)        | | | |
|  | | | Tags: feature, development                                        | | | |
|  | | | Labels: needs-review, needs-testing                               | | | |
|  | | +-------------------------------------------------------------------+ | | |
|  | |                                                                       | | |
|  | |                          [Edit Template]  [Use Template]              | | |
|  | |                                                                       | | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Use Template Modal

```
+------------------------------------------------------------------------------+
|  USE TEMPLATE                                                                  |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  |                                                              [x]          | |
|  |  Create Task from Template: Feature Implementation                        | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  CUSTOMIZE                                                                | |
|  |  +-------------------------------------------------------------------+   | |
|  |  |                                                                    |   | |
|  |  | Task Title *                                                       |   | |
|  |  | [Feature: User Authentication                              ]       |   | |
|  |  |                                                                    |   | |
|  |  | Project *                    Sprint                                |   | |
|  |  | [Website v2.0 v]            [Sprint 5 v]                           |   | |
|  |  |                                                                    |   | |
|  |  | Assignee                    Priority                               |   | |
|  |  | [Sarah Chen v]              [Medium v]                             |   | |
|  |  |                                                                    |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  SUBTASKS TO CREATE                                                       | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | [x] Requirements clarification                             [1 pt] |   | |
|  |  | [x] Technical design                                       [2 pts]|   | |
|  |  | [x] Implementation                                         [3 pts]|   | |
|  |  | [x] Unit tests                                             [1 pt] |   | |
|  |  | [x] Integration tests                                      [1 pt] |   | |
|  |  | [x] Code review                                            [0 pts]|   | |
|  |  | [ ] Documentation (optional)                               [0 pts]|   | |
|  |  | [ ] QA verification (optional)                             [0 pts]|   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  Total: 8 story points (6 required + 0 optional selected)                 | |
|  |                                                                           | |
|  |                                    [Cancel]  [Create Task + Subtasks]     | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Key Elements

1. **Template Library Tabs**
   - My Templates (personal)
   - Team Templates (shared)
   - Library (curated/public)

2. **Template Cards**
   - Template name
   - Subtask count
   - Estimated points
   - Tags
   - Usage count
   - Quick actions

3. **Template Preview**
   - Full structure view
   - Parent task format
   - Subtask list with points
   - Default values
   - Edit/Use actions

4. **Use Template Modal**
   - Customize task details
   - Select/deselect subtasks
   - Override defaults
   - Point total calculator

### Style Notes

- Template cards use card layout with shadow
- Selected template shows preview panel
- Checkboxes allow subtask selection
- Points shown inline with subtasks
- Optional subtasks grayed out

---

## PM-36: OKR & Goals Tracking (NEW)

**File:** `pm-okr-goals.excalidraw`
**Priority:** P3 (Vision)
**PRD Reference:** Phase 3, lines 378-381
**Goal:** Design OKR and goals tracking interface with goal hierarchy, progress rollup from linked tasks/projects, and health indicators.

### Feature Requirements (from PRD)
```
5. **OKR & Goals Tracking** *(Competitor-inspired: Asana, ClickUp)*
   - Define organizational goals and objectives
   - Link tasks/projects to goals for progress rollup
   - Goal health indicators and status tracking
```

### Layout Structure

```
+------------------------------------------------------------------------------+
|  OKR & GOALS                                                                   |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | Goals Dashboard                    [Q4 2024 v]  [+ Create Goal] [...]    | |
|  | -----------------------------------------------------------------------  | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | GOAL PROGRESS OVERVIEW                                                    | |
|  | +----------------------------------------------------------------------+ | |
|  | | +---------------+ +---------------+ +---------------+ +---------------+| | |
|  | | |    67%        | |    4/6        | |    2          | |    1          || | |
|  | | | Overall       | | Objectives    | | On Track      | | At Risk       || | |
|  | | | Progress      | | Complete      | |               | |               || | |
|  | | +---------------+ +---------------+ +---------------+ +---------------+| | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | OBJECTIVES & KEY RESULTS                                                  | |
|  | +----------------------------------------------------------------------+ | |
|  | |                                                                       | | |
|  | | OBJECTIVE 1: Increase Platform Adoption                    [On Track] | | |
|  | | Owner: Sarah Chen | Due: Dec 31, 2024                                 | | |
|  | | ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  75%                 | | |
|  | | +---------------------------------------------------------------+   | | |
|  | | |                                                                |   | | |
|  | | | KR 1.1: Reach 10,000 active users                             |   | | |
|  | | |         Current: 8,500 / 10,000 (85%)              [On Track] |   | | |
|  | | |         Linked: User Acquisition Project                      |   | | |
|  | | |                                                                |   | | |
|  | | | KR 1.2: Achieve 40% weekly retention                          |   | | |
|  | | |         Current: 35% / 40% (87.5%)                 [On Track] |   | | |
|  | | |         Linked: Engagement Features Epic                      |   | | |
|  | | |                                                                |   | | |
|  | | | KR 1.3: Launch mobile app                                     |   | | |
|  | | |         Current: 50% complete                      [At Risk]  |   | | |
|  | | |         Linked: Mobile App Project                            |   | | |
|  | | |                                                                |   | | |
|  | | +---------------------------------------------------------------+   | | |
|  | | [Expand] [Edit] [Link Project]                                       | | |
|  | |                                                                       | | |
|  | | ─────────────────────────────────────────────────────────────────── | | |
|  | |                                                                       | | |
|  | | OBJECTIVE 2: Improve Product Quality                       [On Track] | | |
|  | | Owner: John Martinez | Due: Dec 31, 2024                              | | |
|  | | ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░  62%                 | | |
|  | | +---------------------------------------------------------------+   | | |
|  | | |                                                                |   | | |
|  | | | KR 2.1: Reduce bug count by 50%                               |   | | |
|  | | |         Current: 120 → 72 (40% reduction)          [On Track] |   | | |
|  | | |                                                                |   | | |
|  | | | KR 2.2: Achieve 99.9% uptime                                  |   | | |
|  | | |         Current: 99.7%                             [At Risk]  |   | | |
|  | | |                                                                |   | | |
|  | | | KR 2.3: Reduce average response time to <200ms                |   | | |
|  | | |         Current: 185ms                             [Complete] |   | | |
|  | | |                                                                |   | | |
|  | | +---------------------------------------------------------------+   | | |
|  | | [Expand] [Edit] [Link Project]                                       | | |
|  | |                                                                       | | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | GOAL HIERARCHY VIEW                                                       | |
|  | +----------------------------------------------------------------------+ | |
|  | |                                                                       | | |
|  | |  COMPANY GOAL                                                         | | |
|  | |  ├── Increase Platform Adoption (75%)                                 | | |
|  | |  │   ├── KR 1.1: Active Users (85%)                                  | | |
|  | |  │   │   └── User Acquisition Project                                | | |
|  | |  │   │       ├── Task: Landing Page Redesign ✓                       | | |
|  | |  │   │       ├── Task: Referral Program                              | | |
|  | |  │   │       └── Task: SEO Optimization                              | | |
|  | |  │   ├── KR 1.2: Retention (87.5%)                                   | | |
|  | |  │   │   └── Engagement Features Epic                                | | |
|  | |  │   │       ├── Task: Push Notifications ✓                          | | |
|  | |  │   │       └── Task: Email Campaigns                               | | |
|  | |  │   └── KR 1.3: Mobile App (50%)                                    | | |
|  | |  │       └── Mobile App Project                                      | | |
|  | |  │           ├── Task: iOS Development                               | | |
|  | |  │           └── Task: Android Development                           | | |
|  | |  │                                                                    | | |
|  | |  └── Improve Product Quality (62%)                                   | | |
|  | |      ├── KR 2.1: Bug Reduction (80%)                                 | | |
|  | |      ├── KR 2.2: Uptime (70%)                                        | | |
|  | |      └── KR 2.3: Response Time (100%) ✓                              | | |
|  | |                                                                       | | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Create Goal Modal

```
+------------------------------------------------------------------------------+
|  CREATE GOAL                                                                   |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  |                                                              [x]          | |
|  |  Create Objective                                                         | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  Objective Title *                                                        | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | Increase Platform Adoption                                         |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  Description                                                              | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | Grow our user base and improve engagement metrics to establish    |   | |
|  |  | market leadership in Q4 2024.                                      |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  Owner *                          Time Period *                           | |
|  |  [Sarah Chen v]                   [Q4 2024 v]                             | |
|  |                                                                           | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  KEY RESULTS                                                              | |
|  |  +-------------------------------------------------------------------+   | |
|  |  |                                                                    |   | |
|  |  | KR 1: [Reach 10,000 active users                           ]       |   | |
|  |  |       Metric Type: [Number v]  Target: [10000]  Current: [0]       |   | |
|  |  |                                                                    |   | |
|  |  | KR 2: [Achieve 40% weekly retention                        ]       |   | |
|  |  |       Metric Type: [Percentage v]  Target: [40]  Current: [0]      |   | |
|  |  |                                                                    |   | |
|  |  | KR 3: [Launch mobile app                                   ]       |   | |
|  |  |       Metric Type: [Milestone v]  Status: [Not Started v]          |   | |
|  |  |                                                                    |   | |
|  |  | [+ Add Key Result]                                                 |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  LINK TO PROJECTS (Optional)                                              | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | [+ Link Project or Task]                                           |   | |
|  |  |                                                                    |   | |
|  |  | Progress will automatically roll up from linked items.             |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |                                    [Cancel]  [Create Objective]           | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Key Elements

1. **Progress Overview**
   - Overall progress percentage
   - Objectives complete count
   - On track vs at risk counts

2. **Objectives List**
   - Objective title and owner
   - Due date
   - Progress bar
   - Key results nested below
   - Health status badge

3. **Key Results**
   - KR title and target
   - Current value and percentage
   - Status badge
   - Linked projects/tasks

4. **Hierarchy View**
   - Tree structure visualization
   - Company → Objective → KR → Project → Task
   - Progress percentage at each level
   - Completion checkmarks

5. **Create Goal Modal**
   - Objective details
   - Key results with metric types
   - Linkage to projects/tasks

### Style Notes

- On Track: Green badge
- At Risk: Amber badge
- Complete: Green checkmark
- Progress bars match status color
- Hierarchy uses tree lines
- Expandable/collapsible sections

---

## PM-37: Enterprise Audit & Compliance (NEW)

**File:** `pm-audit-compliance.excalidraw`
**Priority:** P3 (Vision)
**PRD Reference:** Phase 3, lines 383-386
**Goal:** Design enterprise audit logging and compliance interface with comprehensive activity logs, export capabilities, and compliance reporting.

### Feature Requirements (from PRD)
```
6. **Enterprise Features** *(Competitor-inspired: OpenProject, Jira)*
   - Portfolio-level dependency tracking
   - Multi-product roadmaps
   - Audit logging and compliance
```

### Layout Structure

```
+------------------------------------------------------------------------------+
|  AUDIT & COMPLIANCE                                                            |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | Enterprise Audit Center                             [Export] [Settings]  | |
|  | -----------------------------------------------------------------------  | |
|  |                                                                           | |
|  | [Activity Log]  [Access Log]  [Compliance Reports]  [Data Retention]      | |
|  | ______________                                                            | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | ACTIVITY LOG                                                              | |
|  | +----------------------------------------------------------------------+ | |
|  | |                                                                       | | |
|  | | FILTERS                                                               | | |
|  | | +-------------------------------------------------------------------+ | | |
|  | | | Date Range: [Last 7 Days v]  User: [All Users v]                   | | | |
|  | | | Action: [All Actions v]      Resource: [All Resources v]           | | | |
|  | | | [Apply Filters]  [Clear]                                           | | | |
|  | | +-------------------------------------------------------------------+ | | |
|  | |                                                                       | | |
|  | | AUDIT ENTRIES (2,847 total)                                           | | |
|  | | +-------------------------------------------------------------------+ | | |
|  | | | TIMESTAMP           | USER          | ACTION        | RESOURCE    | | | |
|  | | | ─────────────────── | ───────────── | ───────────── | ─────────── | | | |
|  | | | Dec 16, 14:32:15    | Sarah Chen    | task.update   | AUTH-123    | | | |
|  | | |   Changed status from "In Progress" to "Done"                     | | | |
|  | | |   IP: 192.168.1.100 | Session: abc123                             | | | |
|  | | | ─────────────────── | ───────────── | ───────────── | ─────────── | | | |
|  | | | Dec 16, 14:30:02    | John Martinez | task.create   | AUTH-128    | | | |
|  | | |   Created task "Fix OAuth callback handling"                       | | | |
|  | | |   IP: 192.168.1.101 | Session: def456                             | | | |
|  | | | ─────────────────── | ───────────── | ───────────── | ─────────── | | | |
|  | | | Dec 16, 14:28:45    | System        | agent.action  | Navi        | | | |
|  | | |   Agent assigned task AUTH-127 to Maya Johnson                     | | | |
|  | | |   Confidence: 92% | Auto-approved                                  | | | |
|  | | | ─────────────────── | ───────────── | ───────────── | ─────────── | | | |
|  | | | Dec 16, 14:25:30    | Sarah Chen    | approval.approve | APR-456  | | | |
|  | | |   Approved "Deploy to staging" with comment                        | | | |
|  | | |   IP: 192.168.1.100 | Session: abc123                             | | | |
|  | | | ─────────────────── | ───────────── | ───────────── | ─────────── | | | |
|  | | | Dec 16, 14:20:15    | Maya Johnson  | kb.page.edit  | KB-045      | | | |
|  | | |   Updated "API Documentation" page                                 | | | |
|  | | |   Changes: +45 lines, -12 lines                                    | | | |
|  | | +-------------------------------------------------------------------+ | | |
|  | |                                                                       | | |
|  | | [Load More] | Showing 5 of 2,847 entries                             | | |
|  | |                                                                       | | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Compliance Reports Tab

```
+------------------------------------------------------------------------------+
|  COMPLIANCE REPORTS                                                            |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | Generate compliance reports for auditing and regulatory requirements.     | |
|  | +----------------------------------------------------------------------+ | |
|  | |                                                                       | | |
|  | | REPORT TEMPLATES                                                      | | |
|  | | +-------------------------------------------------------------------+ | | |
|  | | |                                                                    | | | |
|  | | | +-------------------------+ +-------------------------+           | | | |
|  | | | | SOC 2 Access Report     | | GDPR Data Access Log    |           | | | |
|  | | | | ─────────────────────── | | ─────────────────────── |           | | | |
|  | | | | User access patterns,   | | Personal data access,   |           | | | |
|  | | | | permission changes,     | | data exports, deletion  |           | | | |
|  | | | | failed login attempts   | | requests processed      |           | | | |
|  | | | |                         | |                         |           | | | |
|  | | | | [Generate Report]       | | [Generate Report]       |           | | | |
|  | | | +-------------------------+ +-------------------------+           | | | |
|  | | |                                                                    | | | |
|  | | | +-------------------------+ +-------------------------+           | | | |
|  | | | | Activity Summary        | | Agent Actions Report    |           | | | |
|  | | | | ─────────────────────── | | ─────────────────────── |           | | | |
|  | | | | All user and system     | | AI agent decisions,     |           | | | |
|  | | | | actions for date range  | | approvals, confidence   |           | | | |
|  | | | |                         | | scores                  |           | | | |
|  | | | |                         | |                         |           | | | |
|  | | | | [Generate Report]       | | [Generate Report]       |           | | | |
|  | | | +-------------------------+ +-------------------------+           | | | |
|  | | |                                                                    | | | |
|  | | +-------------------------------------------------------------------+ | | |
|  | |                                                                       | | |
|  | | GENERATED REPORTS                                                     | | |
|  | | +-------------------------------------------------------------------+ | | |
|  | | | NAME                    | DATE        | SIZE    | STATUS           | | | |
|  | | | ─────────────────────── | ─────────── | ─────── | ──────────────── | | | |
|  | | | SOC2_Dec2024.pdf        | Dec 15      | 2.4 MB  | Ready [Download] | | | |
|  | | | GDPR_Q4_2024.pdf        | Dec 01      | 1.1 MB  | Ready [Download] | | | |
|  | | | Activity_Nov2024.csv    | Dec 01      | 8.5 MB  | Ready [Download] | | | |
|  | | | Agent_Actions_Q4.pdf    | Generating...         | 45%              | | | |
|  | | +-------------------------------------------------------------------+ | | |
|  | |                                                                       | | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Access Log Tab

```
+------------------------------------------------------------------------------+
|  ACCESS LOG                                                                    |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | Track all authentication and authorization events.                        | |
|  | +----------------------------------------------------------------------+ | |
|  | |                                                                       | | |
|  | | RECENT ACCESS EVENTS                                                  | | |
|  | | +-------------------------------------------------------------------+ | | |
|  | | | TIMESTAMP           | USER          | EVENT           | DETAILS   | | | |
|  | | | ─────────────────── | ───────────── | ─────────────── | ───────── | | | |
|  | | | Dec 16, 14:35:00    | Sarah Chen    | login.success   | Web App   | | | |
|  | | |   IP: 192.168.1.100 | Location: San Francisco, CA                 | | | |
|  | | |   Device: Chrome 120 / macOS                                       | | | |
|  | | | ─────────────────── | ───────────── | ─────────────── | ───────── | | | |
|  | | | Dec 16, 14:30:00    | Unknown       | login.failed    | Web App   | | | |
|  | | |   IP: 45.33.22.11 | Location: Unknown | Reason: Invalid password  | | | |
|  | | |   Attempted user: admin@company.com                  [⚠️ Flagged] | | | |
|  | | | ─────────────────── | ───────────── | ─────────────── | ───────── | | | |
|  | | | Dec 16, 14:28:00    | API Key       | api.access      | REST API  | | | |
|  | | |   Key: sk-prod-*** | Endpoint: GET /api/v1/tasks                  | | | |
|  | | | ─────────────────── | ───────────── | ─────────────── | ───────── | | | |
|  | | | Dec 16, 14:25:00    | John Martinez | permission.change | --       | | | |
|  | | |   Granted "Admin" role to Maya Johnson by Sarah Chen               | | | |
|  | | | ─────────────────── | ───────────── | ─────────────── | ───────── | | | |
|  | | | Dec 16, 14:20:00    | Sarah Chen    | 2fa.enabled     | --        | | | |
|  | | |   Enabled TOTP 2FA for account                                      | | | |
|  | | +-------------------------------------------------------------------+ | | |
|  | |                                                                       | | |
|  | | SECURITY ALERTS (2)                                                   | | |
|  | | +-------------------------------------------------------------------+ | | |
|  | | | ⚠️ 3 failed login attempts from IP 45.33.22.11 in last hour        | | | |
|  | | | ⚠️ Unusual access pattern: John Martinez accessed from new device  | | | |
|  | | +-------------------------------------------------------------------+ | | |
|  | |                                                                       | | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Key Elements

1. **Activity Log**
   - Timestamp and user
   - Action type
   - Resource affected
   - Detailed changes
   - IP and session info
   - Filters: Date, User, Action, Resource

2. **Access Log**
   - Authentication events
   - Login successes/failures
   - API access
   - Permission changes
   - Security alerts

3. **Compliance Reports**
   - Report templates (SOC 2, GDPR, etc.)
   - One-click generation
   - Generated reports list
   - Download/status

4. **Data Retention**
   - Retention policies
   - Purge schedules
   - Archive settings

### Style Notes

- Failed events: Red highlight
- Security alerts: Amber background
- System actions: Gray text
- Agent actions: Teal indicator
- Expandable log entries
- Export to CSV/PDF

---

## Summary

BATCH-18 includes 6 Phase 3 PM wireframes:

| ID | Name | Description |
|----|------|-------------|
| PM-32 | Workflow Builder | Visual BMAD workflow editor with marketplace |
| PM-33 | Predictive Analytics | ML forecasting, resource optimization, quality scoring |
| PM-34 | API & Webhooks | API keys, webhook configuration, Zapier |
| PM-35 | Task Templates | Reusable task structures with subtasks |
| PM-36 | OKR & Goals | Objectives, key results, progress rollup |
| PM-37 | Audit & Compliance | Activity logs, access logs, compliance reports |

---

_End of BATCH-18: Phase 3 PM Vision Feature Wireframes_
