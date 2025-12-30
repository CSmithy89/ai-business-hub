# Epic DM-06: Contextual Intelligence - Technical Specification

## 1. Executive Summary

### What DM-06 Delivers

Epic DM-06 implements **Contextual Intelligence** capabilities for the Dynamic Module System, enabling bidirectional knowledge sync between the frontend and agents, and completing the Universal Agent Mesh vision. This is the final phase (Phase 6) of the Dynamic Module System architecture.

**Key Deliverables:**
1. **Deep Context Providers** - Comprehensive context exposure via `useCopilotReadable` hooks
2. **Agent Context Consumption** - Agents leverage frontend context for intelligent responses
3. **Generative UI Composition** - Dynamic layout composition (SplitView, Wizard, DashboardGrid)
4. **MCP Tool Integration** - Connect to external tools via Model Context Protocol
5. **Universal Agent Mesh** - Complete agent discovery and cross-module communication
6. **RAG Context Indexing** - Index application state for semantic search queries

**Key Insight:** CopilotKit's `useCopilotReadable` enables agents to "see" what the user is seeing. Combined with MCP for external tools and A2A for inter-agent communication, this creates a fully context-aware agent mesh where any query like "How is *this* project doing?" works correctly because agents have full application context.

### Key Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| CopilotKit | ^1.x | `useCopilotReadable` for context provision |
| Agno | ^0.3.x | Multi-interface agent platform |
| A2A Protocol | ^0.1.x | Agent-to-Agent communication (Google standard) |
| MCP Protocol | ^1.x | Model Context Protocol for external tools |
| pgvector | ^0.5.x | Vector embeddings for RAG |
| Zustand | ^4.x | Context state management |

### Integration Points with Existing Codebase

1. **CopilotKit Provider (`apps/web/src/components/copilot/`)**
   - Already configured in DM-01 with AG-UI connection
   - This epic adds `useCopilotReadable` context providers

2. **Dashboard Gateway Agent (`agents/gateway/`)**
   - Created in DM-02/DM-03 with orchestration
   - This epic adds context-aware response generation

3. **Knowledge Base RAG (`apps/api/src/knowledge/`)**
   - Created in KB-02 with pgvector embeddings
   - This epic extends indexing to include application context

4. **A2A Client (`agents/a2a/`)**
   - Created in DM-03 for inter-agent calls
   - This epic adds mesh discovery and external agent support

---

## 2. Architecture Decisions

### 2.1 Context Provider Architecture

The context system uses CopilotKit's native `useCopilotReadable` to expose application state to agents:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CONTEXT FLOW                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FRONTEND (React Components)                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       ││
│  │  │ ProjectView      │  │ TaskList         │  │ DocumentEditor   │       ││
│  │  │                  │  │                  │  │                  │       ││
│  │  │ useCopilotReadable useCopilotReadable │  │ useCopilotReadable       ││
│  │  │  └─ project      │  │  └─ tasks        │  │  └─ document     │       ││
│  │  │  └─ phase        │  │  └─ selection    │  │  └─ cursor       │       ││
│  │  │  └─ health       │  │  └─ filters      │  │  └─ changes      │       ││
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘       ││
│  │           │                    │                    │                    ││
│  └───────────┼────────────────────┼────────────────────┼────────────────────┘│
│              │                    │                    │                     │
│              └────────────────────┼────────────────────┘                     │
│                                   │                                          │
│                          AG-UI Protocol                                      │
│                       (Context in System Prompt)                             │
│                                   │                                          │
│                                   ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         AGENT LAYER                                      ││
│  │                                                                          ││
│  │  Dashboard Agent receives context automatically:                         ││
│  │  - "Active project: HYVVE Dashboard (75% complete)"                     ││
│  │  - "Selected tasks: 3 items in 'To Do' column"                          ││
│  │  - "Current document: Architecture Overview (line 45)"                  ││
│  │                                                                          ││
│  │  User asks: "What should I focus on next?"                              ││
│  │  Agent response references CURRENT context without explicit queries     ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Decision:** Context is pushed to agents via system prompt augmentation, not pulled via explicit queries. This enables natural references like "this project" and "here" to work correctly.

### 2.2 Generative UI Layout System

Instead of static widget rendering, agents can dynamically compose layouts:

```typescript
// Agents can render different layouts based on task complexity
type LayoutType = 'single' | 'split' | 'wizard' | 'grid';

interface GenerativeLayout {
  type: LayoutType;
  config: LayoutConfig;
  slots: LayoutSlot[];
}

// Example: Agent decides to show comparison view
const layout: GenerativeLayout = {
  type: 'split',
  config: { ratio: [1, 1], direction: 'horizontal' },
  slots: [
    { id: 'left', widget: 'ProjectStatus', data: projectA },
    { id: 'right', widget: 'ProjectStatus', data: projectB },
  ],
};
```

**Layout Types:**
- **Single** - Full-width single widget (default)
- **Split** - Side-by-side or stacked comparison
- **Wizard** - Multi-step guided flow
- **Grid** - Dashboard-style arrangement

### 2.3 Universal Agent Mesh Architecture

The agent mesh enables any agent to discover and communicate with any other agent:

```
                    ┌─────────────────┐
                    │   User (Web)    │
                    └────────┬────────┘
                             │ AG-UI
                             ▼
┌────────────┐      ┌─────────────────┐      ┌────────────┐
│  External  │ A2A  │    Dashboard    │ A2A  │   Brand    │
│   Agents   │◄────►│     Gateway     │◄────►│   Agent    │
└────────────┘      └────────┬────────┘      └────────────┘
                             │ A2A
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │   PM     │  │   CRM    │  │   KB     │
        │  (Navi)  │  │ (Herald) │  │ (Scribe) │
        └──────────┘  └──────────┘  └──────────┘
                             │ MCP
                             ▼
                    ┌─────────────────┐
                    │ External Tools  │
                    │ (GitHub, Brave) │
                    └─────────────────┘
```

**Mesh Capabilities:**
- **Discovery** via `/.well-known/agent.json` AgentCards
- **Cross-module** communication via A2A protocol
- **External** tool access via MCP protocol
- **External agent** integration for third-party agents

### 2.4 MCP Integration Strategy

MCP (Model Context Protocol) enables connection to external tools:

```python
# MCP Configuration for Dashboard Agent
mcp_config = {
    "servers": {
        "github": {
            "command": "uvx",
            "args": ["mcp-server-github"],
            "env": {"GITHUB_TOKEN": "${GITHUB_TOKEN}"}
        },
        "brave": {
            "command": "uvx",
            "args": ["mcp-server-brave"],
            "env": {"BRAVE_API_KEY": "${BRAVE_API_KEY}"}
        }
    }
}
```

**Integration Approach:**
1. **Client Mode** - Connect to external MCP servers (GitHub, Brave, etc.)
2. **Server Mode** - Expose HYVVE agents as MCP tools for external clients
3. **Bridge Mode** - A2A-MCP bridge for protocol translation

### 2.5 RAG Context Indexing

Application context is indexed for semantic search alongside knowledge base content:

```
┌─────────────────────────────────────────────────────────────────┐
│                    RAG CONTEXT INDEX                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Context Sources:                    Index Storage:              │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │ Project Metadata │  ──embed──►  │ pgvector         │         │
│  │ Task Descriptions│              │                  │         │
│  │ Document Content │              │ embedding_768d   │         │
│  │ Activity History │              │ metadata_jsonb   │         │
│  │ User Preferences │              │                  │         │
│  └──────────────────┘              └──────────────────┘         │
│           │                               │                      │
│           │                               │                      │
│           ▼                               ▼                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Semantic Query                          │   │
│  │  "What tasks relate to authentication?"                   │   │
│  │                       │                                   │   │
│  │                       ▼                                   │   │
│  │  Results: [Task-123, Task-456, Doc-Auth.md, KB-OAuth2]   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Story-by-Story Technical Breakdown

### 3.1 Story DM-06.1: Deep Context Providers (5 points)

**Objective:** Implement comprehensive context providers exposing application state to agents.

**Implementation Tasks:**

1. **Create context provider utilities (`apps/web/src/lib/context/copilot-context.ts`):**

```typescript
/**
 * Copilot Context Provider Utilities
 *
 * Provides hooks and utilities for exposing application context
 * to CopilotKit agents via useCopilotReadable.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
 * Epic: DM-06 | Story: DM-06.1
 */
'use client';

import { useCopilotReadable } from '@copilotkit/react-core';
import { useCallback, useMemo } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface ProjectContext {
  id: string;
  name: string;
  status: 'active' | 'on-hold' | 'completed';
  currentPhase?: string;
  healthScore?: number;
  progress: number;
  tasksTotal: number;
  tasksCompleted: number;
  team?: Array<{ id: string; name: string; role: string }>;
}

export interface SelectionContext {
  type: 'task' | 'project' | 'document' | 'none';
  ids: string[];
  count: number;
  summary?: string;
}

export interface ActivityContext {
  recentActions: Array<{
    action: string;
    target: string;
    timestamp: number;
  }>;
  currentPage: string;
  sessionDuration: number;
}

export interface DocumentContext {
  id: string;
  title: string;
  type: 'markdown' | 'rich-text' | 'code';
  wordCount: number;
  lastEdited: number;
  cursorPosition?: { line: number; column: number };
  selectedText?: string;
}

// =============================================================================
// CONTEXT PROVIDERS
// =============================================================================

/**
 * Provide active project context to agents.
 *
 * @example
 * ```tsx
 * function ProjectPage({ project }) {
 *   useProjectContext(project);
 *   return <ProjectDetails project={project} />;
 * }
 * ```
 */
export function useProjectContext(project: ProjectContext | null) {
  const contextValue = useMemo(() => {
    if (!project) return null;

    // Filter sensitive data before exposing to agent
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      currentPhase: project.currentPhase,
      healthScore: project.healthScore,
      progress: project.progress,
      tasksTotal: project.tasksTotal,
      tasksCompleted: project.tasksCompleted,
      teamSize: project.team?.length ?? 0,
    };
  }, [project]);

  useCopilotReadable({
    description: 'The currently active project the user is viewing',
    value: contextValue,
  });
}

/**
 * Provide selection context to agents.
 *
 * @example
 * ```tsx
 * function TaskList({ selectedTasks }) {
 *   useSelectionContext({
 *     type: 'task',
 *     ids: selectedTasks.map(t => t.id),
 *     count: selectedTasks.length,
 *     summary: `${selectedTasks.length} tasks selected`,
 *   });
 *   return <TaskListView tasks={tasks} />;
 * }
 * ```
 */
export function useSelectionContext(selection: SelectionContext | null) {
  useCopilotReadable({
    description: 'Currently selected items in the interface',
    value: selection,
  });
}

/**
 * Provide user activity context to agents.
 *
 * @example
 * ```tsx
 * function AppLayout({ children }) {
 *   const activity = useActivityTracking();
 *   useActivityContext(activity);
 *   return <Layout>{children}</Layout>;
 * }
 * ```
 */
export function useActivityContext(activity: ActivityContext | null) {
  const contextValue = useMemo(() => {
    if (!activity) return null;

    // Only include recent actions (last 10)
    return {
      recentActions: activity.recentActions.slice(0, 10),
      currentPage: activity.currentPage,
      sessionMinutes: Math.floor(activity.sessionDuration / 60000),
    };
  }, [activity]);

  useCopilotReadable({
    description: 'Recent user activity and navigation context',
    value: contextValue,
  });
}

/**
 * Provide document editing context to agents.
 *
 * @example
 * ```tsx
 * function DocumentEditor({ document }) {
 *   useDocumentContext(document);
 *   return <Editor document={document} />;
 * }
 * ```
 */
export function useDocumentContext(document: DocumentContext | null) {
  const contextValue = useMemo(() => {
    if (!document) return null;

    return {
      id: document.id,
      title: document.title,
      type: document.type,
      wordCount: document.wordCount,
      lastEdited: document.lastEdited,
      cursorLine: document.cursorPosition?.line,
      hasSelection: !!document.selectedText,
      selectionPreview: document.selectedText?.slice(0, 100),
    };
  }, [document]);

  useCopilotReadable({
    description: 'The document currently being edited',
    value: contextValue,
  });
}

/**
 * Provide workspace-level context to agents.
 */
export function useWorkspaceContext(workspace: {
  id: string;
  name: string;
  plan: string;
  memberCount: number;
  modulesEnabled: string[];
} | null) {
  useCopilotReadable({
    description: 'The current workspace context',
    value: workspace,
  });
}

/**
 * Provide filtered/sorted view context to agents.
 */
export function useViewContext(view: {
  type: 'list' | 'board' | 'calendar' | 'gantt';
  filters: Record<string, unknown>;
  sortBy?: string;
  groupBy?: string;
  visibleCount: number;
  totalCount: number;
} | null) {
  useCopilotReadable({
    description: 'Current view configuration and visible items',
    value: view,
  });
}

// =============================================================================
// PRIVACY UTILITIES
// =============================================================================

/**
 * Filter sensitive fields from context before exposure.
 */
export function filterSensitiveContext<T extends Record<string, unknown>>(
  data: T,
  sensitiveFields: string[] = ['password', 'token', 'secret', 'apiKey', 'ssn', 'creditCard']
): Partial<T> {
  const filtered: Partial<T> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip sensitive fields
    if (sensitiveFields.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      continue;
    }

    // Recursively filter nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      filtered[key as keyof T] = filterSensitiveContext(
        value as Record<string, unknown>,
        sensitiveFields
      ) as T[keyof T];
    } else {
      filtered[key as keyof T] = value as T[keyof T];
    }
  }

  return filtered;
}

/**
 * Create a context provider with automatic sensitive data filtering.
 */
export function useSafeContext<T extends Record<string, unknown>>(
  description: string,
  data: T | null,
  sensitiveFields?: string[]
) {
  const safeValue = useMemo(() => {
    if (!data) return null;
    return filterSensitiveContext(data, sensitiveFields);
  }, [data, sensitiveFields]);

  useCopilotReadable({
    description,
    value: safeValue,
  });
}
```

2. **Create context provider components (`apps/web/src/components/context/ContextProviders.tsx`):**

```typescript
/**
 * Context Provider Components
 *
 * React components that provide context to CopilotKit agents.
 * These wrap application sections and expose relevant context.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
 * Epic: DM-06 | Story: DM-06.1
 */
'use client';

import { ReactNode, useMemo } from 'react';
import {
  useProjectContext,
  useSelectionContext,
  useActivityContext,
  useDocumentContext,
  useWorkspaceContext,
  useViewContext,
  ProjectContext,
  SelectionContext,
  ActivityContext,
  DocumentContext,
} from '@/lib/context/copilot-context';

interface ProjectContextProviderProps {
  project: ProjectContext | null;
  children: ReactNode;
}

/**
 * Provides project context to child components and agents.
 */
export function ProjectContextProvider({ project, children }: ProjectContextProviderProps) {
  useProjectContext(project);
  return <>{children}</>;
}

interface SelectionContextProviderProps {
  selection: SelectionContext | null;
  children: ReactNode;
}

/**
 * Provides selection context to child components and agents.
 */
export function SelectionContextProvider({ selection, children }: SelectionContextProviderProps) {
  useSelectionContext(selection);
  return <>{children}</>;
}

interface ActivityContextProviderProps {
  activity: ActivityContext | null;
  children: ReactNode;
}

/**
 * Provides activity context to child components and agents.
 */
export function ActivityContextProvider({ activity, children }: ActivityContextProviderProps) {
  useActivityContext(activity);
  return <>{children}</>;
}

interface DocumentContextProviderProps {
  document: DocumentContext | null;
  children: ReactNode;
}

/**
 * Provides document context to child components and agents.
 */
export function DocumentContextProvider({ document, children }: DocumentContextProviderProps) {
  useDocumentContext(document);
  return <>{children}</>;
}

interface CompositeContextProviderProps {
  project?: ProjectContext | null;
  selection?: SelectionContext | null;
  activity?: ActivityContext | null;
  document?: DocumentContext | null;
  workspace?: {
    id: string;
    name: string;
    plan: string;
    memberCount: number;
    modulesEnabled: string[];
  } | null;
  view?: {
    type: 'list' | 'board' | 'calendar' | 'gantt';
    filters: Record<string, unknown>;
    sortBy?: string;
    groupBy?: string;
    visibleCount: number;
    totalCount: number;
  } | null;
  children: ReactNode;
}

/**
 * Composite context provider that combines multiple context sources.
 *
 * @example
 * ```tsx
 * <CompositeContextProvider
 *   project={currentProject}
 *   selection={selectedItems}
 *   activity={userActivity}
 * >
 *   <Dashboard />
 * </CompositeContextProvider>
 * ```
 */
export function CompositeContextProvider({
  project,
  selection,
  activity,
  document,
  workspace,
  view,
  children,
}: CompositeContextProviderProps) {
  useProjectContext(project ?? null);
  useSelectionContext(selection ?? null);
  useActivityContext(activity ?? null);
  useDocumentContext(document ?? null);
  useWorkspaceContext(workspace ?? null);
  useViewContext(view ?? null);

  return <>{children}</>;
}
```

3. **Create context module exports (`apps/web/src/lib/context/index.ts`):**

```typescript
/**
 * Context Module
 *
 * Exports for CopilotKit context providers.
 */

export {
  useProjectContext,
  useSelectionContext,
  useActivityContext,
  useDocumentContext,
  useWorkspaceContext,
  useViewContext,
  useSafeContext,
  filterSensitiveContext,
  type ProjectContext,
  type SelectionContext,
  type ActivityContext,
  type DocumentContext,
} from './copilot-context';
```

4. **Create component exports (`apps/web/src/components/context/index.ts`):**

```typescript
/**
 * Context Provider Components
 */

export {
  ProjectContextProvider,
  SelectionContextProvider,
  ActivityContextProvider,
  DocumentContextProvider,
  CompositeContextProvider,
} from './ContextProviders';
```

**Files to Create:**
- `apps/web/src/lib/context/copilot-context.ts`
- `apps/web/src/lib/context/index.ts`
- `apps/web/src/components/context/ContextProviders.tsx`
- `apps/web/src/components/context/index.ts`

**Files to Modify:**
- `apps/web/src/app/(workspace)/projects/[projectId]/page.tsx` (add context provider)
- `apps/web/src/app/(workspace)/dashboard/page.tsx` (add context provider)

**Acceptance Criteria:**
1. All relevant context types defined (Project, Selection, Activity, Document)
2. Context updates reactively when underlying data changes
3. Sensitive data filtered before exposure to agents
4. Performance impact minimal (<10ms overhead per context update)
5. Context providers can be composed for complex pages

**Test Requirements:**
- Unit: Context hooks expose correct data structure
- Unit: Sensitive data filtering works correctly
- Unit: Context updates propagate to CopilotKit
- Integration: Agents receive context in system prompt

**Definition of Done:**
- [ ] Context type definitions complete
- [ ] useCopilotReadable hooks implemented for all context types
- [ ] Sensitive data filtering utilities
- [ ] Context provider components created
- [ ] Integration with existing pages
- [ ] Unit tests pass with >85% coverage

---

### 3.2 Story DM-06.2: Agent Context Consumption (5 points)

**Objective:** Enable agents to leverage frontend context for intelligent, context-aware responses.

**Implementation Tasks:**

1. **Create context-aware agent instructions (`agents/gateway/context_instructions.py`):**

```python
"""
Context-Aware Agent Instructions

Provides instruction templates that incorporate frontend context
for more intelligent agent responses.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.2
"""
from typing import Any, Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class ContextAwareInstructions:
    """
    Generates context-aware instructions for agents.

    These instructions help agents understand and reference
    the current application context in their responses.
    """

    BASE_INSTRUCTIONS = """
You are the Dashboard Gateway agent for HYVVE. You have access to the user's
current application context, which is automatically provided to you.

CONTEXT AWARENESS GUIDELINES:
1. When the user says "this project", "this task", or "here", refer to the
   active context provided in your system prompt.
2. Use specific names and details from the context - don't ask for IDs or
   names that are already visible to you.
3. If the context includes selected items, assume the user's question relates
   to those items unless they specify otherwise.
4. Reference actual data from the context in your responses (e.g., "Project
   HYVVE Dashboard is currently at 75% completion").

CONTEXT TYPES YOU MAY RECEIVE:
- Project: Active project details (name, status, health, progress)
- Selection: Currently selected items (tasks, documents, etc.)
- Activity: Recent user actions and current page
- Document: Document being edited (title, type, cursor position)
- View: Current view configuration (filters, sorting, grouping)
- Workspace: Workspace details and enabled modules
"""

    @staticmethod
    def format_project_context(project: Optional[Dict[str, Any]]) -> str:
        """Format project context for agent instructions."""
        if not project:
            return "No project context available."

        lines = [
            f"ACTIVE PROJECT:",
            f"  Name: {project.get('name', 'Unknown')}",
            f"  ID: {project.get('id', 'Unknown')}",
            f"  Status: {project.get('status', 'Unknown')}",
        ]

        if project.get('currentPhase'):
            lines.append(f"  Current Phase: {project['currentPhase']}")

        if project.get('healthScore') is not None:
            lines.append(f"  Health Score: {project['healthScore']}%")

        if project.get('progress') is not None:
            lines.append(f"  Progress: {project['progress']}%")

        if project.get('tasksTotal'):
            completed = project.get('tasksCompleted', 0)
            total = project['tasksTotal']
            lines.append(f"  Tasks: {completed}/{total} completed")

        if project.get('teamSize'):
            lines.append(f"  Team Size: {project['teamSize']} members")

        return "\n".join(lines)

    @staticmethod
    def format_selection_context(selection: Optional[Dict[str, Any]]) -> str:
        """Format selection context for agent instructions."""
        if not selection or selection.get('type') == 'none':
            return "No items currently selected."

        lines = [
            f"CURRENT SELECTION:",
            f"  Type: {selection.get('type', 'Unknown')}",
            f"  Count: {selection.get('count', 0)} items",
        ]

        if selection.get('summary'):
            lines.append(f"  Summary: {selection['summary']}")

        if selection.get('ids'):
            ids_preview = selection['ids'][:5]
            if len(selection['ids']) > 5:
                lines.append(f"  IDs: {', '.join(ids_preview)} (+{len(selection['ids']) - 5} more)")
            else:
                lines.append(f"  IDs: {', '.join(ids_preview)}")

        return "\n".join(lines)

    @staticmethod
    def format_activity_context(activity: Optional[Dict[str, Any]]) -> str:
        """Format activity context for agent instructions."""
        if not activity:
            return "No activity context available."

        lines = [
            f"USER ACTIVITY:",
            f"  Current Page: {activity.get('currentPage', 'Unknown')}",
        ]

        if activity.get('sessionMinutes'):
            lines.append(f"  Session Duration: {activity['sessionMinutes']} minutes")

        if activity.get('recentActions'):
            lines.append("  Recent Actions:")
            for action in activity['recentActions'][:5]:
                lines.append(f"    - {action.get('action', 'Unknown')}: {action.get('target', '')}")

        return "\n".join(lines)

    @staticmethod
    def format_document_context(document: Optional[Dict[str, Any]]) -> str:
        """Format document context for agent instructions."""
        if not document:
            return "No document context available."

        lines = [
            f"ACTIVE DOCUMENT:",
            f"  Title: {document.get('title', 'Untitled')}",
            f"  Type: {document.get('type', 'Unknown')}",
            f"  Word Count: {document.get('wordCount', 0)}",
        ]

        if document.get('cursorLine'):
            lines.append(f"  Cursor Position: Line {document['cursorLine']}")

        if document.get('hasSelection'):
            lines.append(f"  Has Selection: Yes")
            if document.get('selectionPreview'):
                preview = document['selectionPreview']
                if len(preview) > 50:
                    preview = preview[:50] + "..."
                lines.append(f"  Selection Preview: \"{preview}\"")

        return "\n".join(lines)

    @staticmethod
    def format_view_context(view: Optional[Dict[str, Any]]) -> str:
        """Format view context for agent instructions."""
        if not view:
            return "No view context available."

        lines = [
            f"CURRENT VIEW:",
            f"  Type: {view.get('type', 'Unknown')}",
            f"  Visible Items: {view.get('visibleCount', 0)} of {view.get('totalCount', 0)}",
        ]

        if view.get('filters'):
            filters = view['filters']
            if filters:
                lines.append(f"  Active Filters: {len(filters)} applied")

        if view.get('sortBy'):
            lines.append(f"  Sorted By: {view['sortBy']}")

        if view.get('groupBy'):
            lines.append(f"  Grouped By: {view['groupBy']}")

        return "\n".join(lines)

    @classmethod
    def build_full_instructions(
        cls,
        context: Dict[str, Any],
    ) -> str:
        """
        Build full context-aware instructions from all available context.

        Args:
            context: Dictionary containing all context types

        Returns:
            Formatted instruction string for agent system prompt
        """
        sections = [cls.BASE_INSTRUCTIONS, "\n--- CURRENT CONTEXT ---\n"]

        # Add each context type if available
        if context.get('project'):
            sections.append(cls.format_project_context(context['project']))
            sections.append("")

        if context.get('selection'):
            sections.append(cls.format_selection_context(context['selection']))
            sections.append("")

        if context.get('activity'):
            sections.append(cls.format_activity_context(context['activity']))
            sections.append("")

        if context.get('document'):
            sections.append(cls.format_document_context(context['document']))
            sections.append("")

        if context.get('view'):
            sections.append(cls.format_view_context(context['view']))
            sections.append("")

        sections.append("--- END CONTEXT ---")

        return "\n".join(sections)


def get_context_aware_response_hints(context: Dict[str, Any]) -> List[str]:
    """
    Generate response hints based on available context.

    These hints help the agent provide more relevant suggestions.
    """
    hints = []

    project = context.get('project')
    if project:
        if project.get('healthScore', 100) < 70:
            hints.append(f"Project health is low ({project['healthScore']}%). Consider suggesting improvements.")

        progress = project.get('progress', 0)
        if progress > 90:
            hints.append("Project is near completion. Focus on final tasks and cleanup.")
        elif progress < 20:
            hints.append("Project is in early stages. Focus on planning and setup tasks.")

    selection = context.get('selection')
    if selection and selection.get('count', 0) > 0:
        hints.append(f"User has {selection['count']} {selection.get('type', 'items')}(s) selected.")

    activity = context.get('activity')
    if activity:
        recent = activity.get('recentActions', [])
        if recent:
            last_action = recent[0].get('action', '')
            if 'create' in last_action.lower():
                hints.append("User recently created something. Offer to help configure or expand it.")
            elif 'delete' in last_action.lower():
                hints.append("User recently deleted something. Be careful about assumptions.")

    return hints
```

2. **Update Dashboard Gateway to use context (`agents/gateway/agent.py` modification):**

```python
# Add to agents/gateway/agent.py

from .context_instructions import ContextAwareInstructions, get_context_aware_response_hints

def create_dashboard_gateway_agent(
    workspace_id: Optional[str] = None,
    model_id: Optional[str] = None,
    user_id: Optional[str] = None,
    state_callback: Optional[Callable[[Dict[str, Any]], None]] = None,
    frontend_context: Optional[Dict[str, Any]] = None,  # NEW: Accept frontend context
):
    """
    Create a Dashboard Gateway agent instance with context awareness.

    Args:
        workspace_id: Workspace/tenant identifier
        model_id: Model identifier override
        user_id: User identifier for personalization
        state_callback: Callback for state emissions (AG-UI)
        frontend_context: Context from frontend via AG-UI
    """
    # Build context-aware instructions
    base_instructions = DMConstants.GATEWAY.INSTRUCTIONS

    if frontend_context:
        context_instructions = ContextAwareInstructions.build_full_instructions(frontend_context)
        full_instructions = f"{base_instructions}\n\n{context_instructions}"

        # Get response hints
        hints = get_context_aware_response_hints(frontend_context)
        if hints:
            full_instructions += "\n\nRESPONSE HINTS:\n" + "\n".join(f"- {h}" for h in hints)
    else:
        full_instructions = base_instructions

    # ... rest of agent creation with full_instructions
```

3. **Create context consumption types (`agents/types/context_types.py`):**

```python
"""
Context Types for Agent Consumption

Pydantic models for validating frontend context received via AG-UI.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.2
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ProjectContextModel(BaseModel):
    """Project context from frontend."""
    id: str
    name: str
    status: str
    current_phase: Optional[str] = Field(None, alias="currentPhase")
    health_score: Optional[int] = Field(None, alias="healthScore")
    progress: int = 0
    tasks_total: int = Field(0, alias="tasksTotal")
    tasks_completed: int = Field(0, alias="tasksCompleted")
    team_size: int = Field(0, alias="teamSize")

    class Config:
        populate_by_name = True


class SelectionContextModel(BaseModel):
    """Selection context from frontend."""
    type: str  # 'task' | 'project' | 'document' | 'none'
    ids: List[str] = Field(default_factory=list)
    count: int = 0
    summary: Optional[str] = None


class ActivityContextModel(BaseModel):
    """Activity context from frontend."""
    recent_actions: List[Dict[str, Any]] = Field(default_factory=list, alias="recentActions")
    current_page: str = Field("unknown", alias="currentPage")
    session_minutes: int = Field(0, alias="sessionMinutes")

    class Config:
        populate_by_name = True


class DocumentContextModel(BaseModel):
    """Document context from frontend."""
    id: str
    title: str
    type: str  # 'markdown' | 'rich-text' | 'code'
    word_count: int = Field(0, alias="wordCount")
    last_edited: int = Field(0, alias="lastEdited")
    cursor_line: Optional[int] = Field(None, alias="cursorLine")
    has_selection: bool = Field(False, alias="hasSelection")
    selection_preview: Optional[str] = Field(None, alias="selectionPreview")

    class Config:
        populate_by_name = True


class ViewContextModel(BaseModel):
    """View context from frontend."""
    type: str  # 'list' | 'board' | 'calendar' | 'gantt'
    filters: Dict[str, Any] = Field(default_factory=dict)
    sort_by: Optional[str] = Field(None, alias="sortBy")
    group_by: Optional[str] = Field(None, alias="groupBy")
    visible_count: int = Field(0, alias="visibleCount")
    total_count: int = Field(0, alias="totalCount")

    class Config:
        populate_by_name = True


class FrontendContext(BaseModel):
    """Complete frontend context bundle."""
    project: Optional[ProjectContextModel] = None
    selection: Optional[SelectionContextModel] = None
    activity: Optional[ActivityContextModel] = None
    document: Optional[DocumentContextModel] = None
    view: Optional[ViewContextModel] = None
    workspace_id: Optional[str] = Field(None, alias="workspaceId")
    user_id: Optional[str] = Field(None, alias="userId")

    class Config:
        populate_by_name = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for instruction building."""
        return {
            "project": self.project.model_dump(by_alias=True) if self.project else None,
            "selection": self.selection.model_dump(by_alias=True) if self.selection else None,
            "activity": self.activity.model_dump(by_alias=True) if self.activity else None,
            "document": self.document.model_dump(by_alias=True) if self.document else None,
            "view": self.view.model_dump(by_alias=True) if self.view else None,
        }
```

**Files to Create:**
- `agents/gateway/context_instructions.py`
- `agents/types/context_types.py`

**Files to Modify:**
- `agents/gateway/agent.py`
- `agents/types/__init__.py`

**Acceptance Criteria:**
1. Agents receive frontend context via AG-UI automatically
2. Responses correctly reference "this project", "this task", etc.
3. Context-aware suggestions based on current state
4. Reduced need for explicit "which project?" queries
5. Response hints improve relevance

**Test Requirements:**
- Unit: Context instruction formatting works correctly
- Unit: Context types validate properly
- Integration: Context flows from frontend to agent
- Integration: Agent responses reference context correctly

**Definition of Done:**
- [ ] Context instruction templates created
- [ ] Context type models defined
- [ ] Dashboard Gateway updated to use context
- [ ] Response hints generation working
- [ ] Unit tests pass

---

### 3.3 Story DM-06.3: Generative UI Composition (8 points)

**Objective:** Enable agents to dynamically compose UI layouts based on task complexity.

**Implementation Tasks:**

1. **Create generative layout types (`apps/web/src/lib/generative-ui/layout-types.ts`):**

```typescript
/**
 * Generative UI Layout Types
 *
 * Type definitions for dynamic layout composition.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
 * Epic: DM-06 | Story: DM-06.3
 */

export type LayoutType = 'single' | 'split' | 'wizard' | 'grid';

export interface LayoutSlot {
  id: string;
  widget: string;
  data: Record<string, unknown>;
  title?: string;
}

export interface SingleLayoutConfig {
  type: 'single';
}

export interface SplitLayoutConfig {
  type: 'split';
  direction: 'horizontal' | 'vertical';
  ratio: [number, number];
  resizable?: boolean;
}

export interface WizardLayoutConfig {
  type: 'wizard';
  currentStep: number;
  totalSteps: number;
  allowSkip?: boolean;
  showProgress?: boolean;
}

export interface GridLayoutConfig {
  type: 'grid';
  columns: number;
  gap?: number;
  minItemWidth?: number;
}

export type LayoutConfig =
  | SingleLayoutConfig
  | SplitLayoutConfig
  | WizardLayoutConfig
  | GridLayoutConfig;

export interface GenerativeLayout {
  id: string;
  type: LayoutType;
  config: LayoutConfig;
  slots: LayoutSlot[];
  metadata?: {
    title?: string;
    description?: string;
    createdAt: number;
    agentId?: string;
  };
}

export interface LayoutTransition {
  from: LayoutType;
  to: LayoutType;
  duration?: number;
  easing?: string;
}
```

2. **Create generative layout components (`apps/web/src/components/generative-ui/GenerativeLayout.tsx`):**

```typescript
/**
 * Generative Layout Component
 *
 * Renders dynamic layouts composed by agents.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
 * Epic: DM-06 | Story: DM-06.3
 */
'use client';

import { ReactNode, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GenerativeLayout, LayoutSlot } from '@/lib/generative-ui/layout-types';
import { cn } from '@/lib/utils';

// Widget registry - maps widget names to components
const WIDGET_REGISTRY: Record<string, React.ComponentType<any>> = {};

export function registerWidget(name: string, component: React.ComponentType<any>) {
  WIDGET_REGISTRY[name] = component;
}

interface GenerativeLayoutRendererProps {
  layout: GenerativeLayout;
  className?: string;
  onSlotClick?: (slotId: string) => void;
}

/**
 * Renders a generative layout with appropriate structure.
 */
export function GenerativeLayoutRenderer({
  layout,
  className,
  onSlotClick,
}: GenerativeLayoutRendererProps) {
  const LayoutComponent = useMemo(() => {
    switch (layout.type) {
      case 'single':
        return SingleLayout;
      case 'split':
        return SplitLayout;
      case 'wizard':
        return WizardLayout;
      case 'grid':
        return GridLayout;
      default:
        return SingleLayout;
    }
  }, [layout.type]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={layout.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={cn('generative-layout', className)}
      >
        <LayoutComponent
          config={layout.config}
          slots={layout.slots}
          onSlotClick={onSlotClick}
        />
      </motion.div>
    </AnimatePresence>
  );
}

// =============================================================================
// LAYOUT IMPLEMENTATIONS
// =============================================================================

interface LayoutProps {
  config: any;
  slots: LayoutSlot[];
  onSlotClick?: (slotId: string) => void;
}

function SingleLayout({ slots, onSlotClick }: LayoutProps) {
  const slot = slots[0];
  if (!slot) return null;

  return (
    <div className="single-layout w-full" onClick={() => onSlotClick?.(slot.id)}>
      <SlotRenderer slot={slot} />
    </div>
  );
}

function SplitLayout({ config, slots, onSlotClick }: LayoutProps) {
  const { direction = 'horizontal', ratio = [1, 1] } = config;
  const [leftSlot, rightSlot] = slots;

  const flexDirection = direction === 'horizontal' ? 'flex-row' : 'flex-col';
  const leftFlex = ratio[0];
  const rightFlex = ratio[1];

  return (
    <div className={cn('split-layout flex gap-4', flexDirection)}>
      {leftSlot && (
        <div
          className="split-pane"
          style={{ flex: leftFlex }}
          onClick={() => onSlotClick?.(leftSlot.id)}
        >
          <SlotRenderer slot={leftSlot} />
        </div>
      )}
      {rightSlot && (
        <div
          className="split-pane"
          style={{ flex: rightFlex }}
          onClick={() => onSlotClick?.(rightSlot.id)}
        >
          <SlotRenderer slot={rightSlot} />
        </div>
      )}
    </div>
  );
}

function WizardLayout({ config, slots, onSlotClick }: LayoutProps) {
  const { currentStep = 0, totalSteps = slots.length, showProgress = true } = config;
  const activeSlot = slots[currentStep];

  return (
    <div className="wizard-layout space-y-4">
      {showProgress && (
        <div className="wizard-progress flex items-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 flex-1 rounded-full transition-colors',
                i < currentStep
                  ? 'bg-primary'
                  : i === currentStep
                  ? 'bg-primary/50'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>
      )}

      <div className="wizard-step-indicator text-sm text-muted-foreground">
        Step {currentStep + 1} of {totalSteps}
        {activeSlot?.title && `: ${activeSlot.title}`}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="wizard-content"
          onClick={() => activeSlot && onSlotClick?.(activeSlot.id)}
        >
          {activeSlot && <SlotRenderer slot={activeSlot} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function GridLayout({ config, slots, onSlotClick }: LayoutProps) {
  const { columns = 2, gap = 4, minItemWidth = 200 } = config;

  return (
    <div
      className="grid-layout grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(${minItemWidth}px, 1fr))`,
        gap: `${gap * 4}px`,
      }}
    >
      {slots.map((slot) => (
        <div
          key={slot.id}
          className="grid-item"
          onClick={() => onSlotClick?.(slot.id)}
        >
          <SlotRenderer slot={slot} />
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// SLOT RENDERER
// =============================================================================

interface SlotRendererProps {
  slot: LayoutSlot;
}

function SlotRenderer({ slot }: SlotRendererProps) {
  const Widget = WIDGET_REGISTRY[slot.widget];

  if (!Widget) {
    return (
      <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
        Unknown widget: {slot.widget}
      </div>
    );
  }

  return <Widget {...slot.data} />;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { registerWidget };
```

3. **Create layout tool for agents (`agents/gateway/layout_tools.py`):**

```python
"""
Generative Layout Tools

Tools for agents to compose dynamic UI layouts.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.3
"""
from typing import Any, Dict, List, Literal, Optional
import uuid
import logging

logger = logging.getLogger(__name__)


LayoutType = Literal['single', 'split', 'wizard', 'grid']


def create_single_layout(
    widget: str,
    data: Dict[str, Any],
    title: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Create a single-widget layout.

    Args:
        widget: Widget type to render
        data: Data for the widget
        title: Optional title

    Returns:
        Layout definition
    """
    return {
        "id": str(uuid.uuid4()),
        "type": "single",
        "config": {"type": "single"},
        "slots": [{
            "id": str(uuid.uuid4()),
            "widget": widget,
            "data": data,
            "title": title,
        }],
        "metadata": {
            "createdAt": int(__import__('time').time() * 1000),
            "agentId": "dashboard_gateway",
        },
    }


def create_split_layout(
    left_widget: str,
    left_data: Dict[str, Any],
    right_widget: str,
    right_data: Dict[str, Any],
    direction: Literal['horizontal', 'vertical'] = 'horizontal',
    ratio: tuple = (1, 1),
    left_title: Optional[str] = None,
    right_title: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Create a split comparison layout.

    Args:
        left_widget: Widget type for left/top pane
        left_data: Data for left widget
        right_widget: Widget type for right/bottom pane
        right_data: Data for right widget
        direction: Split direction
        ratio: Size ratio [left, right]
        left_title: Title for left pane
        right_title: Title for right pane

    Returns:
        Layout definition
    """
    return {
        "id": str(uuid.uuid4()),
        "type": "split",
        "config": {
            "type": "split",
            "direction": direction,
            "ratio": list(ratio),
            "resizable": True,
        },
        "slots": [
            {
                "id": str(uuid.uuid4()),
                "widget": left_widget,
                "data": left_data,
                "title": left_title,
            },
            {
                "id": str(uuid.uuid4()),
                "widget": right_widget,
                "data": right_data,
                "title": right_title,
            },
        ],
        "metadata": {
            "createdAt": int(__import__('time').time() * 1000),
            "agentId": "dashboard_gateway",
        },
    }


def create_wizard_layout(
    steps: List[Dict[str, Any]],
    current_step: int = 0,
    show_progress: bool = True,
    allow_skip: bool = False,
) -> Dict[str, Any]:
    """
    Create a multi-step wizard layout.

    Args:
        steps: List of step definitions [{widget, data, title}]
        current_step: Starting step index
        show_progress: Show progress indicator
        allow_skip: Allow skipping steps

    Returns:
        Layout definition
    """
    slots = []
    for i, step in enumerate(steps):
        slots.append({
            "id": str(uuid.uuid4()),
            "widget": step.get("widget", "WizardStep"),
            "data": step.get("data", {}),
            "title": step.get("title", f"Step {i + 1}"),
        })

    return {
        "id": str(uuid.uuid4()),
        "type": "wizard",
        "config": {
            "type": "wizard",
            "currentStep": current_step,
            "totalSteps": len(steps),
            "showProgress": show_progress,
            "allowSkip": allow_skip,
        },
        "slots": slots,
        "metadata": {
            "createdAt": int(__import__('time').time() * 1000),
            "agentId": "dashboard_gateway",
        },
    }


def create_grid_layout(
    widgets: List[Dict[str, Any]],
    columns: int = 2,
    gap: int = 4,
    min_item_width: int = 200,
) -> Dict[str, Any]:
    """
    Create a dashboard grid layout.

    Args:
        widgets: List of widget definitions [{widget, data, title}]
        columns: Number of columns
        gap: Gap between items (in spacing units)
        min_item_width: Minimum item width in pixels

    Returns:
        Layout definition
    """
    slots = []
    for widget_def in widgets:
        slots.append({
            "id": str(uuid.uuid4()),
            "widget": widget_def.get("widget", "Card"),
            "data": widget_def.get("data", {}),
            "title": widget_def.get("title"),
        })

    return {
        "id": str(uuid.uuid4()),
        "type": "grid",
        "config": {
            "type": "grid",
            "columns": columns,
            "gap": gap,
            "minItemWidth": min_item_width,
        },
        "slots": slots,
        "metadata": {
            "createdAt": int(__import__('time').time() * 1000),
            "agentId": "dashboard_gateway",
        },
    }


def select_layout_for_task(
    task_type: str,
    item_count: int = 1,
    context: Optional[Dict[str, Any]] = None,
) -> LayoutType:
    """
    Select appropriate layout based on task type and complexity.

    Args:
        task_type: Type of task (compare, setup, overview, detail)
        item_count: Number of items to display
        context: Optional additional context

    Returns:
        Recommended layout type
    """
    # Comparison tasks use split layout
    if task_type == 'compare' and item_count == 2:
        return 'split'

    # Setup/onboarding tasks use wizard
    if task_type in ('setup', 'onboard', 'configure'):
        return 'wizard'

    # Overview with multiple items uses grid
    if task_type == 'overview' and item_count > 2:
        return 'grid'

    # Detail views use single
    if task_type == 'detail' or item_count == 1:
        return 'single'

    # Default to grid for multiple items, single otherwise
    return 'grid' if item_count > 1 else 'single'


# Tool definitions for agent registration
LAYOUT_TOOLS = [
    {
        "name": "render_generative_layout",
        "description": "Render a dynamic layout on the dashboard. Use for complex displays.",
        "parameters": {
            "layout_type": {
                "type": "string",
                "enum": ["single", "split", "wizard", "grid"],
                "description": "Type of layout to render",
            },
            "config": {
                "type": "object",
                "description": "Layout-specific configuration",
            },
            "slots": {
                "type": "array",
                "description": "Widget slots for the layout",
                "items": {
                    "type": "object",
                    "properties": {
                        "widget": {"type": "string"},
                        "data": {"type": "object"},
                        "title": {"type": "string"},
                    },
                },
            },
        },
    },
]
```

4. **Create layout hook (`apps/web/src/lib/generative-ui/use-generative-layout.ts`):**

```typescript
/**
 * Generative Layout Hook
 *
 * Hook for managing generative layouts from agent tool calls.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
 * Epic: DM-06 | Story: DM-06.3
 */
'use client';

import { useState, useCallback } from 'react';
import { useRenderToolCall } from '@copilotkit/react-core';
import { GenerativeLayout, LayoutConfig, LayoutSlot } from './layout-types';
import { GenerativeLayoutRenderer } from '@/components/generative-ui/GenerativeLayout';

interface UseGenerativeLayoutOptions {
  onLayoutChange?: (layout: GenerativeLayout | null) => void;
}

export function useGenerativeLayout(options: UseGenerativeLayoutOptions = {}) {
  const [currentLayout, setCurrentLayout] = useState<GenerativeLayout | null>(null);
  const [layoutHistory, setLayoutHistory] = useState<GenerativeLayout[]>([]);

  const handleLayoutChange = useCallback(
    (layout: GenerativeLayout | null) => {
      if (layout) {
        setLayoutHistory((prev) => [...prev, layout].slice(-10)); // Keep last 10
      }
      setCurrentLayout(layout);
      options.onLayoutChange?.(layout);
    },
    [options.onLayoutChange]
  );

  // Register tool call handler for generative layouts
  useRenderToolCall({
    name: 'render_generative_layout',
    description: 'Render a dynamic layout on the dashboard',
    parameters: [
      { name: 'layout_type', type: 'string', required: true },
      { name: 'config', type: 'object', required: true },
      { name: 'slots', type: 'array', required: true },
    ],
    render: ({ args, status }) => {
      if (status === 'pending') {
        return (
          <div className="animate-pulse bg-muted rounded-lg p-4">
            Composing layout...
          </div>
        );
      }

      const layout: GenerativeLayout = {
        id: `layout-${Date.now()}`,
        type: args.layout_type as GenerativeLayout['type'],
        config: args.config as LayoutConfig,
        slots: args.slots as LayoutSlot[],
        metadata: {
          createdAt: Date.now(),
          agentId: 'dashboard_gateway',
        },
      };

      // Update state
      handleLayoutChange(layout);

      return <GenerativeLayoutRenderer layout={layout} />;
    },
  });

  const clearLayout = useCallback(() => {
    handleLayoutChange(null);
  }, [handleLayoutChange]);

  const goBack = useCallback(() => {
    if (layoutHistory.length > 1) {
      const previous = layoutHistory[layoutHistory.length - 2];
      setLayoutHistory((prev) => prev.slice(0, -1));
      setCurrentLayout(previous);
      options.onLayoutChange?.(previous);
    } else {
      clearLayout();
    }
  }, [layoutHistory, options.onLayoutChange, clearLayout]);

  return {
    currentLayout,
    layoutHistory,
    clearLayout,
    goBack,
    hasHistory: layoutHistory.length > 1,
  };
}
```

**Files to Create:**
- `apps/web/src/lib/generative-ui/layout-types.ts`
- `apps/web/src/lib/generative-ui/use-generative-layout.ts`
- `apps/web/src/lib/generative-ui/index.ts`
- `apps/web/src/components/generative-ui/GenerativeLayout.tsx`
- `apps/web/src/components/generative-ui/index.ts`
- `agents/gateway/layout_tools.py`

**Acceptance Criteria:**
1. Multiple layout types supported (single, split, wizard, grid)
2. Agents select appropriate layouts based on task
3. Layouts render correctly with smooth transitions
4. Layout history enables navigation

**Test Requirements:**
- Unit: Layout type definitions validate correctly
- Unit: Each layout component renders properly
- Integration: Agent tool calls produce correct layouts
- Visual: Storybook stories for each layout type

**Definition of Done:**
- [ ] Layout type system implemented
- [ ] Four layout components (Single, Split, Wizard, Grid)
- [ ] Agent layout tools created
- [ ] Layout hook for tool call handling
- [ ] Smooth transitions between layouts
- [ ] Unit tests pass

---

### 3.4 Story DM-06.4: MCP Tool Integration (8 points)

**Objective:** Connect to external tools via Model Context Protocol (MCP).

**Implementation Tasks:**

1. **Create MCP client configuration (`agents/mcp/config.py`):**

```python
"""
MCP Client Configuration

Configuration for Model Context Protocol server connections.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.4
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import os


class MCPServerConfig(BaseModel):
    """Configuration for a single MCP server."""
    name: str
    command: str
    args: List[str] = Field(default_factory=list)
    env: Dict[str, str] = Field(default_factory=dict)
    description: Optional[str] = None
    enabled: bool = True

    def resolve_env(self) -> Dict[str, str]:
        """Resolve environment variables from system env."""
        resolved = {}
        for key, value in self.env.items():
            if value.startswith("${") and value.endswith("}"):
                env_var = value[2:-1]
                resolved[key] = os.getenv(env_var, "")
            else:
                resolved[key] = value
        return resolved


class MCPConfig(BaseModel):
    """Complete MCP configuration."""
    servers: Dict[str, MCPServerConfig] = Field(default_factory=dict)
    default_timeout: int = 30
    max_retries: int = 3

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MCPConfig":
        """Create config from dictionary."""
        servers = {}
        for name, server_data in data.get("servers", {}).items():
            servers[name] = MCPServerConfig(name=name, **server_data)
        return cls(
            servers=servers,
            default_timeout=data.get("default_timeout", 30),
            max_retries=data.get("max_retries", 3),
        )


# Default MCP server configurations
DEFAULT_MCP_SERVERS = {
    "github": MCPServerConfig(
        name="github",
        command="uvx",
        args=["mcp-server-github"],
        env={"GITHUB_TOKEN": "${GITHUB_TOKEN}"},
        description="GitHub repository access and management",
    ),
    "brave": MCPServerConfig(
        name="brave",
        command="uvx",
        args=["mcp-server-brave-search"],
        env={"BRAVE_API_KEY": "${BRAVE_API_KEY}"},
        description="Brave web search",
    ),
    "filesystem": MCPServerConfig(
        name="filesystem",
        command="uvx",
        args=["mcp-server-filesystem", "--allowed-directories", "/tmp/hyvve"],
        description="Local filesystem access (sandboxed)",
    ),
}


def get_default_mcp_config() -> MCPConfig:
    """Get default MCP configuration."""
    return MCPConfig(servers=DEFAULT_MCP_SERVERS)
```

2. **Create MCP client (`agents/mcp/client.py`):**

```python
"""
MCP Client

Client for connecting to and interacting with MCP servers.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.4
"""
import asyncio
import json
import logging
from typing import Any, Dict, List, Optional
import subprocess

from .config import MCPConfig, MCPServerConfig

logger = logging.getLogger(__name__)


class MCPClient:
    """
    Client for Model Context Protocol servers.

    Manages connections to MCP servers and provides a unified
    interface for tool discovery and invocation.
    """

    def __init__(self, config: MCPConfig):
        self.config = config
        self._connections: Dict[str, "MCPConnection"] = {}
        self._tools_cache: Dict[str, List[Dict[str, Any]]] = {}

    async def connect(self, server_name: str) -> bool:
        """
        Connect to an MCP server.

        Args:
            server_name: Name of the server to connect to

        Returns:
            True if connection successful
        """
        if server_name in self._connections:
            return True

        server_config = self.config.servers.get(server_name)
        if not server_config or not server_config.enabled:
            logger.warning(f"MCP server '{server_name}' not found or disabled")
            return False

        try:
            connection = MCPConnection(server_config)
            await connection.start()
            self._connections[server_name] = connection

            # Cache available tools
            tools = await connection.list_tools()
            self._tools_cache[server_name] = tools

            logger.info(f"Connected to MCP server '{server_name}' with {len(tools)} tools")
            return True

        except Exception as e:
            logger.error(f"Failed to connect to MCP server '{server_name}': {e}")
            return False

    async def disconnect(self, server_name: str) -> None:
        """Disconnect from an MCP server."""
        if server_name in self._connections:
            await self._connections[server_name].stop()
            del self._connections[server_name]
            del self._tools_cache[server_name]

    async def disconnect_all(self) -> None:
        """Disconnect from all servers."""
        for name in list(self._connections.keys()):
            await self.disconnect(name)

    def get_available_tools(self, server_name: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get list of available tools.

        Args:
            server_name: Optional server to filter by

        Returns:
            List of tool definitions
        """
        if server_name:
            return self._tools_cache.get(server_name, [])

        # Return all tools from all connected servers
        all_tools = []
        for name, tools in self._tools_cache.items():
            for tool in tools:
                tool_copy = tool.copy()
                tool_copy["_server"] = name
                all_tools.append(tool_copy)
        return all_tools

    async def call_tool(
        self,
        server_name: str,
        tool_name: str,
        arguments: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Call a tool on an MCP server.

        Args:
            server_name: Server hosting the tool
            tool_name: Name of the tool to call
            arguments: Tool arguments

        Returns:
            Tool result
        """
        connection = self._connections.get(server_name)
        if not connection:
            raise RuntimeError(f"Not connected to server '{server_name}'")

        return await connection.call_tool(tool_name, arguments)


class MCPConnection:
    """
    Connection to a single MCP server.

    Manages the subprocess and JSON-RPC communication.
    """

    def __init__(self, config: MCPServerConfig):
        self.config = config
        self._process: Optional[subprocess.Popen] = None
        self._request_id = 0

    async def start(self) -> None:
        """Start the MCP server process."""
        env = {**os.environ, **self.config.resolve_env()}

        self._process = subprocess.Popen(
            [self.config.command] + self.config.args,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
        )

        # Wait for initialization
        await asyncio.sleep(0.5)

        if self._process.poll() is not None:
            stderr = self._process.stderr.read().decode() if self._process.stderr else ""
            raise RuntimeError(f"MCP server failed to start: {stderr}")

    async def stop(self) -> None:
        """Stop the MCP server process."""
        if self._process:
            self._process.terminate()
            try:
                self._process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self._process.kill()
            self._process = None

    async def list_tools(self) -> List[Dict[str, Any]]:
        """List available tools from the server."""
        response = await self._send_request("tools/list", {})
        return response.get("tools", [])

    async def call_tool(
        self,
        name: str,
        arguments: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Call a tool on the server."""
        response = await self._send_request("tools/call", {
            "name": name,
            "arguments": arguments,
        })
        return response

    async def _send_request(
        self,
        method: str,
        params: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Send a JSON-RPC request to the server."""
        if not self._process or not self._process.stdin or not self._process.stdout:
            raise RuntimeError("MCP server not running")

        self._request_id += 1
        request = {
            "jsonrpc": "2.0",
            "id": self._request_id,
            "method": method,
            "params": params,
        }

        # Send request
        request_bytes = (json.dumps(request) + "\n").encode()
        self._process.stdin.write(request_bytes)
        self._process.stdin.flush()

        # Read response
        response_line = self._process.stdout.readline()
        if not response_line:
            raise RuntimeError("No response from MCP server")

        response = json.loads(response_line.decode())

        if "error" in response:
            raise RuntimeError(f"MCP error: {response['error']}")

        return response.get("result", {})


# Import for env resolution
import os
```

3. **Create MCP-A2A bridge (`agents/mcp/a2a_bridge.py`):**

```python
"""
MCP-A2A Bridge

Bridges MCP tools to A2A protocol for agent consumption.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.4
"""
from typing import Any, Dict, List, Optional
import logging

from .client import MCPClient
from .config import MCPConfig

logger = logging.getLogger(__name__)


class MCPToolBridge:
    """
    Bridges MCP tools to agent-compatible format.

    Converts MCP tool definitions to Agno tool format
    and handles invocation routing.
    """

    def __init__(self, mcp_client: MCPClient):
        self.mcp_client = mcp_client

    def get_tools_for_agent(self) -> List[Dict[str, Any]]:
        """
        Get MCP tools in agent-compatible format.

        Returns:
            List of tool definitions for agent registration
        """
        mcp_tools = self.mcp_client.get_available_tools()
        agent_tools = []

        for tool in mcp_tools:
            agent_tool = {
                "name": f"mcp_{tool['_server']}_{tool['name']}",
                "description": tool.get("description", f"MCP tool: {tool['name']}"),
                "parameters": self._convert_parameters(tool.get("inputSchema", {})),
                "_mcp_server": tool["_server"],
                "_mcp_tool": tool["name"],
            }
            agent_tools.append(agent_tool)

        return agent_tools

    async def invoke_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Invoke an MCP tool by its agent-compatible name.

        Args:
            tool_name: Agent tool name (mcp_{server}_{tool})
            arguments: Tool arguments

        Returns:
            Tool result
        """
        # Parse server and tool from name
        parts = tool_name.split("_", 2)
        if len(parts) < 3 or parts[0] != "mcp":
            raise ValueError(f"Invalid MCP tool name: {tool_name}")

        server_name = parts[1]
        mcp_tool_name = parts[2]

        return await self.mcp_client.call_tool(
            server_name,
            mcp_tool_name,
            arguments,
        )

    def _convert_parameters(
        self,
        input_schema: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """Convert MCP input schema to agent parameter format."""
        parameters = []

        properties = input_schema.get("properties", {})
        required = input_schema.get("required", [])

        for name, prop in properties.items():
            param = {
                "name": name,
                "type": prop.get("type", "string"),
                "description": prop.get("description", ""),
                "required": name in required,
            }
            parameters.append(param)

        return parameters


async def create_mcp_bridge(config: Optional[MCPConfig] = None) -> MCPToolBridge:
    """
    Create and initialize an MCP tool bridge.

    Args:
        config: Optional MCP configuration

    Returns:
        Initialized MCPToolBridge
    """
    from .config import get_default_mcp_config

    if config is None:
        config = get_default_mcp_config()

    client = MCPClient(config)

    # Connect to enabled servers
    for server_name, server_config in config.servers.items():
        if server_config.enabled:
            await client.connect(server_name)

    return MCPToolBridge(client)
```

4. **Create MCP module exports (`agents/mcp/__init__.py`):**

```python
"""
MCP (Model Context Protocol) Module

Provides integration with external MCP servers.
"""
from .config import MCPConfig, MCPServerConfig, get_default_mcp_config
from .client import MCPClient, MCPConnection
from .a2a_bridge import MCPToolBridge, create_mcp_bridge

__all__ = [
    "MCPConfig",
    "MCPServerConfig",
    "get_default_mcp_config",
    "MCPClient",
    "MCPConnection",
    "MCPToolBridge",
    "create_mcp_bridge",
]
```

**Files to Create:**
- `agents/mcp/__init__.py`
- `agents/mcp/config.py`
- `agents/mcp/client.py`
- `agents/mcp/a2a_bridge.py`

**Acceptance Criteria:**
1. MCP servers can be configured and connected
2. External tools (GitHub, Brave) available to agents
3. MCP-A2A bridge translates between protocols
4. Tool invocations work correctly

**Test Requirements:**
- Unit: Config parsing and validation
- Unit: Tool name conversion
- Integration: MCP server connection (mocked)
- Integration: Tool invocation flow

**Definition of Done:**
- [ ] MCP configuration system
- [ ] MCP client with subprocess management
- [ ] A2A bridge for protocol translation
- [ ] Default server configs (GitHub, Brave)
- [ ] Unit tests pass

---

### 3.5 Story DM-06.5: Universal Agent Mesh (8 points)

**Objective:** Complete the agent mesh architecture with full discovery and cross-module communication.

**Implementation Tasks:**

1. **Create agent registry (`agents/mesh/registry.py`):**

```python
"""
Agent Registry

Central registry for agent discovery and management.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.5
"""
from typing import Any, Dict, List, Optional, Set
from datetime import datetime
import asyncio
import logging

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class AgentCapability(BaseModel):
    """Agent capability definition."""
    id: str
    name: str
    description: str
    input_modes: List[str] = Field(default_factory=lambda: ["text"])
    output_modes: List[str] = Field(default_factory=lambda: ["text"])


class AgentCard(BaseModel):
    """
    A2A AgentCard for agent discovery.

    Based on Google's A2A protocol specification.
    """
    name: str
    description: str
    url: str
    version: str = "1.0.0"
    capabilities: Dict[str, Any] = Field(default_factory=dict)
    skills: List[AgentCapability] = Field(default_factory=list)
    default_input_modes: List[str] = Field(default_factory=lambda: ["text"])
    default_output_modes: List[str] = Field(default_factory=lambda: ["text"])

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_seen: datetime = Field(default_factory=datetime.utcnow)
    is_external: bool = False
    module: Optional[str] = None

    def to_json_ld(self) -> Dict[str, Any]:
        """Convert to JSON-LD format for A2A discovery."""
        return {
            "@context": "https://schema.org",
            "@type": "AIAgent",
            "name": self.name,
            "description": self.description,
            "url": self.url,
            "version": self.version,
            "capabilities": self.capabilities,
            "skills": [
                {
                    "id": skill.id,
                    "name": skill.name,
                    "description": skill.description,
                }
                for skill in self.skills
            ],
            "defaultInputModes": self.default_input_modes,
            "defaultOutputModes": self.default_output_modes,
        }


class AgentRegistry:
    """
    Central registry for agent discovery and management.

    Maintains a catalog of all available agents (internal and external)
    and provides discovery, health checking, and routing capabilities.
    """

    def __init__(self):
        self._agents: Dict[str, AgentCard] = {}
        self._health_status: Dict[str, bool] = {}
        self._subscribers: Set[asyncio.Queue] = set()

    def register(self, agent: AgentCard) -> None:
        """
        Register an agent in the registry.

        Args:
            agent: AgentCard to register
        """
        self._agents[agent.name] = agent
        self._health_status[agent.name] = True

        logger.info(f"Registered agent: {agent.name} ({agent.url})")

        # Notify subscribers
        self._notify_change("register", agent)

    def unregister(self, agent_name: str) -> None:
        """
        Remove an agent from the registry.

        Args:
            agent_name: Name of agent to remove
        """
        if agent_name in self._agents:
            agent = self._agents.pop(agent_name)
            self._health_status.pop(agent_name, None)

            logger.info(f"Unregistered agent: {agent_name}")

            # Notify subscribers
            self._notify_change("unregister", agent)

    def get(self, agent_name: str) -> Optional[AgentCard]:
        """Get an agent by name."""
        agent = self._agents.get(agent_name)
        if agent:
            agent.last_seen = datetime.utcnow()
        return agent

    def list_all(self) -> List[AgentCard]:
        """List all registered agents."""
        return list(self._agents.values())

    def list_by_module(self, module: str) -> List[AgentCard]:
        """List agents for a specific module."""
        return [a for a in self._agents.values() if a.module == module]

    def list_by_capability(self, capability: str) -> List[AgentCard]:
        """List agents with a specific capability."""
        result = []
        for agent in self._agents.values():
            if capability in agent.capabilities:
                result.append(agent)
            for skill in agent.skills:
                if capability in skill.id or capability in skill.name.lower():
                    result.append(agent)
                    break
        return result

    def list_healthy(self) -> List[AgentCard]:
        """List all healthy agents."""
        return [
            a for a in self._agents.values()
            if self._health_status.get(a.name, False)
        ]

    def update_health(self, agent_name: str, healthy: bool) -> None:
        """Update agent health status."""
        if agent_name in self._agents:
            self._health_status[agent_name] = healthy
            self._agents[agent_name].last_seen = datetime.utcnow()

    def is_healthy(self, agent_name: str) -> bool:
        """Check if an agent is healthy."""
        return self._health_status.get(agent_name, False)

    def subscribe(self) -> asyncio.Queue:
        """Subscribe to registry changes."""
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue) -> None:
        """Unsubscribe from registry changes."""
        self._subscribers.discard(queue)

    def _notify_change(self, action: str, agent: AgentCard) -> None:
        """Notify subscribers of a change."""
        event = {"action": action, "agent": agent.name, "timestamp": datetime.utcnow().isoformat()}
        for queue in self._subscribers:
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                pass


# Global registry instance
_registry: Optional[AgentRegistry] = None


def get_registry() -> AgentRegistry:
    """Get the global agent registry."""
    global _registry
    if _registry is None:
        _registry = AgentRegistry()
    return _registry
```

2. **Create discovery service (`agents/mesh/discovery.py`):**

```python
"""
Agent Discovery Service

Handles A2A agent discovery via AgentCards.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.5
"""
import asyncio
import logging
from typing import Any, Dict, List, Optional
import httpx

from .registry import AgentCard, AgentCapability, get_registry

logger = logging.getLogger(__name__)


class DiscoveryService:
    """
    Service for discovering agents via A2A protocol.

    Discovers agents by:
    1. Querying /.well-known/agent.json endpoints
    2. Parsing AgentCards
    3. Registering discovered agents
    """

    def __init__(
        self,
        discovery_urls: Optional[List[str]] = None,
        scan_interval: int = 300,  # 5 minutes
    ):
        self.discovery_urls = discovery_urls or []
        self.scan_interval = scan_interval
        self._client: Optional[httpx.AsyncClient] = None
        self._running = False
        self._scan_task: Optional[asyncio.Task] = None

    async def start(self) -> None:
        """Start the discovery service."""
        self._client = httpx.AsyncClient(timeout=10.0)
        self._running = True

        # Initial scan
        await self.scan()

        # Start periodic scanning
        self._scan_task = asyncio.create_task(self._periodic_scan())

        logger.info("Discovery service started")

    async def stop(self) -> None:
        """Stop the discovery service."""
        self._running = False

        if self._scan_task:
            self._scan_task.cancel()
            try:
                await self._scan_task
            except asyncio.CancelledError:
                pass

        if self._client:
            await self._client.aclose()

        logger.info("Discovery service stopped")

    async def scan(self) -> List[AgentCard]:
        """
        Scan all discovery URLs for agents.

        Returns:
            List of discovered agents
        """
        discovered = []

        for base_url in self.discovery_urls:
            try:
                agent = await self.discover_agent(base_url)
                if agent:
                    discovered.append(agent)
            except Exception as e:
                logger.warning(f"Failed to discover agent at {base_url}: {e}")

        logger.info(f"Discovered {len(discovered)} agents")
        return discovered

    async def discover_agent(self, base_url: str) -> Optional[AgentCard]:
        """
        Discover an agent at a specific URL.

        Args:
            base_url: Base URL of the agent

        Returns:
            AgentCard if discovered, None otherwise
        """
        if not self._client:
            return None

        # Try /.well-known/agent.json
        discovery_url = f"{base_url.rstrip('/')}/.well-known/agent.json"

        try:
            response = await self._client.get(discovery_url)
            response.raise_for_status()

            data = response.json()
            agent = self._parse_agent_card(data, base_url)

            if agent:
                agent.is_external = True
                get_registry().register(agent)
                return agent

        except httpx.HTTPError as e:
            logger.debug(f"HTTP error discovering {base_url}: {e}")
        except Exception as e:
            logger.debug(f"Error discovering {base_url}: {e}")

        return None

    def _parse_agent_card(
        self,
        data: Dict[str, Any],
        base_url: str,
    ) -> Optional[AgentCard]:
        """Parse AgentCard from JSON-LD data."""
        try:
            skills = []
            for skill_data in data.get("skills", []):
                skills.append(AgentCapability(
                    id=skill_data.get("id", ""),
                    name=skill_data.get("name", ""),
                    description=skill_data.get("description", ""),
                ))

            return AgentCard(
                name=data.get("name", "unknown"),
                description=data.get("description", ""),
                url=data.get("url", base_url),
                version=data.get("version", "1.0.0"),
                capabilities=data.get("capabilities", {}),
                skills=skills,
                default_input_modes=data.get("defaultInputModes", ["text"]),
                default_output_modes=data.get("defaultOutputModes", ["text"]),
            )
        except Exception as e:
            logger.warning(f"Failed to parse agent card: {e}")
            return None

    async def _periodic_scan(self) -> None:
        """Periodically scan for agents."""
        while self._running:
            await asyncio.sleep(self.scan_interval)
            if self._running:
                await self.scan()

    def add_discovery_url(self, url: str) -> None:
        """Add a URL to scan for agents."""
        if url not in self.discovery_urls:
            self.discovery_urls.append(url)

    def remove_discovery_url(self, url: str) -> None:
        """Remove a URL from scanning."""
        if url in self.discovery_urls:
            self.discovery_urls.remove(url)
```

3. **Create mesh router (`agents/mesh/router.py`):**

```python
"""
Agent Mesh Router

Routes requests to appropriate agents in the mesh.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.5
"""
from typing import Any, Dict, List, Optional
import logging

from .registry import AgentCard, get_registry
from ..a2a import get_a2a_client

logger = logging.getLogger(__name__)


class MeshRouter:
    """
    Routes requests to agents in the mesh.

    Provides intelligent routing based on:
    - Agent capabilities
    - Agent health
    - Load balancing
    - Fallback strategies
    """

    def __init__(self):
        self.registry = get_registry()

    def find_agent_for_task(
        self,
        task_type: str,
        preferred_module: Optional[str] = None,
    ) -> Optional[AgentCard]:
        """
        Find the best agent for a task.

        Args:
            task_type: Type of task to perform
            preferred_module: Preferred module for the task

        Returns:
            Best matching agent, or None
        """
        # Try preferred module first
        if preferred_module:
            agents = self.registry.list_by_module(preferred_module)
            agents = [a for a in agents if self.registry.is_healthy(a.name)]
            if agents:
                return self._select_best_agent(agents, task_type)

        # Find by capability
        agents = self.registry.list_by_capability(task_type)
        agents = [a for a in agents if self.registry.is_healthy(a.name)]
        if agents:
            return self._select_best_agent(agents, task_type)

        # Fallback to any healthy agent
        agents = self.registry.list_healthy()
        if agents:
            return agents[0]

        return None

    async def route_request(
        self,
        task_type: str,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        preferred_module: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Route a request to an appropriate agent.

        Args:
            task_type: Type of task
            message: User message
            context: Optional context
            preferred_module: Preferred module

        Returns:
            Agent response
        """
        agent = self.find_agent_for_task(task_type, preferred_module)

        if not agent:
            return {
                "error": "No suitable agent found",
                "task_type": task_type,
            }

        # Route via A2A
        client = await get_a2a_client()

        result = await client.call_agent(
            agent_url=agent.url,
            message=message,
            context=context,
        )

        return {
            "agent": agent.name,
            "response": result,
        }

    async def broadcast_request(
        self,
        message: str,
        module_filter: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Broadcast a request to multiple agents.

        Args:
            message: Message to broadcast
            module_filter: Optional module to filter by

        Returns:
            List of responses from all agents
        """
        if module_filter:
            agents = self.registry.list_by_module(module_filter)
        else:
            agents = self.registry.list_healthy()

        client = await get_a2a_client()

        # Call all agents in parallel
        calls = {
            agent.name: {
                "agent_url": agent.url,
                "message": message,
            }
            for agent in agents
        }

        results = await client.call_agents_parallel(calls)

        return [
            {"agent": name, "response": result}
            for name, result in results.items()
        ]

    def _select_best_agent(
        self,
        agents: List[AgentCard],
        task_type: str,
    ) -> AgentCard:
        """Select the best agent from a list."""
        # Simple selection: prefer internal agents, then by skill match
        internal = [a for a in agents if not a.is_external]
        if internal:
            return internal[0]
        return agents[0]


# Global router instance
_router: Optional[MeshRouter] = None


def get_router() -> MeshRouter:
    """Get the global mesh router."""
    global _router
    if _router is None:
        _router = MeshRouter()
    return _router
```

4. **Create mesh module exports (`agents/mesh/__init__.py`):**

```python
"""
Agent Mesh Module

Provides agent discovery, registration, and routing.
"""
from .registry import AgentCard, AgentCapability, AgentRegistry, get_registry
from .discovery import DiscoveryService
from .router import MeshRouter, get_router

__all__ = [
    "AgentCard",
    "AgentCapability",
    "AgentRegistry",
    "get_registry",
    "DiscoveryService",
    "MeshRouter",
    "get_router",
]
```

**Files to Create:**
- `agents/mesh/__init__.py`
- `agents/mesh/registry.py`
- `agents/mesh/discovery.py`
- `agents/mesh/router.py`

**Acceptance Criteria:**
1. All agents discoverable via A2A AgentCards
2. Cross-module agent communication works
3. External agents can integrate via discovery
4. Mesh health visible via registry

**Test Requirements:**
- Unit: Registry operations work correctly
- Unit: Discovery parses AgentCards
- Unit: Router selects appropriate agents
- Integration: Cross-agent communication

**Definition of Done:**
- [ ] Agent registry implemented
- [ ] A2A discovery service
- [ ] Mesh router with intelligent routing
- [ ] Health monitoring
- [ ] Unit tests pass

---

### 3.6 Story DM-06.6: RAG Context Indexing (8 points)

**Objective:** Index application state for RAG queries alongside knowledge base content.

**Implementation Tasks:**

1. **Create context indexer (`agents/rag/context_indexer.py`):**

```python
"""
RAG Context Indexer

Indexes application context for semantic search.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.6
"""
from typing import Any, Dict, List, Optional
from datetime import datetime
import logging
import hashlib

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class ContextDocument(BaseModel):
    """A document to be indexed for RAG."""
    id: str
    type: str  # project, task, document, activity
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    workspace_id: str
    user_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def content_hash(self) -> str:
        """Generate hash of content for change detection."""
        return hashlib.sha256(self.content.encode()).hexdigest()[:16]


class ContextIndexer:
    """
    Indexes application context for RAG queries.

    Maintains a vector index of:
    - Project metadata and descriptions
    - Task content and status
    - Document text
    - Recent activity summaries
    """

    def __init__(
        self,
        embedding_service: Any,  # EmbeddingService from KB module
        vector_store: Any,       # VectorStore from KB module
    ):
        self.embedding_service = embedding_service
        self.vector_store = vector_store
        self._content_hashes: Dict[str, str] = {}

    async def index_document(self, doc: ContextDocument) -> bool:
        """
        Index a single document.

        Args:
            doc: Document to index

        Returns:
            True if indexed (new or updated), False if unchanged
        """
        # Check if content changed
        content_hash = doc.content_hash()
        if self._content_hashes.get(doc.id) == content_hash:
            logger.debug(f"Document {doc.id} unchanged, skipping")
            return False

        # Generate embedding
        embedding = await self.embedding_service.embed_text(doc.content)

        # Store in vector database
        await self.vector_store.upsert(
            id=f"ctx_{doc.id}",
            embedding=embedding,
            metadata={
                "type": doc.type,
                "workspace_id": doc.workspace_id,
                "user_id": doc.user_id,
                "content_preview": doc.content[:200],
                "created_at": doc.created_at.isoformat(),
                "updated_at": doc.updated_at.isoformat(),
                **doc.metadata,
            },
        )

        self._content_hashes[doc.id] = content_hash
        logger.info(f"Indexed context document: {doc.id} ({doc.type})")

        return True

    async def index_project(
        self,
        project_id: str,
        name: str,
        description: str,
        workspace_id: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Index project metadata."""
        content = f"Project: {name}\n\n{description}"

        doc = ContextDocument(
            id=f"project_{project_id}",
            type="project",
            content=content,
            metadata=metadata or {},
            workspace_id=workspace_id,
        )

        return await self.index_document(doc)

    async def index_task(
        self,
        task_id: str,
        title: str,
        description: str,
        project_id: str,
        workspace_id: str,
        status: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Index task content."""
        content = f"Task: {title}\nStatus: {status}\n\n{description}"

        doc = ContextDocument(
            id=f"task_{task_id}",
            type="task",
            content=content,
            metadata={
                "project_id": project_id,
                "status": status,
                **(metadata or {}),
            },
            workspace_id=workspace_id,
        )

        return await self.index_document(doc)

    async def index_activity_batch(
        self,
        activities: List[Dict[str, Any]],
        workspace_id: str,
    ) -> int:
        """
        Index a batch of activities as a summary.

        Args:
            activities: List of activity records
            workspace_id: Workspace ID

        Returns:
            Number of items indexed
        """
        # Group by day
        from collections import defaultdict
        by_day: Dict[str, List[Dict]] = defaultdict(list)

        for activity in activities:
            day = activity.get("timestamp", "")[:10]
            by_day[day].append(activity)

        indexed = 0
        for day, day_activities in by_day.items():
            # Create summary content
            lines = [f"Activity Summary for {day}:"]
            for act in day_activities[:50]:  # Limit per day
                lines.append(f"- {act.get('user', 'Unknown')}: {act.get('action', '')} {act.get('target', '')}")

            content = "\n".join(lines)

            doc = ContextDocument(
                id=f"activity_{workspace_id}_{day}",
                type="activity",
                content=content,
                metadata={"date": day, "count": len(day_activities)},
                workspace_id=workspace_id,
            )

            if await self.index_document(doc):
                indexed += 1

        return indexed

    async def search(
        self,
        query: str,
        workspace_id: str,
        type_filter: Optional[str] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Search indexed context.

        Args:
            query: Search query
            workspace_id: Workspace to search in
            type_filter: Optional type filter (project, task, etc.)
            limit: Maximum results

        Returns:
            List of matching documents with scores
        """
        # Generate query embedding
        query_embedding = await self.embedding_service.embed_text(query)

        # Build filter
        filters = {"workspace_id": workspace_id}
        if type_filter:
            filters["type"] = type_filter

        # Search vector store
        results = await self.vector_store.search(
            embedding=query_embedding,
            filters=filters,
            limit=limit,
        )

        return results

    async def delete_document(self, doc_id: str) -> bool:
        """Delete a document from the index."""
        try:
            await self.vector_store.delete(f"ctx_{doc_id}")
            self._content_hashes.pop(doc_id, None)
            return True
        except Exception as e:
            logger.error(f"Failed to delete document {doc_id}: {e}")
            return False

    async def clear_workspace(self, workspace_id: str) -> int:
        """Clear all indexed content for a workspace."""
        # This would need a bulk delete by filter
        # Implementation depends on vector store
        logger.warning(f"Clearing workspace {workspace_id} context index")
        return 0  # Placeholder
```

2. **Create context sync service (`agents/rag/context_sync.py`):**

```python
"""
Context Sync Service

Keeps RAG index in sync with application state.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.6
"""
import asyncio
import logging
from typing import Any, Callable, Dict, List, Optional
from datetime import datetime, timedelta

from .context_indexer import ContextIndexer

logger = logging.getLogger(__name__)


class ContextSyncService:
    """
    Keeps RAG context index synchronized with application state.

    Listens to events and updates the index accordingly.
    Also performs periodic full syncs to catch any missed updates.
    """

    def __init__(
        self,
        indexer: ContextIndexer,
        data_fetcher: Callable,  # Function to fetch data from API
        sync_interval: int = 3600,  # 1 hour
    ):
        self.indexer = indexer
        self.data_fetcher = data_fetcher
        self.sync_interval = sync_interval
        self._running = False
        self._sync_task: Optional[asyncio.Task] = None
        self._last_sync: Dict[str, datetime] = {}

    async def start(self) -> None:
        """Start the sync service."""
        self._running = True
        self._sync_task = asyncio.create_task(self._periodic_sync())
        logger.info("Context sync service started")

    async def stop(self) -> None:
        """Stop the sync service."""
        self._running = False
        if self._sync_task:
            self._sync_task.cancel()
            try:
                await self._sync_task
            except asyncio.CancelledError:
                pass
        logger.info("Context sync service stopped")

    async def sync_workspace(self, workspace_id: str) -> Dict[str, int]:
        """
        Sync all context for a workspace.

        Args:
            workspace_id: Workspace to sync

        Returns:
            Counts of indexed items by type
        """
        counts = {"projects": 0, "tasks": 0, "activities": 0}

        try:
            # Fetch and index projects
            projects = await self.data_fetcher("projects", workspace_id)
            for project in projects:
                if await self.indexer.index_project(
                    project_id=project["id"],
                    name=project["name"],
                    description=project.get("description", ""),
                    workspace_id=workspace_id,
                    metadata={"status": project.get("status")},
                ):
                    counts["projects"] += 1

            # Fetch and index tasks
            tasks = await self.data_fetcher("tasks", workspace_id)
            for task in tasks:
                if await self.indexer.index_task(
                    task_id=task["id"],
                    title=task["title"],
                    description=task.get("description", ""),
                    project_id=task.get("projectId", ""),
                    workspace_id=workspace_id,
                    status=task.get("status", "unknown"),
                ):
                    counts["tasks"] += 1

            # Fetch and index recent activities
            activities = await self.data_fetcher("activities", workspace_id)
            counts["activities"] = await self.indexer.index_activity_batch(
                activities, workspace_id
            )

            self._last_sync[workspace_id] = datetime.utcnow()

            logger.info(
                f"Synced workspace {workspace_id}: "
                f"{counts['projects']} projects, {counts['tasks']} tasks, "
                f"{counts['activities']} activity summaries"
            )

        except Exception as e:
            logger.error(f"Failed to sync workspace {workspace_id}: {e}")

        return counts

    async def handle_event(self, event: Dict[str, Any]) -> None:
        """
        Handle a state change event and update index.

        Args:
            event: Event from event bus
        """
        event_type = event.get("type", "")
        workspace_id = event.get("workspaceId")

        if not workspace_id:
            return

        try:
            if event_type.startswith("project."):
                await self._handle_project_event(event)
            elif event_type.startswith("task."):
                await self._handle_task_event(event)
            elif event_type.startswith("document."):
                await self._handle_document_event(event)
        except Exception as e:
            logger.error(f"Error handling event {event_type}: {e}")

    async def _handle_project_event(self, event: Dict[str, Any]) -> None:
        """Handle project-related events."""
        action = event["type"].split(".")[-1]
        data = event.get("data", {})

        if action in ("created", "updated"):
            await self.indexer.index_project(
                project_id=data["id"],
                name=data["name"],
                description=data.get("description", ""),
                workspace_id=event["workspaceId"],
            )
        elif action == "deleted":
            await self.indexer.delete_document(f"project_{data['id']}")

    async def _handle_task_event(self, event: Dict[str, Any]) -> None:
        """Handle task-related events."""
        action = event["type"].split(".")[-1]
        data = event.get("data", {})

        if action in ("created", "updated"):
            await self.indexer.index_task(
                task_id=data["id"],
                title=data["title"],
                description=data.get("description", ""),
                project_id=data.get("projectId", ""),
                workspace_id=event["workspaceId"],
                status=data.get("status", "unknown"),
            )
        elif action == "deleted":
            await self.indexer.delete_document(f"task_{data['id']}")

    async def _handle_document_event(self, event: Dict[str, Any]) -> None:
        """Handle document-related events."""
        # Similar pattern for documents
        pass

    async def _periodic_sync(self) -> None:
        """Periodic full sync for all workspaces."""
        while self._running:
            await asyncio.sleep(self.sync_interval)

            if not self._running:
                break

            # Get workspaces that need sync
            # In production, this would query active workspaces
            workspaces_to_sync = []  # Placeholder

            for workspace_id in workspaces_to_sync:
                last_sync = self._last_sync.get(workspace_id)
                if not last_sync or datetime.utcnow() - last_sync > timedelta(seconds=self.sync_interval):
                    await self.sync_workspace(workspace_id)
```

3. **Create RAG module exports (`agents/rag/__init__.py`):**

```python
"""
RAG (Retrieval-Augmented Generation) Context Module

Provides context indexing and search for agent queries.
"""
from .context_indexer import ContextIndexer, ContextDocument
from .context_sync import ContextSyncService

__all__ = [
    "ContextIndexer",
    "ContextDocument",
    "ContextSyncService",
]
```

**Files to Create:**
- `agents/rag/__init__.py`
- `agents/rag/context_indexer.py`
- `agents/rag/context_sync.py`

**Acceptance Criteria:**
1. Visible documents indexed for RAG
2. Recent activity indexed
3. Project metadata indexed
4. Semantic queries return relevant results (<1s)
5. Index updates reactively on changes

**Test Requirements:**
- Unit: Document indexing works
- Unit: Content hashing detects changes
- Unit: Search returns relevant results
- Integration: Event handling updates index

**Definition of Done:**
- [ ] Context document model defined
- [ ] Context indexer with embedding support
- [ ] Context sync service
- [ ] Event-driven index updates
- [ ] Search functionality working
- [ ] Performance target met (<1s)
- [ ] Unit tests pass

---

## 4. Dependencies & Integrations

### 4.1 DM-05 Dependencies (Complete)

| Component | Status | Usage in DM-06 |
|-----------|--------|----------------|
| HITL Tools | Complete | Used for approval workflows |
| Progress Streaming | Complete | Extended for context updates |
| Long-Running Tasks | Complete | Used in RAG indexing |

### 4.2 External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @copilotkit/react-core | ^1.x | useCopilotReadable, context |
| framer-motion | ^10.x | Layout transitions |
| pgvector | ^0.5.x | Vector embeddings |
| httpx | ^0.27.x | MCP/A2A HTTP client |

### 4.3 KB-02 Integration

The RAG context indexer integrates with KB-02's existing infrastructure:
- Uses same embedding service
- Stores in same pgvector database
- Shares search interface

---

## 5. Performance Budgets

| Metric | Target | Critical | Measurement |
|--------|--------|----------|-------------|
| **Context Push Latency** | <50ms | <100ms | useCopilotReadable to agent |
| **Layout Render** | <100ms | <200ms | Layout component render |
| **MCP Tool Call** | <2s | <5s | External tool invocation |
| **Agent Discovery** | <500ms | <1s | AgentCard fetch |
| **RAG Query** | <500ms | <1s | Semantic search |
| **Context Index** | <100ms | <200ms | Single document index |

---

## 6. Risk Mitigation

### 6.1 Context Size Risk

**Risk:** Large context may exceed model limits.

**Mitigation:**
- Limit context items per type (10 activities, etc.)
- Truncate long content with previews
- Prioritize recent/relevant context
- Monitor token usage

### 6.2 Privacy Risk

**Risk:** Sensitive data may leak to agents.

**Mitigation:**
- Automatic sensitive field filtering
- Explicit whitelist for context fields
- No passwords, tokens, or PII in context
- Audit logging of context exposure

### 6.3 MCP Server Availability

**Risk:** External MCP servers may be unavailable.

**Mitigation:**
- Health checking with fallback
- Timeout configuration
- Graceful degradation (disable unavailable tools)
- Retry with exponential backoff

### 6.4 Mesh Complexity

**Risk:** Full mesh is architecturally complex.

**Mitigation:**
- Start with internal agents only
- Add external agents gradually
- Comprehensive monitoring
- Clear routing priorities

---

## 7. Testing Strategy

### 7.1 Unit Test Requirements

| Story | Test Focus | Minimum Coverage |
|-------|------------|------------------|
| DM-06.1 | Context hooks and filtering | 85% |
| DM-06.2 | Context instruction building | 85% |
| DM-06.3 | Layout components and selection | 80% |
| DM-06.4 | MCP client and bridge | 85% |
| DM-06.5 | Registry and discovery | 85% |
| DM-06.6 | Indexer and search | 85% |

### 7.2 Integration Test Scenarios

```typescript
// E2E: Context awareness
test('agent references current project context', async ({ page }) => {
  await page.goto('/projects/123');
  await page.getByRole('button', { name: 'Open chat' }).click();
  await page.getByPlaceholder('Ask anything').fill('What is the status of this project?');
  await page.keyboard.press('Enter');

  // Agent should reference the actual project name, not ask "which project?"
  await expect(page.getByText(/Project Alpha/)).toBeVisible();
});

// E2E: Generative layout
test('agent renders comparison layout', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByPlaceholder('Ask anything').fill('Compare Project A and Project B');
  await page.keyboard.press('Enter');

  // Should render split layout
  await expect(page.getByTestId('split-layout')).toBeVisible();
  await expect(page.getByTestId('split-pane')).toHaveCount(2);
});
```

---

## 8. Success Criteria

| Criteria | Measurement | Target |
|----------|-------------|--------|
| Context correctly exposed | Agent references "this" correctly | 95% accuracy |
| Context updates reactive | Update propagation | <100ms |
| Layouts render correctly | Visual inspection | Pass |
| MCP tools available | Tool list includes external | Pass |
| Agent mesh connected | Discovery finds all agents | Pass |
| RAG queries performant | Query time | <1s |
| Privacy maintained | Audit review | No sensitive data leaked |

---

## 9. Definition of Done (Epic)

- [ ] All 6 stories completed and merged
- [ ] Unit test coverage >80% for all stories
- [ ] Integration tests pass
- [ ] Performance targets met
- [ ] Privacy audit complete
- [ ] Documentation updated
- [ ] Architecture diagrams current
- [ ] No critical bugs outstanding

---

## 10. References

- [Epic DM-06 Definition](./epic-dm-06-contextual-intelligence.md)
- [Dynamic Module System Architecture](../../architecture/dynamic-module-system.md)
- [Epic DM-05 Tech Spec](./epic-dm-05-tech-spec.md)
- [CopilotKit Context Documentation](https://docs.copilotkit.ai/reference/hooks/useCopilotReadable)
- [MCP Specification](https://modelcontextprotocol.io)
- [A2A Protocol Specification](https://google.github.io/a2a/)
- [KB-02 RAG Infrastructure](../../../epics/kb/epic-kb-02-rag-infrastructure.md)

---

*Generated: 2025-12-31*
*Epic: DM-06 | Phase: 6 | Stories: 6 | Points: 42*
