# CLAUDE.md - AI Business Hub (HYVVE)

This file provides context for Claude Code when working on this project.

---

## Project Overview

**HYVVE** is an AI-powered business orchestration platform designed to achieve **90% automation with ~5 hours/week human involvement** for SMB businesses.

**Current Phase:** Foundation Build (EPIC-00 through EPIC-07)
**Status:** EPIC-00 (Project Scaffolding) is contexted and ready for development

### The 90/5 Promise
- AI agents handle routine operations autonomously
- Humans approve only strategic decisions
- Confidence-based routing (>85% auto-execute, 60-85% quick approval, <60% full review)

---

## Available MCP Servers

### Playwright (`mcp__playwright__`)
Browser automation and testing.

**Key Tools:**
- `browser_navigate` - Navigate to URLs
- `browser_click` - Click elements
- `browser_type` - Type into inputs
- `browser_snapshot` - Capture accessibility snapshot (preferred over screenshot)
- `browser_take_screenshot` - Visual screenshot
- `browser_fill_form` - Fill multiple form fields
- `browser_evaluate` - Run JavaScript
- `browser_wait_for` - Wait for text/elements

**Usage:** UI testing, web scraping, automated browser interactions.

---

### Context7 (`mcp__context7__`)
Up-to-date library documentation lookup.

**Key Tools:**
- `resolve-library-id` - Find library ID for documentation lookup
- `get-library-docs` - Fetch current documentation for a library

**Usage:** When you need current docs for Next.js, NestJS, Prisma, React, Tailwind, etc.

**Example:**
```
1. resolve-library-id("nextjs")
2. get-library-docs("/vercel/next.js", topic="app router")
```

---

### 21st Magic (`mcp__magic__`)
AI-powered UI component generation from 21st.dev.

**Key Tools:**
- `21st_magic_component_builder` - Generate new UI components
- `21st_magic_component_inspiration` - Browse component examples
- `21st_magic_component_refiner` - Improve existing components
- `logo_search` - Find company logos (JSX/TSX/SVG)

**Usage:** Creating React components, finding UI inspiration, improving component design.

---

### DeepWiki (`mcp__deepwiki__`)
GitHub repository documentation and Q&A.

**Key Tools:**
- `read_wiki_structure` - Get documentation topics for a repo
- `read_wiki_contents` - View full documentation
- `ask_question` - Ask questions about a repo's codebase

**Usage:** Understanding open-source projects, learning patterns from reference implementations.

**Example:**
```
ask_question("makeplane/plane", "How does the real-time collaboration work?")
```

---

### Serena (`mcp__serena__`)
Semantic code analysis and editing.

**Key Tools:**
- `find_symbol` - Find code symbols by name path
- `get_symbols_overview` - Get top-level symbols in a file
- `find_referencing_symbols` - Find references to a symbol
- `replace_symbol_body` - Replace entire symbol definition
- `insert_after_symbol` / `insert_before_symbol` - Insert code
- `rename_symbol` - Rename across codebase
- `search_for_pattern` - Regex search in code
- `list_dir` / `find_file` - File system navigation
- `list_memories` / `read_memory` / `write_memory` - Persistent context

**Usage:** Code refactoring, understanding codebases, precise edits.

**Important:** Prefer symbolic tools over reading entire files. Use `get_symbols_overview` first, then targeted reads.

---

### shadcn (`mcp__shadcn__`)
shadcn/ui component registry.

**Key Tools:**
- `get_project_registries` - Get configured registries
- `search_items_in_registries` - Search for components
- `view_items_in_registries` - View component details
- `get_item_examples_from_registries` - Get usage examples
- `get_add_command_for_items` - Get CLI install command
- `get_audit_checklist` - Verify component integration

**Usage:** Adding shadcn/ui components to the project.

**Example:**
```
1. search_items_in_registries(["@shadcn"], "button")
2. get_add_command_for_items(["@shadcn/button"])
```

---

### Sequential Thinking (`mcp__sequential-thinking__`)
Structured problem-solving through step-by-step thinking.

**Key Tools:**
- `sequentialthinking` - Break down complex problems into steps

**Usage:** Complex architectural decisions, debugging, multi-step analysis.

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js + React + TypeScript | 15.x |
| Styling | Tailwind CSS + shadcn/ui | 4.x |
| Backend | NestJS + TypeScript | 10.x |
| Agent System | Python + FastAPI + Agno | 3.12+ |
| Database | PostgreSQL | 16+ |
| ORM | Prisma | 6.x |
| Cache/Queue | Redis + BullMQ | 7+ |
| Real-time | Socket.io | 4.x |
| Monorepo | Turborepo + pnpm | Latest |

---

## Project Structure

```
/
├── apps/
│   ├── web/                 # Next.js 15 frontend
│   ├── api/                 # NestJS backend
│   └── agents/              # Python AgentOS
│
├── packages/
│   ├── db/                  # Prisma schema + migrations
│   ├── ui/                  # Shared React components
│   ├── shared/              # Shared TypeScript types
│   └── config/              # Shared configuration
│
├── agents/                  # Agno agent implementations
│   ├── platform/            # Core orchestration agents
│   └── crm/                 # CRM module agents
│
├── .bmad/                   # BMAD module definitions
│   ├── core/                # Core BMAD workflows
│   ├── bmm/                 # BMM agents and workflows
│   ├── bmv/                 # Validation module
│   ├── bmp/                 # Planning module
│   └── ...                  # Other modules
│
├── docs/
│   ├── prd.md               # Product Requirements
│   ├── architecture.md      # Technical Architecture
│   ├── ux-design.md         # UX Design Document
│   ├── epics/               # Epic breakdown
│   │   ├── EPIC-INDEX.md
│   │   └── EPIC-00 to 07/
│   ├── sprint-artifacts/
│   │   ├── sprint-status.yaml
│   │   └── tech-spec-*.md
│   └── research/            # Research documents
│
├── src/                     # Legacy/shared source
└── docker/                  # Docker configuration
```

---

## Key Documentation Files

When starting work, reference these files:

| File | Purpose |
|------|---------|
| `docs/prd.md` | Product requirements and scope |
| `docs/architecture.md` | Technical decisions, ADRs |
| `docs/ux-design.md` | User flows and design patterns |
| `docs/epics/EPIC-INDEX.md` | Development roadmap |
| `docs/sprint-artifacts/sprint-status.yaml` | Current sprint status |
| `docs/sprint-artifacts/tech-spec-epic-00.md` | Current epic tech spec |
| `docs/MASTER-PLAN.md` | Overall vision and strategy |
| `docs/MODULE-RESEARCH.md` | Module specifications |
| `docs/bmm-workflow-status.yaml` | BMM workflow progress |

---

## Development Workflow (BMAD Method)

This project uses the **BMAD Method** (Business Model Agile Development).

### Workflow Commands

```bash
# Check current workflow status
/bmad:bmm:workflows:workflow-status

# Get story context before implementation
/bmad:bmm:workflows:story-context

# Execute a story
/bmad:bmm:workflows:dev-story

# Mark story as ready for dev
/bmad:bmm:workflows:story-ready

# Mark story as done
/bmad:bmm:workflows:story-done

# Code review
/bmad:bmm:workflows:code-review
```

### Sprint Status States

**Epic States:**
- `backlog` → `contexted` → (stories drafted) → (all stories done)

**Story States:**
- `backlog` → `drafted` → `ready-for-dev` → `in-progress` → `review` → `done`

---

## Coding Standards

### TypeScript/JavaScript
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use Zod for runtime validation
- Follow existing patterns in codebase

### File Naming
- Components: `PascalCase.tsx`
- Utilities: `kebab-case.ts`
- Types: `*.types.ts`
- Tests: `*.test.ts` or `*.spec.ts`

### Imports
```typescript
// 1. External packages
import { useState } from 'react';
import { z } from 'zod';

// 2. Internal packages (@/)
import { Button } from '@/components/ui/button';

// 3. Relative imports
import { localUtil } from './utils';
```

### Component Structure
```typescript
// 1. Types/interfaces
interface Props { ... }

// 2. Component
export function MyComponent({ prop }: Props) {
  // 3. Hooks
  const [state, setState] = useState();

  // 4. Handlers
  const handleClick = () => { ... };

  // 5. Render
  return ( ... );
}
```

---

## Multi-Tenant Architecture

All data models must include tenant isolation:

```typescript
// Every tenant-scoped model needs:
model Example {
  id        String   @id @default(cuid())
  tenantId  String   // Required for RLS
  // ... other fields

  @@index([tenantId])  // Always index tenantId
}
```

---

## Event Bus Conventions

Events follow the pattern: `{module}.{entity}.{action}`

```typescript
// Examples:
'crm.contact.created'
'approval.item.approved'
'content.article.published'

// Base event structure:
interface BaseEvent {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  correlationId?: string;
  userId: string;
  version: string;
  data: Record<string, any>;
}
```

---

## BYOAI (Bring Your Own AI)

Users provide their own AI API keys. Supported providers:

| Provider | Key Format | Use Case |
|----------|------------|----------|
| Claude | `sk-ant-...` | Strategy, content, code |
| OpenAI | `sk-...` | General tasks |
| Gemini | Google API key | Research |
| DeepSeek | API key | Cost-optimized tasks |
| OpenRouter | `sk-or-...` | 100+ models |

---

## Common Tasks

### Adding a New Component
1. Check shadcn registry: `search_items_in_registries`
2. Install if available: `get_add_command_for_items`
3. Or use 21st Magic: `21st_magic_component_builder`

### Understanding External Code
1. Use DeepWiki: `ask_question("owner/repo", "question")`
2. Or Context7 for library docs: `resolve-library-id` → `get-library-docs`

### Refactoring
1. Use Serena: `get_symbols_overview` → `find_symbol` → `replace_symbol_body`
2. Find usages: `find_referencing_symbols`
3. Rename: `rename_symbol`

### Testing UI
1. Use Playwright: `browser_navigate` → `browser_snapshot` → interactions

---

## Current Sprint

**Epic:** EPIC-00 - Project Scaffolding & Core Setup
**Stories:** 7 stories, 17 points
**Status:** Contexted, ready for development

Check `docs/sprint-artifacts/sprint-status.yaml` for current story status.

---

## Notes

- Avoid over-engineering; implement only what's specified
- Follow existing patterns in the codebase
- Keep multi-tenant isolation in mind for all data models
- Use confidence-based approval for AI actions
- Reference tech specs before implementing stories
