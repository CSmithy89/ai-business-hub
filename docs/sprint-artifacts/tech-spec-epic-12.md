# Technical Specification: EPIC-12 UX Polish

**Epic ID:** EPIC-12
**Status:** Contexted
**Priority:** P1/P2 (High/Medium)
**Phase:** Post-Foundation Enhancement
**Stories:** 8 stories, 18 points
**Dependencies:** None (Can start immediately)
**Parallel with:** EPIC-10 (Platform Hardening), EPIC-11 (Agent Integration)

---

## Epic Overview

Epic 12 addresses UI/UX gaps identified in the wireframe-to-implementation gap analysis. This epic focuses on **frontend enhancements only** - no new features, just polishing existing implementations to match the designed wireframes.

### Business Value
- Complete, polished UI that matches design specifications
- Improved user experience with consistent behavior across all features
- Closes the gap between designed and implemented functionality
- Better conversion rates through improved authentication UX
- Faster approval processing with quick actions
- More engaging chat experience with streaming indicators

### Success Criteria
- [ ] All OAuth providers functional (Google, Microsoft, GitHub)
- [ ] Approval queue has quick action buttons
- [ ] Chat panel has proper streaming UI
- [ ] Settings pages have unsaved changes detection
- [ ] All countdown timers implemented
- [ ] Approval metrics calculated from real data

---

## Current Implementation Context

### Technology Stack (Relevant to UX)
- **Frontend Framework:** Next.js 15 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Form Library:** react-hook-form + @hookform/resolvers
- **Validation:** Standard Schema / Zod
- **State Management:** Zustand
- **Date Formatting:** date-fns
- **Authentication:** better-auth

### Key Patterns Already Established
1. **Component Structure:** Client components with 'use client' directive
2. **Form Validation:** react-hook-form with standardSchemaResolver
3. **Error Handling:** Toast notifications + inline error messages
4. **Loading States:** Spinner icons from lucide-react
5. **Styling:** Tailwind classes with shadcn/ui components
6. **Date/Time:** formatDistanceToNow from date-fns

### Existing Auth Implementation
- **Sign-in page:** `/apps/web/src/app/(auth)/sign-in/page.tsx`
  - Currently has Google OAuth button only
  - Uses `SignInForm` component

- **Sign-up form:** `/apps/web/src/components/auth/sign-up-form.tsx`
  - Has confirm password field already implemented
  - Has Google OAuth button
  - Uses better-auth `authClient.signIn.social()`

### Existing Approval Implementation
- **Approval list item:** `/apps/web/src/components/approval/approval-list-item.tsx`
  - Shows confidence-based border colors
  - Has "View Details" button only
  - No quick actions (Approve/Reject) on cards

### Existing Chat Implementation
- **Chat message:** `/apps/web/src/components/chat/ChatMessage.tsx`
  - Supports user, agent, system messages
  - Has basic styling, no streaming indicators

### Existing Settings Implementation
- Multiple settings components in `/apps/web/src/components/settings/`
- No unsaved changes detection currently

---

## Story-by-Story Technical Guidance

### Story 12.1: OAuth Provider Buttons

**Priority:** P1 High | **Points:** 2

**Acceptance Criteria:**
- AC1: Add Microsoft OAuth button to sign-in page
- AC2: Add GitHub OAuth button to sign-in page
- AC3: Configure better-auth for Microsoft provider
- AC4: Configure better-auth for GitHub provider
- AC5: Match wireframe styling (icon + text, proper spacing)
- AC6: Add buttons to sign-up page as well
- AC7: Handle OAuth errors gracefully with user-friendly messages
- AC8: Update environment variables documentation

**Technical Approach:**

1. **better-auth Configuration**
   - Location: `apps/web/src/lib/auth.ts`
   - Add Microsoft and GitHub to `socialProviders` config
   - Reference: Epic 09 already implemented this backend

2. **OAuth Button Component Pattern**
   - Follow existing Google OAuth button pattern in `sign-up-form.tsx`
   - Create reusable `OAuthButton` component or inline similar buttons
   - Use SVG icons for brand consistency

3. **Implementation Steps:**

```typescript
// apps/web/src/lib/auth.ts (backend already configured in Epic 09)
// Just ensure config includes:
socialProviders: {
  google: { ... },
  microsoft: { ... },  // Already configured
  github: { ... },     // Already configured
}
```

```typescript
// apps/web/src/components/auth/sign-in-form.tsx
// Add Microsoft and GitHub buttons alongside Google:

const handleMicrosoftSignIn = async () => {
  setIsLoading(true)
  try {
    await authClient.signIn.social({
      provider: 'microsoft',
      callbackURL: '/dashboard',
    })
  } catch (error) {
    setError('Unable to sign in with Microsoft. Please try again.')
  } finally {
    setIsLoading(false)
  }
}

// Similar for GitHub
```

4. **Icon Resources:**
   - Microsoft: Use SVG or lucide-react icon
   - GitHub: Use lucide-react `Github` icon
   - Match Google button styling (outline variant, full width)

5. **Error Handling:**
   - Use same error state pattern as existing Google OAuth
   - Generic error messages prevent user enumeration
   - Toast notification for errors

**Files to Modify:**
- `apps/web/src/app/(auth)/sign-in/page.tsx` (add buttons to form)
- `apps/web/src/components/auth/sign-up-form.tsx` (add buttons)
- `packages/config/.env.example` (document new env vars)

**Testing Checklist:**
- [ ] Microsoft OAuth redirects correctly
- [ ] GitHub OAuth redirects correctly
- [ ] Error handling shows friendly messages
- [ ] Buttons styled consistently with Google
- [ ] Works on sign-in and sign-up pages

---

### Story 12.2: Confirm Password Field

**Priority:** P2 Medium | **Points:** 1

**Acceptance Criteria:**
- AC1: Add confirm password input field to sign-up form
- AC2: Show password match indicator (green checkmark or red X)
- AC3: Validate passwords match before form submission
- AC4: Show inline error message if passwords don't match
- AC5: Both fields share same show/hide toggle behavior

**Technical Approach:**

**Good News:** This is already implemented in `sign-up-form.tsx`!

1. **Verification:**
   - Lines 240-264 have confirm password field
   - Has separate show/hide toggle
   - Validation in `signUpSchema`

2. **Enhancement (if needed):**
   - Add visual match indicator (checkmark/X icon)
   - Could add real-time validation feedback

3. **Implementation (if adding indicator):**

```typescript
// Add after confirm password input:
{password && confirmPassword && (
  <div className="mt-2 flex items-center gap-2 text-sm">
    {password === confirmPassword ? (
      <>
        <Check className="h-4 w-4 text-green-600" />
        <span className="text-green-600">Passwords match</span>
      </>
    ) : (
      <>
        <X className="h-4 w-4 text-red-600" />
        <span className="text-red-600">Passwords do not match</span>
      </>
    )}
  </div>
)}
```

**Files to Modify:**
- `apps/web/src/components/auth/sign-up-form.tsx` (optional enhancement)

**Testing Checklist:**
- [ ] Confirm password field exists
- [ ] Validation works on submit
- [ ] Show/hide toggle works independently
- [ ] Error messages display correctly

---

### Story 12.3: Approval Queue Quick Actions

**Priority:** P1 High | **Points:** 3

**Acceptance Criteria:**
- AC1: Add Approve button (green/primary) to approval list cards
- AC2: Add Reject button (red/destructive) to approval list cards
- AC3: Quick actions work without opening detail modal
- AC4: Show confirmation toast on successful action
- AC5: Implement optimistic UI update on action
- AC6: Handle errors with rollback and error toast
- AC7: Match wireframe button styling (icon + text)
- AC8: Update approval count stats immediately

**Technical Approach:**

1. **Current State:**
   - `approval-list-item.tsx` only has "View Details" button
   - Need to add Approve/Reject inline actions

2. **API Integration:**
   - Use existing endpoints from Epic 04:
     - `POST /api/approvals/:id/approve`
     - `POST /api/approvals/:id/reject`

3. **Optimistic UI Pattern:**

```typescript
// apps/web/src/hooks/use-approval-actions.ts (create new hook)
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useApprovalActions() {
  const queryClient = useQueryClient()

  const approve = useMutation({
    mutationFn: async ({ id, notes }: { id: string, notes?: string }) => {
      const res = await fetch(`/api/approvals/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (!res.ok) throw new Error('Failed to approve')
      return res.json()
    },
    onMutate: async ({ id }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['approvals'] })

      // Snapshot previous value
      const previousApprovals = queryClient.getQueryData(['approvals'])

      // Optimistically update
      queryClient.setQueryData(['approvals'], (old: any) => ({
        ...old,
        data: old.data.map((item: any) =>
          item.id === id ? { ...item, status: 'approved' } : item
        ),
      }))

      return { previousApprovals }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['approvals'], context?.previousApprovals)
      toast.error('Failed to approve item')
    },
    onSuccess: () => {
      toast.success('Item approved successfully')
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      queryClient.invalidateQueries({ queryKey: ['approval-stats'] })
    },
  })

  const reject = useMutation({
    // Similar pattern for reject
  })

  return { approve, reject }
}
```

4. **Component Update:**

```typescript
// apps/web/src/components/approval/approval-list-item.tsx
import { useApprovalActions } from '@/hooks/use-approval-actions'
import { Check, X } from 'lucide-react'

export function ApprovalListItem({ approval }: ApprovalListItemProps) {
  const { approve, reject } = useApprovalActions()

  // ... existing code ...

  return (
    <Card>
      {/* ... existing content ... */}

      <div className="flex gap-2">
        {/* Only show quick actions for pending items */}
        {approval.status === 'pending' && (
          <>
            <Button
              size="sm"
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => approve.mutate({ id: approval.id })}
              disabled={approve.isPending || reject.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => reject.mutate({ id: approval.id })}
              disabled={approve.isPending || reject.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </>
        )}
        <Button size="sm" variant="outline" asChild>
          <Link href={`/approvals/${approval.id}`}>
            View Details
          </Link>
        </Button>
      </div>
    </Card>
  )
}
```

5. **Reject Confirmation (Optional Enhancement):**
   - Could add confirmation dialog for reject action
   - Use shadcn/ui `AlertDialog` component

**Files to Create:**
- `apps/web/src/hooks/use-approval-actions.ts` (new)

**Files to Modify:**
- `apps/web/src/components/approval/approval-list-item.tsx`
- `apps/web/src/components/approval/approval-stats.tsx` (invalidate on action)

**Testing Checklist:**
- [ ] Approve button approves without modal
- [ ] Reject button rejects without modal
- [ ] Optimistic UI updates immediately
- [ ] Rollback on error works
- [ ] Toast notifications show
- [ ] Stats update after action
- [ ] Buttons disabled during mutation

---

### Story 12.4: Chat Streaming UI

**Priority:** P2 Medium | **Points:** 2

**Acceptance Criteria:**
- AC1: Add blinking cursor indicator during streaming (|)
- AC2: Add shimmer progress bar while waiting for first token
- AC3: Smooth text reveal as tokens stream in
- AC4: Handle stream interruption gracefully
- AC5: Add "Stop generating" button for long responses

**Technical Approach:**

1. **Current State:**
   - `ChatMessage.tsx` shows static messages only
   - No streaming indicators

2. **New Components Needed:**

```typescript
// apps/web/src/components/chat/StreamingCursor.tsx
'use client'

export function StreamingCursor() {
  return (
    <span className="inline-block w-[2px] h-4 bg-current animate-pulse ml-0.5" />
  )
}
```

```typescript
// apps/web/src/components/chat/StreamingIndicator.tsx
'use client'

export function StreamingIndicator() {
  return (
    <div className="flex max-w-[85%] items-start gap-2.5 self-start">
      {/* Agent Avatar */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white">
        🤖
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-teal-500">Agent</p>

        {/* Shimmer Effect */}
        <div className="rounded-t-xl rounded-br-xl rounded-bl-sm bg-gray-100 px-4 py-3">
          <div className="flex gap-1">
            <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

3. **ChatMessage Enhancement:**

```typescript
// apps/web/src/components/chat/ChatMessage.tsx
interface ChatMessageProps {
  // ... existing props ...
  isStreaming?: boolean
  onStopStreaming?: () => void
}

export const ChatMessage = memo(function ChatMessage({
  // ... existing props ...
  isStreaming,
  onStopStreaming,
}: ChatMessageProps) {
  // ... existing code ...

  if (type === 'agent' && isStreaming) {
    return (
      <div className="flex max-w-[85%] items-start gap-2.5 self-start">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white">
          {agentIcon || '🤖'}
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-teal-500">
            {agentName || 'Agent'}
          </p>

          <div className="rounded-t-xl rounded-br-xl rounded-bl-sm bg-gray-100 px-4 py-3">
            <p className="text-sm leading-relaxed">
              {safeContent}
              <StreamingCursor />
            </p>

            {onStopStreaming && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onStopStreaming}
                className="mt-2"
              >
                Stop generating
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ... rest of component ...
})
```

4. **Integration with Chat Panel:**
   - Update `ChatMessageList.tsx` to handle streaming state
   - Show `StreamingIndicator` while waiting for first token
   - Switch to `ChatMessage` with streaming cursor when tokens arrive

**Files to Create:**
- `apps/web/src/components/chat/StreamingCursor.tsx`
- `apps/web/src/components/chat/StreamingIndicator.tsx`

**Files to Modify:**
- `apps/web/src/components/chat/ChatMessage.tsx`
- `apps/web/src/components/chat/ChatMessageList.tsx`

**Testing Checklist:**
- [ ] Shimmer shows before first token
- [ ] Cursor blinks during streaming
- [ ] Text appears smoothly as tokens arrive
- [ ] Stop button interrupts stream
- [ ] Cursor disappears when complete

---

### Story 12.5: Settings UX Enhancements

**Priority:** P2 Medium | **Points:** 2

**Acceptance Criteria:**
- AC1: Create UnsavedChangesBar component (yellow sticky bar at bottom)
- AC2: Track form dirty state in all settings pages
- AC3: Show bar with "Save Changes" and "Discard" buttons
- AC4: Add blue security notice banner to API Keys page
- AC5: Prevent navigation when unsaved changes exist (with confirmation)
- AC6: Banner text: "API keys are sensitive. Never share them publicly."

**Technical Approach:**

1. **Unsaved Changes Hook:**

```typescript
// apps/web/src/hooks/use-unsaved-changes.ts
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function useUnsavedChanges(isDirty: boolean) {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const handleNavigation = (callback: () => void) => {
    if (isDirty) {
      setShowWarning(true)
      // Could integrate with AlertDialog here
    } else {
      callback()
    }
  }

  return { showWarning, handleNavigation }
}
```

2. **Unsaved Changes Bar Component:**

```typescript
// apps/web/src/components/settings/UnsavedChangesBar.tsx
'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface UnsavedChangesBarProps {
  onSave: () => void
  onDiscard: () => void
  isLoading?: boolean
}

export function UnsavedChangesBar({
  onSave,
  onDiscard,
  isLoading,
}: UnsavedChangesBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-yellow-50 border-t-2 border-yellow-400 px-6 py-4 shadow-lg z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <p className="text-sm font-medium text-yellow-900">
            You have unsaved changes
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={onDiscard}
            disabled={isLoading}
          >
            Discard
          </Button>
          <Button
            onClick={onSave}
            disabled={isLoading}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
```

3. **Security Notice Banner:**

```typescript
// apps/web/src/components/settings/SecurityNoticeBanner.tsx
'use client'

import { Info } from 'lucide-react'

export function SecurityNoticeBanner() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
      <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
      <p className="text-sm text-blue-900">
        API keys are sensitive. Never share them publicly.
      </p>
    </div>
  )
}
```

4. **Integration Example:**

```typescript
// apps/web/src/app/settings/profile/page.tsx
'use client'

import { useForm } from 'react-hook-form'
import { UnsavedChangesBar } from '@/components/settings/UnsavedChangesBar'

export default function ProfilePage() {
  const { register, handleSubmit, formState: { isDirty } } = useForm()

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* form fields */}
      </form>

      {isDirty && (
        <UnsavedChangesBar
          onSave={handleSubmit(onSubmit)}
          onDiscard={() => reset()}
        />
      )}
    </>
  )
}
```

**Files to Create:**
- `apps/web/src/components/settings/UnsavedChangesBar.tsx`
- `apps/web/src/components/settings/SecurityNoticeBanner.tsx`
- `apps/web/src/hooks/use-unsaved-changes.ts`

**Files to Modify:**
- `apps/web/src/app/settings/api-keys/page.tsx` (add banner)
- `apps/web/src/app/settings/profile/page.tsx` (add unsaved bar)
- Other settings pages as needed

**Testing Checklist:**
- [ ] Bar appears when form is dirty
- [ ] Bar disappears after save
- [ ] Discard resets form
- [ ] Browser warns on page leave
- [ ] Security banner shows on API keys page

---

### Story 12.6: Countdown Timers

**Priority:** P3 Low | **Points:** 2

**Acceptance Criteria:**
- AC1: Create reusable CountdownTimer component
- AC2: Add resend countdown to email verification page ("Resend in 30s")
- AC3: Add resend countdown to forgot password page
- AC4: Add auto-redirect countdown to password reset success ("Redirecting in 5s...")
- AC5: Button enables automatically when countdown reaches 0
- AC6: Timer updates every second with smooth animation

**Technical Approach:**

1. **Reusable Countdown Component:**

```typescript
// apps/web/src/components/ui/countdown-timer.tsx
'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  seconds: number
  onComplete?: () => void
  render?: (timeLeft: number) => React.ReactNode
}

export function CountdownTimer({
  seconds,
  onComplete,
  render,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds)

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete?.()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, onComplete])

  if (render) {
    return <>{render(timeLeft)}</>
  }

  return <span>{timeLeft}s</span>
}
```

2. **Usage in Email Verification:**

```typescript
// apps/web/src/app/(auth)/verify-email/page.tsx
const [canResend, setCanResend] = useState(false)

<Button
  variant="ghost"
  onClick={handleResend}
  disabled={!canResend}
>
  {canResend ? (
    'Resend Code'
  ) : (
    <CountdownTimer
      seconds={30}
      onComplete={() => setCanResend(true)}
      render={(time) => `Resend in ${time}s`}
    />
  )}
</Button>
```

3. **Auto-Redirect Pattern:**

```typescript
// apps/web/src/app/(auth)/reset-password/page.tsx
const router = useRouter()

<CountdownTimer
  seconds={5}
  onComplete={() => router.push('/sign-in')}
  render={(time) => (
    <p className="text-sm text-gray-600">
      Redirecting to sign in in {time} seconds...
    </p>
  )}
/>
```

**Files to Create:**
- `apps/web/src/components/ui/countdown-timer.tsx`

**Files to Modify:**
- `apps/web/src/app/(auth)/verify-email/page.tsx`
- `apps/web/src/app/(auth)/forgot-password/page.tsx`
- `apps/web/src/app/(auth)/reset-password/page.tsx`

**Testing Checklist:**
- [ ] Timer counts down every second
- [ ] Button enables at 0
- [ ] onComplete callback fires
- [ ] Auto-redirect works
- [ ] Timer resets on resend

---

### Story 12.7: Approval Metrics Calculation

**Priority:** P2 Medium | **Points:** 3

**Acceptance Criteria:**
- AC1: Create API endpoint `/api/approvals/metrics` for metrics aggregation
- AC2: Calculate average response time from approval timestamps
- AC3: Calculate approval rate (approved / total processed)
- AC4: Calculate auto-approved count (items with confidence > 85%)
- AC5: Update ApprovalStats component to fetch real data
- AC6: Add loading skeleton while fetching metrics
- AC7: Cache metrics with 5-minute TTL for performance

**Technical Approach:**

1. **Metrics API Endpoint:**

```typescript
// apps/web/src/app/api/approvals/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { getSession } from '@/lib/auth-server'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workspaceId = session.user.activeWorkspaceId
  if (!workspaceId) {
    return NextResponse.json({ error: 'No active workspace' }, { status: 400 })
  }

  // Get all approvals for workspace
  const approvals = await prisma.approvalItem.findMany({
    where: { workspaceId },
    select: {
      status: true,
      confidenceScore: true,
      createdAt: true,
      reviewedAt: true,
    },
  })

  // Calculate metrics
  const total = approvals.length
  const processed = approvals.filter(a =>
    ['approved', 'rejected', 'auto_approved'].includes(a.status)
  )
  const approved = approvals.filter(a =>
    ['approved', 'auto_approved'].includes(a.status)
  )
  const autoApproved = approvals.filter(a => a.status === 'auto_approved')

  // Average response time (in hours)
  const responseTimes = processed
    .filter(a => a.reviewedAt)
    .map(a => {
      const created = new Date(a.createdAt).getTime()
      const reviewed = new Date(a.reviewedAt!).getTime()
      return (reviewed - created) / (1000 * 60 * 60) // hours
    })

  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    : 0

  // Approval rate
  const approvalRate = processed.length > 0
    ? (approved.length / processed.length) * 100
    : 0

  return NextResponse.json({
    data: {
      pendingCount: approvals.filter(a => a.status === 'pending').length,
      autoApprovedToday: autoApproved.length, // TODO: filter by today
      avgResponseTime: Math.round(avgResponseTime * 10) / 10, // 1 decimal
      approvalRate: Math.round(approvalRate),
    },
  })
}
```

2. **React Query Hook:**

```typescript
// apps/web/src/hooks/use-approval-metrics.ts
import { useQuery } from '@tanstack/react-query'

interface ApprovalMetrics {
  pendingCount: number
  autoApprovedToday: number
  avgResponseTime: number
  approvalRate: number
}

export function useApprovalMetrics() {
  return useQuery<ApprovalMetrics>({
    queryKey: ['approval-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/approvals/metrics')
      if (!res.ok) throw new Error('Failed to fetch metrics')
      const json = await res.json()
      return json.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 min
  })
}
```

3. **Update ApprovalStats Component:**

```typescript
// apps/web/src/components/approval/approval-stats.tsx
import { useApprovalMetrics } from '@/hooks/use-approval-metrics'
import { Skeleton } from '@/components/ui/skeleton'

export function ApprovalStats() {
  const { data: metrics, isLoading } = useApprovalMetrics()

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        label="Pending Review"
        value={metrics?.pendingCount || 0}
        icon={<Clock />}
      />
      <StatCard
        label="Auto-Approved Today"
        value={metrics?.autoApprovedToday || 0}
        icon={<CheckCircle />}
      />
      <StatCard
        label="Avg Response Time"
        value={`${metrics?.avgResponseTime || 0}h`}
        icon={<Timer />}
      />
      <StatCard
        label="Approval Rate"
        value={`${metrics?.approvalRate || 0}%`}
        icon={<TrendingUp />}
      />
    </div>
  )
}
```

**Files to Create:**
- `apps/web/src/app/api/approvals/metrics/route.ts`
- `apps/web/src/hooks/use-approval-metrics.ts`

**Files to Modify:**
- `apps/web/src/components/approval/approval-stats.tsx`

**Testing Checklist:**
- [ ] Metrics endpoint returns correct data
- [ ] Average response time calculated accurately
- [ ] Approval rate calculated correctly
- [ ] Auto-approved count filters by confidence
- [ ] Loading skeleton displays
- [ ] Metrics cache for 5 minutes
- [ ] Stats update after approval actions

---

### Story 12.8: Chat Error & Preview Cards

**Priority:** P2 Medium | **Points:** 3

**Acceptance Criteria:**
- AC1: Create ChatErrorMessage component with red left border
- AC2: Add warning icon and bold error title
- AC3: Add Retry and Cancel buttons to error messages
- AC4: Create ChatPreviewCard component for email/document previews
- AC5: Add "Show full content" expandable link
- AC6: Preview card shows icon, title, and content snippet
- AC7: Match wireframe styling exactly (colors, spacing, typography)

**Technical Approach:**

1. **Error Message Component:**

```typescript
// apps/web/src/components/chat/ChatErrorMessage.tsx
'use client'

import { AlertTriangle, RotateCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatErrorMessageProps {
  title: string
  message: string
  onRetry?: () => void
  onCancel?: () => void
}

export function ChatErrorMessage({
  title,
  message,
  onRetry,
  onCancel,
}: ChatErrorMessageProps) {
  return (
    <div className="flex max-w-[85%] self-start">
      <div className="border-l-4 border-red-500 bg-red-50 rounded-lg p-4 w-full">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />

          <div className="flex-1">
            <h4 className="font-semibold text-red-900 mb-1">{title}</h4>
            <p className="text-sm text-red-700">{message}</p>

            {(onRetry || onCancel) && (
              <div className="flex gap-2 mt-3">
                {onRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRetry}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <RotateCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
                {onCancel && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onCancel}
                    className="text-red-700 hover:bg-red-100"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

2. **Preview Card Component:**

```typescript
// apps/web/src/components/chat/ChatPreviewCard.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Mail, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface ChatPreviewCardProps {
  type: 'email' | 'document'
  title: string
  snippet: string
  fullContent?: string
  icon?: React.ReactNode
}

export function ChatPreviewCard({
  type,
  title,
  snippet,
  fullContent,
  icon,
}: ChatPreviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const defaultIcon = type === 'email' ? <Mail /> : <FileText />

  return (
    <Card className="max-w-[85%] self-start overflow-hidden">
      <div className="p-4 bg-gray-50 border-l-4 border-blue-500">
        {/* Header */}
        <div className="flex items-start gap-3 mb-2">
          <div className="text-blue-600 shrink-0">
            {icon || defaultIcon}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              {type === 'email' ? 'Email Draft' : 'Document Preview'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="text-sm text-gray-700 mt-3">
          {isExpanded ? fullContent : snippet}
        </div>

        {/* Expand Toggle */}
        {fullContent && fullContent !== snippet && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-3"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show full content
              </>
            )}
          </button>
        )}
      </div>
    </Card>
  )
}
```

3. **Integration with ChatMessage:**

```typescript
// apps/web/src/components/chat/ChatMessage.tsx
// Add new message types:
type: 'user' | 'agent' | 'system' | 'error' | 'preview'

// Handle in component:
if (type === 'error') {
  return <ChatErrorMessage {...errorProps} />
}

if (type === 'preview') {
  return <ChatPreviewCard {...previewProps} />
}
```

**Files to Create:**
- `apps/web/src/components/chat/ChatErrorMessage.tsx`
- `apps/web/src/components/chat/ChatPreviewCard.tsx`

**Files to Modify:**
- `apps/web/src/components/chat/ChatMessage.tsx`

**Testing Checklist:**
- [ ] Error message displays with red border
- [ ] Warning icon shows
- [ ] Retry button works
- [ ] Cancel button works
- [ ] Preview card shows snippet
- [ ] Expand/collapse toggle works
- [ ] Icons display correctly

---

## Shared Patterns

### Form Validation Pattern
All forms use `react-hook-form` + `standardSchemaResolver`:

```typescript
const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
  resolver: standardSchemaResolver(schema),
  mode: 'onBlur',
})
```

### Error Display Pattern
Inline errors below inputs:

```typescript
{errors.fieldName && (
  <p className="text-sm text-red-600">{errors.fieldName.message}</p>
)}
```

### Loading States Pattern
Disable buttons and show spinner:

```typescript
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Loading...
    </>
  ) : (
    'Submit'
  )}
</Button>
```

### Optimistic UI Pattern
Use React Query mutations with `onMutate`:

```typescript
const mutation = useMutation({
  mutationFn: async (data) => { /* API call */ },
  onMutate: async (data) => {
    await queryClient.cancelQueries({ queryKey: ['key'] })
    const previous = queryClient.getQueryData(['key'])
    queryClient.setQueryData(['key'], (old) => updateOptimistically(old, data))
    return { previous }
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['key'], context?.previous)
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['key'] })
  },
})
```

### Toast Notifications
Use sonner for success/error toasts:

```typescript
import { toast } from 'sonner'

toast.success('Action completed successfully')
toast.error('Something went wrong')
```

---

## Testing Strategy

### Unit Tests
- Test individual components in isolation
- Mock API calls and hooks
- Test error states and edge cases

### Integration Tests
- Test form submission flows
- Test optimistic UI updates and rollbacks
- Test navigation with unsaved changes

### E2E Tests (Playwright)
- Test OAuth login flows
- Test approval quick actions end-to-end
- Test chat streaming UI
- Test countdown timer behavior

### Manual Testing Checklist
Each story should verify:
- [ ] Desktop layout (1920x1080)
- [ ] Tablet layout (768x1024)
- [ ] Mobile layout (375x667)
- [ ] Dark mode (if applicable)
- [ ] Keyboard navigation
- [ ] Screen reader accessibility
- [ ] Error states
- [ ] Loading states
- [ ] Empty states

---

## Dependencies

### NPM Packages Already Installed
- `react-hook-form` - Form management
- `@hookform/resolvers` - Validation
- `@tanstack/react-query` - Server state
- `date-fns` - Date formatting
- `lucide-react` - Icons
- `sonner` - Toast notifications
- `tailwindcss` - Styling
- `@radix-ui/*` (via shadcn/ui) - Headless components

### No New Dependencies Required
All stories can be implemented with existing packages.

---

## Performance Considerations

### Metrics Caching (Story 12.7)
- Cache approval metrics for 5 minutes
- Invalidate on approval actions
- Use staleTime and refetchInterval in React Query

### Optimistic Updates (Story 12.3)
- Update UI immediately on action
- Rollback on error
- Revalidate in background

### Streaming UI (Story 12.4)
- Render tokens as they arrive
- Use memo to prevent re-renders
- Cancel stream on unmount

### Countdown Timers (Story 12.6)
- Clear intervals on unmount
- Use useState for timer value
- Single setInterval per timer

---

## Accessibility Notes

### Keyboard Navigation
- All buttons must be keyboard accessible
- Focus indicators on interactive elements
- Tab order matches visual order

### Screen Readers
- Use semantic HTML (button, nav, etc.)
- Add aria-labels for icon-only buttons
- Announce toast notifications

### Color Contrast
- Error red: #DC2626 (sufficient contrast)
- Success green: #16A34A (sufficient contrast)
- Warning yellow: #CA8A04 (sufficient contrast)

---

## Migration Notes

### No Breaking Changes
All stories enhance existing UI without breaking changes.

### Backward Compatibility
- New components are additive
- Existing components remain functional
- No database migrations required

---

## Rollout Strategy

### Phase 1: Authentication (Stories 12.1, 12.2)
- Low risk, high visibility
- Deploy to production immediately

### Phase 2: Approval & Chat (Stories 12.3, 12.4)
- Medium complexity
- Test thoroughly in staging
- Feature flag for quick actions (optional)

### Phase 3: Settings & Timers (Stories 12.5, 12.6)
- Low complexity
- Safe to deploy together

### Phase 4: Metrics & Cards (Stories 12.7, 12.8)
- Medium complexity
- Test metrics calculation carefully
- Monitor API performance

---

## Definition of Done

Each story is complete when:
- [ ] Code implemented and tested locally
- [ ] Unit tests written (if applicable)
- [ ] Manual testing checklist completed
- [ ] Code reviewed by peer
- [ ] Accessibility verified
- [ ] Works on desktop, tablet, mobile
- [ ] Works in light and dark mode
- [ ] Deployed to staging
- [ ] QA sign-off
- [ ] Deployed to production

---

## Related Documentation

- **Epic File:** `docs/epics/EPIC-12-ux-polish.md`
- **Wireframe Gap Analysis:** `docs/wireframe-gap-analysis.md`
- **Architecture:** `docs/architecture.md`
- **PRD:** `docs/prd.md`
- **Sprint Status:** `docs/sprint-artifacts/sprint-status.yaml`

---

_Generated by BMAD epic-tech-context workflow_
_Date: 2025-12-06_
_For: Epic 12 - UX Polish_
