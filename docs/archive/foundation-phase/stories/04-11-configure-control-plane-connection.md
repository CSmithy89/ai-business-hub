# Story 04-11: Configure Control Plane Connection

**Epic:** EPIC-04 - Approval Queue System
**Story ID:** 04-11
**Priority:** P1
**Points:** 2
**Status:** done

---

## Story Description

**As a** platform operator
**I want** AgentOS connected to the Control Plane
**So that** I can monitor agent sessions and memories

---

## Acceptance Criteria

- [ ] Configure AgentOS to connect to os.agno.com
- [ ] Verify agent sessions visible in Control Plane UI
- [ ] Confirm memory entries accessible
- [ ] Test session history navigation
- [ ] Document Control Plane access for team members
- [ ] Verify no data leaves infrastructure (browser-only connection)

---

## Technical Context

### Control Plane Architecture
- Web UI hosted at https://os.agno.com
- Connects via WebSocket FROM browser TO your AgentOS instance
- No data sent to Agno servers (all local)
- Monitoring is read-only observation
- Optional feature (can be disabled in production)

### AgentOS Configuration
- Agent runtime at `agents/main.py`
- Uses Agno's built-in session storage in PostgreSQL
- Exposes monitoring endpoints for Control Plane
- Requires CORS configuration for os.agno.com

### Connection Flow
```
Browser (os.agno.com) --WebSocket--> AgentOS (localhost:7777)
                                          |
                                          v
                                    PostgreSQL (sessions)
```

---

## Implementation Plan

### 1. Update AgentOS CORS Configuration
- Add `https://os.agno.com` to allowed origins
- Enable WebSocket support
- Configure credentials for Control Plane access

### 2. Add Control Plane Endpoints
- `/control-plane/sessions` - List all agent sessions
- `/control-plane/sessions/:id` - Get session details
- `/control-plane/sessions/:id/messages` - Get session messages
- `/control-plane/health` - Control Plane health check

### 3. Update Configuration
- Add `CONTROL_PLANE_ENABLED` environment variable
- Add optional `AGNO_API_KEY` for authentication (if needed)
- Update config.py to handle Control Plane settings

### 4. Create Documentation
- Create `docs/guides/control-plane-setup.md`
- Document how to access Control Plane
- Document how to connect to local AgentOS
- Add session monitoring guide
- Add memory inspection guide
- Add troubleshooting section

### 5. Update Environment Variables
- Update `.env.example` with Control Plane settings
- Document optional vs required variables

---

## References

- **Epic File:** `docs/epics/EPIC-04-approval-system.md`
- **Architecture:** ADR-007 (AgentOS for Agent Runtime)
- **Agno Docs:** https://docs.agno.com/control-plane
- **Control Plane UI:** https://os.agno.com

---

## Testing Checklist

- [ ] AgentOS starts with Control Plane enabled
- [ ] CORS allows connections from os.agno.com
- [ ] Control Plane endpoints return session data
- [ ] Browser can connect to local AgentOS instance
- [ ] Agent sessions visible in Control Plane UI
- [ ] Session history shows conversation flow
- [ ] Memory entries are accessible and readable
- [ ] Control Plane can be disabled via environment variable
- [ ] No errors when Control Plane is disabled

---

## Security Notes

- Control Plane connection is browser-based only
- No data is sent to external servers
- WebSocket connection is direct: browser <-> localhost
- All session data remains in local PostgreSQL
- Control Plane UI is read-only (cannot execute agents)
- Can be completely disabled for production environments

---

## Notes

- Control Plane is optional - production can disable it
- Useful for development and debugging
- Session data stored in `agent_sessions` table (from Story 04-10)
- Control Plane requires AgentOS to be accessible from browser
- For deployed environments, ensure proper firewall/network config

---

**Created:** 2025-12-03
**Assignee:** Dev Team
**Sprint:** Epic 04 - Approval System
