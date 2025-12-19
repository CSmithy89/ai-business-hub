# PM-05.7: Herald Stakeholder Reports

**Epic:** PM-05 - AI Team (Scope, Pulse, Herald)
**Story:** PM-05.7 - Herald Agent for Stakeholder-Specific Reports
**Type:** Feature
**Points:** 5
**Status:** In Progress

---

## User Story

**As a** project manager
**I want** AI-generated reports customized for different stakeholder audiences
**So that** executives, team leads, and clients receive relevant information at the appropriate level of detail

---

## Acceptance Criteria

### 1. Stakeholder Types

- [ ] StakeholderType enum defined: EXECUTIVE, TEAM_LEAD, CLIENT, GENERAL
- [ ] Each stakeholder type has distinct report formatting and content filtering
- [ ] Reports automatically adjust detail level based on stakeholder type
- [ ] Executive reports focus on high-level metrics and outcomes
- [ ] Team lead reports include detailed tasks and blockers
- [ ] Client reports sanitize internal details and focus on deliverables

### 2. Executive Summary Reports

- [ ] High-level overview with key metrics (completion %, budget, timeline)
- [ ] Strategic focus: outcomes, ROI, business impact
- [ ] Minimal technical jargon
- [ ] Visual-ready formatting (charts, KPIs)
- [ ] Executive-level recommendations
- [ ] One-page summary format when possible

### 3. Team Lead Reports

- [ ] Detailed task breakdown by team member
- [ ] Active blockers with context and dependencies
- [ ] Sprint/phase progress with velocity metrics
- [ ] Resource allocation and capacity
- [ ] Technical details preserved
- [ ] Actionable items highlighted

### 4. Client/External Reports

- [ ] Sanitized content (no internal team details)
- [ ] Focus on deliverables and milestones
- [ ] Progress against agreed scope
- [ ] Client-facing language (business outcomes)
- [ ] Timeline and next steps
- [ ] Issue resolution status (without internal details)

### 5. Report Templates

- [ ] Each stakeholder type has predefined content templates
- [ ] Templates customizable per workspace/project
- [ ] Templates stored and versioned
- [ ] Support for custom stakeholder types (future enhancement)

### 6. Backend Service Updates

- [ ] `generateExecutiveReport` method implemented
- [ ] `generateTeamLeadReport` method implemented
- [ ] `generateClientReport` method implemented
- [ ] `GenerateReportDto` extended to accept stakeholderType parameter
- [ ] Report model updated with stakeholderType field

### 7. Agent Tools

- [ ] `generate_executive_report` tool implemented
- [ ] `generate_team_lead_report` tool implemented
- [ ] `generate_client_report` tool implemented
- [ ] Tools call backend API with stakeholder context

---

## Technical Details

### Stakeholder Type Enum

```typescript
// apps/api/src/pm/agents/report.service.ts

export enum StakeholderType {
  EXECUTIVE = 'EXECUTIVE',
  TEAM_LEAD = 'TEAM_LEAD',
  CLIENT = 'CLIENT',
  GENERAL = 'GENERAL',
}
```

### Report Content by Stakeholder

**EXECUTIVE:**
```typescript
{
  summary: "High-level executive summary",
  sections: [
    { heading: "Executive Summary", content: "..." },
    { heading: "Key Metrics", content: "..." },
    { heading: "Strategic Outcomes", content: "..." },
    { heading: "Business Impact", content: "..." },
    { heading: "Recommendations", content: "..." }
  ],
  metrics: {
    completionPercent: number,
    budgetStatus: string,
    timelineStatus: string,
    riskLevel: string
  }
}
```

**TEAM_LEAD:**
```typescript
{
  summary: "Detailed team progress summary",
  sections: [
    { heading: "Sprint Overview", content: "..." },
    { heading: "Team Velocity", content: "..." },
    { heading: "Active Tasks by Member", content: "..." },
    { heading: "Blockers and Dependencies", content: "..." },
    { heading: "Capacity Planning", content: "..." },
    { heading: "Technical Notes", content: "..." }
  ],
  metrics: {
    velocity: number,
    sprintProgress: number,
    blockerCount: number,
    teamCapacity: number
  }
}
```

**CLIENT:**
```typescript
{
  summary: "Client-focused progress update",
  sections: [
    { heading: "Project Overview", content: "..." },
    { heading: "Deliverables Status", content: "..." },
    { heading: "Milestone Progress", content: "..." },
    { heading: "Timeline Update", content: "..." },
    { heading: "Next Steps", content: "..." },
    { heading: "Questions & Answers", content: "..." }
  ],
  metrics: {
    milestonesCompleted: number,
    deliverablesOnTrack: number,
    scheduledCompletionDate: string
  }
}
```

### Prisma Schema Update

```prisma
model Report {
  id              String @id @default(cuid())
  workspaceId     String @map("workspace_id")
  projectId       String @map("project_id")

  // Report details
  type            ReportType
  stakeholderType StakeholderType? @map("stakeholder_type")
  title           String
  content         Json

  // Generation metadata
  generatedBy     String   @map("generated_by")
  generatedAt     DateTime @default(now()) @map("generated_at")

  // Format
  format          ReportFormat @default(MARKDOWN)

  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")

  @@index([workspaceId, projectId])
  @@index([projectId, generatedAt])
  @@index([type])
  @@index([stakeholderType])
  @@map("reports")
}

enum StakeholderType {
  EXECUTIVE
  TEAM_LEAD
  CLIENT
  GENERAL
}
```

### API Endpoint Updates

```typescript
// POST /api/pm/agents/reports/:projectId/generate
{
  "type": "PROJECT_STATUS" | "HEALTH_REPORT" | "PROGRESS_REPORT",
  "stakeholderType": "EXECUTIVE" | "TEAM_LEAD" | "CLIENT" | "GENERAL",
  "format": "MARKDOWN" | "JSON"
}
```

### Python Tools

```python
# agents/pm/tools/report_tools.py

@tool
def generate_executive_report(
    project_id: str,
    workspace_id: str,
    report_type: str = "PROJECT_STATUS",
    format: str = "MARKDOWN"
) -> Dict[str, Any]:
    """Generate executive summary report with high-level metrics."""
    # Calls API with stakeholderType=EXECUTIVE

@tool
def generate_team_lead_report(
    project_id: str,
    workspace_id: str,
    report_type: str = "PROGRESS_REPORT",
    format: str = "MARKDOWN"
) -> Dict[str, Any]:
    """Generate detailed team lead report with tasks and blockers."""
    # Calls API with stakeholderType=TEAM_LEAD

@tool
def generate_client_report(
    project_id: str,
    workspace_id: str,
    report_type: str = "PROJECT_STATUS",
    format: str = "MARKDOWN"
) -> Dict[str, Any]:
    """Generate client-facing report with sanitized content."""
    # Calls API with stakeholderType=CLIENT
```

---

## Implementation Strategy

### Phase 1: Backend Foundation
1. Update Prisma schema with StakeholderType enum and field
2. Run migration
3. Update GenerateReportDto interface
4. Add StakeholderType enum to report.service.ts

### Phase 2: Report Generation Methods
1. Implement generateExecutiveReport method
2. Implement generateTeamLeadReport method
3. Implement generateClientReport method
4. Update main generateReport method to route based on stakeholderType

### Phase 3: Controller Updates
1. Update generate endpoint to accept stakeholderType
2. Validate stakeholder type parameter
3. Pass stakeholderType to service

### Phase 4: Agent Tools
1. Add generate_executive_report tool
2. Add generate_team_lead_report tool
3. Add generate_client_report tool
4. Update Herald agent instructions

---

## Content Filtering Rules

### Executive Reports
- **Include:** High-level metrics, outcomes, ROI, strategic decisions
- **Exclude:** Individual task details, technical implementation, internal team issues
- **Tone:** Strategic, business-focused, concise

### Team Lead Reports
- **Include:** All task details, blockers, technical notes, capacity, velocity
- **Exclude:** Client-sensitive information, strategic discussions
- **Tone:** Detailed, technical, actionable

### Client Reports
- **Include:** Deliverables, milestones, timeline, business outcomes
- **Exclude:** Internal team details, technical implementation, resource issues
- **Tone:** Professional, outcome-focused, reassuring

---

## Dependencies

### Prerequisites
- PM-05.6 (Herald Report Generation) - Base report infrastructure
- PM-05.4 (Pulse Health Monitoring) - Health data for reports
- PM-02 (Tasks) - Task data for team lead reports

### External Dependencies
- Agno framework (Python agents)
- NestJS (backend API)
- Prisma ORM (database)

---

## Testing Strategy

### Unit Tests

**TypeScript (Backend):**
- Test each stakeholder report generation method
- Test content filtering for each stakeholder type
- Test metric calculation per stakeholder
- Test default stakeholder type (GENERAL)

**Python (Agent Tools):**
- Test each stakeholder tool invocation
- Test API parameter passing
- Test error handling

### Integration Tests
- Test end-to-end report generation for each stakeholder type
- Test report content validation per stakeholder
- Test concurrent report generation with different stakeholders
- Test stakeholder type filtering in report history

### Manual Testing
- Generate executive report and verify content appropriateness
- Generate team lead report and verify detailed information
- Generate client report and verify content sanitization
- Compare reports side-by-side for same project

---

## Security Considerations

- Validate stakeholder type against user permissions
- Ensure client reports truly sanitize internal data
- Audit report access by stakeholder type
- Prevent unauthorized access to detailed reports (e.g., clients viewing team lead reports)

---

## Documentation

- Update Herald agent documentation with stakeholder report capabilities
- Document stakeholder type parameter in API docs
- Add examples of each stakeholder report type
- Create guide for choosing appropriate stakeholder type

---

## Definition of Done

- [ ] Prisma schema updated with stakeholderType
- [ ] Migration created and tested
- [ ] All three stakeholder report methods implemented
- [ ] Controller updated to accept stakeholderType
- [ ] All three agent tools implemented
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Manual testing completed for all stakeholder types
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Type check passes with no errors

---

## Future Enhancements

- Custom stakeholder types per workspace
- Template customization UI
- Stakeholder preferences (preferred metrics, sections)
- Multi-stakeholder reports (combined audiences)
- Report scheduling by stakeholder
- Email templates per stakeholder type

---

**Created:** 2025-12-20
**Last Updated:** 2025-12-20
**Estimated Completion:** TBD
