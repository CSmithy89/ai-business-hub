# HITL (Human-in-the-Loop) Approval Flow

This diagram shows how agents pause execution for human approval and resume after receiving a decision.

```mermaid
sequenceDiagram
    autonumber
    participant A as Agent<br/>(Python)
    participant AB as Approval Bridge
    participant AE as Approval Events<br/>(Event-Driven)
    participant API as NestJS API
    participant WS as WebSocket
    participant UI as Approval UI<br/>(React)
    participant U as User

    Note over A,U: Agent Requests Human Approval

    A->>AB: request_approval(action, context)
    AB->>AB: Generate approval_id
    AB->>API: POST /approvals
    API->>API: Store in DB
    API-->>AB: approval_id

    AB->>AE: Register Future
    AB->>WS: Emit approval.created

    WS->>UI: Push notification
    UI->>U: Show approval card

    Note over A,U: Agent Waits (Event-Driven, No Polling)

    A->>AE: await wait_for_event(approval_id)

    par User Reviews
        U->>UI: Review context
        U->>UI: Click Approve/Reject
    end

    UI->>API: POST /approvals/:id/decision
    API->>API: Update status
    API->>WS: Emit approval.resolved

    WS->>AE: Deliver event
    AE->>AE: Set Future result
    AE-->>AB: Decision received
    AB-->>A: Return decision

    alt Approved
        A->>A: Continue execution
    else Rejected
        A->>A: Handle rejection
    end
```

## Approval States

```mermaid
stateDiagram-v2
    [*] --> Pending: Agent requests
    Pending --> Approved: User approves
    Pending --> Rejected: User rejects
    Pending --> Cancelled: User/system cancels
    Pending --> Expired: Timeout (5 min)

    Approved --> [*]: Agent continues
    Rejected --> [*]: Agent handles rejection
    Cancelled --> [*]: Agent handles cancellation
    Expired --> [*]: Agent handles timeout
```

## Confidence-Based Routing

```mermaid
flowchart TD
    A[Agent Action] --> C{Confidence Score}

    C -->|> 85%| AUTO[Auto-Execute]
    C -->|60-85%| QUICK[Quick Approval<br/>Single click]
    C -->|< 60%| FULL[Full Review<br/>Context + details]

    AUTO --> LOG[Audit Log]
    QUICK --> AP{User Decision}
    FULL --> AP

    AP -->|Approve| EXEC[Execute Action]
    AP -->|Reject| ABORT[Abort Action]

    EXEC --> LOG
    ABORT --> LOG

    style AUTO fill:#c8e6c9
    style QUICK fill:#fff9c4
    style FULL fill:#ffcdd2
```

## Event-Driven Architecture

### Why Events Instead of Polling?

| Metric | Polling (Old) | Event-Driven (Current) |
|--------|---------------|------------------------|
| CPU during wait | ~1% | ~0% |
| Response latency | 0-5 seconds | <100ms |
| API calls per 5min | ~60 | 1 |
| Network overhead | High | Minimal |

### Event Flow

```mermaid
flowchart LR
    subgraph Python["Python (AgentOS)"]
        AE[ApprovalEvents]
        F[asyncio.Future]
    end

    subgraph Node["Node.js (NestJS)"]
        WS[WebSocket Gateway]
        ES[EventEmitter]
    end

    subgraph Frontend["React"]
        UI[Approval UI]
        ST[State Store]
    end

    WS -->|approval.created| UI
    UI -->|Decision| WS
    WS -->|approval.resolved| ES
    ES -->|HTTP callback| AE
    AE -->|set_result| F

    style Python fill:#e8f5e9
    style Node fill:#e3f2fd
    style Frontend fill:#fce4ec
```

## Cancellation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Approval UI
    participant API as NestJS API
    participant AE as Approval Events
    participant A as Agent

    U->>UI: Click Cancel
    UI->>API: POST /approvals/:id/cancel
    API->>API: Validate permissions
    API->>API: Update status = cancelled
    API->>AE: Emit approval.cancelled
    AE-->>A: CancelledError
    A->>A: Handle cancellation gracefully
```

## Related Documentation

- [A2A Request Flow](./a2a-request-flow.md)
- [Async Primitive Patterns](../../guides/async-primitive-patterns.md)
- [Security Review Checklist](../../security/review-checklist.md)
