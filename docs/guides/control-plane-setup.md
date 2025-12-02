# Control Plane Setup Guide

**Version:** 1.0
**Last Updated:** 2025-12-03
**Applies To:** HYVVE AgentOS v0.1.0+

---

## Table of Contents

1. [What is Control Plane?](#what-is-control-plane)
2. [Quick Start](#quick-start)
3. [Accessing Control Plane](#accessing-control-plane)
4. [Session Monitoring](#session-monitoring)
5. [Memory Inspection](#memory-inspection)
6. [Configuration](#configuration)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)
9. [Security & Privacy](#security--privacy)

---

## What is Control Plane?

**Control Plane** is Agno's web-based monitoring dashboard for AI agent sessions. It provides a visual interface to:

- View all agent conversations and sessions
- Monitor agent decision-making in real-time
- Inspect agent memories and context
- Debug conversation flows
- Review agent tool usage

### Key Features

- **Browser-Based:** Runs entirely in your browser - no external services
- **Direct Connection:** WebSocket connection from browser to your AgentOS instance
- **No Data Transfer:** All session data stays in your infrastructure
- **Read-Only:** Cannot execute agents or modify sessions
- **Optional:** Can be completely disabled for production

### Architecture

```
┌─────────────────┐
│   os.agno.com   │  (Control Plane UI in Browser)
│  (Static HTML)  │
└────────┬────────┘
         │ WebSocket
         ↓
┌─────────────────┐
│   AgentOS       │  (Your Local Instance)
│  localhost:7777 │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   PostgreSQL    │  (Session Storage)
│ agent_sessions  │
└─────────────────┘
```

**Important:** The Control Plane UI at `os.agno.com` is just static HTML/JavaScript. When you connect, your browser establishes a WebSocket connection directly to your AgentOS instance. No data is sent to Agno's servers.

---

## Quick Start

### Prerequisites

- AgentOS running locally or on accessible server
- PostgreSQL database configured
- Modern web browser (Chrome, Firefox, Safari, Edge)

### 5-Minute Setup

1. **Enable Control Plane** (enabled by default)
   ```bash
   # In your .env file
   CONTROL_PLANE_ENABLED=true
   ```

2. **Start AgentOS**
   ```bash
   cd agents
   python main.py
   ```

3. **Verify Control Plane is enabled**
   ```bash
   # Check startup logs for:
   # INFO - Control Plane: enabled
   # INFO - Control Plane URL: https://os.agno.com
   ```

4. **Open Control Plane**
   - Navigate to https://os.agno.com
   - Enter AgentOS URL: `http://localhost:7777`
   - Click "Connect"

5. **View Sessions**
   - Browse your agent sessions
   - Click on a session to view conversation history

---

## Accessing Control Plane

### Step 1: Open Control Plane UI

Navigate to **https://os.agno.com** in your browser.

### Step 2: Connect to AgentOS

You'll be prompted to enter your AgentOS URL:

**For Local Development:**
```
http://localhost:7777
```

**For Deployed AgentOS:**
```
https://agents.yourdomain.com
```

**For Remote Dev Environment:**
```
http://192.168.1.100:7777
```

### Step 3: Verify Connection

Once connected, you should see:
- Green "Connected" indicator
- List of agent sessions
- Session count and statistics

### Authentication (Optional)

If you've configured `AGNO_API_KEY`, you'll need to provide it:

1. Click "Settings" in Control Plane UI
2. Enter your API key
3. Control Plane will include it as `Authorization: Bearer <key>`

---

## Session Monitoring

### Viewing All Sessions

The Control Plane dashboard shows all agent sessions:

| Column | Description |
|--------|-------------|
| **Session ID** | Unique session identifier |
| **Agent Name** | Which agent handled this session (e.g., "Sentinel") |
| **User** | User ID who initiated the session |
| **Workspace** | Workspace context |
| **Created** | When session started |
| **Messages** | Number of messages in conversation |
| **Status** | Active, Completed, Error |

### Filtering Sessions

Use the filter controls to narrow down:

- **Agent Name:** Show only ApprovalAgent sessions
- **Workspace:** Filter by workspace ID
- **User:** Show sessions for specific user
- **Date Range:** Sessions within time period
- **Status:** Active vs. completed sessions

### Viewing Session Details

Click on any session to see:

1. **Metadata**
   - Session ID
   - Agent name and model
   - User and workspace context
   - Start/end times

2. **Conversation History**
   - User messages
   - Agent responses
   - Tool calls and results
   - Timestamps

3. **Tool Usage**
   - Which tools were called
   - Tool parameters
   - Tool results
   - Success/failure status

### Example Session View

```
Session: sess_abc123
Agent: Sentinel (gpt-4o)
User: user_456
Workspace: ws_789

┌──────────────────────────────────────────────┐
│ [10:00:00] User                              │
│ Show me pending approvals                    │
├──────────────────────────────────────────────┤
│ [10:00:01] Sentinel (tool call)              │
│ get_pending_approvals()                      │
│ → 3 approvals found                          │
├──────────────────────────────────────────────┤
│ [10:00:02] Sentinel                          │
│ You have 3 pending approvals:                │
│ 1. Content publish (high priority)           │
│ 2. Email campaign (normal)                   │
│ 3. Deal approval (normal)                    │
└──────────────────────────────────────────────┘
```

---

## Memory Inspection

### Agent Memories

Control Plane provides access to agent memories (if `enable_user_memories=True`):

1. Navigate to session details
2. Click "Memories" tab
3. View stored memories:
   - User preferences
   - Past decisions
   - Context from previous sessions

### Memory Structure

```json
{
  "user_id": "user_456",
  "workspace_id": "ws_789",
  "memories": [
    {
      "type": "preference",
      "key": "approval_threshold",
      "value": "85%",
      "created_at": "2025-12-03T10:00:00Z"
    },
    {
      "type": "context",
      "key": "last_approval",
      "value": "Approved content item #123",
      "created_at": "2025-12-03T09:30:00Z"
    }
  ]
}
```

### Debugging with Memories

Use memories to understand:
- Why agent made certain decisions
- What context it has about user
- What it remembers from past sessions
- Potential issues with context retention

---

## Configuration

### Environment Variables

```bash
# ============================================
# CONTROL PLANE (Story 04-11)
# ============================================

# Enable/disable Control Plane monitoring
CONTROL_PLANE_ENABLED=true

# Optional: API key for Control Plane authentication
# If set, Control Plane must provide this key
# If not set, Control Plane endpoints are public (local dev only!)
AGNO_API_KEY=""
```

### AgentOS Configuration

The Control Plane integration is configured in `agents/config.py`:

```python
class Settings(BaseSettings):
    # Control Plane (optional)
    control_plane_enabled: bool = True
    agno_api_key: Optional[str] = None
```

### CORS Configuration

AgentOS automatically adds `https://os.agno.com` to CORS allowed origins when Control Plane is enabled:

```python
# In agents/main.py
allowed_origins = [
    "http://localhost:3000",  # Next.js frontend
    "http://localhost:3001",  # NestJS API
]

if settings.control_plane_enabled:
    allowed_origins.append("https://os.agno.com")
```

### Disabling Control Plane

To completely disable Control Plane:

```bash
# .env
CONTROL_PLANE_ENABLED=false
```

When disabled:
- Control Plane endpoints return 404
- `os.agno.com` not added to CORS
- Agent functionality unaffected
- Session storage still works (for internal use)

---

## Production Deployment

### Recommendation: Disable in Production

For production deployments, we recommend disabling Control Plane:

```bash
# Production .env
CONTROL_PLANE_ENABLED=false
```

**Reasons:**
- External access to monitoring endpoints
- Potential information disclosure
- No production need for real-time monitoring
- Use proper logging/metrics instead

### Alternative: Secure Access

If you need Control Plane in production:

#### Option 1: SSH Tunnel

```bash
# On your local machine
ssh -L 7777:localhost:7777 user@production-server

# Then connect Control Plane to:
http://localhost:7777
```

#### Option 2: VPN Access

- Require VPN connection to access AgentOS
- Control Plane connects through VPN
- AgentOS not exposed to public internet

#### Option 3: API Key Authentication

```bash
# Production .env
CONTROL_PLANE_ENABLED=true
AGNO_API_KEY="agno_sk_production_secret_key_here"
```

Control Plane will require this key as `Authorization: Bearer <key>`.

### Production Monitoring Alternatives

Instead of Control Plane, use:

- **Structured Logging:** Log all agent actions to files/services
- **APM Tools:** Datadog, New Relic, Sentry for performance
- **Custom Dashboards:** Build internal monitoring UI
- **Database Queries:** Query `agent_sessions` table directly

---

## Troubleshooting

### Connection Refused

**Symptom:** Cannot connect Control Plane to AgentOS

**Solutions:**

1. **Verify AgentOS is running**
   ```bash
   curl http://localhost:7777/health
   ```

2. **Check Control Plane enabled**
   ```bash
   # Check logs for:
   # INFO - Control Plane: enabled
   ```

3. **Verify correct URL**
   - Local: `http://localhost:7777`
   - Not: `https://localhost:7777` (no SSL locally)
   - Not: `http://127.0.0.1:7777` (use `localhost`)

4. **Check firewall rules**
   ```bash
   # Ensure port 7777 is accessible
   telnet localhost 7777
   ```

### CORS Errors

**Symptom:** Browser console shows CORS errors

**Solutions:**

1. **Verify os.agno.com in allowed origins**
   ```bash
   # Check logs for:
   # INFO - CORS origins: [..., 'https://os.agno.com']
   ```

2. **Check CONTROL_PLANE_ENABLED=true**
   - CORS origin only added if enabled

3. **Clear browser cache**
   - Hard refresh (Ctrl+Shift+R)

4. **Try different browser**
   - Rule out browser-specific issues

### No Sessions Visible

**Symptom:** Control Plane connects but shows no sessions

**Solutions:**

1. **Verify sessions exist in database**
   ```sql
   SELECT * FROM agent_sessions LIMIT 5;
   ```

2. **Create a test session**
   ```bash
   curl -X POST http://localhost:7777/agents/approval/runs \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <your-jwt>" \
     -d '{"message": "Show me pending approvals"}'
   ```

3. **Check Control Plane endpoints**
   ```bash
   curl http://localhost:7777/control-plane/sessions
   ```

4. **Review AgentOS logs**
   - Look for errors in session storage
   - Check database connectivity

### WebSocket Timeout

**Symptom:** Connection drops after period of inactivity

**Solutions:**

1. **Check network/proxy settings**
   - Some networks block WebSocket connections
   - Try different network

2. **Increase WebSocket timeout**
   - Configure in AgentOS if needed

3. **Use polling instead**
   - Some Control Plane UIs support HTTP polling fallback

### Authentication Errors

**Symptom:** 401/403 errors when accessing Control Plane

**Solutions:**

1. **Verify API key matches**
   ```bash
   # .env
   AGNO_API_KEY=your_key_here

   # Control Plane settings
   API Key: your_key_here
   ```

2. **Check Authorization header format**
   - Should be: `Bearer <key>`
   - Not: `<key>` alone

3. **Regenerate API key if compromised**

---

## Security & Privacy

### Data Privacy

Control Plane is designed with privacy in mind:

- **Browser-Only Connection:** Your browser connects directly to your AgentOS
- **No External Servers:** No data sent to Agno or third-party servers
- **Local Storage:** All session data stays in your PostgreSQL database
- **WebSocket Direct:** No intermediary proxies or relays

### What os.agno.com Is

The URL `https://os.agno.com` serves only static files:
- HTML page for Control Plane UI
- JavaScript for WebSocket client
- CSS for styling

When you enter your AgentOS URL, the JavaScript in your browser connects directly to your instance. The `os.agno.com` server never sees your data.

### Security Best Practices

1. **Development Only**
   - Use Control Plane for local development
   - Disable in production

2. **API Key Protection**
   - If using `AGNO_API_KEY`, keep it secret
   - Rotate regularly
   - Never commit to git

3. **Network Security**
   - Don't expose AgentOS port to internet
   - Use VPN/SSH tunnel for remote access
   - Firewall rules to restrict access

4. **Session Data**
   - Session data includes user messages
   - May contain sensitive information
   - Ensure PostgreSQL properly secured

5. **HTTPS for Production**
   - If using Control Plane in production (not recommended)
   - Use HTTPS for AgentOS (`https://agents.yourdomain.com`)
   - Valid SSL certificate required

### Compliance Considerations

- **GDPR:** Session data may contain personal information
- **HIPAA:** Don't use Control Plane with PHI
- **SOC2:** Disable in production for compliance
- **Audit Trails:** Control Plane access not logged by default

---

## Additional Resources

### Documentation

- **Agno Docs:** https://docs.agno.com/control-plane
- **AgentOS Architecture:** `docs/architecture.md` (ADR-007)
- **Story 04-11:** `docs/stories/04-11-configure-control-plane-connection.md`

### Support

- **Internal:** Post in #ai-platform Slack channel
- **Agno:** https://discord.gg/agno (for Agno-specific issues)
- **Issues:** Create ticket in project management system

### Related Guides

- Agent Development Guide (coming soon)
- Session Management Guide (coming soon)
- AgentOS Production Deployment Guide (coming soon)

---

**Need Help?**

If you encounter issues not covered in this guide:
1. Check AgentOS logs for errors
2. Review PostgreSQL connection
3. Post in #ai-platform Slack
4. Create support ticket with full error details

---

**Document Version:** 1.0
**Last Updated:** 2025-12-03
**Maintained By:** Platform Team
