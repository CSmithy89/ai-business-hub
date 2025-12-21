# Story KB-04.3: Q&A Chat Interface

Status: done

## Story

As a KB user,
I want to chat with the KB,
so that I can ask questions naturally.

## Acceptance Criteria

1. Given I open KB chat, when I ask a question, AI answers using KB content.
2. Responses include source citations with links.
3. Follow-up questions maintain context.
4. If no relevant content is found, the system responds with "Not found".

## Tasks / Subtasks

- [x] Add KB ask endpoint for Q&A (AC: 1-4)
  - [x] Retrieve RAG context and citations for the question
  - [x] Generate answer via AI provider using RAG context and conversation history
  - [x] Return answer, sources, and confidence
- [x] Add KB chat UI (AC: 1-3)
  - [x] Build chat page with message history
  - [x] Send prior messages as conversation context
  - [x] Render citations with links to KB pages
- [x] Tests (AC: 1-4)
  - [x] API tests for Q&A responses and "Not found" fallback
  - [x] UI tests for citation rendering and history handling

## Dev Notes

- Reuse `RagService.query` for retrieval and citation metadata.
- Keep conversation context in the client and pass it to the API for follow-ups.
- Ensure human approval is preserved for any content insertion (Q&A is read-only).

### Project Structure Notes

- API KB AI endpoints: `apps/api/src/kb/ai/*` and `/api/kb/ask` for Scribe tool compatibility.
- KB UI routes live in `apps/web/src/app/(dashboard)/kb/*`.

### References

- `docs/modules/bm-pm/epics/epic-kb-04-ai-native-knowledge-base.md` (Story KB-04.3)
- `docs/modules/bm-pm/PRD.md` (Phase 3 AI-Native KB Features)
- `docs/modules/bm-pm/kb-specification.md` (F8: AI-Native KB)
- `docs/modules/bm-pm/architecture.md` (Knowledge Base & RAG Architecture)
- `docs/sprint-artifacts/tech-spec-epic-kb-04.md` (Q&A chat workflow)

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/kb-04-3-qa-chat-interface.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Added KB ask endpoint returning answer, sources, and confidence with RAG context.  
✅ Added KB chat page with conversation history and citation rendering.  
✅ Added API and UI tests covering Q&A responses and fallback behavior.

### File List

- `apps/api/src/kb/ai/ask.controller.ts`
- `apps/api/src/kb/ai/ai.service.ts`
- `apps/api/src/kb/ai/ai.service.spec.ts`
- `apps/api/src/kb/ai/dto/kb-ask.dto.ts`
- `apps/api/src/kb/kb.module.ts`
- `apps/web/src/app/(dashboard)/kb/chat/page.tsx`
- `apps/web/src/app/(dashboard)/kb/chat/page.test.tsx`
- `apps/web/src/components/kb/KBHome.tsx`
- `apps/web/src/hooks/use-kb-pages.ts`
- `docs/modules/bm-pm/stories/kb-04-3-qa-chat-interface.context.xml`
- `docs/modules/bm-pm/stories/kb-04-3-qa-chat-interface.md`

## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- Ask endpoint uses RAG context with citations and returns a clear "Not found" fallback.
- Chat UI keeps conversation history and renders source links consistently.
- Tests cover both answer flow and fallback behavior.

### Minor Suggestions (Non-blocking)

- Consider trimming or summarizing long history payloads to reduce token usage.
- Add optional rate limiting for the ask endpoint if usage grows.
