'use client'

import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight, common } from 'lowlight'
import type * as Y from 'yjs'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { createMentionExtension } from './extensions/mention'

// Create lowlight instance with common languages
const lowlight = createLowlight(common)

export type KbCollaborationConfig = {
  document: Y.Doc
}

export type KbCollaborationCursorConfig = {
  provider: HocuspocusProvider
  user: { name: string; color: string }
}

export function createExtensions(
  placeholder = 'Start writing...',
  options?: {
    collaboration?: KbCollaborationConfig
    cursor?: KbCollaborationCursorConfig
    workspaceId?: string
  },
) {
  const collaboration = options?.collaboration
  const cursor = options?.cursor
  const workspaceId = options?.workspaceId

  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4],
      },
      codeBlock: false, // Using CodeBlockLowlight instead
      ...(collaboration ? { history: false } : {}),
    }),
    ...(collaboration ? [Collaboration.configure({ document: collaboration.document })] : []),
    ...(cursor
      ? [
          CollaborationCursor.configure({
            provider: cursor.provider,
            user: cursor.user,
            render: (user) => {
              const caret = document.createElement('span')
              caret.classList.add('collaboration-cursor__caret')
              caret.style.borderColor = String(user.color)

              const label = document.createElement('span')
              label.classList.add('collaboration-cursor__label')
              label.style.backgroundColor = String(user.color)
              label.textContent = String(user.name)

              caret.appendChild(label)
              return caret
            },
            selectionRender: (user) => ({
              nodeName: 'span',
              class: 'collaboration-cursor__selection',
              style: `background-color: ${String(user.color)}33`,
            }),
          }),
        ]
      : []),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-primary underline underline-offset-4 hover:text-primary/80',
      },
    }),
    Underline,
    Placeholder.configure({
      placeholder,
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'border-collapse table-auto w-full',
      },
    }),
    TableRow,
    TableCell.configure({
      HTMLAttributes: {
        class: 'border border-border p-2',
      },
    }),
    TableHeader.configure({
      HTMLAttributes: {
        class: 'border border-border p-2 font-bold bg-muted',
      },
    }),
    TaskList.configure({
      HTMLAttributes: {
        class: 'not-prose pl-2',
      },
    }),
    TaskItem.configure({
      HTMLAttributes: {
        class: 'flex items-start gap-2',
      },
      nested: true,
    }),
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: {
        class: 'rounded-md bg-muted p-4 font-mono text-sm',
      },
    }),
    ...(workspaceId ? [createMentionExtension(workspaceId)] : []),
  ]
}
