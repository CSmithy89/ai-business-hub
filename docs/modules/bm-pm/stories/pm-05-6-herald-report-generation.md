# PM-05.6: Herald Report Generation

**Epic:** PM-05 - AI Team (Scope, Pulse, Herald)
**Story:** PM-05.6 - Herald Agent for Automated Report Generation
**Type:** Feature
**Points:** 5
**Status:** Ready for Dev

---

## User Story

**As a** project manager
**I want** AI-generated reports for standups, sprints, and stakeholder updates
**So that** I can save time on report generation and maintain consistent communication

---

## Acceptance Criteria

### 1. Herald Agent Implementation

- [ ] Herald agent created in `agents/pm/herald.py` following Agno framework
- [ ] Agent has clear instructions for report generation
- [ ] Agent integrated into PM team in `agents/pm/team.py`
- [ ] Agent supports multiple report types: project_status, health_report, progress_report

### 2. Report Generation Tools

- [ ] `generate_project_report` tool implemented
- [ ] `generate_health_report` tool implemented
- [ ] `generate_progress_report` tool implemented
- [ ] Tools call backend API endpoints with proper authentication
- [ ] Tools handle errors gracefully and return structured data

### 3. Backend Report Service

- [ ] `ReportService` created at `apps/api/src/pm/agents/report.service.ts`
- [ ] `generateReport` method creates reports with structured content
- [ ] `getReportHistory` method retrieves past reports
- [ ] Report templates defined for different report types
- [ ] Reports stored in database with proper metadata

### 4. Backend Report Controller

- [ ] `ReportController` created at `apps/api/src/pm/agents/report.controller.ts`
- [ ] `POST /pm/agents/reports/:projectId/generate` endpoint implemented
- [ ] `GET /pm/agents/reports/:projectId` endpoint implemented
- [ ] `GET /pm/agents/reports/:projectId/:reportId` endpoint implemented
- [ ] Endpoints enforce workspace/tenant isolation
- [ ] Endpoints validate user permissions

### 5. Data Model

- [ ] Report model added to Prisma schema if not already present
- [ ] Model includes: id, projectId, type, format, content, generatedAt, generatedBy
- [ ] Proper indexes for performance (projectId, generatedAt)
- [ ] Multi-tenant isolation enforced

### 6. Report Formats

- [ ] Reports generated in JSON format (structured data)
- [ ] Reports include markdown-formatted content for display
- [ ] Content supports PDF-ready markdown (for future PDF export)
- [ ] Reports include metadata (generation time, agent version, etc.)

---

## Technical Details

### Herald Agent Configuration

```python
# agents/pm/herald.py

HERALD_INSTRUCTIONS = [
    "You are Herald, the automated reporting specialist for HYVVE projects.",
    "Generate clear, concise reports for different audiences.",
    "Report types:",
    "  • Project Status: Current state, progress, key metrics",
    "  • Health Report: Health score analysis, risks, recommendations",
    "  • Progress Report: Completed work, upcoming tasks, timeline",
    "Use project data to generate accurate, data-driven reports.",
    "Structure reports with clear sections and bullet points.",
    "Include relevant metrics (velocity, completion %, time spent).",
    "Highlight blockers and risks prominently.",
    "Provide actionable next steps.",
]
```

### Report Structure

```typescript
interface Report {
  id: string;
  workspaceId: string;
  projectId: string;
  type: 'PROJECT_STATUS' | 'HEALTH_REPORT' | 'PROGRESS_REPORT';
  title: string;
  content: {
    summary: string;
    sections: {
      heading: string;
      content: string; // Markdown
    }[];
    metrics?: Record<string, any>;
  };
  format: 'MARKDOWN' | 'JSON';
  generatedBy: string; // 'herald_agent' or user ID
  generatedAt: Date;
}
```

### API Endpoints

```typescript
// POST /api/pm/agents/reports/:projectId/generate
{
  "type": "PROJECT_STATUS" | "HEALTH_REPORT" | "PROGRESS_REPORT",
  "format": "MARKDOWN" | "JSON"
}

// Response
{
  "report": Report
}

// GET /api/pm/agents/reports/:projectId?type=PROJECT_STATUS&limit=10
// Returns array of reports

// GET /api/pm/agents/reports/:projectId/:reportId
// Returns single report with full content
```

---

## Implementation Notes

### Report Generation Flow

1. User requests report via Herald agent or API
2. Backend validates permissions and project access
3. ReportService gathers project data (tasks, phases, health scores)
4. Service generates structured report content
5. Report stored in database
6. Report returned to user

### Report Content Templates

**Project Status Report:**
- Executive summary
- Current phase progress
- Task breakdown by status
- Key metrics (completion %, velocity)
- Upcoming milestones

**Health Report:**
- Overall health score and level
- Health factors breakdown
- Active risks and severity
- Team capacity status
- Recommendations for improvement

**Progress Report:**
- Completed work since last report
- Work in progress
- Upcoming priorities
- Blockers and dependencies
- Timeline status

### Performance Considerations

- Report generation should complete within 5 seconds
- Cache project data during generation to minimize queries
- Limit report history queries (default: last 30 days)
- Index reports by projectId and generatedAt for fast retrieval

---

## Dependencies

### Prerequisites
- PM-01 (Projects, Phases) - Report data source
- PM-02 (Tasks) - Task data for reports
- PM-05.4 (Pulse Health Monitoring) - Health data for health reports

### External Dependencies
- Agno framework (Python agents)
- NestJS (backend API)
- Prisma ORM (database)

---

## Testing Strategy

### Unit Tests

**Python (Herald Agent):**
- Test report tool invocations
- Test error handling for API failures
- Test report content generation

**TypeScript (Backend):**
- Test ReportService.generateReport with different types
- Test report history retrieval
- Test report template rendering
- Test multi-tenant isolation

### Integration Tests

- Test end-to-end report generation via API
- Test report storage and retrieval
- Test permission enforcement
- Test concurrent report generation

### Manual Testing

- Generate each report type via agent chat
- Verify report content accuracy
- Verify markdown formatting
- Verify report history display

---

## Security Considerations

- Validate workspace/tenant isolation for all report queries
- Ensure only authorized users can generate/view reports
- Sanitize report content to prevent XSS attacks
- Rate limit report generation to prevent abuse

---

## Documentation

- Update PM agent documentation with Herald capabilities
- Document report API endpoints in API docs
- Add examples of report formats to technical docs
- Update user guide with report generation instructions

---

## Definition of Done

- [ ] Herald agent implemented and integrated into PM team
- [ ] All report tools implemented and tested
- [ ] Backend service and controller implemented
- [ ] All API endpoints working and tested
- [ ] Report model added to schema and migrated
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Type check passes with no errors

---

## Notes

- PDF export functionality deferred to future story (Phase 2)
- Scheduled/recurring reports deferred to future story
- Email delivery of reports deferred to future story
- Focus on core report generation and storage for MVP

---

**Created:** 2025-12-20
**Last Updated:** 2025-12-20
**Estimated Completion:** TBD
