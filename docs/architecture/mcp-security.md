# MCP Security Model

HYVVE integrates the Model Context Protocol (MCP) to extend agent capabilities with workspace-scoped tools. MCP is powerful, but it introduces an explicit security boundary: **a misconfigured MCP server can exfiltrate or modify workspace data**.

This document defines HYVVE’s MCP permission model and operational guidance.

---

## Permission Model

HYVVE represents permissions as bit flags:

| Flag | Name | Meaning |
|------|------|---------|
| `1` | READ | Tools that read data (safe-ish, still sensitive) |
| `2` | WRITE | Tools that write/update data |
| `4` | EXECUTE | Tools that execute actions (highest risk) |

Common presets:
- **Read Only** (`1`)
- **Read/Write** (`3`)
- **Full Access** (`7`)

### Tool Filtering
On the agent side, tools are filtered based on granted permissions. “Execute” tool patterns (run/execute/call/etc.) are blocked unless EXECUTE is granted.

---

## Security Risk: EXECUTE

Granting EXECUTE should be treated like granting “run commands / trigger side effects”:
- A malicious or compromised MCP server can trigger actions on behalf of an agent.
- A well-intentioned server can still perform unsafe operations if prompts/tool routing are wrong.

**Recommendation:** default to **Read Only** and expand permissions only after:
- verifying server owner and code,
- confirming which tools will be exposed,
- limiting tool allowlists.

---

## Secrets & Access Control

MCP server configs can include sensitive values:
- `apiKeyEncrypted` (stored encrypted)
- `headers` (may include tokens)
- `envVars` (may include secrets)

HYVVE’s UI/API guidance:
- Only **owners/admins** can create/update/delete MCP servers.
- For detail reads:
  - admins/owners can view raw header/env values,
  - members receive **masked outputs** (empty `headers/envVars` plus `headerKeys/envVarKeys` metadata).
- Environment variables are restricted to the `MCP_` prefix and are validated for size/shape to reduce abuse.

---

## Operational Guidance

### Recommended Practices
- Prefer HTTPS endpoints and rotate server credentials regularly.
- Use **tool allowlists** (`includeTools`) instead of broad access whenever possible.
- Keep `headers` minimal and avoid embedding long-lived tokens; prefer short-lived tokens.
- Treat `envVars` as server configuration (not a general-purpose env injection mechanism).

### Auditing
If you allow EXECUTE:
- ensure realtime and audit logs are enabled and monitored,
- consider additional change-approval processes for MCP permission changes.

