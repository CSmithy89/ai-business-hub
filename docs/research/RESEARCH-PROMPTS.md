# AI Business Hub - Research Prompts & BMAD Workflow Guide

**Purpose:** Detailed prompts for extracting patterns from reference implementations
**Created:** 2025-11-28
**Related:** MASTER-PLAN.md, MODULE-RESEARCH.md, NEXT-STEPS.md

---

## Overview

This document provides structured research prompts for each reference repository. Each section includes:
- **What to Extract** (specific to AI Business Hub requirements)
- **BMAD Agents to Use** (which agent persona to activate)
- **Research Prompt** (copy-paste ready prompt for each repo)
- **Output Template** (structure for your findings)

---

## Research Workflow

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RESEARCH WORKFLOW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 1: Clone Repository                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  git clone [repo-url]                                                        │
│  cd [repo-name]                                                              │
│                                                                              │
│  STEP 2: Activate BMAD Research Session                                      │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Use Party Mode with relevant agents OR load specific agent                  │
│  /bmad:core:workflows:party-mode                                             │
│                                                                              │
│  STEP 3: Execute Research Prompt                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Copy the research prompt for that repo                                      │
│  Paste into the active session                                               │
│                                                                              │
│  STEP 4: Document Findings                                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Create docs/research/{repo}-analysis.md                                     │
│  Use the output template provided                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Taskosaur Research

### 1.1 What to Extract (from MASTER-PLAN.md & MODULE-RESEARCH.md)

| Requirement | Source Section | What to Find |
|-------------|----------------|--------------|
| Conversational UI | MASTER-PLAN §3.1, §8.2.3 | Chat component structure, streaming responses |
| BYOAI Model Switching | MASTER-PLAN §2.1, §6 | Provider abstraction, model router patterns |
| Real-time WebSocket | MASTER-PLAN §8.3 | Socket.io integration, live updates |
| Task Definition Format | MODULE-RESEARCH §7 | How they define conversational workflows |
| State Management | MODULE-RESEARCH §7.4 | How they track workflow state |

### 1.2 BMAD Agents to Use

| Agent | Why |
|-------|-----|
| **Winston (Architect)** | System architecture, folder structure, API design |
| **Amelia (Developer)** | Code patterns, implementation details |
| **Sally (UX Designer)** | UI component patterns, user flows |

**Recommended:** Start with Party Mode, then drill down with individual agents.

### 1.3 Research Prompt

```markdown
# TASKOSAUR RESEARCH SESSION

## Context
I'm building the AI Business Hub platform (see docs/MASTER-PLAN.md and docs/MODULE-RESEARCH.md).
I need to extract specific patterns from @Taskosaur-main/ to inform our implementation.

## Your Mission
Analyze this Taskosaur codebase and document findings for these specific requirements:

### 1. Conversational UI Architecture
- How is the chat interface structured? (components, state, props)
- How do they handle streaming responses from AI models?
- What component library are they using (shadcn, radix, custom)?
- How is the conversation history managed?
- Where are the chat components located? List the file paths.

### 2. BYOAI Model Switching
- How do users configure their AI provider/API keys?
- Where is the model selection logic?
- How do they abstract different providers (Claude, OpenAI, etc.)?
- Is there a router or adapter pattern?
- Find the interface/types for model configuration.

### 3. Task/Workflow Definition
- How are tasks defined? (schema, format, structure)
- Can users create custom workflows?
- How is task state tracked?
- What's the data model for a task?

### 4. Real-time Updates
- How do they implement WebSocket connections?
- How are streaming AI responses displayed?
- What library/approach for real-time?

### 5. State Management
- What state management approach (React Context, Zustand, Redux, etc.)?
- How is global app state structured?
- How do they handle async operations?

## Output Format
For each section, provide:
1. **File paths** where you found the relevant code
2. **Key code snippets** (the actual implementation)
3. **Pattern summary** (what approach they're using)
4. **Adoption recommendation** (adopt, adapt, or avoid for our use case)

## Priority Files to Examine
- /src/components/chat/ or similar
- /src/lib/ai/ or /src/services/
- /src/hooks/ (especially useChat, useStream, etc.)
- /src/store/ or /src/context/
- /src/types/ (model definitions)
- package.json (dependencies)
```

### 1.4 Output Template

Create: `docs/research/taskosaur-analysis.md`

```markdown
# Taskosaur Analysis

**Analyzed:** [date]
**Version/Commit:** [git hash]
**Analyst:** [agent name]

## 1. Conversational UI Architecture

### Key Files
- `path/to/file.tsx` - Description

### Pattern Summary
[How they structure the chat UI]

### Code Snippets
\`\`\`typescript
// Key implementation patterns
\`\`\`

### Adoption Recommendation
- [ ] Adopt as-is
- [ ] Adapt for our needs
- [ ] Avoid (reason)

## 2. BYOAI Model Switching

[Same structure...]

## 3. Task/Workflow Definition

[Same structure...]

## 4. Real-time Updates

[Same structure...]

## 5. State Management

[Same structure...]

## Key Takeaways for AI Business Hub

1. [Most important finding]
2. [Second most important]
3. [Third most important]

## Questions for Next Steps

1. [Open question to resolve]
2. [Decision needed]
```

---

## 2. Twenty CRM Research

### 2.1 What to Extract (from MASTER-PLAN.md & MODULE-RESEARCH.md)

| Requirement | Source Section | What to Find |
|-------------|----------------|--------------|
| Record System | MODULE-RESEARCH §1.3.1 | Contact, Company, Deal, Activity entities |
| Custom Fields | MODULE-RESEARCH §1.3.1 | Extensible field system |
| GraphQL Schema | MASTER-PLAN §4.4 | API patterns, query structure |
| Workspace Isolation | MASTER-PLAN §7 | Multi-tenant patterns |
| Pipeline Views | MODULE-RESEARCH §6.11 (BM-CRM) | Deal pipeline implementation |

### 2.2 BMAD Agents to Use

| Agent | Why |
|-------|-----|
| **Winston (Architect)** | Data architecture, schema design |
| **Mary (Analyst)** | Business domain modeling, requirements mapping |
| **Amelia (Developer)** | Implementation patterns, code structure |

### 2.3 Research Prompt

```markdown
# TWENTY CRM RESEARCH SESSION

## Context
I'm building the AI Business Hub platform with a CRM module (BM-CRM) and Sales module (BMS).
These modules share a unified data layer inspired by Twenty CRM's flexible record architecture.
See docs/MODULE-RESEARCH.md §1.3 for our shared data architecture requirements.

## Your Mission
Analyze Twenty CRM's codebase to extract patterns for our unified record system.

### 1. Core Data Model
- Find the Contact, Company, Deal (Opportunity) entities
- What fields are on each entity by default?
- How are relationships between entities modeled?
- Where are the Prisma/TypeORM schemas?

### 2. Custom Fields Architecture
- How do they implement extensible/custom fields?
- Is it JSON columns, EAV pattern, or something else?
- How are custom field types validated?
- Can you show the schema for custom fields?

### 3. Activity/Timeline System
- How are activities (calls, emails, meetings, notes) structured?
- How is the activity timeline implemented?
- How do activities link to Contacts/Companies/Deals?

### 4. GraphQL API Patterns
- What's the schema structure?
- How do they handle pagination?
- How do they handle filtering/sorting?
- What resolvers exist for CRM entities?

### 5. Workspace/Tenant Isolation
- How is multi-tenancy implemented?
- How do they isolate data between workspaces?
- Is it row-level security, schema per tenant, or separate DBs?

### 6. Pipeline/Kanban Views
- How is the deal pipeline implemented?
- What's the data model for stages?
- How do they handle drag-and-drop stage changes?

## Output Format
For each section, provide:
1. **File paths** where you found the relevant code
2. **Schema definitions** (Prisma, TypeORM, or raw SQL)
3. **Pattern summary** (architectural approach)
4. **Mapping to our requirements** (how it applies to MODULE-RESEARCH.md §1.3)

## Priority Files to Examine
- /packages/twenty-server/src/engine/core-modules/
- /packages/twenty-shared/
- prisma/schema.prisma or similar
- /packages/twenty-server/src/engine/api/graphql/
- Any files with "workspace", "tenant", "object-metadata"
```

### 2.4 Output Template

Create: `docs/research/twenty-crm-analysis.md`

```markdown
# Twenty CRM Analysis

**Analyzed:** [date]
**Version/Commit:** [git hash]
**Analyst:** [agent name]

## 1. Core Data Model

### Entity Definitions

#### Contact
\`\`\`prisma
model Contact {
  // schema here
}
\`\`\`

#### Company
[Same structure...]

#### Deal/Opportunity
[Same structure...]

### Relationship Diagram
[Describe or draw relationships]

### Mapping to AI Business Hub
| Twenty Entity | Our Entity | Notes |
|---------------|------------|-------|
| Person | Contact | Rename, add leadScore field |

## 2. Custom Fields Architecture

### Approach Used
[EAV, JSON, hybrid?]

### Schema
\`\`\`prisma
// Custom fields implementation
\`\`\`

### Adoption Notes
[What to adopt/modify]

## 3. Activity/Timeline System

[Same structure...]

## 4. GraphQL API Patterns

[Same structure...]

## 5. Workspace/Tenant Isolation

[Same structure...]

## 6. Pipeline/Kanban Views

[Same structure...]

## Key Schema Decisions for AI Business Hub

1. [Most important finding]
2. [Second most important]

## Recommended Prisma Schema for BM-CRM

\`\`\`prisma
// Draft schema based on Twenty patterns
\`\`\`
```

---

## 3. Agno Framework Research

### 3.1 What to Extract (from MASTER-PLAN.md & MODULE-RESEARCH.md)

| Requirement | Source Section | What to Find |
|-------------|----------------|--------------|
| Agent Teams | MASTER-PLAN §5.2 | Team coordination patterns |
| Tool Definitions | MASTER-PLAN §4.4 | AgentTool interface |
| Memory/Context | MASTER-PLAN §5.3 | Shared memory, context passing |
| Multi-Agent Orchestration | MODULE-RESEARCH §3 | How agents work together |
| Human-in-the-Loop | MASTER-PLAN §2.3 | Approval gates, pausing for human input |

### 3.2 BMAD Agents to Use

| Agent | Why |
|-------|-----|
| **Winston (Architect)** | Agent architecture, orchestration patterns |
| **John (PM)** | Workflow design, approval flow requirements |
| **Murat (Test Architect)** | Testing agent interactions |

### 3.3 Research Prompt

```markdown
# AGNO FRAMEWORK RESEARCH SESSION

## Context
I'm building the AI Business Hub platform which uses multi-agent orchestration.
Our architecture follows the Agno Framework for agent teams (see MASTER-PLAN.md §5).
We need human-in-the-loop approval gates for strategic decisions.

## Your Mission
Deep dive into Agno's documentation and patterns to extract implementation guidance.

### 1. Agent Definition Patterns
- How do you define an agent in Agno?
- What properties does an agent have (name, model, tools, instructions)?
- How are agent "personalities" configured?
- What's the YAML/Python structure?

### 2. Team Orchestration
- How do you create a team of agents?
- How does the team leader coordinate?
- How do agents hand off tasks to each other?
- What's the communication pattern (direct, via leader, broadcast)?

### 3. Tool Integration
- How are tools defined for agents?
- What's the interface for a custom tool?
- How do you register tools with an agent?
- Can tools be shared across agents?

### 4. Memory & Context
- How does Agno handle agent memory?
- Can agents share context/memory?
- How is conversation history managed?
- What persistence options exist?

### 5. Human-in-the-Loop
- Does Agno support pausing for human approval?
- How would you implement approval gates?
- Can agents request human input mid-workflow?
- What patterns exist for this?

### 6. Workflow Orchestration
- How do you define multi-step workflows?
- How do you handle conditional branching?
- How do you handle errors/retries?
- Is there a workflow definition format?

## Output Format
For each section, provide:
1. **Documentation links** where you found the info
2. **Code examples** (Python/YAML)
3. **Pattern summary**
4. **Mapping to our BMAD agents** (how we'd implement our agents from MODULE-RESEARCH.md)

## Priority Resources
- https://docs.agno.com/
- Agent definition examples
- Team examples
- Tool examples
- Memory/persistence docs
```

### 3.4 Output Template

Create: `docs/research/agno-analysis.md`

```markdown
# Agno Framework Analysis

**Analyzed:** [date]
**Documentation Version:** [version]
**Analyst:** [agent name]

## 1. Agent Definition Patterns

### Agent Structure
\`\`\`python
# Example agent definition
\`\`\`

### Mapping to AI Business Hub Agents
| Our Agent | Agno Config | Model | Tools |
|-----------|-------------|-------|-------|
| Strategy Agent | [config] | Claude Opus | [tools] |

## 2. Team Orchestration

### Team Definition
\`\`\`python
# Team setup
\`\`\`

### Our Team Structure
[How we'd implement the team from MASTER-PLAN.md §5.2]

## 3. Tool Integration

### Tool Interface
\`\`\`python
# Tool definition pattern
\`\`\`

### Our Agent Tools
| Agent | Tools Needed | Implementation |
|-------|--------------|----------------|
| Research Agent | web_search, competitor_analysis | [notes] |

## 4. Memory & Context

[Same structure...]

## 5. Human-in-the-Loop

### Approval Pattern
\`\`\`python
# How to pause for approval
\`\`\`

### Our Approval Gates
| Approval Type | Trigger | Implementation |
|---------------|---------|----------------|
| Content approval | Before publish | [notes] |

## 6. Workflow Orchestration

[Same structure...]

## Implementation Recommendations

### Phase 1: Core Agent Setup
1. [Step]
2. [Step]

### Phase 2: Team Coordination
1. [Step]
2. [Step]
```

---

## 4. Quick Reference: BMAD Commands for Research

| Task | Command | When to Use |
|------|---------|-------------|
| Multi-agent discussion | `/bmad:core:workflows:party-mode` | Getting multiple perspectives on findings |
| Brainstorm patterns | `/bmad:core:workflows:brainstorming` | Exploring how to adapt patterns |
| Load Architect | `/bmad:bmm:agents:architect` | Deep architecture analysis |
| Load Developer | `/bmad:bmm:agents:dev` | Code-level analysis |
| Load Analyst | `/bmad:bmm:agents:analyst` | Requirements mapping |
| Load UX Designer | `/bmad:bmm:agents:ux-designer` | UI pattern analysis |

---

## 5. Research Completion Checklist

### Before Starting
- [ ] Cloned all three repositories locally
- [ ] Read MASTER-PLAN.md and MODULE-RESEARCH.md
- [ ] Understand what patterns you're looking for

### Taskosaur Research
- [ ] Analyzed conversational UI structure
- [ ] Documented BYOAI model switching pattern
- [ ] Extracted task definition format
- [ ] Understood real-time/WebSocket approach
- [ ] Created `docs/research/taskosaur-analysis.md`

### Twenty CRM Research
- [ ] Extracted Contact/Company/Deal schemas
- [ ] Understood custom fields architecture
- [ ] Documented activity/timeline system
- [ ] Analyzed GraphQL patterns
- [ ] Understood multi-tenancy approach
- [ ] Created `docs/research/twenty-crm-analysis.md`

### Agno Framework Research
- [ ] Understood agent definition patterns
- [ ] Documented team orchestration
- [ ] Extracted tool integration patterns
- [ ] Understood memory/context sharing
- [ ] Documented human-in-the-loop patterns
- [ ] Created `docs/research/agno-analysis.md`

### After Research
- [ ] Updated NEXT-STEPS.md with findings
- [ ] Identified decisions to make
- [ ] Ready for Phase 1 implementation

---

## 6. Plane Research

### 6.1 What to Extract (from MASTER-PLAN.md & MODULE-RESEARCH.md)

| Requirement | Source Section | What to Find |
|-------------|----------------|--------------|
| Project Hierarchy | MODULE-RESEARCH §BM-PM | Workspace → Project → Module → Cycle → Issue |
| Views/Filtering | MASTER-PLAN §8.2 | Saved views, filter system, query builder |
| Kanban/Board UI | MODULE-RESEARCH §BM-PM | Board components, drag-and-drop |
| Real-time Collaboration | MASTER-PLAN §8.3 | Y.js + Hocuspocus patterns |
| Analytics | MODULE-RESEARCH §BM-PM | Burndown, velocity, cycle analytics |
| Inbox/Triage | MODULE-RESEARCH §BM-PM | External input processing |

### 6.2 BMAD Agents to Use

| Agent | Why |
|-------|-----|
| **Winston (Architect)** | System architecture, data models, real-time patterns |
| **Mary (Analyst)** | Requirements mapping, feature comparison |
| **Amelia (Developer)** | Implementation patterns, code structure |
| **Sally (UX Designer)** | UI components, board/list/calendar views |

**Recommended:** Start with Party Mode for architecture overview, then drill into specific areas.

### 6.3 Research Prompt

```markdown
# PLANE RESEARCH SESSION

## Context
I'm building the AI Business Hub platform with a Project Management module (BM-PM).
This module manages Products (BME-Course, BME-Podcast, etc.) through BMAD phases with AI agent teams.
See docs/modules/bm-pm/architecture.md for our target architecture.

Plane's hierarchy (Workspace → Project → Module → Cycle → Issue) maps to our needs:
- Workspace → Business
- Project → Product
- Module → Product Category (optional grouping)
- Cycle → Phase (BMAD phases)
- Issue → Task (human or agent assigned)

## Your Mission
Analyze Plane's codebase to extract patterns for our BM-PM module implementation.

### 1. Data Model Architecture
- Find the Workspace, Project, Module, Cycle, Issue entities
- What fields are on each entity?
- How are relationships modeled?
- Where are the Django models / database schemas?
- How do they handle soft deletes and archiving?

### 2. Views System
- How do they implement saved views/filters?
- What's the query builder pattern?
- How do they persist view configurations?
- What filter operators are supported (equals, contains, in, etc.)?
- Find the ViewFilter interface/model.

### 3. Board/Kanban Implementation
- How is the Kanban board component structured?
- How do they handle drag-and-drop between columns?
- What's the state management for board updates?
- How do they batch status changes?
- Find the board components and state logic.

### 4. Real-time Collaboration (Y.js + Hocuspocus)
- How is Y.js integrated for collaborative editing?
- What's the Hocuspocus server configuration?
- How do they handle document synchronization?
- What happens on conflict resolution?
- Where is the live collaboration server code?

### 5. Cycle Analytics
- How do they calculate burndown charts?
- What's the velocity calculation algorithm?
- How is scope creep tracked?
- What data is stored vs computed on demand?
- Find the analytics computation logic.

### 6. Inbox/Triage System
- How does the inbox work?
- What sources can create inbox items (email, GitHub, etc.)?
- How is triage (accept/decline/snooze) implemented?
- What's the conversion flow from inbox to issue?
- Find the inbox models and processing logic.

### 7. State Management (MobX)
- How are MobX stores structured?
- What stores exist (issue, cycle, project, etc.)?
- How do they handle optimistic updates?
- How is data cached and invalidated?
- Find the store definitions.

### 8. Issue Relations & Dependencies
- How are issue relations modeled (blocks, blocked_by, relates_to)?
- How do they visualize dependencies?
- Is there a dependency graph calculation?
- Find the relation model and UI components.

## Output Format
For each section, provide:
1. **File paths** where you found the relevant code
2. **Schema/Model definitions** (Django models, TypeScript types)
3. **Key code snippets** (actual implementation)
4. **Pattern summary** (architectural approach)
5. **Mapping to AI Business Hub** (how we'd adapt for BM-PM)

## Priority Directories to Examine
- /apiserver/plane/db/models/ (Django models)
- /apiserver/plane/app/views/ (API endpoints)
- /web/store/ (MobX stores)
- /web/components/issues/ (Issue components)
- /web/components/cycles/ (Cycle components)
- /web/components/views/ (View filter components)
- /live/ (Hocuspocus server)
- /packages/types/ (TypeScript interfaces)
- /packages/editor/ (Y.js editor integration)
```

### 6.4 Output Template

Create: `docs/research/plane-analysis.md`

```markdown
# Plane Analysis

**Analyzed:** [date]
**Version/Commit:** [git hash]
**Repository:** https://github.com/makeplane/plane
**Analyst:** [agent name]

## Executive Summary

[2-3 paragraph overview of key findings and recommendations]

## 1. Data Model Architecture

### Core Entities

#### Workspace
\`\`\`python
# Django model
class Workspace(models.Model):
    # fields here
\`\`\`

#### Project
[Same structure...]

#### Module
[Same structure...]

#### Cycle
[Same structure...]

#### Issue
[Same structure...]

### Entity Relationship Diagram
\`\`\`
[ASCII or description of relationships]
\`\`\`

### Mapping to AI Business Hub
| Plane Entity | BM-PM Entity | Adaptations Needed |
|--------------|--------------|-------------------|
| Workspace | Business | Add BYOAI config, branding |
| Project | Product | Add BMAD template, agent team |
| Module | ProductCategory | Optional, for grouping |
| Cycle | Phase | Map to BMAD phases |
| Issue | AgentTask | Add assignment type, approval |

### Adoption Recommendation
- [ ] Adopt schema pattern
- [ ] Adapt with modifications
- [ ] Build custom (reason)

## 2. Views System

### View Model
\`\`\`typescript
interface IssueView {
  // TypeScript interface
}
\`\`\`

### Filter Implementation
\`\`\`typescript
// How filters are structured and applied
\`\`\`

### Query Builder Pattern
[Description of how queries are built from view config]

### Adoption Recommendation
[What to adopt/modify]

## 3. Board/Kanban Implementation

### Component Structure
\`\`\`
web/components/
├── issues/
│   ├── board-views/
│   │   ├── kanban/
│   │   │   ├── block.tsx
│   │   │   ├── board.tsx
│   │   │   └── ...
\`\`\`

### Drag and Drop Pattern
\`\`\`typescript
// Key DnD implementation
\`\`\`

### State Updates
[How status changes are handled]

### Adoption Recommendation
[What to adopt/modify]

## 4. Real-time Collaboration (Y.js + Hocuspocus)

### Architecture
\`\`\`
[Diagram of real-time setup]
\`\`\`

### Y.js Integration
\`\`\`typescript
// Y.js document structure
\`\`\`

### Hocuspocus Configuration
\`\`\`typescript
// Server setup
\`\`\`

### Conflict Resolution
[How conflicts are handled]

### Adoption Recommendation
- Priority: [Low/Medium/High]
- Phase: [When to implement]
- Notes: [Considerations]

## 5. Cycle Analytics

### Burndown Calculation
\`\`\`python
# Algorithm for burndown
\`\`\`

### Velocity Tracking
\`\`\`python
# Velocity calculation
\`\`\`

### Data Model for Analytics
\`\`\`python
# What's stored vs computed
\`\`\`

### Mapping to BM-PM Analytics
| Plane Metric | BM-PM Metric | Implementation |
|--------------|--------------|----------------|
| Burndown | Phase Burndown | [notes] |
| Velocity | Sprint Velocity | [notes] |

## 6. Inbox/Triage System

### Inbox Model
\`\`\`python
# Inbox item structure
\`\`\`

### Processing Flow
\`\`\`
[Email/GitHub] → [Inbox] → [Triage] → [Issue/Declined]
\`\`\`

### AI Business Hub Application
[How we'd use this for agent output triage]

## 7. State Management (MobX)

### Store Structure
\`\`\`typescript
// Root store organization
\`\`\`

### Example Store
\`\`\`typescript
// IssueStore or CycleStore pattern
\`\`\`

### Optimistic Updates Pattern
[How they handle immediate UI feedback]

### Adoption Recommendation
[MobX vs our approach]

## 8. Issue Relations & Dependencies

### Relation Model
\`\`\`python
# IssueRelation model
\`\`\`

### Dependency Visualization
[How they show blocked/blocking issues]

### Adoption Recommendation
[What to adopt/modify]

## Key Takeaways for AI Business Hub

### Must Adopt
1. [Pattern with highest value]
2. [Second highest]
3. [Third highest]

### Consider Adopting
1. [Useful but not critical]
2. [Nice to have]

### Skip for Now
1. [Pattern to defer with reason]
2. [Unnecessary complexity]

## Implementation Recommendations

### Sprint 1-2: Foundation
- [ ] Adapt Workspace/Project models for Business/Product
- [ ] Implement basic CRUD APIs

### Sprint 3-4: Views & Boards
- [ ] Port Views system with modifications
- [ ] Implement Kanban board

### Sprint 5+: Advanced Features
- [ ] Cycle analytics
- [ ] Y.js collaboration (if prioritized)
- [ ] Inbox system for agent outputs

## Open Questions

1. [Question needing resolution]
2. [Architecture decision pending]
3. [User research needed]
```

---

## 7. Recommended Research Order

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  RECOMMENDED RESEARCH SEQUENCE                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. TASKOSAUR (4 hours)                                                      │
│     └── WHY FIRST: UI patterns inform all user-facing design                │
│     └── AGENTS: Winston, Amelia, Sally                                       │
│     └── OUTPUT: taskosaur-analysis.md                                        │
│                                                                              │
│                            ▼                                                 │
│                                                                              │
│  2. TWENTY CRM (4 hours)                                                     │
│     └── WHY SECOND: Data model is foundation for BM-CRM (first module)      │
│     └── AGENTS: Winston, Mary, Amelia                                        │
│     └── OUTPUT: twenty-crm-analysis.md                                       │
│                                                                              │
│                            ▼                                                 │
│                                                                              │
│  3. AGNO (2 hours)                                                           │
│     └── WHY THIRD: Agent patterns supplement MASTER-PLAN.md                 │
│     └── AGENTS: Winston, John, Murat                                         │
│     └── OUTPUT: agno-analysis.md                                             │
│                                                                              │
│                            ▼                                                 │
│                                                                              │
│  4. SYNTHESIS (1 hour)                                                       │
│     └── Review all three analyses                                            │
│     └── Update NEXT-STEPS.md with learnings                                  │
│     └── Make architectural decisions                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

**Document Status:** Ready for Research Phase
**Next Action:** Clone Taskosaur and begin research
