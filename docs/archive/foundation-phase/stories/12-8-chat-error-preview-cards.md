# Story 12.8: Chat Error & Preview Cards

**Epic:** EPIC-12 - Platform Hardening & Tech Debt
**Points:** 3
**Priority:** P2 Medium
**Status:** Done

---

## User Story

**As a** user
**I want** to see clear error messages and content previews in chat
**So that** I can understand errors and preview AI-generated content

---

## Acceptance Criteria

- [x] AC1: Create ChatErrorMessage component with red left border
- [x] AC2: Add warning icon and bold error title
- [x] AC3: Add Retry and Cancel buttons to error messages
- [x] AC4: Create ChatPreviewCard component for email/document previews
- [x] AC5: Add "Show full content" expandable link
- [x] AC6: Preview card shows icon, title, and content snippet
- [x] AC7: Match wireframe styling exactly (colors, spacing, typography)

---

## Implementation Details

### 1. Component: `ChatErrorMessage`

**Location:** `/apps/web/src/components/chat/ChatErrorMessage.tsx`

**Features:**
- Red left border (4px) for visual distinction
- Red-50 background for error context
- AlertTriangle warning icon
- Bold error title
- Error description text
- Optional Retry button with RotateCw icon
- Optional Cancel button with X icon
- Accessible with proper button types

**Props:**
```typescript
interface ChatErrorMessageProps {
  title: string          // Bold error heading
  message: string        // Error description
  onRetry?: () => void   // Retry button callback
  onCancel?: () => void  // Cancel button callback
  className?: string     // Custom styling
}
```

**Usage:**
```tsx
<ChatErrorMessage
  title="Failed to send message"
  message="There was a network error. Please try again."
  onRetry={() => resendMessage()}
  onCancel={() => dismissError()}
/>
```

### 2. Component: `ChatPreviewCard`

**Location:** `/apps/web/src/components/chat/ChatPreviewCard.tsx`

**Features:**
- Blue left border (4px) for preview distinction
- Gray-50 background
- Type-specific icons (Mail for email, FileText for document)
- Title and type label
- Content snippet
- Expandable full content with toggle
- Accessible with aria-expanded

**Props:**
```typescript
interface ChatPreviewCardProps {
  type: 'email' | 'document'  // Content type
  title: string               // Preview title
  snippet: string             // Short content preview
  fullContent?: string        // Full content (expandable)
  icon?: ReactNode            // Custom icon
  className?: string          // Custom styling
}
```

**Usage:**
```tsx
// Email preview
<ChatPreviewCard
  type="email"
  title="Meeting Follow-up"
  snippet="Thank you for attending today's meeting..."
  fullContent="Thank you for attending today's meeting. As discussed, here are the next steps we need to take..."
/>

// Document preview
<ChatPreviewCard
  type="document"
  title="Q4 Report Draft"
  snippet="This quarter we achieved a 15% increase in..."
/>
```

---

## Styling Notes

### Error Message Colors
- Border: `border-red-500`
- Background: `bg-red-50`
- Icon: `text-red-600`
- Title: `text-red-900`
- Message: `text-red-700`
- Buttons: `border-red-300 text-red-700`

### Preview Card Colors
- Border: `border-blue-500`
- Background: `bg-gray-50`
- Icon: `text-blue-600`
- Title: `text-gray-900`
- Label: `text-gray-500`
- Content: `text-gray-700`
- Toggle: `text-blue-600`

---

## Files Changed

### New Files
1. `/apps/web/src/components/chat/ChatErrorMessage.tsx` - Error message component
2. `/apps/web/src/components/chat/ChatPreviewCard.tsx` - Preview card component
3. `/docs/stories/12-8-chat-error-preview-cards.md` - This story file

---

## Dependencies

- `lucide-react` - For icons (AlertTriangle, RotateCw, X, Mail, FileText, ChevronDown, ChevronUp)
- `@/components/ui/button` - For action buttons
- `@/components/ui/card` - For preview card container

---

## Story Definition of Done

- [x] Code implemented and committed
- [x] Acceptance criteria met
- [x] Components follow existing patterns
- [x] TypeScript types are correct
- [x] Accessible with proper ARIA attributes
- [x] No console errors or warnings
- [x] Story documentation created

---

**Completed:** 2025-12-06
**Developer:** Claude Code
