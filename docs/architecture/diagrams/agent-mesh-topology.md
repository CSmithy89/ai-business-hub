# Agent Mesh Topology

This diagram shows the agent discovery, routing, and health check architecture.

```mermaid
flowchart TB
    subgraph Mesh["Agent Mesh Layer"]
        D[Discovery Service]
        R[Router]
        H[Health Monitor]
        LB[Load Balancer]
    end

    subgraph Gateway["Gateway Agents"]
        DG[Dashboard Gateway]
        AG[API Gateway]
    end

    subgraph PM["PM Module"]
        NA[Navi<br/>Project Management]
        SA[Sage<br/>Strategy]
        CH[Chrono<br/>Timeline]
    end

    subgraph KB["Knowledge Base"]
        SC[Scribe<br/>Content]
    end

    subgraph Platform["Platform Agents"]
        VA[Validation Agent]
        AU[Audit Agent]
    end

    D <--> R
    R <--> LB
    H --> D

    DG & AG <--> LB

    LB <--> NA & SA & CH
    LB <--> SC
    LB <--> VA & AU

    H -.->|health check| NA & SA & CH & SC & VA & AU

    style Mesh fill:#fff3e0
    style Gateway fill:#e3f2fd
    style PM fill:#e8f5e9
    style KB fill:#f3e5f5
    style Platform fill:#fce4ec
```

## Discovery Protocol

```mermaid
sequenceDiagram
    participant A as New Agent
    participant D as Discovery
    participant R as Registry
    participant H as Health Monitor

    Note over A,H: Agent Registration

    A->>A: Load AgentCard
    A->>D: POST /agents/register
    D->>D: Validate AgentCard
    D->>R: Store agent info

    R-->>D: Registered
    D-->>A: Registration confirmed

    H->>A: Initial health check
    A-->>H: Health OK

    H->>R: Mark agent healthy
    R->>D: Update routing table
```

## Agent Card Schema

```mermaid
classDiagram
    class AgentCard {
        +string name
        +string version
        +string[] capabilities
        +Endpoint[] endpoints
        +HealthConfig health
        +Metadata metadata
    }

    class Endpoint {
        +string protocol
        +string url
        +string[] methods
    }

    class HealthConfig {
        +string endpoint
        +int intervalMs
        +int timeoutMs
        +int unhealthyThreshold
    }

    class Metadata {
        +string module
        +string[] tags
        +string description
    }

    AgentCard "1" *-- "*" Endpoint
    AgentCard "1" *-- "1" HealthConfig
    AgentCard "1" *-- "1" Metadata
```

## Routing Strategy

```mermaid
flowchart TD
    REQ[Incoming Request] --> R{Router}

    R -->|Capability Match| CM[Find agents with capability]
    CM --> HA{Healthy Agents?}

    HA -->|Yes| LB[Load Balance]
    HA -->|No| FB[Fallback Strategy]

    LB -->|Round Robin| A1[Agent 1]
    LB -->|Least Connections| A2[Agent 2]
    LB -->|Random| A3[Agent 3]

    FB -->|Cached Response| CACHE[Return cached]
    FB -->|Default Response| DEF[Return default]
    FB -->|Error| ERR[Return error]

    style REQ fill:#e3f2fd
    style LB fill:#e8f5e9
    style FB fill:#ffcdd2
```

## Health Check System

### Parallel Health Checks

```mermaid
sequenceDiagram
    participant H as Health Monitor
    participant S as Semaphore<br/>(max 5)
    participant A1 as Agent 1
    participant A2 as Agent 2
    participant A3 as Agent 3

    Note over H,A3: Parallel health checks with backpressure

    H->>S: Acquire (5 slots)

    par Parallel Execution
        S->>A1: GET /health
        S->>A2: GET /health
        S->>A3: GET /health
    end

    A1-->>S: 200 OK (50ms)
    A2-->>S: 200 OK (80ms)
    A3-->>S: Timeout (5000ms)

    S-->>H: Results [OK, OK, UNHEALTHY]
    H->>H: Update registry
```

### Health States

```mermaid
stateDiagram-v2
    [*] --> Unknown: Agent registered
    Unknown --> Healthy: Health check OK
    Healthy --> Unhealthy: 3 consecutive failures
    Unhealthy --> Healthy: 2 consecutive successes
    Unhealthy --> Dead: 10 consecutive failures
    Dead --> Healthy: Manual restart + health OK
```

## Agent Capabilities

| Agent | Module | Capabilities | Dependencies |
|-------|--------|--------------|--------------|
| Navi | PM | project.status, task.manage, phase.track | PostgreSQL |
| Sage | PM | strategy.analyze, recommendation.generate | Navi, KB |
| Chrono | PM | timeline.manage, deadline.track | Navi |
| Scribe | KB | content.verify, kb.search, rag.query | pgvector |
| Dashboard Gateway | Platform | widget.compose, state.manage | All PM agents |

## Failure Handling

```mermaid
flowchart TD
    REQ[Request] --> A{Agent Call}

    A -->|Success| OK[Return Response]
    A -->|Timeout| TO{Retry?}
    A -->|Error| ER{Retryable?}

    TO -->|Attempt < 3| RETRY[Retry with backoff]
    TO -->|Attempt >= 3| FALLBACK

    ER -->|Yes| RETRY
    ER -->|No| FALLBACK

    RETRY --> A

    FALLBACK[Fallback Strategy]
    FALLBACK --> CACHE[Cached Response]
    FALLBACK --> DEF[Default Response]
    FALLBACK --> ERR[Error Widget]

    style OK fill:#c8e6c9
    style FALLBACK fill:#fff9c4
    style ERR fill:#ffcdd2
```

## Related Documentation

- [A2A Request Flow](./a2a-request-flow.md)
- [Dashboard Data Flow](./dashboard-data-flow.md)
- [A2A Troubleshooting Guide](../../runbooks/a2a-troubleshooting.md)
