# MCP Integrations (User Guide)

This guide explains how to configure **MCP servers** in HYVVE and the validation limits you will encounter in the UI/API.

If you are looking for the deeper security model (permissions and risk boundaries), see `docs/architecture/mcp-security.md`.

---

## Who Can Configure MCP

HYVVE uses workspace roles to control access:

- Owners/Admins: can create, update, and delete MCP servers; can view secret values (headers/env vars).
- Members: can view the server list; do not receive raw secret values on detail reads.

---

## Where to Configure MCP

- Open: `Settings` → `MCP Integrations` (URL: `/settings/mcp`)
- Add a server, then optionally restrict tool access and permissions.

---

## MCP Server Fields

### Identity

- **Server ID**: a stable identifier you choose (lowercase + hyphens).
- **Name**: a human-friendly label shown in the UI.

### Transport

HYVVE stores transport config so AgentOS can connect:

- **stdio**: uses a local command executed by AgentOS (AgentOS host must have access to the command/binary).
- **sse**: connects to a server that speaks Server-Sent Events.
- **streamable-http**: connects to a server that supports streamable HTTP.

### Authentication and Secrets

- **API Key**: stored encrypted at rest (never returned by the list endpoint).
- **Headers**: stored as a key/value map (often used for auth tokens).
- **Environment Variables**: stored as a key/value map; restricted to `MCP_` variables to avoid surprising process-level injection semantics.

### Tool Access Controls

- **includeTools**: allowlist of tool names/patterns.
- **excludeTools**: denylist of tool names/patterns.

If both are set, they must not overlap.

### Permissions

HYVVE represents MCP permissions as bit flags:

- `1` READ
- `2` WRITE
- `4` EXECUTE

Common presets:

- `1` Read Only
- `3` Read/Write
- `7` Full Access

See `docs/architecture/mcp-security.md` for guidance on when to grant EXECUTE.

### Timeout and Enablement

- **timeoutSeconds**: request timeout for MCP operations.
- **enabled**: whether the integration is active.

---

## Validation Limits (What the API Will Accept)

These limits are enforced when creating/updating MCP servers.

### Workspace Limits

- Maximum MCP servers per workspace: 10

### Server Basics

| Field | Requirement |
|------|-------------|
| `serverId` | 1–100 chars; regex `^[a-z0-9-]+$` |
| `name` | 1–200 chars |
| `apiKey` | 1–500 chars (optional) |
| `timeoutSeconds` | integer 5–300 (default 30) |

### Transport Requirements

- `transport=stdio` requires `command`
- `transport=sse` or `transport=streamable-http` requires `url`

### Headers

- Max entries: 20
- Header name (`key`) length: ≤ 200
- Header value length: ≤ 4000
- Total characters across all header keys + values: ≤ 20000
- Header names must match RFC7230 token rules:
  - ``^[!#$%&'*+.^_`|~0-9A-Za-z-]+$``
- Values must not contain `\n` or `\r` (CRLF/newlines are rejected)

### Environment Variables (`envVars`)

- Max entries: 50
- Key length: ≤ 100
- Value length: ≤ 4000
- Total characters across all keys + values: ≤ 30000
- Keys must:
  - start with `MCP_`
  - match `^[A-Z0-9_]+$`
- Values must not contain `\n` or `\r`

---

## Examples

### Example: SSE Server with Bearer Token

```json
{
  "serverId": "my-sse-server",
  "name": "My SSE MCP Server",
  "transport": "sse",
  "url": "https://mcp.example.com/sse",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "envVars": {
    "MCP_LOG_LEVEL": "info"
  },
  "permissions": 1,
  "timeoutSeconds": 30,
  "enabled": true
}
```

### Example: stdio Server

```json
{
  "serverId": "local-stdio",
  "name": "Local stdio MCP",
  "transport": "stdio",
  "command": "node ./servers/mcp-local.js",
  "permissions": 3,
  "timeoutSeconds": 30,
  "enabled": true
}
```

---

## Troubleshooting

### “Validation failed” when saving

Common causes:

- Header/env maps exceed the entry limits.
- Header names contain spaces or invalid characters.
- Header/env values contain newlines.
- `envVars` keys do not start with `MCP_` or include lowercase characters.
- `includeTools` and `excludeTools` contain the same tool name.
- `timeoutSeconds` is outside 5–300.

### “Server is unreachable”

HYVVE stores the configuration, but connectivity depends on where AgentOS runs.

- Ensure the MCP server URL is reachable from AgentOS (network/DNS/firewalls).
- For `stdio`, ensure the command exists on the AgentOS host/container.
