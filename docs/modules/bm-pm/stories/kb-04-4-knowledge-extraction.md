# Story KB-04.4: Knowledge Extraction

Status: done

## Story

As a Scribe agent,
I want to extract docs from completed tasks,
so that knowledge is captured automatically.

## Acceptance Criteria

1. Given task with significant description/comments completed, when Scribe detects knowledge opportunity, then suggests creating KB page from task content.
2. Draft page is pre-filled with task details for review.
3. Knowledge extraction requires human approval before creation.

## Tasks / Subtasks

- [x] Detect task completion and evaluate content significance (AC: 1)
  - [x] Listen for `pm.task.status_changed` events when status becomes DONE
  - [x] Gather task description/comments and apply significance heuristic
- [x] Generate KB draft suggestion (AC: 1-2)
  - [x] Produce AI draft from task content with clear KB structure
  - [x] Include task metadata in preview data for reviewers
- [x] Route approval request (AC: 3)
  - [x] Create approval item for knowledge extraction (pending review)
  - [x] Avoid duplicate suggestions for the same task
- [x] Tests (AC: 1-3)
  - [x] Event handler tests for DONE tasks with/without meaningful content
  - [x] Approval routing payload includes draft data

## Dev Notes

- Trigger on `EventTypes.PM_TASK_STATUS_CHANGED` and only when `toStatus === DONE`.
- Use `ApprovalRouterService` with type `kb.knowledge_extraction` and `sourceModule: scribe`.
- Keep approval pending (avoid auto-approval) to preserve human review gate.
- Draft content should be based on task description + comments; use AI when available, with a safe fallback template.
- Ensure workspace isolation on task and approval queries.

### Project Structure Notes

- PM task events: `apps/api/src/pm/tasks/tasks.service.ts`
- Event subscribers: `apps/api/src/events/decorators/event-subscriber.decorator.ts`
- KB AI service: `apps/api/src/kb/ai/ai.service.ts`
- Approvals routing: `apps/api/src/approvals/services/approval-router.service.ts`

### References

- `docs/modules/bm-pm/epics/epic-kb-04-ai-native-knowledge-base.md` (Story KB-04.4)
- `docs/modules/bm-pm/PRD.md` (Phase 3 AI-Native KB Features)
- `docs/modules/bm-pm/kb-specification.md` (F8: AI-Native KB)
- `docs/modules/bm-pm/architecture.md` (Knowledge Base & RAG Architecture)
- `docs/sprint-artifacts/tech-spec-epic-kb-04.md` (Knowledge extraction workflow)

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/kb-04-4-knowledge-extraction.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Added knowledge extraction handler for task completion with significance checks and dedupe.  
✅ Added AI draft generation from task content with fallback template.  
✅ Routed extraction suggestions through approvals with preview data and confidence metadata.  
✅ Added handler and AI service tests for extraction flow.

### File List

- `apps/api/src/kb/ai/ai.service.ts`
- `apps/api/src/kb/ai/ai.service.spec.ts`
- `apps/api/src/kb/ai/knowledge-extraction.handler.ts`
- `apps/api/src/kb/ai/knowledge-extraction.handler.spec.ts`
- `apps/api/src/kb/kb.module.ts`
- `apps/api/src/approvals/approvals.service.ts`
- `apps/api/src/approvals/services/approval-router.service.ts`
- `apps/web/src/config/agent-colors.ts`
- `docs/modules/bm-pm/stories/kb-04-4-knowledge-extraction.context.xml`
- `docs/modules/bm-pm/stories/kb-04-4-knowledge-extraction.md`

## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- Task completion handler guards for DONE status, content significance, and duplicate approvals.
- Approval payload includes AI/fallback draft content with task metadata for review.
- Added tests for both AI draft generation and handler behavior.

### Minor Suggestions (Non-blocking)

- Consider supporting bulk task completion events (`taskIds`) if bulk updates are common.
