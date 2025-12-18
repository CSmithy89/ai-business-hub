# Story KB-03.6: #Task Reference Support

**Epic:** KB-03 - KB Verification & Scribe Agent
**Story ID:** kb-03-6-hash-references
**Status:** In Progress
**Points:** 5
**Type:** Feature
**Created:** 2025-12-18

---

## Description

Add #task reference support in the Tiptap rich text editor to allow users to reference PM tasks in KB pages. When a user types "#", an autocomplete dropdown appears showing workspace tasks. Selected references render as styled chips and create PageMention entries (mentionType=TASK).

---

## User Story

**As a** KB user,
**I want** to reference tasks in pages using #task-number,
**So that** I can link documentation to work and create cross-references.

---

## Acceptance Criteria

- [ ] Typing "#" in the editor triggers task autocomplete
- [ ] Autocomplete dropdown shows workspace tasks
- [ ] Can search tasks by number or title
- [ ] Selecting a task inserts a reference chip
- [ ] Reference chips are visually distinct (styled badges with #PM-123)
- [ ] References are clickable (navigate to task detail)
- [ ] PageMention record created with mentionType=TASK
- [ ] References preserved across page saves/loads
- [ ] Keyboard navigation in autocomplete (arrow keys, Enter, Escape)
- [ ] Autocomplete closes when clicking outside

---

## Prerequisites

- KB-01.3: Rich Text Editor (Tiptap) - Complete
- KB-03.5: @Mention Support - Complete (provides base pattern)
- PM-02: Task Management System - Complete

---

## Technical Implementation

### 1. Enhance Task Search API

**File:** `apps/api/src/pm/tasks/tasks.service.ts`

Update the list method to also search by taskNumber when search term is numeric:

```typescript
...(query.search
  ? {
      OR: [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        // Add taskNumber search for numeric queries
        ...(isNumeric(query.search)
          ? [{ taskNumber: parseInt(query.search, 10) }]
          : []),
      ],
    }
  : {}),
```

### 2. Tiptap TaskReference Extension

**File:** `apps/web/src/components/kb/editor/extensions/task-reference.ts`

Similar to the Mention extension but with "#" trigger:

```typescript
export const createTaskReferenceExtension = (options: TaskReferenceOptions) => {
  return Mention.configure({
    HTMLAttributes: {
      class: 'task-reference',
    },
    renderLabel({ node }) {
      return `#PM-${node.attrs.taskNumber}`
    },
    suggestion: {
      char: '#',
      items: async ({ query }) => {
        // Fetch tasks from API
        const response = await fetch(
          `/api/pm/tasks?search=${encodeURIComponent(query)}&limit=10`
        )
        return response.json()
      },
      // ... render config
    },
  })
}
```

### 3. TaskReferenceList Component

**File:** `apps/web/src/components/kb/editor/TaskReferenceList.tsx`

Display filtered task list with:
- Task number (#PM-123)
- Task title
- Task status badge
- Keyboard navigation

### 4. Update MentionService

**File:** `apps/api/src/kb/mentions/mention.service.ts`

Handle TASK mentions alongside USER mentions:

```typescript
extractMentionsFromContent(content: JSONContent): ExtractedMention[] {
  const mentions: ExtractedMention[] = []

  // ... traverse content
  if (node.type === 'mention') {
    // User mention (@)
    mentions.push({ type: 'USER', targetId: node.attrs.id })
  } else if (node.type === 'taskReference') {
    // Task mention (#)
    mentions.push({ type: 'TASK', targetId: node.attrs.taskId })
  }

  return mentions
}
```

### 5. Styling

**File:** `apps/web/src/app/globals.css`

```css
/* Task reference chip */
.task-reference {
  @apply inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5;
  @apply text-sm font-medium text-blue-600 dark:text-blue-400;
  @apply cursor-pointer hover:bg-blue-500/20 transition-colors;
}
```

---

## Files to Create/Modify

### New Files

1. `apps/web/src/components/kb/editor/extensions/task-reference.ts`
2. `apps/web/src/components/kb/editor/TaskReferenceList.tsx`

### Modified Files

1. `apps/api/src/pm/tasks/tasks.service.ts` - Add taskNumber search
2. `apps/web/src/components/kb/editor/extensions.ts` - Add TaskReference extension
3. `apps/api/src/kb/mentions/mention.service.ts` - Handle TASK mentions
4. `apps/web/src/app/globals.css` - Add task reference styles

---

## Testing Checklist

### Manual Testing

1. **Task Reference Trigger**
   - Type "#" in editor
   - Verify autocomplete appears
   - Verify workspace tasks shown

2. **Task Search**
   - Type "#123" - verify finds task by number
   - Type "#bug" - verify finds tasks by title

3. **Reference Selection**
   - Select task from list
   - Verify reference chip inserted
   - Verify chip shows #PM-123 format

4. **Persistence**
   - Save page with references
   - Reload page
   - Verify references preserved

5. **Navigation**
   - Click reference chip
   - Verify navigates to task detail

---

## Definition of Done

- [ ] TaskReference extension integrated with Tiptap
- [ ] Autocomplete dropdown functional with task search
- [ ] References render as clickable chips
- [ ] PageMention records created for TASK type
- [ ] Tests passing
- [ ] Type check passing
- [ ] Code reviewed

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-18 | Story drafted | Claude |

