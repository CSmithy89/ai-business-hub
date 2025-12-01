# Story 01-7: Implement Session Management

**Story ID:** 01-7
**Epic:** EPIC-01 - Authentication System
**Status:** done
**Points:** 2
**Priority:** P0

---

## User Story

**As a** user
**I want** to view and manage my active sessions
**So that** I can maintain security of my account across multiple devices

---

## Acceptance Criteria

- [x] Create session management page at `/settings/sessions`
- [x] Display list of active sessions with device/browser info, location, and last activity
- [x] Show current session indicator (marked as "Current Session")
- [x] Allow users to revoke individual sessions (except current session)
- [x] Allow users to revoke all other sessions at once with a single action
- [x] Add session activity tracking with proper timestamps
- [x] Implement proper error handling and loading states for all operations

---

## Technical Requirements

### Session Management Page

**Location:** `/settings/sessions`

**Display Requirements:**
1. List all active sessions for the current user
2. For each session display:
   - **Device Information:** Browser name and version (parsed from userAgent)
   - **Operating System:** OS name and version (parsed from userAgent)
   - **Location:** Approximate location from IP address (optional for MVP)
   - **Last Activity:** Timestamp of last session update (e.g., "Active now", "2 hours ago")
   - **Session Created:** When the session was first created
   - **Current Session Badge:** Visual indicator for the current session
3. Action buttons:
   - "Revoke" button for each session (disabled for current session)
   - "Revoke All Other Sessions" button at page level

### Database Models Used

From `packages/db/prisma/schema.prisma`:
```prisma
model Session {
  id                String    @id @default(uuid())
  userId            String    @map("user_id")
  token             String    @unique
  expiresAt         DateTime  @map("expires_at")
  ipAddress         String?   @map("ip_address")
  userAgent         String?   @map("user_agent")
  activeWorkspaceId String?   @map("active_workspace_id")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### API Endpoints Required

better-auth provides built-in session management endpoints:
- `GET /api/auth/list-sessions` - List all active sessions for current user
- `POST /api/auth/revoke-session` - Revoke a specific session by ID
- `POST /api/auth/revoke-other-sessions` - Revoke all sessions except current

### Client-Side Integration

Use the authClient from `apps/web/src/lib/auth-client.ts`:
```typescript
// Extend authClient with session management methods
authClient.listSessions()
authClient.revokeSession({ sessionId: string })
authClient.revokeOtherSessions()
```

### User Agent Parsing

Parse `userAgent` string to extract:
- Browser name (Chrome, Firefox, Safari, Edge, etc.)
- Browser version
- Operating system (Windows, macOS, Linux, iOS, Android, etc.)
- Device type (Desktop, Mobile, Tablet)

**Recommended Library:** `ua-parser-js` (already widely used, lightweight)

### Security Requirements

1. **Session Identification:**
   - Current session must be identified to prevent self-revocation
   - Use session token from cookie to match current session

2. **Authorization:**
   - Users can only view/revoke their own sessions
   - better-auth handles authorization automatically via session middleware

3. **Session Revocation:**
   - Revoking a session deletes it from the database
   - Session token becomes invalid immediately
   - User on revoked session is logged out on next request

4. **Audit Trail:**
   - Session revocation should be logged (future enhancement)
   - Track who revoked which session when

### Error Handling

- **Network Errors:** Show error toast, allow retry
- **Session Not Found:** Handle gracefully (session may have expired)
- **Current Session Protection:** Disable revoke button for current session
- **Bulk Revocation Confirmation:** Confirm before revoking all sessions

---

## Implementation Notes

### Page Structure

```
/settings/sessions/
├── page.tsx                    # Main sessions page
└── components/
    ├── session-list.tsx        # List of active sessions
    ├── session-card.tsx        # Individual session card
    └── revoke-session-dialog.tsx  # Confirmation dialog
```

### Session Card Design

Each session card should display:
```
┌──────────────────────────────────────────┐
│ [Browser Icon] Browser Name (Version)    │
│ OS Name • Location (Optional)            │
│ Last active: 2 hours ago                 │
│ Created: December 1, 2025                │
│                                           │
│ [Current Session] or [Revoke Button]     │
└──────────────────────────────────────────┐
```

### State Management

Use React Query for server state:
```typescript
const { data: sessions, isLoading, error } = useQuery({
  queryKey: ['sessions'],
  queryFn: () => authClient.listSessions(),
})

const revokeSessionMutation = useMutation({
  mutationFn: (sessionId: string) => authClient.revokeSession({ sessionId }),
  onSuccess: () => queryClient.invalidateQueries(['sessions']),
})
```

### User Experience

1. **Loading State:**
   - Show skeleton loaders while fetching sessions
   - Disable actions during mutations

2. **Empty State:**
   - Show message if only current session exists
   - Encourage users about security benefits

3. **Success Feedback:**
   - Toast notification on successful revocation
   - Immediate UI update (optimistic or refetch)

4. **Confirmation:**
   - Confirm before revoking all other sessions
   - Explain what will happen (all other devices logged out)

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Session management page accessible at `/settings/sessions`
- [ ] List of active sessions displayed with all required information
- [ ] Current session properly identified and marked
- [ ] Individual session revocation working (except current)
- [ ] Bulk revocation (all other sessions) working
- [ ] User agent parsing correctly extracts device info
- [ ] Error handling implemented for all operations
- [ ] Loading states implemented for all async operations
- [ ] TypeScript compilation passes with no errors
- [ ] UI is responsive and matches design system
- [ ] Code reviewed and approved
- [ ] Story status updated to "review"

---

## Files to Create/Modify

### Files to Create
- `apps/web/src/app/settings/sessions/page.tsx` - Main sessions management page
- `apps/web/src/components/session/session-list.tsx` - Session list component
- `apps/web/src/components/session/session-card.tsx` - Individual session card
- `apps/web/src/components/session/revoke-session-dialog.tsx` - Confirmation dialog
- `apps/web/src/lib/user-agent.ts` - User agent parsing utilities

### Files to Modify
- `apps/web/src/lib/auth-client.ts` - Add session management methods
- `apps/web/package.json` - Add ua-parser-js dependency if needed
- `docs/sprint-artifacts/sprint-status.yaml` - Update story status

---

## Technical Dependencies

### Epic Dependencies
- **Story 01-1 (Complete):** Requires better-auth configuration with session support
- **Story 01-4 (Complete):** Session creation during sign-in
- **Story 01-6 (Complete):** Session invalidation pattern established

### Package Dependencies
- `better-auth` - Built-in session management endpoints (already installed)
- `ua-parser-js` - User agent parsing (need to install: `pnpm add ua-parser-js`)
- `@tanstack/react-query` - Server state management (already installed)

---

## Traceability to Tech Spec

| Acceptance Criteria | Tech Spec Section | Reference |
|---------------------|-------------------|-----------|
| List active sessions | APIs and Interfaces | `/api/auth/list-sessions` endpoint |
| Display device info | Data Models and Contracts | Session model with userAgent field |
| Revoke individual session | APIs and Interfaces | `/api/auth/revoke-session` endpoint |
| Revoke all other sessions | APIs and Interfaces | `/api/auth/revoke-other-sessions` endpoint |
| Session security | Security | Session token validation |

---

## Related Stories

**Depends On:**
- 01-1: Install and Configure better-auth (complete) - provides session infrastructure
- 01-4: Implement Email/Password Sign-In (complete) - creates sessions
- 01-6: Implement Password Reset Flow (complete) - session invalidation pattern

**Blocks:**
- None - This is a standalone feature for user account security

**Related:**
- 01-8: Create Auth UI Components - may share components/patterns

---

## Success Metrics

- Users can view all their active sessions
- Session information is accurate (device, browser, last activity)
- Session revocation works immediately across devices
- Page load time < 500ms (p95)
- Zero errors in production for session operations
- Estimated completion time: 3-4 hours

---

## Development Notes

### User Agent Parsing Example

```typescript
import UAParser from 'ua-parser-js'

function parseUserAgent(userAgent: string) {
  const parser = new UAParser(userAgent)
  const result = parser.getResult()

  return {
    browser: {
      name: result.browser.name || 'Unknown',
      version: result.browser.version || '',
    },
    os: {
      name: result.os.name || 'Unknown',
      version: result.os.version || '',
    },
    device: {
      type: result.device.type || 'desktop',
      vendor: result.device.vendor || '',
      model: result.device.model || '',
    },
  }
}
```

### Session Identification

```typescript
// Get current session token from cookie to identify current session
function getCurrentSessionId(): string | undefined {
  const cookies = document.cookie.split(';')
  const sessionCookie = cookies.find(c => c.trim().startsWith('hyvve-session-token='))
  // Parse and extract session ID from JWT or use session endpoint
  // better-auth provides this via useSession hook
}
```

### Location from IP (Optional for MVP)

For MVP, location can be omitted or shown as "Unknown". Future enhancement:
- Use IP geolocation service (e.g., ipapi.co, ipinfo.io)
- Show city/country level location (not precise address)
- Implement on backend to keep IP private

---

## Testing Requirements

### Manual Testing

1. **View Sessions:**
   - Sign in on multiple devices/browsers
   - Verify all sessions appear in list
   - Verify current session is marked correctly

2. **Session Information:**
   - Verify browser name/version is correct
   - Verify OS information is correct
   - Verify last activity timestamp updates
   - Verify session created date is accurate

3. **Individual Revocation:**
   - Revoke a specific session
   - Verify session is removed from list
   - Verify user is logged out on that device
   - Verify current session cannot be revoked

4. **Bulk Revocation:**
   - Click "Revoke All Other Sessions"
   - Confirm in dialog
   - Verify all other sessions are revoked
   - Verify current session remains active
   - Verify users are logged out on other devices

5. **Error Handling:**
   - Test with network errors (simulate offline)
   - Test with invalid session ID
   - Verify error messages are user-friendly
   - Verify retry capability works

### Integration Testing

- Test session list API endpoint
- Test individual revocation API endpoint
- Test bulk revocation API endpoint
- Test authorization (users can only access own sessions)

---

## Notes

- Session management is critical for account security
- Users should be able to identify suspicious sessions
- Location information can be added as future enhancement
- Consider adding session activity log (future enhancement)
- Mobile responsive design is important for cross-device management

---

_Story created: 2025-12-02_
_Epic reference: EPIC-01-authentication.md_
_Tech spec reference: tech-spec-epic-01.md_
