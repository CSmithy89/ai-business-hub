# Epic DM-06: Contextual Intelligence

## Overview

Implement bidirectional knowledge sync and Generative UI composition, enabling agents to understand application context and dynamically compose UI layouts. This epic completes the Universal Agent Mesh vision.

## Scope

### From Architecture Doc (Phase 6)

This epic implements Phase 6 of the Dynamic Module System architecture:
- Bidirectional knowledge sync via `useCopilotReadable`
- Generative UI composition (dynamic layouts)
- Universal Agent Mesh completion
- MCP integration for external tools

## Proposed Stories

### Story DM-06.1: Deep Context Providers

Implement comprehensive context providers:

- Document/page content context
- Selected items context
- User activity context
- Application state context

**Acceptance Criteria:**
- All relevant context exposed
- Context updates reactively
- Sensitive data filtered
- Performance impact minimal

**Points:** 5

### Story DM-06.2: Agent Context Consumption

Agents leverage context for intelligent responses:

- Context available in agent prompts
- Agents reference "this project" correctly
- Context-aware suggestions
- Reduced need for explicit queries

**Acceptance Criteria:**
- Agents receive frontend context
- Responses reference current context
- "This" and "here" work correctly
- Suggestions are contextual

**Points:** 5

### Story DM-06.3: Generative UI Composition

Dynamic layout composition based on content:

- Agents can render `SplitView` layouts
- Agents can render `Wizard` flows
- Agents can render `DashboardGrid` arrangements
- Layout selection based on task complexity

**Acceptance Criteria:**
- Multiple layout types supported
- Agents select appropriate layouts
- Layouts render correctly
- Smooth transitions between layouts

**Points:** 8

### Story DM-06.4: MCP Tool Integration

Connect to external tools via MCP:

- Configure MCP server connections
- Expose GitHub, Brave tools to agents
- Create internal tools as MCP servers
- A2A-MCP bridge for compatibility

**Acceptance Criteria:**
- MCP servers connected
- External tools available to agents
- Internal agents exposed via MCP
- Bridge translates correctly

**Points:** 8

### Story DM-06.5: Universal Agent Mesh

Complete the agent mesh architecture:

- All agents discoverable via A2A
- Cross-module agent communication
- External agent integration
- Mesh monitoring dashboard

**Acceptance Criteria:**
- Agent discovery working
- Cross-module calls functional
- External agents can integrate
- Mesh health visible

**Points:** 8

### Story DM-06.6: RAG Context Indexing

Index application state for RAG queries:

- Index visible documents
- Index recent activity
- Index project metadata
- Semantic search on context

**Acceptance Criteria:**
- Context indexed for RAG
- Semantic queries work
- Index updates reactively
- Query performance < 1s

**Points:** 8

## Total Points: 42

## Dependencies

- DM-05 (HITL and streaming)
- KB-02 (RAG infrastructure)

## Technical Notes

### Context Provider Example

```typescript
// apps/web/src/components/ProjectView.tsx
import { useCopilotReadable } from "@copilotkit/react-core";

export function ProjectView({ project }) {
  useCopilotReadable({
    description: "The currently active project details",
    value: {
      id: project.id,
      name: project.name,
      phase: project.currentPhase,
      health: project.healthScore,
      // Exclude sensitive data
    }
  });

  return <div>...</div>;
}
```

### Universal Agent Mesh

```
                    ┌─────────────────┐
                    │   User (Web)    │
                    └────────┬────────┘
                             │ AG-UI
                             ▼
┌────────────┐      ┌─────────────────┐      ┌────────────┐
│  External  │ A2A  │    Dashboard    │ A2A  │   Brand    │
│   Agents   │◄────►│     Agent       │◄────►│   Agent    │
└────────────┘      └────────┬────────┘      └────────────┘
                             │ A2A
                             ▼
                    ┌─────────────────┐
                    │    PM Agent     │
                    └────────┬────────┘
                             │ MCP
                             ▼
                    ┌─────────────────┐
                    │ External Tools  │
                    │ (GitHub, Brave) │
                    └─────────────────┘
```

### Key Files to Create/Modify

```
apps/web/src/
├── components/
│   └── layouts/
│       ├── GenerativeSplitView.tsx
│       ├── GenerativeWizard.tsx
│       └── GenerativeGrid.tsx
└── providers/
    └── ContextProviders.tsx

apps/agents/
├── mesh/
│   ├── discovery.py
│   └── registry.py
└── mcp/
    ├── client.py
    └── server.py
```

## Risks

1. **Context Size** - Large context may exceed limits
2. **Privacy** - Sensitive data must not leak to agents
3. **Complexity** - Full mesh is architecturally complex

## Success Criteria

- Full context awareness working
- Generative UI adapts to tasks
- Agent mesh fully connected
- MCP tools integrated
- RAG queries performant

## References

- [Dynamic Module System Architecture](../../architecture/dynamic-module-system.md)
- [CopilotKit Context Documentation](https://docs.copilotkit.ai/reference/hooks/useCopilotReadable)
- [MCP Specification](https://modelcontextprotocol.io)
