# Dashboard Data Flow

This diagram shows how data flows from widget requests through agents to final rendering on the dashboard.

```mermaid
flowchart TB
    subgraph Frontend["Frontend (Next.js)"]
        D[Dashboard Page]
        SS[Dashboard State Store<br/>Zustand]
        WG[Widget Grid]
        W1[ProjectOverviewWidget]
        W2[MetricsWidget]
        W3[ActivityWidget]
    end

    subgraph CopilotKit["CopilotKit Layer"]
        CP[CopilotKitProvider]
        CA[useCopilotAction]
        CR[useCopilotReadable]
    end

    subgraph Gateway["Gateway Agent"]
        GA[Dashboard Gateway]
        WC[Widget Composer]
        SC[State Cache]
    end

    subgraph Agents["Specialist Agents"]
        NA[Navi - PM]
        SA[Sage - Strategy]
        CH[Chrono - Timeline]
        SC2[Scribe - KB]
    end

    subgraph Storage["Persistence Layer"]
        RD[(Redis<br/>State Cache)]
        PG[(PostgreSQL<br/>Business Data)]
    end

    D --> SS
    SS --> WG
    WG --> W1 & W2 & W3

    D <--> CP
    CP <--> CA
    CP <--> CR

    CA <-->|AG-UI| GA
    CR -->|Context| GA

    GA --> WC
    GA <--> SC

    WC -->|A2A| NA & SA & CH & SC2
    NA & SA & CH & SC2 -->|Widget Data| WC

    SC <--> RD
    NA & SA & CH & SC2 <--> PG

    style Frontend fill:#e1f5fe
    style CopilotKit fill:#f3e5f5
    style Gateway fill:#fff3e0
    style Agents fill:#e8f5e9
    style Storage fill:#fce4ec
```

## Data Flow Stages

### 1. Request Initiation
```mermaid
sequenceDiagram
    participant U as User
    participant D as Dashboard
    participant SS as State Store
    participant CP as CopilotKit

    U->>D: Navigate to dashboard
    D->>SS: Subscribe to state
    SS->>SS: Check local cache
    alt Cache Miss
        SS->>CP: Request fresh data
    else Cache Hit
        SS-->>D: Return cached state
    end
```

### 2. Widget Composition
```mermaid
sequenceDiagram
    participant GA as Gateway Agent
    participant WC as Widget Composer
    participant NA as Navi Agent

    GA->>WC: Compose dashboard
    WC->>NA: Get project overview
    NA-->>WC: Project data
    WC->>WC: Create widget payload
    WC-->>GA: ProjectOverviewWidget payload
```

### 3. State Synchronization
```mermaid
sequenceDiagram
    participant SS as State Store
    participant WS as WebSocket
    participant RD as Redis
    participant T2 as Other Tab

    SS->>WS: State update (version N)
    WS->>RD: Persist state
    RD-->>WS: Confirm
    WS->>T2: Broadcast sync
    T2->>T2: Apply if version > local
```

## Widget Types

| Widget | Data Source | Refresh Rate | Cache TTL |
|--------|-------------|--------------|-----------|
| ProjectOverview | Navi | On demand | 5 min |
| Metrics | Multiple agents | 30 sec | 1 min |
| Activity | Event stream | Real-time | No cache |
| Tasks | Navi | On demand | 5 min |
| Alerts | System events | Real-time | No cache |

## Related Documentation

- [A2A Request Flow](./a2a-request-flow.md)
- [State Sync System](../state-sync.md)
- [CopilotKit Patterns](../../guides/copilotkit-patterns.md)
