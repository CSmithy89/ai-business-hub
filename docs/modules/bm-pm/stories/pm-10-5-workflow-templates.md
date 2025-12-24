# Story PM-10-5: Workflow Templates & Management

**Epic:** PM-10 - Workflow Builder
**Module:** Core-PM (bm-pm)
**Status:** done
**Created:** 2025-12-24
**Story Points:** 5

---

## User Story

**As a** project manager,
**I want** workflow templates and management controls,
**So that** I can quickly create common automations and manage workflow lifecycle.

---

## Acceptance Criteria

### Workflow Templates

**Given** I want to create a new workflow
**When** I click "Create Workflow"
**Then** I can choose from pre-built templates or start blank

**And** available templates include:
- Task Assignment on Status Change
- Due Date Reminder Notification
- Auto-close Stale Tasks
- Escalation on Overdue
- Phase Transition Automation

**And** templates pre-populate nodes and connections

**And** I can customize template after selection

### Workflow Management

**Given** I have workflows in my project
**When** I view the workflow list
**Then** I see status, trigger type, last run, and execution count

**And** I can activate/pause workflows

**And** I can view execution history for each workflow

**And** I can filter and sort the list

**And** I can retry failed executions

---

## Technical Implementation Details

### Overview

This story adds workflow templates for common automation patterns and completes the workflow management features including execution history viewing and lifecycle controls.

### Workflow Templates

Pre-built templates stored as JSON definitions:

```typescript
interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'assignment' | 'notification' | 'lifecycle' | 'escalation';
  definition: WorkflowDefinition;
  icon: string;
}
```

**Template Categories:**
1. **Assignment** - Auto-assign based on conditions
2. **Notification** - Alerts and reminders
3. **Lifecycle** - Status and phase transitions
4. **Escalation** - Overdue handling

### Backend Endpoints

```
GET /pm/workflow-templates - List available templates
POST /pm/workflows/from-template - Create workflow from template

POST /pm/workflows/:id/activate - Activate workflow
POST /pm/workflows/:id/pause - Pause workflow

GET /pm/workflows/:id/executions - List executions (paginated)
POST /pm/workflow-executions/:id/retry - Retry failed execution
```

### Frontend Components

1. **WorkflowTemplateGallery** - Grid of template cards
2. **WorkflowManagementList** - Enhanced list with filters
3. **ExecutionHistoryPanel** - Paginated execution logs
4. **WorkflowStatusToggle** - Activate/pause switch

### Files to Create/Modify

**Backend:**
- `apps/api/src/pm/workflows/workflow-templates.ts` - Template definitions
- `apps/api/src/pm/workflows/workflows.controller.ts` - Add endpoints
- `apps/api/src/pm/workflows/workflows.service.ts` - Add methods

**Frontend:**
- `apps/web/src/components/pm/workflows/WorkflowTemplateGallery.tsx`
- `apps/web/src/components/pm/workflows/ExecutionHistoryPanel.tsx`
- `apps/web/src/components/pm/workflows/WorkflowStatusToggle.tsx`
- Update workflow list page with management features

---

## Definition of Done

- [ ] 5 pre-built workflow templates implemented
- [ ] Template gallery UI with category filtering
- [ ] Create from template functionality
- [ ] Activate/pause workflow controls
- [ ] Execution history viewer with pagination
- [ ] Retry failed execution functionality
- [ ] All TypeScript types properly defined

---

## Dependencies

- PM-10-1: Workflow Canvas (provides workflow structure)
- PM-10-2: Trigger Conditions (provides trigger types)
- PM-10-3: Action Library (provides action types)
- PM-10-4: Workflow Testing (provides execution trace)

---

## Notes

- Templates should cover the most common PM automation patterns
- Template definitions are static (not user-editable templates)
- Execution history should show enough detail to debug issues
- Retry should re-run with same trigger data
