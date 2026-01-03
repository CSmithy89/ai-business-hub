# MCP Configuration Guide (Developer/Operations)

This guide covers MCP (Model Context Protocol) server configuration from the AgentOS perspective. For UI-based configuration, see [MCP Integrations (User Guide)](./mcp-integrations.md).

## Overview

MCP enables HYVVE agents to interact with external tools and services through a standardized protocol. The system supports:

- **Multiple transports**: stdio, SSE, streamable-http
- **Permission-based access**: READ, WRITE, EXECUTE flags
- **Workspace scoping**: Each workspace has isolated MCP configurations
- **Tool filtering**: Include/exclude specific tools per server

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AgentOS                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐     ┌─────────────────┐     ┌──────────────┐  │
│  │ Agent       │────▶│ MCPProvider     │────▶│ MCPTools     │  │
│  │ (Dashboard, │     │ (workspace-     │     │ (Agno)       │  │
│  │  Navi, etc) │     │  scoped)        │     │              │  │
│  └─────────────┘     └─────────────────┘     └──────┬───────┘  │
│                                                      │          │
└──────────────────────────────────────────────────────│──────────┘
                                                       │
                    ┌──────────────────────────────────┼──────────┐
                    │          MCP Servers              │          │
                    │  ┌──────────┐  ┌──────────┐  ┌───▼────────┐ │
                    │  │ GitHub   │  │Filesystem│  │ Custom     │ │
                    │  │ (stdio)  │  │ (stdio)  │  │ (sse/http) │ │
                    │  └──────────┘  └──────────┘  └────────────┘ │
                    └─────────────────────────────────────────────┘
```

## Configuration Sources

MCP server configurations are loaded in this order:

1. **Database** (Primary): `mcp_server_configs` table
2. **HTTP API** (Fallback): `/api/workspaces/{id}/mcp-servers`

### Database Schema

```sql
CREATE TABLE mcp_server_configs (
  id                 TEXT PRIMARY KEY,
  workspace_id       TEXT NOT NULL REFERENCES workspace(id),
  server_id          TEXT NOT NULL,
  name               TEXT NOT NULL,
  transport          TEXT NOT NULL,  -- "stdio", "sse", "streamable-http"
  command            TEXT,           -- For stdio transport
  url                TEXT,           -- For SSE/HTTP transport
  api_key_encrypted  TEXT,           -- Encrypted at rest
  headers            JSONB,
  env_vars           JSONB,
  include_tools      TEXT[],
  exclude_tools      TEXT[],
  permissions        INTEGER,        -- Bitfield: 1=READ, 2=WRITE, 4=EXECUTE
  timeout_seconds    INTEGER DEFAULT 30,
  enabled            BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
);
```

## Permission System

MCP uses bitfield permissions for fine-grained access control:

| Flag | Value | Description |
|------|-------|-------------|
| READ | 1 | Search, list, get, query operations |
| WRITE | 2 | Create, update, delete operations |
| EXECUTE | 4 | Run, execute, invoke operations |

### Common Presets

| Preset | Value | Use Case |
|--------|-------|----------|
| Read Only | 1 | Search tools, documentation lookup |
| Read/Write | 3 | GitHub, filesystem access |
| Full Access | 7 | Code execution, system commands |

### Tool Permission Mapping

Tools are automatically classified by name patterns:

```python
# Read patterns
"search", "list", "get", "find", "read", "fetch", "query" → READ

# Write patterns
"create", "update", "delete", "add", "remove", "set", "put", "post" → WRITE

# Execute patterns
"run", "execute", "invoke", "call", "start", "trigger" → EXECUTE
```

## Available Presets

The system includes built-in presets for common MCP servers:

```python
MCP_PRESETS = {
    "filesystem": MCPServerConfig(
        id="mcp-filesystem",
        name="Filesystem Access",
        transport="stdio",
        command="npx -y @modelcontextprotocol/server-filesystem",
        permissions=MCPPermission.READ_WRITE,
        include_tools=["read_file", "write_file", "list_directory"],
    ),
    "github": MCPServerConfig(
        id="mcp-github",
        name="GitHub Integration",
        transport="stdio",
        command="npx -y @modelcontextprotocol/server-github",
        permissions=MCPPermission.READ_WRITE,
        env={"GITHUB_TOKEN": ""},  # User must provide
    ),
    "brave-search": MCPServerConfig(
        id="mcp-brave-search",
        name="Brave Search",
        transport="stdio",
        command="npx -y @anthropic-ai/mcp-server-brave-search",
        permissions=MCPPermission.READ_ONLY,
        env={"BRAVE_API_KEY": ""},
    ),
    "memory": MCPServerConfig(
        id="mcp-memory",
        name="Memory/Knowledge Store",
        transport="stdio",
        command="npx -y @modelcontextprotocol/server-memory",
        permissions=MCPPermission.READ_WRITE,
    ),
}
```

## Adding Custom MCP Servers

### Via Python Code

```python
from providers.mcp import (
    MCPProvider,
    MCPServerConfig,
    MCPPermission,
    WorkspaceMCPConfig,
)

# Create server configuration
custom_server = MCPServerConfig(
    id="my-custom-mcp",
    name="My Custom MCP Server",
    transport="sse",
    url="https://mcp.example.com/sse",
    api_key="sk-xxx",
    headers={"X-Custom-Header": "value"},
    permissions=MCPPermission.READ_WRITE,
    timeout_seconds=60,
    include_tools=["tool1", "tool2"],
)

# Add to provider
config = WorkspaceMCPConfig(workspace_id="ws_123")
provider = MCPProvider(config)
provider.add_server(custom_server)

# Get tools for agents
mcp_tools = await provider.get_mcp_tools()
```

### Via Database (Preferred)

```sql
INSERT INTO mcp_server_configs (
    id, workspace_id, server_id, name, transport,
    url, api_key_encrypted, permissions, enabled
) VALUES (
    'cfg_xxx', 'ws_123', 'my-custom-mcp', 'My Custom Server',
    'sse', 'https://mcp.example.com/sse',
    '<encrypted_key>', 3, true
);
```

## Enhancing Agents with MCP

### Automatic Enhancement

```python
from providers.mcp import enhance_agent_with_mcp

# Add MCP tools to an existing agent
agent = await enhance_agent_with_mcp(
    agent=my_agent,
    workspace_id="ws_123",
    server_ids=["mcp-github", "mcp-filesystem"],  # Optional filter
    jwt_token=user_jwt,  # For HTTP fallback
)
```

### Manual Integration

```python
from providers.mcp import get_workspace_mcp_provider

# Get provider
provider = await get_workspace_mcp_provider(
    workspace_id="ws_123",
    jwt_token=user_jwt,
)

# Get tools
mcp_tools = await provider.get_mcp_tools()

# Add to agent
if mcp_tools:
    agent.tools.extend(mcp_tools)
```

## Transport Configuration

### stdio Transport

For local command-based servers:

```python
MCPServerConfig(
    transport="stdio",
    command="npx -y @modelcontextprotocol/server-github",
    env={
        "GITHUB_TOKEN": "${GITHUB_TOKEN}",
        "GITHUB_ORG": "myorg",
    },
)
```

**Requirements:**
- Command must be executable on the AgentOS host
- Environment variables are passed to the subprocess
- Timeout applies to individual tool calls

### SSE Transport

For Server-Sent Events endpoints:

```python
MCPServerConfig(
    transport="sse",
    url="https://mcp.example.com/sse",
    api_key="sk-xxx",  # Added as Bearer token
    headers={
        "X-Workspace-ID": "ws_123",
    },
)
```

### Streamable HTTP Transport

For HTTP-based servers with streaming:

```python
MCPServerConfig(
    transport="streamable-http",
    url="https://mcp.example.com/stream",
    headers={
        "Authorization": "Bearer sk-xxx",
    },
)
```

## Security Considerations

### API Key Encryption

API keys are encrypted at rest using AES-256-GCM:

```python
# Encryption is handled automatically by CredentialEncryptionService
# Keys are decrypted only when connecting to MCP servers

# The system supports two key sources:
# 1. ENCRYPTION_MASTER_KEY (preferred)
# 2. BETTER_AUTH_SECRET (legacy fallback)
```

### Environment Variable Restrictions

For security, environment variables must:

- Start with `MCP_` prefix
- Match pattern `^[A-Z0-9_]+$`
- Not contain newlines

```python
# Valid
env={"MCP_LOG_LEVEL": "debug", "MCP_API_KEY": "xxx"}

# Invalid (rejected by validation)
env={"PATH": "/custom/path"}  # No MCP_ prefix
```

### Permission Boundaries

- **READ**: Safe for search/lookup operations
- **WRITE**: Can modify data; audit carefully
- **EXECUTE**: Can run commands; use sparingly

## Troubleshooting

### Connection Issues

**Problem:** "Failed to create MCP tools for 'server-id'"

1. Check transport type matches configuration:
   - `stdio` requires `command`
   - `sse`/`streamable-http` requires `url`

2. Verify command/URL accessibility:
   ```bash
   # For stdio
   which npx
   npx -y @modelcontextprotocol/server-github --version

   # For SSE/HTTP
   curl -I https://mcp.example.com/sse
   ```

3. Check environment variables are set:
   ```bash
   echo $GITHUB_TOKEN
   ```

### Permission Denied

**Problem:** Tool filtered out due to permissions

Check logs for:
```
Tool 'create_file' filtered out: requires WRITE, granted READ
```

**Solution:** Update server permissions in database or UI.

### Timeout Issues

**Problem:** MCP operations timing out

1. Increase `timeout_seconds` (max 300)
2. Check network connectivity to remote servers
3. For stdio, ensure subprocess isn't hanging

### Tool Not Found

**Problem:** Expected tool not available

1. Check `include_tools` isn't filtering it out
2. Check `exclude_tools` isn't blocking it
3. Verify the MCP server actually exposes the tool:
   ```bash
   # List tools from MCP server
   npx -y @modelcontextprotocol/server-github tools list
   ```

## Monitoring

### Logging

MCP operations are logged at INFO level:

```python
logger.info(f"Created MCP tools for server '{server_id}'")
logger.info(f"Enhanced agent '{agent.name}' with MCP tools")
```

Enable DEBUG for permission filtering details:

```python
logger.debug(f"Tool '{tool_name}' filtered out: requires {required}, granted {granted}")
```

### Metrics

MCP operations are tracked via OpenTelemetry:

- `mcp.connection.created` - Server connection established
- `mcp.tool.invoked` - Tool execution count
- `mcp.tool.duration` - Tool execution time
- `mcp.tool.error` - Tool execution errors

## Related Documentation

- [MCP Integrations (User Guide)](./mcp-integrations.md)
- [MCP Security Model](../architecture/mcp-security.md)
- [A2A Request Flow](../architecture/diagrams/a2a-request-flow.md)
