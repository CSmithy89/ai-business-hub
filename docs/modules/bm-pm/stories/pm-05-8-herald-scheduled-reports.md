# PM-05.8: Herald Scheduled Reports

**Epic:** PM-05 - AI Team (Scope, Pulse, Herald)
**Story:** PM-05.8 - Herald Agent for Scheduled Report Generation
**Type:** Feature
**Points:** 5
**Status:** In Progress

---

## User Story

**As a** project lead
**I want** automated scheduled report generation
**So that** stakeholders receive regular project updates without manual effort

---

## Acceptance Criteria

### 1. Report Scheduling Model

- [ ] ReportSchedule model created in Prisma schema
- [ ] ReportFrequency enum defined (DAILY, WEEKLY, BIWEEKLY, MONTHLY)
- [ ] Schedule includes: projectId, frequency, reportType, stakeholderType, enabled flag
- [ ] Schedule tracks lastRun and nextRun timestamps
- [ ] Proper indexes on workspaceId, projectId, enabled, nextRun

### 2. Schedule Management Service

- [ ] ScheduledReportService created with CRUD operations
- [ ] createSchedule method validates input and sets nextRun
- [ ] updateSchedule method recalculates nextRun if frequency changes
- [ ] deleteSchedule method (soft delete or hard delete)
- [ ] listSchedules method with filtering by project/workspace
- [ ] getSchedule method to retrieve single schedule
- [ ] enableSchedule/disableSchedule toggle methods

### 3. Cron Job for Automated Generation

- [ ] ScheduledReportCron created with daily cron schedule
- [ ] Checks for schedules where nextRun <= now and enabled = true
- [ ] Uses existing ReportService to generate reports
- [ ] Updates lastRun and calculates new nextRun after generation
- [ ] Handles errors gracefully (logs but continues with other schedules)
- [ ] Supports all ReportFrequency types
- [ ] Sends notifications when reports are generated (optional)

### 4. API Endpoints

- [ ] POST /pm/agents/reports/schedules - Create new schedule
- [ ] GET /pm/agents/reports/schedules - List schedules for project
- [ ] GET /pm/agents/reports/schedules/:id - Get single schedule
- [ ] PUT /pm/agents/reports/schedules/:id - Update schedule
- [ ] DELETE /pm/agents/reports/schedules/:id - Delete schedule
- [ ] PATCH /pm/agents/reports/schedules/:id/toggle - Enable/disable schedule

### 5. Integration

- [ ] ScheduledReportController added to agents module
- [ ] ScheduledReportService added to agents module providers
- [ ] ScheduledReportCron registered in agents module
- [ ] All services properly injected with dependencies
- [ ] TypeScript type check passes

---

## Technical Details

### Prisma Schema

```prisma
/// ReportSchedule - Automated report generation schedule
model ReportSchedule {
  id              String @id @default(cuid())
  workspaceId     String @map("workspace_id")
  projectId       String @map("project_id")

  // Schedule configuration
  frequency       ReportFrequency
  reportType      ReportType
  stakeholderType StakeholderType? @map("stakeholder_type")
  enabled         Boolean @default(true)

  // Schedule tracking
  lastRun         DateTime? @map("last_run")
  nextRun         DateTime  @map("next_run")

  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  // Relations
  project         Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
  @@index([projectId])
  @@index([enabled, nextRun])
  @@index([workspaceId, projectId])
  @@map("report_schedules")
}

enum ReportFrequency {
  DAILY
  WEEKLY
  BIWEEKLY
  MONTHLY
}
```

### ScheduledReportService Methods

```typescript
class ScheduledReportService {
  async createSchedule(
    workspaceId: string,
    projectId: string,
    dto: CreateScheduleDto,
  ): Promise<ReportSchedule>;

  async updateSchedule(
    workspaceId: string,
    scheduleId: string,
    dto: UpdateScheduleDto,
  ): Promise<ReportSchedule>;

  async deleteSchedule(
    workspaceId: string,
    scheduleId: string,
  ): Promise<void>;

  async listSchedules(
    workspaceId: string,
    projectId?: string,
  ): Promise<ReportSchedule[]>;

  async getSchedule(
    workspaceId: string,
    scheduleId: string,
  ): Promise<ReportSchedule>;

  async toggleSchedule(
    workspaceId: string,
    scheduleId: string,
    enabled: boolean,
  ): Promise<ReportSchedule>;

  // Internal helper
  calculateNextRun(
    frequency: ReportFrequency,
    lastRun?: Date,
  ): Date;
}
```

### DTOs

```typescript
export interface CreateScheduleDto {
  frequency: ReportFrequency;
  reportType: ReportType;
  stakeholderType?: StakeholderType;
}

export interface UpdateScheduleDto {
  frequency?: ReportFrequency;
  reportType?: ReportType;
  stakeholderType?: StakeholderType;
  enabled?: boolean;
}
```

### Cron Job Logic

```typescript
@Injectable()
export class ScheduledReportCron {
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runScheduledReports(): Promise<void> {
    // 1. Find all schedules where nextRun <= now AND enabled = true
    const dueSchedules = await this.findDueSchedules();

    // 2. For each schedule:
    for (const schedule of dueSchedules) {
      try {
        // a. Generate report using ReportService
        await this.reportService.generateReport(
          schedule.workspaceId,
          schedule.projectId,
          'herald_agent', // System user
          {
            type: schedule.reportType,
            stakeholderType: schedule.stakeholderType,
          },
        );

        // b. Update lastRun and calculate nextRun
        await this.updateScheduleAfterRun(schedule);
      } catch (error) {
        // c. Log error but continue with other schedules
        this.logger.error(`Failed to generate scheduled report for ${schedule.id}`, error);
      }
    }
  }
}
```

### Next Run Calculation

```typescript
calculateNextRun(frequency: ReportFrequency, lastRun?: Date): Date {
  const now = lastRun || new Date();
  const next = new Date(now);

  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
  }

  return next;
}
```

---

## Implementation Strategy

### Phase 1: Database Schema
1. Add ReportSchedule model to schema.prisma
2. Add ReportFrequency enum
3. Run Prisma migration
4. Verify schema changes

### Phase 2: Service Layer
1. Create scheduled-report.service.ts
2. Implement CRUD methods
3. Implement nextRun calculation logic
4. Add validation and error handling

### Phase 3: Cron Job
1. Create scheduled-report.cron.ts
2. Implement daily cron job
3. Add logic to find due schedules
4. Integrate with ReportService
5. Add error handling and logging

### Phase 4: API Layer
1. Create scheduled-report.controller.ts
2. Implement all REST endpoints
3. Add request validation
4. Add authorization checks

### Phase 5: Module Integration
1. Update agents.module.ts
2. Register service, cron, and controller
3. Verify dependency injection
4. Run type check

---

## API Endpoints

### Create Schedule
```http
POST /api/pm/agents/reports/schedules
Content-Type: application/json

{
  "projectId": "proj_123",
  "frequency": "WEEKLY",
  "reportType": "PROJECT_STATUS",
  "stakeholderType": "EXECUTIVE"
}

Response 201:
{
  "schedule": {
    "id": "sched_123",
    "workspaceId": "ws_123",
    "projectId": "proj_123",
    "frequency": "WEEKLY",
    "reportType": "PROJECT_STATUS",
    "stakeholderType": "EXECUTIVE",
    "enabled": true,
    "lastRun": null,
    "nextRun": "2025-12-27T00:00:00Z",
    "createdAt": "2025-12-20T00:00:00Z",
    "updatedAt": "2025-12-20T00:00:00Z"
  }
}
```

### List Schedules
```http
GET /api/pm/agents/reports/schedules?projectId=proj_123

Response 200:
{
  "schedules": [
    { "id": "sched_123", ... },
    { "id": "sched_456", ... }
  ],
  "total": 2
}
```

### Update Schedule
```http
PUT /api/pm/agents/reports/schedules/sched_123
Content-Type: application/json

{
  "frequency": "MONTHLY",
  "enabled": false
}

Response 200:
{
  "schedule": { "id": "sched_123", ... }
}
```

### Delete Schedule
```http
DELETE /api/pm/agents/reports/schedules/sched_123

Response 204 No Content
```

### Toggle Schedule
```http
PATCH /api/pm/agents/reports/schedules/sched_123/toggle
Content-Type: application/json

{
  "enabled": false
}

Response 200:
{
  "schedule": { "id": "sched_123", "enabled": false, ... }
}
```

---

## Dependencies

### Prerequisites
- PM-05.6 (Herald Report Generation) - Base report service
- PM-05.7 (Herald Stakeholder Reports) - Stakeholder-specific reports
- NestJS Schedule module (already registered globally)
- Prisma ORM

### External Dependencies
- @nestjs/schedule (for cron jobs)
- Prisma Client (for database operations)

---

## Testing Strategy

### Unit Tests

**ScheduledReportService:**
- Test createSchedule with various frequencies
- Test updateSchedule recalculates nextRun correctly
- Test deleteSchedule removes schedule
- Test listSchedules filtering
- Test calculateNextRun for all frequency types
- Test toggleSchedule

**ScheduledReportCron:**
- Test findDueSchedules query logic
- Test report generation for due schedules
- Test lastRun/nextRun update after generation
- Test error handling (one failure doesn't stop others)

### Integration Tests
- Create schedule and verify nextRun calculation
- Trigger cron job manually and verify reports generated
- Update schedule frequency and verify nextRun recalculated
- Disable schedule and verify cron skips it
- Delete schedule and verify cascade behavior

### Manual Testing
- Create daily, weekly, and monthly schedules
- Wait for cron to run (or trigger manually)
- Verify reports generated in Report table
- Verify lastRun and nextRun updated
- Disable schedule and verify no reports generated

---

## Security Considerations

- Validate workspace/project access before creating schedules
- Ensure only workspace members can create/modify schedules
- Prevent excessive schedule creation (rate limiting)
- Validate frequency and reportType enums
- Audit log for schedule changes (optional)

---

## Future Enhancements

- Email notifications when scheduled reports are generated
- Custom delivery times (e.g., "every Monday at 9am")
- Retry logic for failed report generation
- Report delivery to specific stakeholders
- Webhook integration for report generation events
- Schedule templates for quick setup
- Batch schedule creation for multiple projects

---

## Definition of Done

- [ ] Prisma schema updated with ReportSchedule and ReportFrequency
- [ ] Migration created and applied
- [ ] ScheduledReportService fully implemented
- [ ] ScheduledReportCron fully implemented
- [ ] ScheduledReportController fully implemented
- [ ] All endpoints working and tested
- [ ] agents.module.ts updated with new components
- [ ] TypeScript type check passes
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] Documentation updated

---

**Created:** 2025-12-20
**Last Updated:** 2025-12-20
**Estimated Completion:** TBD
