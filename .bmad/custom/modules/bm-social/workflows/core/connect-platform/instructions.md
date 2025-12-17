# Connect Platform Workflow

## Purpose
Connect a new social media account to the HYVVE platform via OAuth authentication.

## Context Variables
- `{{platform}}` - Target platform (twitter, linkedin, facebook, instagram, tiktok, youtube, pinterest, threads, bluesky)
- `{{workspace_id}}` - Current workspace identifier
- `{{user_id}}` - Authenticated user ID

## Prerequisites
- User must be authenticated
- User must have permission to connect accounts
- Platform OAuth credentials configured in workspace settings

## Execution Steps

### Step 1: Platform Selection
Present available platforms with connection status:

```
Available Platforms:
[ ] Twitter/X - Connect your Twitter account
[ ] LinkedIn - Personal or Company page
[ ] Facebook - Personal, Page, or Group
[ ] Instagram - Business or Creator account
[ ] TikTok - Business account required
[ ] YouTube - Channel connection
[ ] Pinterest - Business account
[ ] Threads - Via Instagram connection
[ ] Bluesky - Direct connection
```

Validate platform is supported and not already connected.

### Step 2: Permission Review
Display required permissions for selected platform:

**Twitter Example:**
- Read tweets and profile
- Post tweets on your behalf
- Access Direct Messages (optional)
- View analytics

Ask user to confirm they accept permissions.

### Step 3: Initiate OAuth Flow
1. Generate state token for CSRF protection
2. Build OAuth authorization URL with scopes
3. Store pending connection in `PlatformConnection` table with status `pending`
4. Redirect user to platform authorization

### Step 4: Authorization Callback
1. Verify state token matches
2. Exchange authorization code for access token
3. Fetch user/page profile from platform API
4. Store tokens encrypted in `PlatformConnection`
5. Update status to `connected`

### Step 5: Account Configuration
Prompt for settings:
- **Display Name**: How account appears in calendar
- **Default Posting**: Direct publish or queue
- **Team Access**: Which team members can post
- **Notifications**: Enable post confirmations

### Step 6: Time Slot Setup
Configure auto-scheduling slots:
```
Weekly Schedule:
Mon: [9:00 AM] [12:00 PM] [6:00 PM]
Tue: [9:00 AM] [12:00 PM] [6:00 PM]
...
```

Use `optimal-posting-times.csv` as defaults.

### Step 7: Test Connection
1. Fetch recent posts to verify read access
2. Optionally create a test draft (not published)
3. Verify all permissions working

### Step 8: Confirmation
Display success message:
```
Connected: @username on Twitter
Permissions: Post, Read, Analytics
Time Slots: 21 slots configured
Next Step: Create your first post
```

Emit event: `social.platform.connected`

## Error Handling

| Error | Resolution |
|-------|------------|
| OAuth denied | Show retry option, explain permissions |
| Token expired | Prompt re-authorization |
| Rate limited | Queue for retry, show wait time |
| Invalid scope | Check platform requirements |

## Events Emitted
- `social.platform.connecting` - OAuth flow started
- `social.platform.connected` - Successfully connected
- `social.platform.failed` - Connection failed

## Related Workflows
- `create-post` - Create content after connecting
- `schedule-content` - Set up posting schedule
