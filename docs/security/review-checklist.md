# Security Review Checklist

Use this checklist when reviewing PRs for security concerns.

## Quick Reference

| Category | Key Questions |
|----------|---------------|
| Auth | Is authentication required? Verified? |
| Authz | Is authorization checked for resources? |
| Input | Is all input validated and sanitized? |
| Output | Is output properly encoded? |
| Data | Is sensitive data protected? |
| Deps | Are dependencies secure and updated? |

## Authentication

- [ ] **Endpoints require authentication** - No accidental public endpoints
- [ ] **JWT tokens validated** - Signature, expiration, issuer checked
- [ ] **Session management secure** - HttpOnly, Secure, SameSite cookies
- [ ] **Password handling proper** - Hashed with bcrypt/argon2, never logged
- [ ] **MFA not bypassed** - Critical actions require 2FA if enabled

## Authorization

- [ ] **Resource ownership verified** - User can only access their resources
- [ ] **Role checks in place** - Admin endpoints check admin role
- [ ] **Workspace isolation** - Multi-tenant data properly scoped
- [ ] **No privilege escalation** - Users can't grant themselves permissions
- [ ] **API keys scoped** - Keys limited to necessary permissions

## Input Validation

- [ ] **All inputs validated** - Query params, body, headers
- [ ] **Schema validation** - Zod/class-validator for request bodies
- [ ] **Type coercion safe** - No prototype pollution via __proto__
- [ ] **File uploads validated** - Type, size, content checked
- [ ] **Path traversal prevented** - No `../` in file paths

## Output Encoding

- [ ] **XSS prevented** - HTML escaped, no dangerouslySetInnerHTML
- [ ] **JSON injection prevented** - Proper serialization
- [ ] **Error messages safe** - No stack traces in production
- [ ] **Headers secure** - CSP, X-Content-Type-Options set

## SQL/Database

- [ ] **Parameterized queries** - No string concatenation in SQL
- [ ] **ORM used safely** - Prisma raw queries avoided
- [ ] **RLS enforced** - Tenant isolation at database level
- [ ] **Sensitive data encrypted** - API keys, tokens at rest

## API Security

- [ ] **Rate limiting** - Endpoints have rate limits
- [ ] **CORS configured** - Only allowed origins
- [ ] **Request size limited** - Large payload attacks prevented
- [ ] **Timeouts set** - No unbounded operations

## Secrets & Configuration

- [ ] **No hardcoded secrets** - Use environment variables
- [ ] **Secrets not logged** - No API keys in logs
- [ ] **Environment checked** - Different configs for dev/prod
- [ ] **Default passwords changed** - No admin/admin

## Dependencies

- [ ] **No known vulnerabilities** - `pnpm audit` clean
- [ ] **Minimal dependencies** - Only necessary packages
- [ ] **Lockfile committed** - Reproducible builds
- [ ] **Outdated packages reviewed** - Security patches applied

## Agent-Specific (A2A/HITL)

- [ ] **Agent permissions scoped** - Agents can only access allowed resources
- [ ] **HITL thresholds respected** - High-risk actions require approval
- [ ] **Tool execution sandboxed** - No shell injection via MCP
- [ ] **Context boundaries enforced** - Workspace/project isolation

## WebSocket Security

- [ ] **Origin validated** - Only allowed origins can connect
- [ ] **Authentication required** - Token validated on connect
- [ ] **Room isolation** - Users only join allowed rooms
- [ ] **Message rate limited** - Flood protection
- [ ] **Message size limited** - Large message attacks prevented

## Common Anti-Patterns

### SQL Injection
```typescript
// BAD
const query = `SELECT * FROM users WHERE id = '${userId}'`;

// GOOD
const user = await prisma.user.findUnique({ where: { id: userId } });
```

### XSS
```tsx
// BAD
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// GOOD
<div>{userContent}</div>
```

### Path Traversal
```typescript
// BAD
const file = fs.readFileSync(`/uploads/${filename}`);

// GOOD
const safeName = path.basename(filename);
const file = fs.readFileSync(path.join(UPLOAD_DIR, safeName));
```

### Insecure Comparison
```typescript
// BAD - timing attack
if (token === storedToken) { ... }

// GOOD
import { timingSafeEqual } from 'crypto';
if (timingSafeEqual(Buffer.from(token), Buffer.from(storedToken))) { ... }
```

## Approval Required

The following changes require explicit security review approval:

- [ ] Authentication/authorization logic
- [ ] Cryptographic operations
- [ ] API key or secret handling
- [ ] Database schema changes with sensitive fields
- [ ] Third-party OAuth integration
- [ ] WebSocket authentication changes
- [ ] Agent tool execution paths
- [ ] MCP server configurations

## Semgrep Integration

PRs are automatically scanned by Semgrep. Address all findings:

```bash
# Run locally before pushing
semgrep scan --config auto --config .semgrep/

# Common rules triggered:
# - hardcoded-api-key
# - raw-sql-query
# - dangerouslySetInnerHTML-usage
# - subprocess-shell-true
```

## Related Documentation

- [WebSocket Security](../architecture/websocket-security.md)
- [MCP Security Model](../architecture/mcp-security.md)
- [Semgrep Rules](../../.semgrep/rules/)
