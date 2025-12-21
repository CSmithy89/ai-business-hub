# Story KB-04.5: Gap Detection

Status: done

## Story

As a KB admin,
I want AI to identify documentation gaps,
so that I know what's missing.

## Acceptance Criteria

1. Given I run gap analysis, when Scribe analyzes, then shows: topics mentioned but not documented, frequently asked but no page, outdated pages (based on product changes).
2. Gap analysis output includes suggestions for new pages.

## Tasks / Subtasks

- [x] Add gap analysis API (AC: 1-2)
  - [x] Analyze recent tasks for missing topics and frequent questions
  - [x] Include outdated pages using stale verification checks
  - [x] Return suggestions for new pages
- [x] Add gap analysis UI (AC: 1-2)
  - [x] Provide a "Run Analysis" action
  - [x] Render missing topics, questions, outdated pages, and suggestions
- [x] Tests (AC: 1-2)
  - [x] Service tests for gap detection output

## Dev Notes

- Admin-only gap analysis endpoint under KB analysis namespace.
- Use task title/description heuristics for topics and questions; avoid heavy NLP.
- Reuse stale page detection for outdated content.
- Keep responses workspace-scoped and deterministic.

### Project Structure Notes

- KB module: `apps/api/src/kb/*`
- Verification service: `apps/api/src/kb/verification/verification.service.ts`
- KB UI components: `apps/web/src/components/kb/*`

### References

- `docs/modules/bm-pm/epics/epic-kb-04-ai-native-knowledge-base.md` (Story KB-04.5)
- `docs/modules/bm-pm/PRD.md` (Phase 3 AI-Native KB Features)
- `docs/modules/bm-pm/kb-specification.md` (F8: AI-Native KB)
- `docs/sprint-artifacts/tech-spec-epic-kb-04.md` (Gap detection workflow)

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/kb-04-5-gap-detection.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Added KB gap analysis endpoint with lightweight heuristics and stale page inclusion.  
✅ Added admin UI to run analysis and display missing topics, questions, outdated pages, and suggestions.  
✅ Added service unit tests for gap analysis output.

### File List

- `apps/api/src/kb/analysis/analysis.controller.ts`
- `apps/api/src/kb/analysis/analysis.service.ts`
- `apps/api/src/kb/analysis/analysis.service.spec.ts`
- `apps/api/src/kb/analysis/dto/gap-analysis.query.dto.ts`
- `apps/api/src/kb/kb.module.ts`
- `apps/web/src/components/kb/GapAnalysisDashboard.tsx`
- `apps/web/src/hooks/use-gap-analysis.ts`
- `apps/web/src/app/kb/gaps/page.tsx`
- `apps/web/src/components/kb/KBHome.tsx`
- `docs/modules/bm-pm/stories/kb-04-5-gap-detection.context.xml`
- `docs/modules/bm-pm/stories/kb-04-5-gap-detection.md`

## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- Gap analysis uses lightweight, deterministic heuristics with admin-only access.
- Outdated pages reuse existing stale verification checks for consistency.
- UI surfaces all required outputs and includes a run action with summary counts.

### Minor Suggestions (Non-blocking)

- Consider supporting a configurable task lookback window in the UI.
