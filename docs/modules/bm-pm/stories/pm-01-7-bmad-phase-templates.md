# Story PM-01.7: BMAD Phase Templates

Status: done

## Story

As a project creator,
I want pre-configured phase templates,
so that I get a structured starting point.

## Acceptance Criteria

1. Given I select a BMAD template during project creation  
   When the project is created  
   Then phases are auto-generated (Course: 7 BUILD + 3 OPERATE phases)
2. And Kanban-Only template creates a single "Backlog" phase
3. And each generated phase includes suggested task templates (stored as phase description text for MVP)

## Tasks / Subtasks

- [x] Define phase templates (Course + Kanban-only) (AC: 1,2,3)
- [x] Seed phases when creating a project with template selected (AC: 1,2)
- [x] Add unit tests to validate phase seeding behavior (AC: 1,2)

## Dev Notes

- The existing project create flow already stores `bmadTemplateId`; this story uses it to seed phases.
- For MVP, "suggested task templates" are stored as markdown text in `Phase.description` until Task templates are implemented in PM-02.

### References

- `docs/modules/bm-pm/epics/epic-pm-01-project-phase-management.md` (Story PM-01.7)

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/pm-01-7-bmad-phase-templates.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Added server-side phase templates for `bmad-course` and `kanban-only`, including suggested task templates in phase descriptions.  
✅ Automatically seeds phases on project creation when a template is selected, with the first phase set to `CURRENT`.  
✅ Added unit tests validating phase seeding behavior for both templates.

### File List

- `apps/api/src/pm/templates/bmad-phase-templates.ts`
- `apps/api/src/pm/projects/projects.service.ts`
- `apps/api/src/pm/projects/projects.service.spec.ts`
- `docs/modules/bm-pm/sprint-status.yaml`
- `docs/modules/bm-pm/stories/pm-01-7-bmad-phase-templates.md`
- `docs/modules/bm-pm/stories/pm-01-7-bmad-phase-templates.context.xml`

## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- Template seeding happens transactionally during project creation, keeping project/team/phases consistent.
- Tests cover both templates and verify the first phase becomes `CURRENT`, matching typical project start expectations.

### Minor Suggestions (Non-blocking)

- Consider emitting a single “phases seeded” domain event in the future if downstream systems need to react without relying on polling.

