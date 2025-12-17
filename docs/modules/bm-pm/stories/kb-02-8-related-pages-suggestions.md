# Story: KB-02.8 - Related Pages Suggestions

**Epic:** KB-02 - KB Real-Time & RAG  
**Status:** Done  
**Completed:** 2025-12-18  
**Points:** 5

---

## Story Description

As a KB user, I want the system to suggest related pages based on semantic similarity, so I can quickly discover other relevant content while reading a page.

---

## Acceptance Criteria

- [x] Given I view a KB page
- [x] When embeddings exist for that page
- [x] Then the API returns a list of related pages ranked by similarity
- [x] And results are filtered by tenantId + workspaceId
- [x] And the endpoint returns quickly (vector index + best-chunk-per-page ranking)

---

## Technical Implementation

### Backend (NestJS)

#### 1. New Endpoint
- `GET /kb/pages/:id/related?limit=8`

**Location:** `apps/api/src/kb/pages/pages.controller.ts`

#### 2. Retrieval Strategy
- Uses the first available embedding chunk for the source page as a representative vector.
- Finds the best matching chunk per candidate page and ranks by cosine distance (`<=>`).
- Returns `score` (derived from distance) plus a snippet (best chunk text).

**Location:** `apps/api/src/kb/pages/pages.service.ts`

### Tests

- Updated `PagesService` unit tests to include the new dependency (`EmbeddingsService`) and validate related suggestions behavior.

**Location:** `apps/api/src/kb/pages/pages.service.spec.ts`

