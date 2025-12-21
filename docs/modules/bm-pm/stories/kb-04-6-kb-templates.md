# Story KB-04.6: KB Templates

Status: done

## Story

As a KB user,
I want page templates,
so that I create consistent documentation.

## Acceptance Criteria

1. Given I create new page, when I select template, then page pre-filled with structure, headings, placeholder content.
2. Templates include Meeting Notes, Decision Record, Process Doc, and Technical Spec.
3. Users can create custom templates.

## Tasks / Subtasks

- [x] Add template support in KB API (AC: 1-3)
  - [x] Store templates as KB pages flagged as templates
  - [x] Provide endpoints to list and create templates
  - [x] Exclude templates from normal KB listings/search
- [x] Add template selection in KB UI (AC: 1-2)
  - [x] Render built-in templates and custom templates in create flow
  - [x] Create page with template content
- [x] Add "Save as template" action (AC: 3)
  - [x] Allow users to save current page content as a template
- [x] Tests (AC: 1-3)
  - [x] Service tests for templates or template listing

## Dev Notes

- Default templates must include the four required types.
- Templates should not appear in KB page navigation/search.
- Keep template content as Tiptap JSON with placeholder text.

### Project Structure Notes

- KB pages: `apps/api/src/kb/pages/*`
- KB templates: `apps/api/src/kb/templates/*`
- KB create page UI: `apps/web/src/app/(dashboard)/kb/new/page.tsx`

### References

- `docs/modules/bm-pm/epics/epic-kb-04-ai-native-knowledge-base.md` (Story KB-04.6)
- `docs/sprint-artifacts/tech-spec-epic-kb-04.md` (KB Templates workflow)

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/kb-04-6-kb-templates.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Added KB templates API with built-in templates and custom template creation.  
✅ Added template selection to the KB create flow with pre-filled content.  
✅ Added save-as-template action on KB pages.  
✅ Added template service tests and excluded templates from KB listings/search.

### File List

- `packages/db/prisma/schema.prisma`
- `apps/api/src/kb/ai/ai.service.ts`
- `apps/api/src/kb/analysis/analysis.service.ts`
- `apps/api/src/kb/kb.module.ts`
- `apps/api/src/kb/pages/dto/create-page.dto.ts`
- `apps/api/src/kb/pages/dto/list-pages.query.dto.ts`
- `apps/api/src/kb/pages/pages.service.ts`
- `apps/api/src/kb/rag/rag.service.ts`
- `apps/api/src/kb/search/search.service.ts`
- `apps/api/src/kb/templates/templates.constants.ts`
- `apps/api/src/kb/templates/templates.controller.ts`
- `apps/api/src/kb/templates/templates.service.ts`
- `apps/api/src/kb/templates/templates.service.spec.ts`
- `apps/api/src/kb/templates/dto/create-template.dto.ts`
- `apps/api/src/kb/verification/verification.service.ts`
- `apps/web/src/app/(dashboard)/kb/new/page.tsx`
- `apps/web/src/app/(dashboard)/kb/[slug]/page.tsx`
- `apps/web/src/hooks/use-kb-pages.ts`
- `docs/modules/bm-pm/stories/kb-04-6-kb-templates.context.xml`
- `docs/modules/bm-pm/stories/kb-04-6-kb-templates.md`

## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- Built-in templates cover the required types with structured placeholder content.
- Templates are excluded from KB listings and search to keep navigation clean.
- Create flow and save-as-template action cover both built-in and custom templates.

### Minor Suggestions (Non-blocking)

- Consider a lightweight templates management page for editing/removal later.
