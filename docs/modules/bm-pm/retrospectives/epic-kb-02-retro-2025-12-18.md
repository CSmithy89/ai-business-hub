# Epic KB-02 Retrospective: KB Real-Time & RAG

**Epic:** KB-02 (KB Real-Time & RAG)  
**PRs:** https://github.com/CSmithy89/ai-business-hub/pull/21, https://github.com/CSmithy89/ai-business-hub/pull/23  
**Date:** 2025-12-18  
**Facilitator:** Bob (Scrum Master)

## Participants

- chris (Project Lead)
- Alice (Product Owner)
- Charlie (Senior Dev)
- Dana (QA)
- Winston (Architect)

---

# Part 1 — Epic Review

## 1) Goal vs Outcome

**Epic goal:** Users get collaborative editing with live cursors and AI-powered semantic search + RAG.

**Outcome:** KB-02 shipped end-to-end real-time collaboration, offline-first editing, and an embeddings-backed retrieval layer:
- Collaboration server (Hocuspocus/Yjs) with session-token auth, workspace membership enforcement, and debounced persistence to `knowledge_pages.yjs_state`
- Tiptap collaboration + collaboration cursor in the KB editor, with deterministic collaborator colors and sync-state UX
- pgvector-backed embeddings pipeline (BullMQ) + semantic search endpoint + RAG query endpoint + related pages endpoint

## 2) Shipped Scope (What’s In)

**Stories shipped (8/8):**
- KB-02.1 Yjs collaboration server
- KB-02.2 Presence cursors + editor wiring
- KB-02.3 Conflict resolution UX (sync state/unsynced indicators)
- KB-02.4 Offline support (IndexedDB persistence + network status)
- KB-02.5 Embedding pipeline (pgvector, jobs, chunking, provider integration)
- KB-02.6 Semantic search
- KB-02.7 Agent KB queries (RAG endpoint)
- KB-02.8 Related pages suggestions

## 3) Evidence (Stories, Reviews, PRs, Commits)

- **Story records:** `docs/modules/bm-pm/stories/kb-02-*.md` (all `Status: Done`)
- **Epic tech spec:** `docs/modules/bm-pm/epics/epic-kb-02-tech-spec.md`
- **Epic PR:** #21 (feature delivery; large multi-surface change set)
- **Follow-ups PR:** #23 (review-driven hardening; post-merge checklist closeout)
- **Follow-ups tracker:** `docs/modules/bm-pm/epics/epic-kb-02-followups.md`

## 4) What Went Well (Wins)

Alice (Product Owner): “This is the first time the KB feels ‘alive’: multiple editors, visible presence, and smarter discovery.”

Charlie (Senior Dev): “The epic shipped as a vertical slice: persistence + background embeddings + retrieval endpoints + editor UX. It’s a solid platform primitive for KB-03+.”

Dana (QA): “Backend unit tests for the new services reduced risk, especially around auth boundaries and response formatting.”

Winston (Architect): “The separation of concerns held up: collaboration persistence doesn’t block REST, and embeddings work is offloaded to BullMQ.”

## 5) What Didn’t Go Well (Pain Points)

- Review automation flagged several integration and edge-case issues late (after the large feature surface was in place), which increased iteration cost versus catching them earlier.
- The embeddings stack has unavoidable coupling between model dims and DB schema (`vector(1536)`), so “just changing the model” is not safe without an operational migration plan.
- Some BMAD workflow automation assumes global sprint artifact paths, while bm-pm uses module-local paths (`docs/modules/bm-pm/...`), creating friction for orchestration.

## 6) Surprises / Discoveries

- Multi-AI review was unusually complementary here: Gemini surfaced maintainability and syntax/constant issues; CodeAnt highlighted correctness hardening and shutdown safety in collaboration; the combination materially reduced production risk.
- Collaboration persistence hardening (debounce keying, shutdown flush, corrupt-state handling) mattered more than expected once we mapped the failure modes (restart during debounce window, malformed document names, soft-deleted pages).

## 7) Decisions & Tradeoffs

- **Debounced Yjs persistence** was selected to reduce DB write load; hardening added flush-on-shutdown and deterministic debounce keys to avoid lost edits and timer collisions.
- **Embeddings generation via background jobs** was chosen to keep KB saves responsive; concurrency and pacing/circuit-breaker controls were introduced to reduce provider cost/rate risk.
- **Vector schema fixed at 1536 dims** (pragmatic MVP); migration strategy documented rather than implemented inside KB-02 to avoid risky online table rewrites.

## 8) Quality & Validation

- Baseline gates: `pnpm type-check`, `pnpm lint`, `pnpm test`
- Key tests added in `apps/api` to cover:
  - collaboration auth + load/store behavior
  - embeddings utilities + provider response validation
  - semantic search/rag formatting behavior

## 9) Review-Driven Follow-ups (Hardening)

The KB-02 follow-up pass closed the highest-risk review items:
- Centralized embedding dims + fail-fast against schema mismatch; documented operational migration options (`docs/runbooks/kb-embeddings-vector-dimensions.md`)
- Safer provider error handling/logging; response structure validation; per-vector dims validation
- Recursive CTE for breadcrumb path building (cycle guard) and defensive DTO clamping
- Collab server resilience: deterministic debounce keys, flush pending persists on shutdown, prevent writes to soft-deleted pages, handle corrupt `yjsState` safely
- Frontend reliability: cookie-based collab token fallback, `useRef` for autosave timeout, hook deps fixed, network-status test cleanup

---

# Part 2 — Next Epic Preparation (KB-03)

## 10) Next Epic Candidate

KB-03: KB Verification & Scribe (`docs/modules/bm-pm/epics/epic-kb-03-kb-verification-scribe-agent.md`)

## 11) Readiness Checklist (Before Starting KB-03)

- Decide whether KB-03 depends on multi-dimension embeddings support or whether the fixed schema is acceptable for the phase.
- Confirm operational path for pgvector index creation in production environments (downtime tolerance vs out-of-band/maintenance execution).
- Confirm collaboration deployment topology (single process vs separate collab service) and establish baseline monitoring signals (disconnect rate, persist latency, job backlog).
- Ensure KB editor UX remains stable under reconnect/offline transitions (manual validation on slow/unstable networks).

## 12) Closing Notes

Bob (Scrum Master): “KB-02 turned the KB into a collaborative, AI-assisted system. The follow-up hardening was high leverage and sets us up well for KB-03.”

