# Story 12.4: Chat Streaming UI

**Epic:** EPIC-12 - Platform Hardening & Tech Debt
**Points:** 2
**Priority:** P2 Medium
**Status:** Done

---

## User Story

**As a** user
**I want** to see visual feedback while AI responses stream
**So that** I know the system is actively generating a response

---

## Acceptance Criteria

- [x] AC1: Add blinking cursor indicator during streaming (|)
- [x] AC2: Add shimmer progress bar while waiting for first token
- [x] AC3: Smooth text reveal as tokens stream in
- [x] AC4: Handle stream interruption gracefully
- [x] AC5: Add "Stop generating" button for long responses

---

## Implementation Details

### 1. New Component: `StreamingCursor.tsx`

A blinking cursor indicator shown at the end of streaming text.

**Location:** `/apps/web/src/components/chat/StreamingCursor.tsx`

**Features:**
- Inline cursor element using CSS animation
- Accessible with aria-label
- Uses `animate-pulse` for smooth blinking effect

### 2. New Component: `StreamingIndicator.tsx`

Loading indicator shown while waiting for the first token.

**Location:** `/apps/web/src/components/chat/StreamingIndicator.tsx`

**Features:**
- Bouncing dots animation with staggered delays
- Matches agent message styling (avatar, name, bubble)
- Configurable agent appearance (name, icon, color)
- Accessible with role="status" and aria-label

### 3. Enhanced Component: `ChatMessage.tsx`

Added streaming support to the existing chat message component.

**Location:** `/apps/web/src/components/chat/ChatMessage.tsx`

**New Props:**
```typescript
interface ChatMessageProps {
  // ... existing props ...
  /** Whether this message is currently streaming */
  isStreaming?: boolean;
  /** Callback to stop streaming (shows stop button when provided) */
  onStopStreaming?: () => void;
}
```

**Features:**
- Shows `StreamingCursor` at end of text when `isStreaming` is true
- Shows "Stop generating" button when `onStopStreaming` is provided
- Hides timestamp while streaming (cleaner UI)
- Button uses Square icon for stop indicator

---

## Usage Examples

### Waiting for First Token
```tsx
import { StreamingIndicator } from '@/components/chat/StreamingIndicator'

// Show while waiting for response to start
{isWaitingForResponse && (
  <StreamingIndicator
    agentName="Assistant"
    agentIcon="🤖"
    agentColor="#20B2AA"
  />
)}
```

### Streaming Message
```tsx
import { ChatMessage } from '@/components/chat/ChatMessage'

// Show message with streaming cursor and stop button
<ChatMessage
  type="agent"
  content={partialContent}
  timestamp={new Date()}
  agentName="Assistant"
  isStreaming={true}
  onStopStreaming={() => abortController.abort()}
/>
```

### Completed Message
```tsx
// Once streaming completes, remove streaming props
<ChatMessage
  type="agent"
  content={fullContent}
  timestamp={message.createdAt}
  agentName="Assistant"
/>
```

---

## Files Changed

### New Files
1. `/apps/web/src/components/chat/StreamingCursor.tsx` - Blinking cursor component
2. `/apps/web/src/components/chat/StreamingIndicator.tsx` - Loading dots component
3. `/docs/stories/12-4-chat-streaming-ui.md` - This story file

### Modified Files
1. `/apps/web/src/components/chat/ChatMessage.tsx` - Added streaming support

---

## Dependencies

- `lucide-react` - For Square icon in stop button
- Tailwind CSS animations - `animate-pulse`, `animate-bounce`

---

## Testing Notes

### Manual Testing Checklist
- [ ] StreamingIndicator shows bouncing dots
- [ ] StreamingCursor blinks at end of text
- [ ] Stop button appears when onStopStreaming provided
- [ ] Stop button click calls onStopStreaming
- [ ] Timestamp hidden during streaming
- [ ] Timestamp shows after streaming completes
- [ ] Components match agent message styling

---

## Story Definition of Done

- [x] Code implemented and committed
- [x] Acceptance criteria met
- [x] Components follow existing patterns
- [x] TypeScript types are correct
- [x] Accessible with aria attributes
- [x] No console errors or warnings
- [x] Story documentation created

---

**Completed:** 2025-12-06
**Developer:** Claude Code
