# Story KB-03.7: Scribe Agent Foundation

**Epic:** KB-03 - KB Verification & Scribe Agent
**Story ID:** kb-03-7-scribe-agent-foundation
**Status:** In Progress
**Points:** 8
**Type:** Feature
**Created:** 2025-12-18

---

## Description

Create the Scribe agent for AI-powered Knowledge Base management. Scribe helps users create, update, search, and maintain KB pages with AI assistance. All actions require human approval (suggestion mode).

---

## User Story

**As a** KB user,
**I want** an AI agent to help manage the knowledge base,
**So that** I can efficiently create, organize, and maintain documentation with AI assistance.

---

## Acceptance Criteria

- [ ] Scribe agent can create KB pages (with approval)
- [ ] Can search KB and provide summaries
- [ ] Can detect stale pages and suggest actions
- [ ] Can mark pages as verified (with user approval)
- [ ] All actions require human approval (suggestion mode)
- [ ] Agent accessible via chat interface

---

## Prerequisites

- KB-01: Knowledge Base Foundation - Complete
- KB-02: Real-Time & RAG - Complete
- KB-03.1-3.6: Verification system - Complete
- Agno framework setup - Complete

---

## Technical Implementation

### 1. Agent Structure

```
agents/platform/scribe/
├── __init__.py
├── scribe_agent.py        # Main agent definition
├── tools/
│   ├── __init__.py
│   ├── kb_tools.py        # Page CRUD tools
│   ├── rag_tools.py       # RAG/semantic search tools
│   └── analysis_tools.py  # Stale detection, summarization
└── prompts/
    └── scribe_system.md   # System prompt
```

### 2. KB Tools

**kb_tools.py:**
- `create_kb_page`: Create new KB page (requires approval)
- `update_kb_page`: Update existing page (requires approval)
- `search_kb`: Full-text search KB pages
- `get_kb_page`: Get page by ID or slug
- `mark_page_verified`: Mark page as verified (requires approval)

### 3. RAG Tools

**rag_tools.py:**
- `query_rag`: Semantic search with RAG
- `get_related_pages`: Find related pages via embeddings
- `ask_kb_question`: Natural language Q&A over KB

### 4. Analysis Tools

**analysis_tools.py:**
- `detect_stale_pages`: Find pages needing review
- `summarize_page`: Generate page summary
- `analyze_kb_structure`: Analyze page hierarchy and gaps

### 5. System Prompt

Scribe's personality and capabilities:
- Helpful documentation assistant
- Proactive about identifying stale content
- Suggests improvements and updates
- Always confirms before making changes

---

## Files to Create

### New Files

1. `agents/platform/scribe/__init__.py`
2. `agents/platform/scribe/scribe_agent.py`
3. `agents/platform/scribe/tools/__init__.py`
4. `agents/platform/scribe/tools/kb_tools.py`
5. `agents/platform/scribe/tools/rag_tools.py`
6. `agents/platform/scribe/tools/analysis_tools.py`
7. `agents/platform/scribe/prompts/scribe_system.md`

### Modified Files

1. `agents/platform/__init__.py` - Export Scribe agent

---

## Definition of Done

- [ ] Scribe agent structure created
- [ ] KB tools implemented
- [ ] RAG tools implemented
- [ ] Analysis tools implemented
- [ ] System prompt defined
- [ ] Agent exported from platform module
- [ ] Type check passing
- [ ] Tests passing

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-18 | Story drafted | Claude |

