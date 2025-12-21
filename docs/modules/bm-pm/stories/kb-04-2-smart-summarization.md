# Story KB-04.2: Smart Summarization

Status: done

## Story

As a KB user,
I want AI summaries of long pages,
so that I can quickly understand content.

## Acceptance Criteria

1. Given I view a long page, when I click "Summarize", AI generates a TL;DR summary.
2. The summary can be inserted at the top of the page.
3. The summary includes a key points bullet list.

## Tasks / Subtasks

- [x] Add API support for page summarization (AC: 1-3)
  - [x] Fetch page content and generate summary + key points via AI provider
  - [x] Return structured summary payload
- [x] Add Summarize action in KB editor (AC: 1-3)
  - [x] Trigger summary generation for current page
  - [x] Display summary + key points
  - [x] Insert summary at top of the editor content
- [x] Tests (AC: 1-3)
  - [x] API tests for summary generation
  - [x] UI tests for summary insertion structure

## Dev Notes

- Use existing KB page content (`contentText`) for summarization to avoid re-parsing Tiptap JSON.
- Preserve human approval: summaries should be inserted only when the user clicks insert.
- Summaries should be regenerated when the page content changes (cache invalidation can be added later).

### Project Structure Notes

- API KB AI endpoints: `apps/api/src/kb/ai/*`.
- KB editor: `apps/web/src/components/kb/editor/*`.
- Shared KB types: `packages/shared/src/types/kb.ts`.

### References

- `docs/modules/bm-pm/epics/epic-kb-04-ai-native-knowledge-base.md` (Story KB-04.2)
- `docs/modules/bm-pm/PRD.md` (Phase 3 AI-Native KB Features)
- `docs/modules/bm-pm/kb-specification.md` (F8: AI-Native KB)
- `docs/modules/bm-pm/architecture.md` (Knowledge Base & RAG Architecture)
- `docs/sprint-artifacts/tech-spec-epic-kb-04.md` (Summarization workflow)
- `agents/platform/scribe/tools/analysis_tools.py` (Existing summary logic reference)

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/kb-04-2-smart-summarization.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Added KB AI summary endpoint that returns TL;DR and key points.  
✅ Added Summarize action in the KB editor with insert-at-top flow.  
✅ Extended helper/test coverage for summary node insertion.

### File List

- `apps/api/src/kb/ai/ai.controller.ts`
- `apps/api/src/kb/ai/ai.service.ts`
- `apps/api/src/kb/ai/ai.service.spec.ts`
- `apps/api/src/kb/ai/dto/kb-summary.dto.ts`
- `apps/web/src/components/kb/editor/EditorToolbar.tsx`
- `apps/web/src/components/kb/editor/PageEditor.tsx`
- `apps/web/src/hooks/use-kb-pages.ts`
- `apps/web/src/lib/kb-ai.ts`
- `apps/web/src/lib/kb-ai.test.ts`
- `docs/modules/bm-pm/stories/kb-04-2-smart-summarization.context.xml`
- `docs/modules/bm-pm/stories/kb-04-2-smart-summarization.md`

## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- Summary endpoint enforces workspace scoping and returns structured TL;DR + key points.
- Editor integration keeps summaries user-inserted, preserving human approval.
- Tests cover summary parsing and insertion behavior.

### Minor Suggestions (Non-blocking)

- Consider caching summary results per page version to reduce repeated AI calls.
- Add a simple loading indicator on the editor while summary generation runs.
