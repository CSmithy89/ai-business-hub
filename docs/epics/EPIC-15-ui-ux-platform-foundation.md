# Epic 15: UI/UX Platform Foundation

**Epic ID:** EPIC-15
**Status:** Ready for Development
**Priority:** P0/P1 - Critical & High Priority
**Phase:** Phase 7 - UI/UX Foundation
**Source:** UI-UX-IMPROVEMENTS-BACKLOG.md (User Testing + Style Guide Audit)

---

## Epic Overview

Implement comprehensive UI/UX improvements to transform HYVVE from a functional prototype into a polished, production-ready platform. This epic addresses critical user flow issues, style guide compliance, and core functionality gaps identified through user testing and design audits.

### Business Value

The current platform has significant UX friction: users land on "No Workspace Selected," icons display as text strings, chat doesn't connect to agents, and settings pages are empty shells. This epic delivers the "first impression" experience that makes users believe in the platform's promise of 90% automation.

### Success Criteria

- [ ] Users land on Businesses Portfolio page after sign-in (not empty dashboard)
- [ ] 4-step onboarding wizard guides new users through setup
- [ ] All icons display as proper Lucide components (no text strings)
- [ ] Chat panel connects to real Agno backend with streaming responses
- [ ] All Settings pages fully functional (Profile, Security, Sessions, Workspace, Members, AI Config)
- [ ] Approval queue loads data without errors
- [ ] Style guide compliance >90% (premium shadows, hover states, focus rings)
- [ ] Business portfolio and switcher operational

---

## Stories

### Chapter 1: Critical Infrastructure Fixes (P0)

---

### Story 15.1: Replace Material Icon Text Strings with Lucide Components

**Points:** 3
**Priority:** P0
**Backlog Reference:** Section 13.1, 1.2

**As a** user navigating the platform
**I want** to see proper icons instead of text like "grid_view" and "check_circle"
**So that** the UI looks professional and is visually understandable

**Acceptance Criteria:**
- [ ] Replace all Material Icon text strings with Lucide React components
- [ ] Sidebar icons updated:
  - `grid_view` → `<LayoutGrid />`
  - `check_circle` → `<CheckCircle />`
  - `smart_toy` → `<Bot />`
  - `settings` → `<Settings />`
  - `group` → `<Users />`
  - `folder_open` → `<Folder />`
- [ ] Header icons updated:
  - `search` → `<Search />`
  - `notifications` → `<Bell />`
  - `help` → `<HelpCircle />`
  - `expand_more` → `<ChevronDown />`
- [ ] Chat panel icons updated:
  - `@` mentions → `<AtSign />`
  - attachments → `<Paperclip />`
  - send → `<ArrowUp />`
  - history → `<History />`
  - minimize → `<Minimize2 />`
  - maximize → `<Maximize2 />`
  - external link → `<ExternalLink />`
- [ ] Verify no remaining text-based icon references in codebase
- [ ] All icons have appropriate size (default 20px for nav, 16px for inline)

**Technical Notes:**
- Import from `lucide-react` package (already installed)
- Apply consistent sizing via className or size prop
- Ensure icons inherit color from parent for theme support

**Files to Modify:**
- `apps/web/src/components/layout/sidebar.tsx`
- `apps/web/src/components/layout/header.tsx`
- `apps/web/src/components/chat/chat-panel.tsx`
- `apps/web/src/components/chat/chat-input.tsx`

---

### Story 15.2: Create Businesses Portfolio Landing Page

**Points:** 5
**Priority:** P0
**Backlog Reference:** Section 2.1, 10.1
**Wireframe:** BO-01 Portfolio Dashboard with Business Cards

**As a** signed-in user
**I want** to see all my businesses on a dedicated portfolio page
**So that** I can quickly access or create businesses

**Acceptance Criteria:**
- [ ] Create page at `/businesses` route
- [ ] Display businesses as card grid (see wireframe BO-01)
- [ ] Each business card shows:
  - Business logo/placeholder
  - Business name
  - Status badge (Draft, Validating, Planning, Branding, Active)
  - Validation score (if available)
  - Phase progress indicators (dots or bar)
  - Last updated timestamp
  - "Continue →" action button
- [ ] "Add New Business" card at end of grid
  - Links to `/onboarding/wizard`
- [ ] Empty state for users with no businesses:
  - Hub character illustration
  - "Create Your First Business" CTA
  - Warm, encouraging copy
- [ ] Search bar to filter businesses by name
- [ ] Sort options: Name, Created Date, Last Activity, Status
- [ ] Responsive grid: 3 columns desktop, 2 tablet, 1 mobile
- [ ] Update sign-in redirect to `/businesses` instead of `/dashboard`

**Visual Layout (from Wireframe):**
```
Your Businesses                                    [+ Add Business]

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 🏢 Acme Corp     │  │ 🏢 TechStart     │  │ ➕ Add New       │
│ ━━━━━━━━━━━━━━━  │  │ ━━━━━━━━━━━━━━━  │  │  Start a new     │
│ Validation: 85%  │  │ Validation: 40%  │  │  business        │
│ Planning: 60%    │  │ Planning: 0%     │  │  validation      │
│ Branding: 30%    │  │ Branding: 0%     │  │                  │
│ [Continue →]     │  │ [Continue →]     │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

**Technical Notes:**
- Fetch businesses from `/api/businesses` endpoint
- Use skeleton loaders while fetching
- Business status determines card accent color

**Files to Create:**
- `apps/web/src/app/(app)/businesses/page.tsx`
- `apps/web/src/components/business/business-card.tsx`
- `apps/web/src/components/business/business-grid.tsx`
- `apps/web/src/components/business/add-business-card.tsx`

---

### Story 15.3: Implement 4-Step User Onboarding Wizard

**Points:** 8
**Priority:** P0
**Backlog Reference:** Section 2.2
**Wireframe:** AU-05 Onboarding Wizard (lines 887-960 in WIREFRAME-INDEX.md)

**As a** new user completing sign-up
**I want** a guided onboarding experience
**So that** I can set up my workspace and understand the platform

**Acceptance Criteria:**
- [ ] Create route at `/onboarding/account-setup`
- [ ] Step indicator shows 4 dots with current step highlighted in coral
- [ ] Back/Continue navigation buttons
- [ ] Skip option with warning about limited functionality

**Step 1: Create Workspace**
- [ ] Workspace name input
- [ ] Auto-generated workspace URL preview (hyvve.app/[slug])
- [ ] Validation for name length and uniqueness

**Step 2: Add AI Provider (BYOAI Setup)**
- [ ] Provider selection radio cards:
  - 🧠 Claude (Anthropic) - Recommended badge
  - 🤖 OpenAI
  - 💎 Google Gemini
  - 🔮 DeepSeek
  - 🌐 OpenRouter
- [ ] API key input (masked after entry)
- [ ] "Test Key" button with loading state
- [ ] Success/failure feedback for key validation
- [ ] Option to skip (with limitations warning)

**Step 3: Meet Your AI Team**
- [ ] Introduction carousel/cards for agents:
  - 🎯 Hub - Your orchestrator
  - 🐚 Maya - CRM & relationships
  - 🗺️ Atlas - Projects & tasks
  - ✨ Nova - Marketing & content
  - 📊 Echo - Analytics & insights
- [ ] Brief description of each agent's role
- [ ] "They'll handle 90% of your operations" messaging

**Step 4: Ready!**
- [ ] Welcome message with user's name
- [ ] Optional quick tour toggle
- [ ] "Go to Dashboard" primary CTA
- [ ] Confetti animation on completion (per style guide celebration moments)

**Progress Persistence:**
- [ ] Save progress to localStorage or API after each step
- [ ] Resume from last incomplete step on return
- [ ] Redirect to businesses page if onboarding complete

**Technical Notes:**
- Use Zustand or React state for wizard state management
- API key validation calls `/api/ai-providers/validate`
- Store workspace creation via existing workspace API

**Files to Create:**
- `apps/web/src/app/(auth)/onboarding/account-setup/page.tsx`
- `apps/web/src/components/onboarding/onboarding-wizard.tsx`
- `apps/web/src/components/onboarding/step-indicator.tsx`
- `apps/web/src/components/onboarding/step-[1-4].tsx`

---

### Story 15.4: Connect Chat Panel to Agno Backend

**Points:** 8
**Priority:** P0
**Backlog Reference:** Section 3.3, 3.4

**As a** user interacting with the chat panel
**I want** real responses from AI agents
**So that** I can actually use the platform's AI capabilities

**Acceptance Criteria:**
- [ ] Connect chat to Agno/FastAPI agent backend
- [ ] Implement message sending functionality
- [ ] POST to `/api/agents/[agentId]/messages` with user message
- [ ] Typing indicator appears when agent is processing
- [ ] Support streaming responses (SSE or WebSocket)
- [ ] Display agent response with proper formatting (markdown support)
- [ ] Handle agent errors gracefully:
  - Network failure → "Unable to reach agent. Retry?"
  - Rate limit → "Please wait a moment..."
  - API key invalid → "Check your AI provider settings"
- [ ] Persist chat history per session/business context
- [ ] Support @mentions for specific agents (@hub, @maya, etc.)
- [ ] File attachment upload with drag-drop
- [ ] Attachment processing feedback (uploading, processing, complete)

**Chat Agent Selection (Section 3.4):**
- [ ] Agent selector dropdown in chat header
- [ ] Display current agent avatar and name
- [ ] Dropdown shows available agents:
  - Hub (default orchestrator)
  - Maya (CRM & relationships)
  - Atlas (Projects & tasks)
  - Nova (Marketing & content)
  - Echo (Analytics & insights)
- [ ] Agent switch maintains conversation context (optional clear)
- [ ] Visual indicator of which agent is responding
- [ ] Agent-specific greeting on switch

**Message Flow:**
```
User types message → POST /api/agents/hub/messages
                  → AgentOS processes → SSE stream
                  → Typing indicator while streaming
                  → Display complete response
                  → Save to chat history
```

**Technical Notes:**
- Use existing AgentOSService bridge from EPIC-04
- Agent context includes current workspaceId, businessId (if in business)
- Rate limiting via Redis

**Files to Modify:**
- `apps/web/src/components/chat/chat-panel.tsx`
- `apps/web/src/components/chat/chat-input.tsx`
- `apps/web/src/components/chat/chat-message.tsx`
- `apps/web/src/hooks/use-chat.ts`
- `apps/api/src/agents/agents.controller.ts`

---

### Story 15.5: Fix Approvals Page Data Loading

**Points:** 3
**Priority:** P0
**Backlog Reference:** Section 5.1

**As a** user viewing the Approvals page
**I want** approval items to load without errors
**So that** I can review and act on pending approvals

**Acceptance Criteria:**
- [ ] Fix "Error Loading Approvals - Failed to fetch" error
- [ ] Implement proper API endpoint at GET `/api/approvals`
- [ ] Show skeleton loaders while loading
- [ ] Demo mode fallback with sample approval items:
  - 3-5 realistic approval items
  - Mix of confidence levels (high, medium, low)
  - Different types (content, email, deal, agent_action)
- [ ] Graceful error handling with retry button
- [ ] Empty state when no approvals pending

**Demo Data Structure:**
```typescript
const demoApprovals = [
  {
    id: 'demo-1',
    type: 'content',
    title: 'Blog Post: AI Automation Trends',
    confidenceScore: 92,
    status: 'pending',
    agentName: 'Nova',
    createdAt: new Date(),
  },
  // ... more items
];
```

**Technical Notes:**
- Check if real API returns data; fallback to demo if error
- Console logging for debugging (removable in prod)

**Files to Modify:**
- `apps/web/src/app/(app)/approvals/page.tsx`
- `apps/web/src/hooks/use-approvals.ts`
- `apps/api/src/approvals/approvals.controller.ts`

---

### Story 15.6: Implement Settings Profile Page

**Points:** 3
**Priority:** P0
**Backlog Reference:** Section 4.1 - Profile

**As a** user managing my account
**I want** a functional profile settings page
**So that** I can update my personal information

**Acceptance Criteria:**
- [ ] Display current user info:
  - Full name (editable)
  - Email (read-only, shows provider if OAuth)
  - Avatar (with upload/change capability)
- [ ] Edit name with inline validation
- [ ] Avatar upload:
  - Click to open file picker
  - Drag-drop support
  - Image preview before save
  - Crop/resize modal (optional)
  - Max file size: 2MB
  - Accepted formats: jpg, png, gif, webp
- [ ] Connected accounts display:
  - Show OAuth providers (Google, GitHub)
  - "Connected" badge with disconnect option
  - "Connect" button for unlinked providers
- [ ] Save changes button (disabled until changes made)
- [ ] Success toast on save
- [ ] Loading state during save

**Technical Notes:**
- Avatar upload to cloud storage (S3/R2)
- Use existing user API endpoints
- Optimistic UI update for avatar

**Files to Modify:**
- `apps/web/src/app/(app)/settings/page.tsx`
- `apps/web/src/components/settings/profile-form.tsx`
- `apps/web/src/components/settings/avatar-upload.tsx`

---

### Story 15.7: Implement Settings Security Page

**Points:** 5
**Priority:** P0
**Backlog Reference:** Section 4.1 - Security

**As a** security-conscious user
**I want** to manage my password and 2FA settings
**So that** my account remains secure

**Acceptance Criteria:**
- [ ] Current password verification field
- [ ] Change password form:
  - New password input
  - Confirm password input
  - Password strength indicator (weak/medium/strong)
  - Requirements checklist (8+ chars, uppercase, number, symbol)
- [ ] Two-factor authentication section:
  - Current 2FA status (Enabled/Disabled)
  - "Enable 2FA" button → setup modal with QR code
  - "Disable 2FA" button with password confirmation
- [ ] Backup codes:
  - Generate 10 single-use codes
  - Display in modal with copy/download options
  - Regenerate option (invalidates old codes)
- [ ] Recent security events log:
  - Password changes
  - 2FA changes
  - New device logins
  - Show last 10 events

**Technical Notes:**
- 2FA uses TOTP (Time-based One-Time Password)
- Use `otplib` for TOTP generation/verification
- Backup codes stored hashed in database

**Files to Create:**
- `apps/web/src/app/(app)/settings/security/page.tsx`
- `apps/web/src/components/settings/change-password-form.tsx`
- `apps/web/src/components/settings/two-factor-setup.tsx`
- `apps/web/src/components/settings/backup-codes-modal.tsx`
- `apps/web/src/components/settings/security-log.tsx`

---

### Story 15.8: Implement Settings Sessions Page

**Points:** 3
**Priority:** P0
**Backlog Reference:** Section 4.1 - Sessions

**As a** user concerned about account access
**I want** to see and manage my active sessions
**So that** I can detect unauthorized access and sign out remotely

**Acceptance Criteria:**
- [ ] List all active sessions with:
  - Device type icon (desktop/mobile/tablet)
  - Browser name and version
  - Operating system
  - IP address (partially masked for privacy)
  - Location (city, country from IP)
  - Last active timestamp
  - "Current session" badge for this session
- [ ] "Sign out" button per session (except current)
- [ ] "Sign out all other sessions" button with confirmation
- [ ] Session creation timestamps
- [ ] Empty state if only current session exists
- [ ] Auto-refresh every 30 seconds

**Technical Notes:**
- Sessions stored in `sessions` table via better-auth
- Use IP geolocation service for location
- User-Agent parsing for device/browser info

**Files to Create:**
- `apps/web/src/app/(app)/settings/sessions/page.tsx`
- `apps/web/src/components/settings/session-list.tsx`
- `apps/web/src/components/settings/session-card.tsx`

---

### Story 15.9: Implement Workspace General Settings

**Points:** 3
**Priority:** P0
**Backlog Reference:** Section 4.2 - General

**As a** workspace owner
**I want** to configure workspace-level settings
**So that** I can customize my workspace

**Acceptance Criteria:**
- [ ] Workspace name edit with validation
- [ ] Workspace slug/URL display (read-only after creation)
- [ ] Timezone selection dropdown (all IANA timezones)
- [ ] Default language selection (English, Spanish, French, German, etc.)
- [ ] Workspace avatar/logo upload:
  - Same UX as profile avatar
  - Displayed in header workspace selector
- [ ] Delete workspace button:
  - Requires typing workspace name to confirm
  - Warning about permanent deletion
  - Transfers ownership or deletes all data
- [ ] Save changes button with loading state
- [ ] Success/error toasts

**Technical Notes:**
- Timezone affects scheduled agent actions
- Delete workspace is soft-delete with 30-day recovery window

**Files to Modify:**
- `apps/web/src/app/(app)/settings/workspace/page.tsx`
- `apps/web/src/components/settings/workspace-form.tsx`
- `apps/web/src/components/settings/delete-workspace-modal.tsx`

---

### Story 15.10: Fix and Implement Workspace Members Page

**Points:** 5
**Priority:** P0
**Backlog Reference:** Section 4.2 - Members

**As a** workspace admin
**I want** to manage team members
**So that** I can control who has access to my workspace

**Acceptance Criteria:**
- [ ] **Fix "No workspace selected" error** - Workspace context must load correctly
- [ ] Display members table with columns:
  - Avatar + Name
  - Email
  - Role (dropdown for role change)
  - Status (Active, Pending, Deactivated)
  - Last Active timestamp
  - Actions menu (Remove, Change Role)
- [ ] Invite member modal:
  - Email input (supports multiple comma-separated)
  - Role selection dropdown
  - Personal message (optional)
  - "Send Invite" button
- [ ] Pending invitations section:
  - Shows pending invites with resend/cancel options
  - Expiration countdown
- [ ] Role change dropdown per member:
  - Owner (single, with transfer flow)
  - Admin
  - Member
  - Viewer (read-only)
  - Billing (billing only)
- [ ] Remove member with confirmation:
  - Warning about data ownership
  - Option to transfer ownership of their items
- [ ] Bulk actions:
  - Select multiple members
  - Bulk remove
  - Bulk role change
- [ ] Search filter by name/email
- [ ] Pagination for large teams (>20 members)

**Technical Notes:**
- Workspace context from URL param or Zustand store
- Role changes require owner/admin permission
- Invitation sends email via SendGrid/Resend

**Files to Modify:**
- `apps/web/src/app/(app)/settings/workspace/members/page.tsx`
- `apps/web/src/components/settings/members-table.tsx`
- `apps/web/src/components/settings/invite-member-modal.tsx`
- `apps/web/src/components/settings/member-actions.tsx`

---

### Story 15.10a: Implement Workspace Roles Page

**Points:** 3
**Priority:** P0
**Backlog Reference:** Section 4.2 - Roles

**As a** workspace admin
**I want** to view role definitions and permissions
**So that** I understand what each role can do and assign appropriate roles to members

**Acceptance Criteria:**
- [ ] Create page at `/settings/workspace/roles`
- [ ] Display 5 default roles in a table/cards:
  - **Owner** - Full access, can delete workspace, transfer ownership
  - **Admin** - Manage members, settings, billing; cannot delete workspace
  - **Member** - Standard access to all features, cannot manage members
  - **Viewer** - Read-only access to all data
  - **Billing** - Access to billing and subscription settings only
- [ ] Permission matrix table showing capabilities per role:
  - Columns: Permission categories
  - Rows: Roles
  - Cells: ✓ / ✗ indicators
- [ ] Permission categories to display:
  - Workspace Settings
  - Member Management
  - Billing & Subscription
  - Business Management
  - AI Agent Configuration
  - Approval Actions
  - Data Export
- [ ] Visual hierarchy: Owner at top, descending permissions
- [ ] Read-only for non-owner users (no editing roles)
- [ ] Link to this page from Members page ("View Role Permissions")
- [ ] Responsive layout for table (horizontal scroll on mobile)

**Permission Matrix Layout:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ Role Permissions                                                     │
├──────────┬──────────┬─────────┬─────────┬─────────┬─────────────────┤
│ Role     │ Settings │ Members │ Billing │ Business│ Agent Config    │
├──────────┼──────────┼─────────┼─────────┼─────────┼─────────────────┤
│ Owner    │    ✓     │    ✓    │    ✓    │    ✓    │       ✓         │
│ Admin    │    ✓     │    ✓    │    ✓    │    ✓    │       ✓         │
│ Member   │    ○     │    ✗    │    ✗    │    ✓    │       ○         │
│ Viewer   │    ✗     │    ✗    │    ✗    │    ○    │       ✗         │
│ Billing  │    ✗     │    ✗    │    ✓    │    ✗    │       ✗         │
└──────────┴──────────┴─────────┴─────────┴─────────┴─────────────────┘
Legend: ✓ Full access  ○ Limited access  ✗ No access
```

**Technical Notes:**
- Roles are system-defined, not user-editable in MVP
- Permission matrix can be static data (no API needed)
- Future: Custom roles feature (separate epic)

**Files to Create:**
- `apps/web/src/app/(app)/settings/workspace/roles/page.tsx`
- `apps/web/src/components/settings/roles-table.tsx`
- `apps/web/src/components/settings/permission-matrix.tsx`
- `apps/web/src/config/roles-permissions.ts`

---

### Chapter 2: High Priority Features (P1)

---

### Story 15.11: Implement Main Menu Restructuring with Businesses Tab

**Points:** 3
**Priority:** P1
**Backlog Reference:** Section 1.1

**As a** user navigating the platform
**I want** Businesses as a main menu item with sub-navigation
**So that** I can easily access all business-related features

**Acceptance Criteria:**
- [ ] Add "Businesses" tab to main sidebar menu
- [ ] Businesses sub-navigation items:
  - Portfolio (→ `/businesses`)
  - Planning (→ `/businesses/planning`)
  - Branding (→ `/businesses/branding`)
  - Validation (→ `/businesses/validation`)
- [ ] Collapsible sub-menu with expand/collapse chevron
- [ ] Active state highlighting for current section
- [ ] Remove "Your Businesses" from Dashboard (moved to portfolio)
- [ ] Icon for Businesses: `<Building2 />` or `<Briefcase />`

**Technical Notes:**
- Sub-navigation only visible when Businesses expanded
- Deep linking maintains parent highlight

**Files to Modify:**
- `apps/web/src/components/layout/sidebar.tsx`
- `apps/web/src/config/navigation.ts`

---

### Story 15.12: Implement Chat Panel Position Options

**Points:** 5
**Priority:** P1
**Backlog Reference:** Section 3.1, 3.2

**As a** user who prefers different layouts
**I want** multiple chat panel position options
**So that** I can customize my workspace layout

**Acceptance Criteria:**
- [ ] **Position 1: Right Panel** (current default)
  - Full height on right side
  - Resizable width (300-600px)
- [ ] **Position 2: Bottom Horizontal**
  - Docked at bottom, full width
  - ~200px height, resizable
  - Horizontal message layout
- [ ] **Position 3: Floating Window**
  - Draggable anywhere on screen
  - Resizable width and height
  - Minimum size: 300x400px
  - "Pin" option to prevent accidental moves
- [ ] **Position 4: Collapsed**
  - Minimized to floating action button
  - Badge shows unread count
  - Click to expand to last position
- [ ] Position toggle in chat header (icon buttons or menu)
- [ ] Remember user preference in localStorage
- [ ] Smooth animated transitions between positions
- [ ] Keyboard shortcut: `Ctrl+Shift+C` to toggle collapse

**Responsive Behavior:**
- [ ] Auto-collapse on screens < 1024px
- [ ] Full-screen modal mode on mobile (< 768px)
- [ ] Floating action button visible when collapsed

**Technical Notes:**
- Use CSS transforms for animations
- Floating uses `position: fixed` with drag library
- localStorage key: `chat-panel-position`

**Files to Modify:**
- `apps/web/src/components/chat/chat-panel.tsx`
- `apps/web/src/components/chat/chat-container.tsx`
- `apps/web/src/hooks/use-chat-position.ts`

---

### Story 15.13: Implement AI Configuration Page

**Points:** 5
**Priority:** P1
**Backlog Reference:** Section 4.3, 11.1
**Wireframe:** ST-02 API Keys Management

**As a** user managing my AI providers
**I want** a comprehensive AI configuration page
**So that** I can manage my BYOAI API keys

**Acceptance Criteria:**
- [ ] Provider list with status cards:
  - 🧠 Claude (Anthropic)
  - 🤖 OpenAI
  - 💎 Google Gemini
  - 🔮 DeepSeek
  - 🌐 OpenRouter
- [ ] Per-provider card shows:
  - Provider logo/icon
  - Status badge (Verified ✓, Not configured ○, Invalid ✗)
  - Masked API key (last 4 chars visible)
  - "Test" button with loading/success/failure states
  - "Remove" button with confirmation
  - Last used timestamp
- [ ] Add provider modal:
  - Provider selection (if adding new)
  - API key input (masked)
  - Test connection before save
  - Model selection dropdown (provider-specific)
- [ ] Default model selection per agent (optional)
- [ ] Usage statistics per provider (tokens used, cost estimate)
- [ ] Key expiration warnings (for providers that expire keys)

**Wireframe Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│ API Keys                                      [+ Add Provider]  │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🧠 Claude (Anthropic)                    ✓ Verified      │  │
│  │ API Key: sk-ant-••••••••••••3f2a       [Test] [Remove]   │  │
│  │ Last used: 2 hours ago                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

**Technical Notes:**
- API keys encrypted at rest (AES-256)
- Test calls minimal endpoint (e.g., list models)
- Usage tracking via AgentOS telemetry

**Files to Create:**
- `apps/web/src/app/(app)/settings/ai-config/page.tsx`
- `apps/web/src/components/settings/ai-provider-card.tsx`
- `apps/web/src/components/settings/add-provider-modal.tsx`

---

### Story 15.14: Implement Business Switcher Dropdown

**Points:** 3
**Priority:** P1
**Backlog Reference:** Section 10.2
**Wireframe:** BO-09 Business Switcher Dropdown

**As a** user working across multiple businesses
**I want** a quick switcher in the header
**So that** I can rapidly change business context

**Acceptance Criteria:**
- [ ] Header dropdown for business switching
- [ ] Current business shows:
  - Logo/avatar
  - Business name
  - Status badge
- [ ] Dropdown list shows:
  - All user's businesses
  - Status badge per business
  - Search/filter input
- [ ] "View All" link → `/businesses` portfolio
- [ ] "Create New" link → `/onboarding/wizard`
- [ ] Replaces/augments workspace selector when in business context
- [ ] Smooth transition animation on open/close
- [ ] Keyboard navigation (up/down arrows, enter to select)

**Technical Notes:**
- Uses Radix UI Dropdown or shadcn Select
- Business context stored in URL and Zustand

**Files to Create:**
- `apps/web/src/components/layout/business-switcher.tsx`

**Files to Modify:**
- `apps/web/src/components/layout/header.tsx`

---

### Story 15.15: Update Sign-In Flow Redirect Logic

**Points:** 2
**Priority:** P1
**Backlog Reference:** Section 2.3

**As a** returning user
**I want** to land on the right page after sign-in
**So that** I can immediately start working

**Acceptance Criteria:**
- [ ] After successful sign-in:
  - If onboarding incomplete → redirect to `/onboarding/account-setup`
  - If no businesses exist → redirect to `/businesses` with empty state
  - If businesses exist → redirect to `/businesses`
  - If deep link provided → redirect to deep link after auth
- [ ] "Continue Setup" prompt if onboarding incomplete
- [ ] Remember last visited page (optional enhancement)

**Technical Notes:**
- Check `user.onboardingComplete` flag
- Check `workspaces.length` and `businesses.length`
- Store intended destination before auth redirect

**Files to Modify:**
- `apps/web/src/app/(auth)/sign-in/page.tsx`
- `apps/web/src/middleware.ts`
- `apps/api/src/auth/auth.service.ts`

---

### Story 15.16: Enhance Business Onboarding Wizard

**Points:** 5
**Priority:** P1
**Backlog Reference:** Section 10.3
**Wireframes:** BO-02, BO-03, BO-04, BO-05

**As a** user creating a new business
**I want** an enhanced onboarding wizard matching wireframes
**So that** I provide comprehensive business information

**Acceptance Criteria:**

**Step 1 Enhancement - Documents:**
- [ ] Document upload zone with drag-drop
- [ ] Supported formats: PDF, DOCX, PPTX, TXT
- [ ] Upload types: Pitch deck, Business plan, Market research
- [ ] Progress indicator per file
- [ ] "Skip" option if no documents

**Step 2 Enhancement - Details:**
- [ ] Industry selection dropdown (pre-populated list)
- [ ] Business stage selection:
  - Idea
  - Pre-seed
  - Seed
  - Series A+
  - Established
- [ ] Team size selector (1, 2-5, 6-10, 11-50, 50+)
- [ ] Funding status (Bootstrapped, Seeking, Funded)
- [ ] All fields with validation

**Step 3 Enhancement - Capture Idea:**
- [ ] Replace form with chat interface
- [ ] Vera (Validation Lead) introduces herself
- [ ] Conversational intake of:
  - Problem being solved
  - Target customer
  - Proposed solution
  - Unique value proposition
- [ ] Structured extraction from conversation

**Step 4 Enhancement - Launch:**
- [ ] Validation team introduction cards:
  - 🎯 Vera - Validation Lead (coral)
  - 📊 Marco - Market Research (blue)
  - 🔍 Cipher - Competitive Intel (teal)
  - 👤 Persona - Customer Discovery (purple)
  - ⚠️ Risk - Risk Assessment (orange)
- [ ] Estimated timeline for validation process
- [ ] "Start Validation" CTA

**Technical Notes:**
- Document upload to cloud storage
- Chat with Vera uses AgentOS conversation endpoint
- Store intake data in business record

**Files to Modify:**
- `apps/web/src/app/(app)/onboarding/wizard/page.tsx`
- `apps/web/src/components/onboarding/wizard-step-*.tsx`

---

### Story 15.17: Implement Approval Cards with Confidence Visualization

**Points:** 3
**Priority:** P1
**Backlog Reference:** Section 5.2, 5.3

**As an** approver reviewing items
**I want** clear approval cards with confidence indicators
**So that** I can make quick, informed decisions

**Acceptance Criteria:**
- [ ] Display approval items in cards/list
- [ ] Each card shows:
  - Type icon (content, email, deal, etc.)
  - Title
  - Confidence score with color:
    - Green (>85%): High confidence, likely auto-approve
    - Yellow (60-85%): Medium, quick review needed
    - Red (<60%): Low, full review required
  - Agent name/avatar that created the item
  - Timestamp
- [ ] Quick actions:
  - Approve (primary button)
  - Reject (secondary button)
  - View Details (expands card or opens modal)
- [ ] Bulk selection checkboxes
- [ ] Bulk action bar (appears when items selected)

**Approval Detail Modal:**
- [ ] Full approval context display
- [ ] AI reasoning explanation (collapsible)
- [ ] Confidence factors breakdown:
  - Factor name
  - Score
  - Explanation
  - Flag concerning factors in red
- [ ] Approve/Reject with optional comment
- [ ] History of similar past approvals (if available)

**Technical Notes:**
- Card variants: compact (list), expanded (detail)
- Modal uses shadcn Dialog component

**Files to Create:**
- `apps/web/src/components/approval/approval-card.tsx`
- `apps/web/src/components/approval/approval-detail-modal.tsx`
- `apps/web/src/components/approval/approval-list.tsx`

---

### Story 15.18: Implement Agent Cards Enhancement

**Points:** 3
**Priority:** P1
**Backlog Reference:** Section 6.2

**As a** user viewing the AI Team page
**I want** enhanced agent cards with full information
**So that** I understand each agent's capabilities and status

**Acceptance Criteria:**
- [ ] Agent card displays:
  - Agent avatar with character color border
  - Agent name and role title
  - Status indicator (Online, Busy, Offline, Paused)
  - Tasks completed count
  - Success rate percentage
  - Brief capability description
- [ ] Character colors per agent (from style guide):
  - Hub: #FF6B6B (coral)
  - Maya: #20B2AA (teal)
  - Atlas: #FF9F43 (orange)
  - Sage: #2ECC71 (green)
  - Nova: #FF6B9D (pink)
  - Echo: #4B7BEC (blue)
- [ ] Click card → opens agent detail modal
- [ ] Quick actions:
  - Configure (settings for this agent)
  - View Activity (recent actions)
  - Pause/Resume toggle

**Technical Notes:**
- Agent status from AgentOS health endpoint
- Stats aggregated from agent activity logs

**Files to Modify:**
- `apps/web/src/app/(app)/ai-team/page.tsx`
- `apps/web/src/components/agents/agent-card.tsx`

---

### Story 15.19: Apply Style Guide Card Styling

**Points:** 3
**Priority:** P1
**Backlog Reference:** Section 13.4

**As a** user viewing the platform
**I want** cards to have premium styling
**So that** the platform feels polished and professional

**Acceptance Criteria:**
- [ ] All cards use consistent border-radius: 16px (--radius-lg)
- [ ] All cards have subtle shadow at rest: `var(--shadow-sm)`
- [ ] Hover state adds:
  - Border color change: `var(--border-default)` → `var(--border-strong)`
  - Shadow increase: `var(--shadow-md)`
  - Subtle lift: `transform: translateY(-2px)`
- [ ] Consistent padding: 24px (--space-6)
- [ ] Card backgrounds: white on cream background for elevation
- [ ] Transition duration: 200ms ease-out

**CSS Variables to Implement:**
```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
--radius-lg: 16px;
--space-6: 24px;
--border-subtle: #f0ebe4;
--border-default: #e5ddd4;
--border-strong: #d4c9bc;
```

**Apply to Components:**
- [ ] Business cards
- [ ] Agent cards
- [ ] Approval cards
- [ ] Settings section cards
- [ ] Dashboard stat cards
- [ ] Any other card components

**Files to Modify:**
- `apps/web/src/app/globals.css` (CSS variables)
- `packages/ui/src/components/card.tsx`
- All card-using components

---

### Story 15.20: Apply Style Guide Button Styling

**Points:** 2
**Priority:** P1
**Backlog Reference:** Section 13.5

**As a** user interacting with buttons
**I want** premium button styling with proper feedback
**So that** interactions feel responsive and polished

**Acceptance Criteria:**
- [ ] Primary buttons:
  - Coral shadow: `0 2px 8px rgba(255, 107, 107, 0.25)`
  - Hover: `translateY(-1px)` + increased shadow
  - Active: `transform: scale(0.98)`
- [ ] All buttons:
  - Border radius: 10px (--radius-md)
  - Consistent padding
  - Smooth transitions (150ms)
- [ ] Ghost buttons:
  - Hover: subtle background change
  - Focus: coral ring
- [ ] Disabled state:
  - Reduced opacity (0.5)
  - No hover effects
  - cursor: not-allowed

**Technical Notes:**
- Update shadcn Button component variants
- Ensure all existing buttons inherit styles

**Files to Modify:**
- `packages/ui/src/components/button.tsx`
- `apps/web/src/app/globals.css`

---

### Story 15.21: Apply Style Guide Focus States

**Points:** 2
**Priority:** P1
**Backlog Reference:** Section 13.7

**As a** keyboard user or accessibility user
**I want** visible focus states on all interactive elements
**So that** I can navigate the interface effectively

**Acceptance Criteria:**
- [ ] All focusable elements have visible focus ring:
  - Color: coral (#FF6B6B)
  - Width: 2px
  - Offset: 2px
- [ ] Focus ring only appears on keyboard focus (`:focus-visible`)
- [ ] Applies to:
  - Buttons
  - Links
  - Inputs
  - Checkboxes/radios
  - Select dropdowns
  - Cards (when clickable)
  - Modal close buttons
  - Sidebar navigation items
- [ ] Sufficient contrast on all backgrounds (cream, white, dark)

**CSS Implementation:**
```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

**Technical Notes:**
- May need `:focus-visible` polyfill for older browsers
- Test with keyboard-only navigation

**Files to Modify:**
- `apps/web/src/app/globals.css`
- Individual component files if needed

---

### Story 15.22: Implement Chat Panel Styling Per Style Guide

**Points:** 3
**Priority:** P1
**Backlog Reference:** Section 13.3

**As a** user interacting with chat
**I want** properly styled chat bubbles and components
**So that** conversations are easy to read and visually appealing

**Acceptance Criteria:**
- [ ] Agent message bubbles:
  - Background: `var(--bg-white)`
  - Border: `1px solid var(--border-subtle)`
  - Border radius: 16px (top-left: 4px for agent)
  - Padding: 16px (--space-4)
  - Agent avatar aligned left
- [ ] User message bubbles:
  - Background: coral gradient or solid
  - Border radius: 16px (top-right: 4px for user)
  - Text: white
  - Aligned right
- [ ] Timestamps:
  - Left-aligned for agent messages
  - Right-aligned for user messages
  - Subtle text color
- [ ] Typing indicator:
  - Three-dot animation
  - Appears in agent bubble style
  - Smooth pulse animation
- [ ] Chat header icons:
  - Replace any remaining text icons
  - Proper hover states

**Technical Notes:**
- Use CSS animations for typing indicator
- Ensure markdown rendering in messages

**Files to Modify:**
- `apps/web/src/components/chat/chat-message.tsx`
- `apps/web/src/components/chat/typing-indicator.tsx`
- `apps/web/src/components/chat/chat-panel.tsx`

---

### Story 15.23: Implement Header Bar Style Fixes

**Points:** 2
**Priority:** P1
**Backlog Reference:** Section 13.2

**As a** user viewing the header
**I want** proper icon rendering and hover states
**So that** the header looks professional

**Acceptance Criteria:**
- [ ] All header icons render as Lucide components (if not done in 15.1)
- [ ] Hide `expand_more` text, show only ChevronDown icon
- [ ] Add hover states to icon buttons:
  - Background: subtle gray on hover
  - Lift effect: `translateY(-1px)`
  - Transition: 150ms ease
- [ ] Workspace/Business selector:
  - Clear dropdown trigger styling
  - Chevron rotates on open
- [ ] Notification bell:
  - Badge for unread count (coral background)
  - Badge hides when count is 0
- [ ] Search icon:
  - Opens command palette on click
  - Keyboard hint: "⌘K"

**Technical Notes:**
- Ensure icons are 20px size
- Use shadcn Button with `variant="ghost"`

**Files to Modify:**
- `apps/web/src/components/layout/header.tsx`
- `apps/web/src/components/layout/workspace-selector.tsx`

---

### Story 15.24: Implement Form Accessibility Improvements

**Points:** 2
**Priority:** P1
**Backlog Reference:** Section 7.1

**As a** user filling out forms
**I want** proper autocomplete and accessibility attributes
**So that** forms work well with password managers and assistive technology

**Acceptance Criteria:**
- [ ] Email inputs: `autocomplete="email"`
- [ ] Password inputs: `autocomplete="current-password"` or `autocomplete="new-password"`
- [ ] Name inputs: `autocomplete="name"`
- [ ] All icon-only buttons have `aria-label`
- [ ] Form fields have associated `<label>` elements
- [ ] Error messages linked via `aria-describedby`
- [ ] Required fields marked with `aria-required="true"`
- [ ] Focus ring visible on all inputs (per 15.21)

**Technical Notes:**
- Audit all forms across the app
- Use shadcn Form components with proper accessibility

**Files to Modify:**
- `apps/web/src/components/auth/sign-in-form.tsx`
- `apps/web/src/components/auth/sign-up-form.tsx`
- `apps/web/src/components/settings/change-password-form.tsx`
- All other form components

---

### Story 15.25: Apply Agent Character Colors Throughout

**Points:** 2
**Priority:** P1
**Backlog Reference:** Section 14.5

**As a** user interacting with agents
**I want** consistent character colors for each agent
**So that** I can quickly identify which agent I'm working with

**Acceptance Criteria:**
- [ ] Define CSS variables for agent colors:
  ```css
  --agent-hub: #FF6B6B;
  --agent-maya: #20B2AA;
  --agent-atlas: #FF9F43;
  --agent-sage: #2ECC71;
  --agent-nova: #FF6B9D;
  --agent-echo: #4B7BEC;
  ```
- [ ] Apply agent colors to:
  - Agent card borders/accents
  - Chat message agent avatars
  - Agent badges in approval cards
  - AI Team page cards
  - Onboarding agent introductions
- [ ] Gradient option for premium agent cards
- [ ] Consistent avatar styling with colored ring

**Validation Team Colors:**
- [ ] Vera: #FF6B6B (coral)
- [ ] Marco: #4B7BEC (blue)
- [ ] Cipher: #20B2AA (teal)
- [ ] Persona: #9B59B6 (purple)
- [ ] Risk: #FF9F43 (orange)

**Technical Notes:**
- Create `agent-colors.ts` config file
- Use CSS custom properties for theming

**Files to Create:**
- `apps/web/src/config/agent-colors.ts`

**Files to Modify:**
- `apps/web/src/app/globals.css`
- Agent-related components

---

### Story 15.26: Implement Appearance Settings Page

**Points:** 3
**Priority:** P1
**Backlog Reference:** Section 4.3 - Appearance

**As a** user who prefers different visual settings
**I want** to customize the platform appearance
**So that** I can personalize my experience

**Acceptance Criteria:**
- [ ] Create page at `/settings/appearance`
- [ ] Theme selection:
  - Light (default) - warm coral theme
  - Dark - dark mode variant
  - System - follows OS preference
- [ ] Accent color selection (future consideration):
  - Coral (default, brand color)
  - Note: "More colors coming soon" message
- [ ] Sidebar density options:
  - Comfortable (default) - more spacing
  - Compact - reduced spacing for power users
- [ ] Font size adjustment:
  - Small (14px base)
  - Medium (16px base, default)
  - Large (18px base)
- [ ] Preview panel showing changes in real-time
- [ ] Save preference to user settings
- [ ] Persist preference in localStorage for instant load
- [ ] Reset to defaults button

**Dark Mode Considerations:**
- [ ] CSS custom properties support dark mode values
- [ ] Cream backgrounds become dark gray (#1a1a1a)
- [ ] Coral accent remains vibrant in dark mode
- [ ] Proper contrast ratios maintained (WCAG AA)
- [ ] Agent colors adjusted for dark backgrounds

**Technical Notes:**
- Use CSS custom properties with `data-theme` attribute
- Store preference in both localStorage and user API
- Respect `prefers-color-scheme` media query for system mode
- Dark mode implementation can be phased (start with toggle, full support later)

**Files to Create:**
- `apps/web/src/app/(app)/settings/appearance/page.tsx`
- `apps/web/src/components/settings/theme-selector.tsx`
- `apps/web/src/components/settings/appearance-preview.tsx`
- `apps/web/src/hooks/use-theme.ts`

**Files to Modify:**
- `apps/web/src/app/globals.css` (dark mode variables)
- `apps/web/src/providers/theme-provider.tsx`

---

## Wireframe References

| Story | Wireframe | HTML Path |
|-------|-----------|-----------|
| 15.2 Business Portfolio | BO-01 | `bo-01_portfolio_dashboard_with_business_cards/code.html` |
| 15.3 Account Onboarding | AU-05 | `au-05_email_verification/code.html` |
| 15.13 AI Config | ST-02 | `st-02_api_keys_management/code.html` |
| 15.14 Business Switcher | BO-09 | `bo-09_business_switcher_dropdown/code.html` |
| 15.16 Business Wizard | BO-02 to BO-05 | `bo-02_*` through `bo-05_*` |
| 15.17 Approval Cards | AP-02, AP-03 | `ap-02_*`, `ap-03_*` |
| 15.18 Agent Cards | AI-02 | `ai-02_agent_card_component/code.html` |

**Full wireframe index:** [WIREFRAME-INDEX.md](../design/wireframes/WIREFRAME-INDEX.md)

---

## Dependencies

- Epic 00: Project Scaffolding (complete)
- Epic 01: Authentication (complete)
- Epic 02: Workspace Management (complete)
- Epic 03: RBAC & Multi-tenancy (complete)
- Epic 04: Approval System (for approval-related stories)
- Epic 06: BYOAI (for AI config page)
- Epic 07: UI Shell (for layout modifications)
- Epic 08: Business Onboarding (for business module pages)

---

## Technical Notes

### CSS Variable System
All style guide values should be defined as CSS custom properties in `globals.css` for consistent theming.

### Component Library
Use shadcn/ui components as base, extending with style guide customizations.

### Testing Requirements
- Visual regression tests for style guide compliance
- Accessibility tests (axe-core) for WCAG 2.1 AA
- E2E tests for critical user flows (onboarding, chat)

---

## Estimated Effort

| Category | Stories | Points |
|----------|---------|--------|
| P0 Critical | 11 | 49 |
| P1 High | 16 | 48 |
| **Total** | **27** | **97** |

**Estimated Sprints:** 5 (at ~20 points/sprint)

**New Stories Added (2025-12-11):**
- Story 15.10a: Workspace Roles Page (+3 points, P0)
- Story 15.26: Appearance Settings Page (+3 points, P1)
- Story 15.4: Updated to include Chat Agent Selection (no point change)

---

_Epic created: 2025-12-11_
_Source: UI-UX-IMPROVEMENTS-BACKLOG.md_
_PRD Reference: User Experience, Platform Polish_
