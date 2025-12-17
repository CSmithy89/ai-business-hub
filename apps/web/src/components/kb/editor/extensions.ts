'use client'

import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight, common } from 'lowlight'

// Create lowlight instance with common languages
const lowlight = createLowlight(common)

export const createExtensions = (placeholder = 'Start writing...') => [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3, 4],
    },
    codeBlock: false, // Using CodeBlockLowlight instead
  }),
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
]
