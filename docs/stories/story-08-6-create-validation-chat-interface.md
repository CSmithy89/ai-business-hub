# Story 08.6: Create Validation Chat Interface

**Story ID:** 08.6
**Epic:** EPIC-08 - Business Onboarding & Foundation Modules
**Status:** done
**Points:** 3
**Priority:** P0
**Dependencies:** Story 08.5 (Validation Team Agno Configuration)

---

## User Story

**As a** user
**I want** to chat with the Validation Team
**So that** I can validate my business idea through conversation

---

## Description

This story creates the chat interface for the Business Validation Module (BMV). Users interact with Vera (the team leader) who coordinates with specialist agents to validate business ideas. The interface shows chat messages, workflow progress, agent indicators, and suggested actions.

---

## Acceptance Criteria

### Chat Interface
- [ ] Create `/dashboard/[businessId]/validation` page
- [ ] Implement chat message list with scroll management
- [ ] Display team leader (Vera) as primary responder
- [ ] Show agent name/avatar for each message
- [ ] Support markdown rendering in messages
- [ ] Implement message input with send button

### Streaming & Real-time
- [ ] Implement SSE streaming for agent responses (mock for MVP)
- [ ] Show typing indicator while agent is thinking
- [ ] Display message chunks as they arrive

### Workflow Progress
- [ ] Display workflow progress indicator
- [ ] Show completed workflows with checkmarks
- [ ] Highlight current workflow
- [ ] Show pending workflows

### Action Buttons
- [ ] Add suggested action buttons from agent responses
- [ ] Show "Continue to Planning" when validation complete
- [ ] Display key findings summary panel

---

## Technical Implementation Details

### Page Structure

```typescript
// apps/web/src/app/(dashboard)/dashboard/[businessId]/validation/page.tsx

export default function ValidationPage({ params }: { params: { businessId: string } }) {
  return (
    <div className="flex flex-col h-full">
      <ValidationHeader businessId={params.businessId} />
      <ValidationProgress businessId={params.businessId} />
      <ChatInterface businessId={params.businessId} />
    </div>
  )
}
```

### Components to Create

1. `ValidationPage` - Main page container
2. `ValidationHeader` - Title, score display
3. `ValidationProgress` - Workflow progress indicator
4. `ValidationChatInterface` - Chat container
5. `ChatMessageList` - Scrollable message list
6. `ChatMessage` - Individual message component
7. `ChatInput` - Message input with send
8. `AgentAvatar` - Agent icon/avatar display
9. `SuggestedActions` - Action button list

### API Endpoints (Mock for MVP)

```typescript
// POST /api/validation/[businessId]/messages
// Send message to validation team

// GET /api/validation/[businessId]/messages
// Get message history

// GET /api/validation/[businessId]/progress
// Get workflow progress
```

---

## Testing Requirements

### Unit Tests
- [ ] Chat message rendering
- [ ] Message input validation
- [ ] Progress indicator states

### Integration Tests
- [ ] Message send/receive flow
- [ ] Progress update sync

### E2E Tests
- [ ] Full chat conversation flow
- [ ] Navigation from onboarding to validation

---

## Definition of Done

- [ ] Validation page accessible at `/dashboard/[businessId]/validation`
- [ ] Chat interface renders messages correctly
- [ ] Agent names shown with messages
- [ ] Workflow progress visible
- [ ] Message input working
- [ ] Responsive design (mobile-friendly)
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Code reviewed

---

## Related Documentation

- [Epic 08: Business Onboarding](../epics/EPIC-08-business-onboarding.md)
- [Wireframe: BO-06 - Validation Page](../design/wireframes/WIREFRAME-INDEX.md)

---

_Story created: 2025-12-05_
_Last updated: 2025-12-05_
