# Epic PM-08: Prism Agent & Predictive Analytics

**Goal:** Users get AI-powered trend analysis and predictive insights.

**FRs Covered:** FR-6 (advanced)

## Wireframe References

| Story | Wireframe | Assets |
|-------|-----------|--------|
| PM-08: Predictive Analytics Dashboard | PM-33 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-33_predictive_analytics_(prism)/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-33_predictive_analytics_(prism)/screen.png) |
| PM-08: Reports Dashboard | PM-15 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-15_project_reports/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-15_project_reports/screen.png) |

---

### Story PM-08.1: Prism Agent Foundation

**As a** platform,
**I want** Prism agent for predictive analytics,
**So that** AI provides forward-looking insights.

**Acceptance Criteria:**

**Given** sufficient project history
**When** Prism analyzes data
**Then** generates: completion predictions, risk forecasts, trend analysis

**And** explains reasoning

**And** confidence levels shown

**Prerequisites:** PM-05.7

**Technical Notes:**
- Agno agent in `agents/platform/prism/`
- Requires minimum data threshold

---

### Story PM-08.2: Completion Predictions

**As a** project lead,
**I want** predicted completion dates,
**So that** I can plan accurately.

**Acceptance Criteria:**

**Given** project has velocity history
**When** Prism predicts
**Then** shows: predicted end date, confidence range (optimistic/pessimistic), factors affecting prediction

**And** updates as velocity changes

**Prerequisites:** PM-08.1

**Technical Notes:**
- Based on velocity and remaining work
- Monte Carlo simulation for ranges

---

### Story PM-08.3: Risk Forecasting

**As a** project lead,
**I want** predicted risks,
**So that** I can mitigate before they occur.

**Acceptance Criteria:**

**Given** project patterns analyzed
**When** risks identified
**Then** shows: predicted risk, probability, potential impact, suggested mitigation

**And** auto-creates RiskEntry (pending approval)

**Prerequisites:** PM-08.1

**Technical Notes:**
- Pattern matching from historical data
- Cross-project learning (same workspace)

---

### Story PM-08.4: Trend Dashboards

**As a** project lead,
**I want** trend visualizations,
**So that** I understand project trajectory.

**Acceptance Criteria:**

**Given** I view analytics
**When** trends load
**Then** shows: velocity trend (4 weeks), scope trend, completion rate trend, team productivity trend

**And** anomaly highlighting

**And** drill-down to details

**Prerequisites:** PM-08.1

**Technical Notes:**
- Charts with trend lines
- Statistical significance indicators

---

### Story PM-08.5: What-If Scenarios

**As a** project lead,
**I want** to model scenarios,
**So that** I can plan for changes.

**Acceptance Criteria:**

**Given** I open scenario planner
**When** I adjust variables
**Then** shows impact on: completion date, resource needs, risk levels

**And** variables: add/remove scope, change team size, adjust velocity

**Prerequisites:** PM-08.1

**Technical Notes:**
- Interactive sliders
- Real-time recalculation

---

### Story PM-08.6: Analytics Export

**As a** project lead,
**I want** to export analytics,
**So that** I can share with stakeholders.

**Acceptance Criteria:**

**Given** I am viewing analytics
**When** I click export
**Then** options: PDF report, CSV data, image (chart)

**And** scheduled exports available

**Prerequisites:** PM-08.4

**Technical Notes:**
- PDF generation with charts
- Scheduled via cron

---
