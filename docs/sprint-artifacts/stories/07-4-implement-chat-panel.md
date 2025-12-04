# Story 07-4: Implement Chat Panel

**Epic:** EPIC-07 - UI Shell
**Status:** done
**Points:** 3
**Priority:** P0 - Critical
**Created:** 2025-12-04
**Assigned to:** Development Team

---

## User Story

**As a** user
**I want** a persistent chat panel so that
**So that** I can interact with AI agents

---

## Context

The Chat Panel is the primary interface for conversing with AI agents on the HYVVE platform. It provides a persistent, always-accessible chat interface that enables users to interact with various AI agents (Hub, Maya, Atlas, etc.) for business automation tasks. The panel supports rich message types, streaming responses, @mentions, and maintains conversation history.

This story builds upon the placeholder ChatPanel component created in Story 07-1, replacing it with a fully functional chat interface that includes:
- Multiple message types (user, agent, system)
- Real-time streaming indicators
- Message history with auto-scroll
- Input area with @mention support
- Collapsible panel with minimize state

### Dependencies

- **Story 07-1 (Complete):** Dashboard layout provides the chat panel container
- **UI Store (Complete):** Chat panel state management already implemented
- **Epic 01 (Complete):** Authentication provides user context
- **Future Integration:** Backend WebSocket connection for real-time chat (deferred)

### Wireframe References

**CH-01: Chat Panel**
Location: `/home/chris/projects/work/Ai Bussiness Hub/docs/design/wireframes/Finished wireframes and html files/ch-01_chat_panel/code.html`

Key design elements:
- Panel: 380px width, fixed right side, top to bottom
- Header: Agent selector with status indicator, action buttons
- Messages area: Scrollable with custom scrollbar
- Input: Rounded container with @mention and attachment buttons
- Collapsed state: Minimal icon button

**CH-02: Chat Messages (All Types)**
Location: `/home/chris/projects/work/Ai Bussiness Hub/docs/design/wireframes/Finished wireframes and html files/ch-02_chat_messages_(all_types)_/code.html`

Message types:
- User messages: Right-aligned, primary color background
- Agent messages: Left-aligned with avatar, secondary background
- System messages: Centered, muted style
- Typing indicator: Animated dots in agent message bubble

**CH-03: Chat Input Component**
Location: `/home/chris/projects/work/Ai Bussiness Hub/docs/design/wireframes/Finished wireframes and html files/ch-03_chat_input_component/code.html`

Input features:
- Auto-expanding textarea (max 6 lines)
- @mention button and attachment button
- Send button (arrow icon)
- Rounded full container with tertiary background

---

## Acceptance Criteria

### AC-1: Chat Panel Structure
- [ ] Chat panel renders at fixed right position (width: 380px)
- [ ] Header displays agent selector with avatar and status
- [ ] Messages area scrollable with custom scrollbar
- [ ] Input area fixed at bottom
- [ ] Collapse/expand toggle works correctly
- [ ] Collapsed state shows icon button only

### AC-2: Message Display - User Messages
- [ ] User messages display right-aligned
- [ ] Primary color background (#FF6B6B)
- [ ] White text color
- [ ] Rounded corners (top-left, top-right, bottom-left full; bottom-right small)
- [ ] Timestamp below message (11px, muted)
- [ ] Max width 85% of panel

### AC-3: Message Display - Agent Messages
- [ ] Agent messages display left-aligned
- [ ] Agent avatar on left (circular, agent color)
- [ ] Agent name above message bubble
- [ ] Tertiary background for message bubble
- [ ] Rounded corners (top-left, top-right, bottom-right full; bottom-left small)
- [ ] Timestamp below message (11px, muted)
- [ ] Max width 85% of panel

### AC-4: Message Display - System Messages
- [ ] System messages centered
- [ ] Muted text color
- [ ] Smaller font size (13px)
- [ ] No background bubble
- [ ] Used for timestamps dividers ("Today", "Yesterday")

### AC-5: Streaming Indicator
- [ ] Typing indicator shows animated dots
- [ ] Displays in agent message bubble format
- [ ] Three dots with staggered animation
- [ ] Muted gray color

### AC-6: Message List Behavior
- [ ] Auto-scroll to bottom on new messages
- [ ] Custom scrollbar (6px width, gray thumb)
- [ ] Smooth scrolling behavior
- [ ] Messages grouped by time dividers

### AC-7: Chat Input
- [ ] Textarea auto-expands (1-6 lines)
- [ ] Placeholder: "Message [Agent Name]..."
- [ ] @mention button on left (functional hint, basic implementation)
- [ ] Attachment button on left (visual only for now)
- [ ] Send button on right (arrow icon)
- [ ] Send on Enter (Shift+Enter for newline)
- [ ] Disable send when empty

### AC-8: Header Controls
- [ ] Agent selector displays current agent
- [ ] History button (icon only, placeholder)
- [ ] Minimize button collapses panel
- [ ] Expand button (full screen placeholder)
- [ ] Pop-out button (new window placeholder)

---

## Technical Approach

### Component Structure

```
apps/web/src/components/
├── shell/
│   └── ChatPanel.tsx              # Main panel (refactor from placeholder)
└── chat/
    ├── ChatMessage.tsx            # Individual message component
    ├── ChatMessageList.tsx        # Scrollable message container
    ├── ChatInput.tsx              # Input area with @mentions
    └── TypingIndicator.tsx        # Animated typing dots
```

### Implementation Details

#### 1. Chat Message Component (`chat/ChatMessage.tsx`)

```typescript
'use client';

import { cn } from '@/lib/utils';

interface ChatMessageProps {
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  agentName?: string;
  agentIcon?: string;
  agentColor?: string;
}

export function ChatMessage({
  type,
  content,
  timestamp,
  agentName,
  agentIcon,
  agentColor,
}: ChatMessageProps) {
  const formattedTime = formatTime(timestamp);

  if (type === 'system') {
    return (
      <div className="flex justify-center my-3">
        <p className="text-xs text-[rgb(var(--color-text-muted))]">
          {content}
        </p>
      </div>
    );
  }

  if (type === 'user') {
    return (
      <div className="flex max-w-[85%] flex-col items-end gap-1 self-end">
        <div className={cn(
          'rounded-t-xl rounded-bl-xl rounded-br-sm',
          'bg-[rgb(var(--color-primary-500))] px-4 py-3 text-white'
        )}>
          <p className="text-sm font-normal leading-relaxed">{content}</p>
        </div>
        <p className="text-[11px] text-[rgb(var(--color-text-muted))]">
          {formattedTime}
        </p>
      </div>
    );
  }

  // Agent message
  return (
    <div className="flex max-w-[85%] items-start gap-2.5 self-start">
      {/* Agent Avatar */}
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center',
          'rounded-full text-base text-white'
        )}
        style={{ backgroundColor: agentColor || '#20B2AA' }}
      >
        {agentIcon || '🤖'}
      </div>

      <div className="flex flex-col gap-1">
        {/* Agent Name */}
        <p
          className="text-xs font-semibold"
          style={{ color: agentColor || '#20B2AA' }}
        >
          {agentName || 'Agent'}
        </p>

        {/* Message Bubble */}
        <div className={cn(
          'rounded-t-xl rounded-br-xl rounded-bl-sm',
          'bg-[rgb(var(--color-bg-tertiary))] px-4 py-3',
          'text-[rgb(var(--color-text-primary))]'
        )}>
          <p className="text-sm font-normal leading-relaxed">{content}</p>
        </div>

        {/* Timestamp */}
        <p className="text-[11px] text-[rgb(var(--color-text-muted))]">
          {formattedTime}
        </p>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
```

#### 2. Typing Indicator Component (`chat/TypingIndicator.tsx`)

```typescript
'use client';

import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  agentName: string;
  agentIcon?: string;
  agentColor?: string;
}

export function TypingIndicator({
  agentName,
  agentIcon,
  agentColor,
}: TypingIndicatorProps) {
  return (
    <div className="flex max-w-[85%] items-start gap-2.5 self-start">
      {/* Agent Avatar */}
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center',
          'rounded-full text-base text-white'
        )}
        style={{ backgroundColor: agentColor || '#20B2AA' }}
      >
        {agentIcon || '🤖'}
      </div>

      <div className="flex flex-col gap-1">
        {/* Agent Name */}
        <p
          className="text-xs font-semibold"
          style={{ color: agentColor || '#20B2AA' }}
        >
          {agentName}
        </p>

        {/* Typing Indicator */}
        <div className={cn(
          'flex items-center gap-1.5 rounded-t-xl rounded-br-xl rounded-bl-sm',
          'bg-[rgb(var(--color-bg-tertiary))] px-4 py-3'
        )}>
          <div className="h-2 w-2 rounded-full bg-[rgb(var(--color-text-muted))] animate-[bounce_1.4s_infinite_ease-in-out]" />
          <div className="h-2 w-2 rounded-full bg-[rgb(var(--color-text-muted))] animate-[bounce_1.4s_infinite_ease-in-out_0.2s]" />
          <div className="h-2 w-2 rounded-full bg-[rgb(var(--color-text-muted))] animate-[bounce_1.4s_infinite_ease-in-out_0.4s]" />
        </div>
      </div>
    </div>
  );
}
```

#### 3. Message List Component (`chat/ChatMessageList.tsx`)

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  agentName?: string;
  agentIcon?: string;
  agentColor?: string;
}

interface ChatMessageListProps {
  messages: Message[];
  isTyping?: boolean;
  currentAgent?: {
    name: string;
    icon?: string;
    color?: string;
  };
}

export function ChatMessageList({
  messages,
  isTyping,
  currentAgent,
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className={cn(
      'flex flex-1 flex-col gap-4 overflow-y-auto p-4',
      'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
      'scrollbar-track-transparent'
    )}>
      {messages.map((message) => (
        <ChatMessage key={message.id} {...message} />
      ))}

      {isTyping && currentAgent && (
        <TypingIndicator
          agentName={currentAgent.name}
          agentIcon={currentAgent.icon}
          agentColor={currentAgent.color}
        />
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
```

#### 4. Chat Input Component (`chat/ChatInput.tsx`)

```typescript
'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  agentName: string;
  disabled?: boolean;
}

export function ChatInput({ onSend, agentName, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-expand textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 144)}px`; // max 6 lines (24px * 6)
  };

  return (
    <footer className={cn(
      'shrink-0 border-t border-[rgb(var(--color-border-default))]',
      'bg-[rgb(var(--color-bg-surface))] p-3 px-4'
    )}>
      <div className={cn(
        'relative flex min-h-[44px] items-end gap-2',
        'rounded-full bg-[rgb(var(--color-bg-tertiary))] py-2 pl-11 pr-2'
      )}>
        {/* Left Icons */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1">
          {/* @mention button */}
          <button
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md',
              'text-[rgb(var(--color-text-muted))] transition-colors duration-150',
              'hover:bg-[rgb(var(--color-border-default))]',
              'hover:text-[rgb(var(--color-text-secondary))]'
            )}
            aria-label="Mention agent"
            onClick={() => {
              // Basic @mention support - insert @ symbol
              setMessage((prev) => prev + '@');
              textareaRef.current?.focus();
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              alternate_email
            </span>
          </button>

          {/* Attachment button (placeholder) */}
          <button
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md',
              'text-[rgb(var(--color-text-muted))] transition-colors duration-150',
              'hover:bg-[rgb(var(--color-border-default))]',
              'hover:text-[rgb(var(--color-text-secondary))]'
            )}
            aria-label="Attach file"
            onClick={() => {
              // TODO: Implement file attachment
              console.log('Attachment clicked');
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              attachment
            </span>
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${agentName}...`}
          disabled={disabled}
          className={cn(
            'w-full max-h-36 min-h-[24px] resize-none self-center',
            'border-none bg-transparent text-sm',
            'text-[rgb(var(--color-text-primary))]',
            'placeholder:text-[rgb(var(--color-text-muted))]',
            'focus:outline-none focus:ring-0 disabled:cursor-not-allowed'
          )}
          rows={1}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center',
            'rounded-full bg-[rgb(var(--color-primary-500))] text-white',
            'transition-all duration-150 hover:scale-105 active:scale-95',
            'disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-600'
          )}
          aria-label="Send message"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            arrow_upward
          </span>
        </button>
      </div>
    </footer>
  );
}
```

#### 5. Updated Chat Panel (`shell/ChatPanel.tsx`)

Refactor placeholder to integrate all components with full functionality.

#### 6. Mock Data Hook (`hooks/use-chat-messages.ts`)

```typescript
'use client';

import { useState } from 'react';

interface Message {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  agentName?: string;
  agentIcon?: string;
  agentColor?: string;
}

export function useChatMessages() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'Today',
      timestamp: new Date(),
    },
    {
      id: '2',
      type: 'user',
      content: 'Create a follow-up email for the Johnson deal with a friendly tone.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      id: '3',
      type: 'agent',
      content: 'Of course. Here is a draft based on our last conversation. I\'ve included a friendly opening and a clear call to action.',
      timestamp: new Date(Date.now() - 4 * 60 * 1000),
      agentName: 'Hub',
      agentIcon: '🎯',
      agentColor: '#FF6B6B',
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate agent typing
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      // Add agent response
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: `I received your message: "${content}". This is a mock response for demonstration purposes.`,
        timestamp: new Date(),
        agentName: 'Hub',
        agentIcon: '🎯',
        agentColor: '#FF6B6B',
      };

      setMessages((prev) => [...prev, agentMessage]);
    }, 2000);
  };

  return {
    messages,
    isTyping,
    sendMessage,
  };
}
```

---

## Implementation Tasks

### Task 1: Create Chat Message Components
- [ ] Create `apps/web/src/components/chat/` directory
- [ ] Create `ChatMessage.tsx` with user, agent, system variants
- [ ] Create `TypingIndicator.tsx` with animated dots
- [ ] Create `ChatMessageList.tsx` with auto-scroll
- [ ] Create `ChatInput.tsx` with auto-expand textarea

### Task 2: Implement Message Styling
- [ ] User messages: right-aligned, primary background
- [ ] Agent messages: left-aligned, avatar, agent color
- [ ] System messages: centered, muted
- [ ] Proper border radius for message bubbles
- [ ] Timestamp formatting and positioning

### Task 3: Implement Scrolling Behavior
- [ ] Custom scrollbar styles (6px width)
- [ ] Auto-scroll to bottom on new messages
- [ ] Smooth scroll animation
- [ ] Scroll container with proper overflow handling

### Task 4: Implement Chat Input
- [ ] Auto-expanding textarea (1-6 lines)
- [ ] @mention button (inserts @ symbol)
- [ ] Attachment button (placeholder)
- [ ] Send button with disabled state
- [ ] Enter to send, Shift+Enter for newline
- [ ] Input validation (no empty messages)

### Task 5: Update Chat Panel Container
- [ ] Refactor `ChatPanel.tsx` from placeholder
- [ ] Integrate `ChatMessageList` component
- [ ] Integrate `ChatInput` component
- [ ] Add header with agent selector and controls
- [ ] Implement collapse/expand logic
- [ ] Add collapsed state (icon button)

### Task 6: Create Mock Data Hook
- [ ] Create `use-chat-messages.ts` hook
- [ ] Provide sample conversation data
- [ ] Implement `sendMessage` function
- [ ] Simulate typing indicator
- [ ] Return messages, isTyping, sendMessage

### Task 7: Add Animations
- [ ] Typing indicator bounce animation
- [ ] Smooth message list scroll
- [ ] Input send button hover/active states
- [ ] Panel collapse/expand transition

### Task 8: Test Responsive Behavior
- [ ] Panel width consistent (380px)
- [ ] Messages responsive within panel
- [ ] Input area auto-expands correctly
- [ ] Scrollbar appears when needed
- [ ] Collapsed state shows correctly

### Task 9: Visual QA
- [ ] Compare with CH-01 wireframe
- [ ] Verify message alignment and spacing
- [ ] Test light and dark modes
- [ ] Verify agent colors display correctly
- [ ] Test with long messages (text wrapping)

### Task 10: Integration Testing
- [ ] Verify integration with UI store
- [ ] Test collapse/expand functionality
- [ ] Test message sending
- [ ] Verify typing indicator appears/disappears
- [ ] Test auto-scroll behavior

---

## Testing Requirements

### Unit Tests

**File:** `apps/web/src/components/chat/__tests__/ChatMessage.test.tsx`

```typescript
describe('ChatMessage', () => {
  it('renders user message right-aligned', () => {});
  it('renders agent message with avatar', () => {});
  it('renders system message centered', () => {});
  it('formats timestamp correctly', () => {});
  it('applies agent color to avatar and name', () => {});
  it('displays agent icon in avatar', () => {});
});
```

**File:** `apps/web/src/components/chat/__tests__/ChatInput.test.tsx`

```typescript
describe('ChatInput', () => {
  it('sends message on Enter key', () => {});
  it('adds newline on Shift+Enter', () => {});
  it('disables send when message empty', () => {});
  it('clears input after sending', () => {});
  it('inserts @ on mention button click', () => {});
  it('auto-expands textarea up to 6 lines', () => {});
});
```

### Visual Tests (Storybook)

**File:** `apps/web/src/components/chat/ChatMessage.stories.tsx`

```typescript
export const UserMessage = () => <ChatMessage type="user" />;
export const AgentMessage = () => <ChatMessage type="agent" />;
export const SystemMessage = () => <ChatMessage type="system" />;
export const LongMessage = () => <ChatMessage />;
```

### Interaction Tests (Playwright)

**File:** `apps/web/e2e/chat-panel.spec.ts`

```typescript
test.describe('Chat Panel', () => {
  test('renders chat panel expanded', async ({ page }) => {});
  test('displays message history', async ({ page }) => {});
  test('sends message on Enter', async ({ page }) => {});
  test('collapses panel on minimize', async ({ page }) => {});
  test('shows typing indicator', async ({ page }) => {});
  test('auto-scrolls to new messages', async ({ page }) => {});
  test('inserts @ on mention button', async ({ page }) => {});
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All implementation tasks completed
- [ ] Unit tests written and passing
- [ ] Visual tests in Storybook
- [ ] Playwright tests passing
- [ ] TypeScript type-check passes
- [ ] ESLint passes with no warnings
- [ ] Works in light and dark modes
- [ ] Responsive within panel container
- [ ] Code reviewed and approved
- [ ] PR merged to epic branch
- [ ] Sprint status updated

---

## Notes

### Design Tokens Used

```css
--color-primary-500: #FF6B6B
--color-accent-500: #20B2AA (secondary)
--color-bg-surface: Light #ffffff / Dark #232326
--color-bg-tertiary: Light #f5f3ee / Dark #1a1a1d
--color-border-default: Light #e5e5e5 / Dark #27272a
--color-text-primary: Light #1a1a1a / Dark #fafafa
--color-text-secondary: Light #6b7280 / Dark #a1a1aa
--color-text-muted: Light #9ca3af / Dark #71717a
```

### Agent Colors

| Agent | Color | Icon |
|-------|-------|------|
| Hub | #FF6B6B (Primary) | 🎯 |
| Maya | #20B2AA (Secondary) | 🐚 |
| Atlas | #FF9F43 (Warning) | 🗺️ |
| Sage | #2ECC71 (Success) | 🌿 |

### Future Enhancements (Not in This Story)

- WebSocket integration for real-time chat
- Message reactions (emoji reactions)
- Message editing and deletion
- File attachments upload/display
- Rich text formatting (markdown)
- Agent switching dropdown
- Chat history navigation
- Message search
- Conversation threads
- Voice input support

---

## Related Stories

- **Story 07-1:** Dashboard Layout Component (dependency - complete)
- **Story 07-5:** Implement Dark/Light Mode (integration for theme)
- **Story 07-6:** Create Command Palette (related UI pattern)
- **Story 07-7:** Create Notification Center (related UI pattern)

---

_Story created by BMAD create-story workflow_
_Epic reference: docs/epics/EPIC-07-ui-shell.md_
_Tech spec: docs/sprint-artifacts/tech-spec-epic-07.md_
_Wireframes: CH-01, CH-02, CH-03_
