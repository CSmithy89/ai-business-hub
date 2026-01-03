# A2A Request Flow

This diagram shows the complete flow of an Agent-to-Agent (A2A) request from the frontend through the agent mesh to specialist agents.

```mermaid
sequenceDiagram
    autonumber
    participant F as Frontend<br/>(Next.js)
    participant C as CopilotKit<br/>Provider
    participant G as Gateway Agent<br/>(AgentOS)
    participant M as Agent Mesh<br/>(Discovery)
    participant N as Navi<br/>(PM Agent)
    participant S as Sage<br/>(Strategy Agent)

    Note over F,S: A2A Request Flow - Dashboard Data Request

    F->>C: User action / page load
    C->>G: AG-UI message<br/>(via WebSocket)

    G->>G: Parse request type
    G->>M: Route to specialists

    par Parallel Agent Calls
        M->>N: Get project status
        M->>S: Get strategic insights
    end

    N-->>M: Project data<br/>(tasks, phases, health)
    S-->>M: Strategy data<br/>(recommendations)

    M-->>G: Aggregated response
    G->>G: Compose widgets
    G-->>C: Widget payloads<br/>(AG-UI response)
    C-->>F: Render widgets

    Note over F,S: Response time: ~200-500ms
```

## Key Components

| Component | Role | Protocol |
|-----------|------|----------|
| Frontend | User interface, renders widgets | HTTP/WS |
| CopilotKit | AI interaction layer | AG-UI |
| Gateway Agent | Request orchestration | A2A |
| Agent Mesh | Discovery and routing | A2A |
| Specialist Agents | Domain-specific processing | A2A |

## Error Handling

```mermaid
sequenceDiagram
    participant F as Frontend
    participant G as Gateway Agent
    participant M as Agent Mesh
    participant A as Agent

    F->>G: Request
    G->>M: Route
    M->>A: Call agent

    alt Agent Timeout
        A--xM: Timeout (5s)
        M-->>G: Fallback response
        G-->>F: Cached/default data
    else Agent Error
        A-->>M: Error response
        M-->>G: Error with context
        G-->>F: ErrorWidget
    end
```

## Related Documentation

- [Dynamic Module System Architecture](../dynamic-module-system.md)
- [Agent Mesh Topology](./agent-mesh-topology.md)
- [HITL Approval Flow](./hitl-approval-flow.md)
