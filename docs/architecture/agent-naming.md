# Agent Naming Conventions

This document describes the agent naming conventions used in the HYVVE platform.

## Overview

Agents in the HYVVE platform use creative internal code names for identification in the codebase. These are mapped to user-friendly display names shown in the UI.

## Why Two Naming Systems?

1. **Internal Names**: Short, memorable code names for developers
2. **Display Names**: Clear, descriptive names for users

This separation allows:
- Developers to use concise references in code
- Users to see meaningful, self-explanatory names
- Flexibility to change display names without refactoring

## Agent Directory

### Platform Agents

| Internal Name | Display Name | Description |
|--------------|--------------|-------------|
| `pulse` | Vitals | System health metrics and performance indicators |
| `gateway` | Gateway | Central orchestration and routing for all agents |
| `dashboard_gateway` | Dashboard Agent | Dashboard orchestration and widget coordination |

### Project Management Agents

| Internal Name | Display Name | Description |
|--------------|--------------|-------------|
| `navi` | Navigator | Project overview and task management assistant |
| `sage` | Advisor | Strategic planning and recommendation engine |
| `chrono` | Scheduler | Timeline management and deadline tracking |

### Knowledge Agents

| Internal Name | Display Name | Description |
|--------------|--------------|-------------|
| `scribe` | Knowledge Writer | Document creation and content verification |

### Monitoring Agents

| Internal Name | Display Name | Description |
|--------------|--------------|-------------|
| `herald` | Activity Monitor | Recent activity feed and notifications |

### Integration Agents

| Internal Name | Display Name | Description |
|--------------|--------------|-------------|
| `mcp_coordinator` | Tool Coordinator | MCP tool orchestration and capability management |

## Usage in Code

### TypeScript

```typescript
import {
  getAgentDisplayName,
  getAgentDescription,
  getAgentIcon,
  isKnownAgent,
  type AgentInternalName,
} from '@hyvve/shared';

// Get display name for UI
const displayName = getAgentDisplayName('navi'); // 'Navigator'

// Get description for tooltips
const description = getAgentDescription('sage'); // 'Strategic planning and...'

// Get icon for UI components
const icon = getAgentIcon('chrono'); // 'calendar-clock'

// Type-safe agent references
function handleAgent(agentName: AgentInternalName) {
  console.log(`Processing ${getAgentDisplayName(agentName)}`);
}
```

### Python

In Python agents, use the internal names consistently. The frontend handles display name mapping:

```python
# Use internal names in agent code
agent_name = "navi"
```

## Adding New Agents

When creating a new agent:

1. Choose a memorable internal name (single word, lowercase)
2. Add to `AGENT_NAME_MAP` in `packages/shared/src/agent-names.ts`
3. Update this documentation
4. Ensure consistent usage across the codebase

## Best Practices

1. **Always use internal names** in code, API contracts, and logs
2. **Use display names** only in UI rendering
3. **Import from `@hyvve/shared`** for type-safe access
4. **Check `isKnownAgent()`** before casting to `AgentInternalName`

---

*Updated: DM-11.12 | Epic: DM-11*
