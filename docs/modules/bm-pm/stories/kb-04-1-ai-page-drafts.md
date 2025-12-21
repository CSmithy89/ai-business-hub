# Story KB-04.1: AI Page Drafts

Status: done

## Story

As a KB user,
I want AI to draft pages from context,
so that documentation is faster to create.

## Acceptance Criteria

1. Given I click "AI Draft" and describe what I need, Scribe generates a page draft.
2. The draft appears in the editor for review and edit before publishing.
3. Drafts include source citations when based on existing KB content.

## Tasks / Subtasks

- [x] Implement AI draft request flow in the API (AC: 1, 3)
  - [x] Define request/response DTOs for draft generation (prompt + citations)
  - [x] Generate draft content via AI provider with workspace-scoped context
  - [x] Return draft content plus citation metadata
- [x] Add "AI Draft" entry point in KB editor or Scribe panel (AC: 1, 2)
  - [x] Capture user intent prompt
  - [x] Insert draft into editor without auto-publish
  - [x] Render citations with links to KB pages
- [x] Tests (AC: 1-3)
  - [x] API tests for draft service (mocked provider and RAG)
  - [x] UI tests for draft-to-editor conversion

## Dev Notes

- Scribe tools already cover RAG queries and summarization; draft generation should preserve the "suggestion only" requirement and require human approval.
- RAG scoring already boosts verified pages; reuse citations from `RagService` to show sources.
- KB editor uses Tiptap + Yjs; draft insertion should not conflict with auto-save or collaboration state.

### Project Structure Notes

- API KB domain: `apps/api/src/kb/*` (pages, search, rag, verification, embeddings).
- Agent runtime: `agents/platform/scribe/*` and AgentOS bridge in `apps/api/src/agentos/*`.
- KB UI: `apps/web/src/components/kb/*` and editor in `apps/web/src/components/kb/editor/*`.

### References

- `docs/modules/bm-pm/epics/epic-kb-04-ai-native-knowledge-base.md` (Story KB-04.1)
- `docs/modules/bm-pm/PRD.md` (Phase 3 AI-Native KB Features)
- `docs/modules/bm-pm/kb-specification.md` (F8: AI-Native KB)
- `docs/modules/bm-pm/architecture.md` (Knowledge Base & RAG Architecture)
- `docs/sprint-artifacts/tech-spec-epic-kb-04.md` (Epic KB-04 Tech Spec)
- `agents/platform/scribe/prompts/scribe_system.md` (Scribe approval constraints)
- `agents/platform/scribe/tools/rag_tools.py` (RAG queries + citations)
- `apps/api/src/kb/rag/rag.service.ts` (RAG results and citations)
- `apps/web/src/components/kb/editor/PageEditor.tsx` (Editor integration)

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/kb-04-1-ai-page-drafts.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Added KB AI draft endpoint backed by RAG context and AI provider completions.  
✅ Wired an AI Draft dialog into the KB editor with draft insertion and citations display.  
✅ Added backend and frontend unit tests for draft generation and text-to-editor conversion.

### File List

- `apps/api/src/kb/ai/ai.controller.ts`
- `apps/api/src/kb/ai/ai.service.ts`
- `apps/api/src/kb/ai/ai.service.spec.ts`
- `apps/api/src/kb/ai/dto/kb-draft.dto.ts`
- `apps/api/src/kb/kb.errors.ts`
- `apps/api/src/kb/kb.module.ts`
- `apps/web/src/components/kb/editor/EditorToolbar.tsx`
- `apps/web/src/components/kb/editor/PageEditor.tsx`
- `apps/web/src/hooks/use-kb-pages.ts`
- `apps/web/src/lib/kb-ai.ts`
- `apps/web/src/lib/kb-ai.test.ts`
- `docs/modules/bm-pm/stories/kb-04-1-ai-page-drafts.context.xml`

## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- Draft generation reuses RAG context for citations and keeps human review in the editor.
- API and UI changes are scoped to KB modules with workspace isolation preserved.
- Tests cover draft service behavior and draft-to-editor conversion.

### Minor Suggestions (Non-blocking)

- Consider adding basic rate limiting or debounce on draft requests if usage spikes.
- Evaluate whether draft insertion should warn before overwriting non-empty pages.
