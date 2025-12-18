# Story KB-03.5: @Mention Support

**Epic:** KB-03 - KB Verification & Scribe Agent
**Story ID:** kb-03-5-at-mentions
**Status:** Ready for Dev
**Points:** 5
**Type:** Feature
**Created:** 2025-12-18

---

## Description

Add @mention support in the Tiptap rich text editor to allow users to mention team members in KB pages. When a user types "@", an autocomplete dropdown appears showing workspace members. Selected mentions render as styled chips and create notification entries for mentioned users.

---

## User Story

**As a** KB user,
**I want** to @mention users in pages,
**So that** I can reference team members and notify them about relevant content.

---

## Acceptance Criteria

- [ ] Typing "@" in the editor triggers mention autocomplete
- [ ] Autocomplete dropdown shows workspace members
- [ ] Can search members by name or email
- [ ] Selecting a member inserts a mention chip
- [ ] Mention chips are visually distinct (styled badges)
- [ ] Mentions are clickable (show user profile/card on click)
- [ ] Mentioned user receives in-app notification
- [ ] PageMention record created in database
- [ ] Mentions preserved across page saves/loads
- [ ] Mentions work in both edit and view modes
- [ ] Keyboard navigation in autocomplete (arrow keys, Enter, Escape)
- [ ] Autocomplete closes when clicking outside

---

## Prerequisites

- KB-01.3: Rich Text Editor (Tiptap) - ✅ Complete
- Member list API endpoint - Available at `GET /api/workspaces/:workspaceId/members`
- Notification system - ✅ Available

---

## Technical Implementation

### 1. Tiptap Mention Extension

**Install Dependencies:**
```bash
pnpm add @tiptap/extension-mention @tiptap/suggestion
```

**File:** `apps/web/src/components/kb/editor/extensions/mention.ts`

**Features:**
- Configure Tiptap Mention extension
- Custom rendering for mention chips
- Suggestion plugin configuration
- Keyboard navigation support

**Extension Config:**
```typescript
import Mention from '@tiptap/extension-mention'
import { ReactRenderer } from '@tiptap/react'
import { SuggestionOptions } from '@tiptap/suggestion'
import tippy, { Instance } from 'tippy.js'

export const MentionExtension = Mention.configure({
  HTMLAttributes: {
    class: 'mention',
  },
  suggestion: {
    items: async ({ query }) => {
      // Fetch workspace members matching query
      return await fetchWorkspaceMembers(query)
    },
    render: () => {
      // Render autocomplete dropdown
      return {
        onStart: (props) => { /* ... */ },
        onUpdate: (props) => { /* ... */ },
        onExit: () => { /* ... */ },
      }
    },
  },
})
```

### 2. Mention Autocomplete Component

**File:** `apps/web/src/components/kb/editor/MentionList.tsx`

**Features:**
- Display filtered member list
- Search highlighting
- Avatar + name + email display
- Keyboard navigation (arrow keys)
- Selection on Enter key
- Close on Escape or click outside

**Component Structure:**
```tsx
export function MentionList({ items, command }: MentionListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = items[index]
    if (item) {
      command({ id: item.id, label: item.name })
    }
  }

  return (
    <div className="mention-list">
      {items.map((item, index) => (
        <button
          key={item.id}
          className={cn('mention-item', index === selectedIndex && 'selected')}
          onClick={() => selectItem(index)}
        >
          <Avatar src={item.image} name={item.name} />
          <div>
            <div className="name">{item.name}</div>
            <div className="email">{item.email}</div>
          </div>
        </button>
      ))}
    </div>
  )
}
```

### 3. Mention Chip Styling

**File:** `apps/web/src/app/globals.css`

**Add Styles:**
```css
/* Mention chip in editor */
.mention {
  @apply inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary;
  @apply cursor-pointer hover:bg-primary/20;
  @apply transition-colors;
}

/* Mention autocomplete list */
.mention-list {
  @apply rounded-lg border bg-popover p-1 shadow-md;
  @apply max-h-64 overflow-y-auto;
}

.mention-item {
  @apply flex w-full items-center gap-2 rounded-md px-2 py-1.5;
  @apply text-left hover:bg-accent;
  @apply transition-colors;
}

.mention-item.selected {
  @apply bg-accent;
}
```

### 4. API Integration

**File:** `apps/web/src/hooks/use-workspace-members.ts`

**Hook for fetching members:**
```typescript
export function useWorkspaceMembers(workspaceId: string, query?: string) {
  return useQuery({
    queryKey: ['workspace-members', workspaceId, query],
    queryFn: async () => {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/members${query ? `?q=${query}` : ''}`,
        {
          headers: { Authorization: `Bearer ${getSessionToken()}` },
        }
      )
      if (!response.ok) throw new Error('Failed to fetch members')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

### 5. Backend: PageMention Tracking

**File:** `apps/api/src/kb/pages/pages.service.ts`

**Add mention extraction:**
```typescript
async extractMentions(pageId: string, content: any): Promise<void> {
  // Extract @mentions from Tiptap JSON content
  const mentions = this.extractMentionsFromContent(content)

  // Delete old mentions
  await this.prisma.pageMention.deleteMany({
    where: { pageId, mentionType: 'USER' },
  })

  // Create new mentions
  if (mentions.length > 0) {
    await this.prisma.pageMention.createMany({
      data: mentions.map((m, idx) => ({
        pageId,
        mentionType: 'USER',
        targetId: m.userId,
        position: m.position || idx,
      })),
    })
  }
}

private extractMentionsFromContent(content: any): Array<{ userId: string; position: number }> {
  const mentions: Array<{ userId: string; position: number }> = []
  let position = 0

  const traverse = (node: any) => {
    if (node.type === 'mention') {
      mentions.push({ userId: node.attrs.id, position })
    }
    if (node.content) {
      node.content.forEach(traverse)
    }
    position++
  }

  if (content?.content) {
    content.content.forEach(traverse)
  }

  return mentions
}
```

### 6. Notification Creation

**File:** `apps/api/src/notifications/notifications.service.ts`

**Create notification on mention:**
```typescript
async createMentionNotification(
  userId: string,
  workspaceId: string,
  pageId: string,
  pageTitle: string,
  mentionedBy: string
): Promise<void> {
  await this.prisma.notification.create({
    data: {
      userId,
      workspaceId,
      type: 'kb_mention',
      title: 'You were mentioned',
      message: `${mentionedBy} mentioned you in "${pageTitle}"`,
      link: `/kb/${pageId}`,
      data: {
        pageId,
        pageTitle,
        mentionedBy,
      },
    },
  })

  // Emit real-time notification via WebSocket
  this.eventEmitter.emit('notification.created', {
    userId,
    workspaceId,
    notificationType: 'kb_mention',
  })
}
```

### 7. Update Editor Extensions

**File:** `apps/web/src/components/kb/editor/extensions.ts`

**Add Mention to extensions list:**
```typescript
import { MentionExtension } from './extensions/mention'

export function createExtensions(
  placeholder = 'Start writing...',
  options?: {
    collaboration?: KbCollaborationConfig
    cursor?: KbCollaborationCursorConfig
    workspaceId?: string
  },
) {
  return [
    // ... existing extensions
    MentionExtension(options?.workspaceId),
  ]
}
```

### 8. Update Page Save Handler

**File:** `apps/web/src/app/(dashboard)/kb/[slug]/page.tsx`

**Extract and create mentions on save:**
```typescript
const handleSave = async (content: any) => {
  await updatePageMutation.mutateAsync({
    id: page.id,
    content,
    // Trigger mention extraction and notifications
    processMentions: true,
  })
}
```

---

## API Changes

### New Endpoint (Optional Enhancement)

**Endpoint:** `GET /api/workspaces/:workspaceId/members/search?q=query`

**Purpose:** Optimized search for autocomplete (if standard member list is slow)

**Response:**
```json
{
  "data": [
    {
      "id": "user-123",
      "name": "John Doe",
      "email": "john@example.com",
      "image": "https://..."
    }
  ]
}
```

### Updated Endpoint

**Endpoint:** `PATCH /api/kb/pages/:id`

**Add processMentions flag:**
```json
{
  "content": { /* Tiptap JSON */ },
  "processMentions": true
}
```

---

## Database Schema

**Already exists in schema.prisma:**

```prisma
model PageMention {
  id     String @id @default(cuid())
  pageId String @map("page_id")

  mentionType KBMentionType @map("mention_type")
  targetId    String        @map("target_id") // User ID
  position    Int

  createdAt DateTime @default(now()) @map("created_at")

  page KnowledgePage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@index([pageId])
  @@index([targetId])
  @@index([mentionType])
  @@map("page_mentions")
}

enum KBMentionType {
  USER // @username
  TASK // #PM-123
  PAGE // [[Page Title]]
}
```

**No migration needed** - PageMention model already exists.

---

## Files to Create/Modify

### New Files

1. `apps/web/src/components/kb/editor/extensions/mention.ts` - Mention extension config
2. `apps/web/src/components/kb/editor/MentionList.tsx` - Autocomplete dropdown
3. `apps/web/src/hooks/use-workspace-members.ts` - Member search hook

### Modified Files

1. `apps/web/src/components/kb/editor/extensions.ts` - Add Mention extension
2. `apps/web/src/app/globals.css` - Add mention styles
3. `apps/api/src/kb/pages/pages.service.ts` - Add mention extraction
4. `apps/api/src/kb/pages/dto/update-page.dto.ts` - Add processMentions flag
5. `apps/api/src/notifications/notifications.service.ts` - Add mention notification

---

## Testing Checklist

### Unit Tests

- [ ] Mention extraction from Tiptap content
- [ ] Member search filtering
- [ ] Keyboard navigation logic

### Integration Tests

- [ ] Create page with mentions
- [ ] Update page with new mentions
- [ ] PageMention records created
- [ ] Notifications sent to mentioned users

### Manual Testing

1. **Mention Trigger**
   - Type "@" in editor
   - Verify autocomplete appears
   - Verify workspace members shown

2. **Mention Search**
   - Type "@joh"
   - Verify filtered to matching names
   - Verify search works for email too

3. **Mention Selection**
   - Select member from list
   - Verify mention chip inserted
   - Verify chip has correct styling
   - Verify chip is clickable

4. **Keyboard Navigation**
   - Use arrow keys to navigate list
   - Press Enter to select
   - Press Escape to close
   - Verify all work correctly

5. **Persistence**
   - Save page with mentions
   - Reload page
   - Verify mentions preserved
   - Verify mentions render correctly

6. **Notifications**
   - Mention a user
   - Save page
   - Verify mentioned user receives notification
   - Verify notification links to page
   - Verify notification shows correct message

7. **Multiple Mentions**
   - Mention multiple users
   - Verify all recorded
   - Verify all notified
   - Verify no duplicates

8. **Edge Cases**
   - Delete mentioned user from workspace
   - Verify mention still renders (with fallback)
   - Remove mention from page
   - Verify PageMention record deleted

---

## Performance Considerations

- **Member List Caching**: Cache workspace members for 5 minutes
- **Debounced Search**: Debounce autocomplete search queries (200ms)
- **Virtualized List**: Use virtual scrolling if member list > 50 items
- **Lazy Notifications**: Queue notifications, send in batch to avoid spam
- **Optimistic Updates**: Show mention chip immediately, sync in background

---

## Accessibility

- **Keyboard Navigation**: Full keyboard support for autocomplete
- **ARIA Labels**: Proper labels for mention chips and autocomplete
- **Screen Reader**: Announce mention insertion and autocomplete state
- **Focus Management**: Maintain focus in editor after mention insertion
- **Contrast**: Ensure mention chips meet WCAG contrast requirements

---

## Security Considerations

- **Authorization**: Only workspace members can be mentioned
- **Privacy**: Mentions only visible to users with page access
- **Rate Limiting**: Limit notification frequency to prevent spam
- **XSS Prevention**: Sanitize mention display names
- **Validation**: Validate mentioned user exists in workspace

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| @ | Trigger mention autocomplete |
| Arrow Up/Down | Navigate autocomplete list |
| Enter | Select highlighted member |
| Escape | Close autocomplete |
| Backspace | Delete mention chip (when cursor before it) |

---

## Related Stories

- **KB-03.6: #Task Reference Support** - Similar implementation for task mentions
- **KB-03.1: Verification System** - Verified pages prioritized in mentions
- **PM-06.5: In-App Notifications** - Display mention notifications

---

## Definition of Done

- [ ] Mention extension integrated with Tiptap
- [ ] Autocomplete dropdown functional
- [ ] Member search working
- [ ] Keyboard navigation working
- [ ] Mention chips render correctly
- [ ] PageMention records created on save
- [ ] Notifications sent to mentioned users
- [ ] Tests passing
- [ ] Type check passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Deployed to staging

---

## Notes

- Tiptap Mention extension uses `@tiptap/suggestion` under the hood
- Tippy.js used for autocomplete positioning
- Consider adding mention preview on hover (future enhancement)
- Consider batch notification sending (if many mentions)
- Real-time collaboration will need mention sync via Yjs (future enhancement)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-18 | Story drafted | Claude |
