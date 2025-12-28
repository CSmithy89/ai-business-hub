# Epic DM-02: Agno Multi-Interface Backend

## Overview

Configure AgentOS with native AG-UI and A2A protocol support, enabling agents to be accessed via multiple interfaces simultaneously. This epic establishes the backend infrastructure for the Dynamic Module System.

## Scope

### From Architecture Doc (Phase 2)

This epic implements Phase 2 of the Dynamic Module System architecture:
- Install Agno AG-UI and A2A dependencies
- Configure AgentOS with multi-interface support
- Update existing agents for protocol compatibility
- Set up A2A discovery endpoints

## Proposed Stories

### Story DM-02.1: Agno Protocol Dependencies

Install and configure Agno protocol support:

- Install `agno[agui,a2a]` or individual packages
- Verify `ag-ui-protocol` and `a2a-sdk` installation
- Update `pyproject.toml` with new dependencies
- Test basic protocol imports

**Acceptance Criteria:**
- All protocol packages installed successfully
- Imports work without errors
- Version compatibility verified
- Development environment updated

**Points:** 2

### Story DM-02.2: AgentOS Multi-Interface Setup

Configure AgentOS to expose multiple interfaces:

- Update `agents/main.py` with interface configuration
- Configure AGUI interface for frontend communication
- Configure A2A interface for inter-agent communication
- Set up interface routing paths

**Acceptance Criteria:**
- AgentOS starts with both interfaces
- `/agui` endpoint responds to AG-UI requests
- `/a2a` endpoint responds to A2A requests
- Both interfaces serve same agent

**Points:** 5

### Story DM-02.3: A2A AgentCard Discovery

Implement A2A discovery endpoints:

- Configure `/.well-known/agent.json` endpoint
- Generate AgentCard with capabilities
- Include skill definitions from agent tools
- Add streaming and notification capabilities

**Acceptance Criteria:**
- AgentCard endpoint returns valid JSON-LD
- All agent skills listed correctly
- Capabilities accurately described
- External agents can discover via endpoint

**Points:** 3

### Story DM-02.4: Dashboard Gateway Agent

Create the Dashboard Gateway agent with multi-protocol support:

- Create `agents/dashboard.py` with gateway agent
- Implement `render_dashboard_widget` tool
- Configure for AG-UI frontend access
- Configure for A2A backend coordination

**Acceptance Criteria:**
- Dashboard agent accessible via AG-UI
- Dashboard agent accessible via A2A
- Tool calls properly serialized
- Agent handles both text and tool responses

**Points:** 8

### Story DM-02.5: Existing Agent Protocol Updates

Update existing PM agents for A2A compatibility:

- Add A2A interface to Navi agent
- Add A2A interface to Pulse agent
- Add A2A interface to Herald agent
- Ensure backward compatibility with current API

**Acceptance Criteria:**
- PM agents respond to A2A Tasks
- Existing REST endpoints still work
- Agent responses properly formatted
- No breaking changes to current flows

**Points:** 8

## Total Points: 26

## Dependencies

- DM-01 (for end-to-end testing with frontend)

## Technical Notes

### Key Files to Create/Modify

```
apps/agents/
├── main.py                    # AgentOS multi-interface config
├── dashboard.py               # Dashboard Gateway agent
├── pm/
│   ├── navi.py               # Add A2A interface
│   ├── pulse.py              # Add A2A interface
│   └── herald.py             # Add A2A interface
└── interfaces/
    └── config.py             # Interface configuration
```

### AgentOS Configuration Example

```python
from agno.os import AgentOS
from agno.os.interfaces.agui import AGUI
from agno.os.interfaces.a2a import A2A

agent_os = AgentOS(
    agents=[dashboard_agent, navi_agent, pulse_agent],
    interfaces=[
        AGUI(agent=dashboard_agent, path="/agui"),
        A2A(agent=dashboard_agent, path="/a2a/dashboard"),
        A2A(agent=navi_agent, path="/a2a/navi"),
        A2A(agent=pulse_agent, path="/a2a/pulse"),
    ]
)
```

## Risks

1. **Protocol Version Compatibility** - Agno, AG-UI, A2A versions must align
2. **Performance Overhead** - Multiple interfaces may add latency
3. **Authentication** - Must integrate with existing BYOAI auth

## Success Criteria

- All agents accessible via appropriate protocols
- A2A discovery working for external agents
- No regressions in existing agent functionality
- Documentation updated with new endpoints

## References

- [Dynamic Module System Architecture](../../architecture/dynamic-module-system.md)
- [Agno Documentation](https://docs.agno.com)
- [A2A Protocol Spec](https://github.com/google/a2a-protocol)
