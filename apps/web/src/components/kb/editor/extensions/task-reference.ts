import Mention from '@tiptap/extension-mention'
import { ReactRenderer } from '@tiptap/react'
import { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion'
import tippy, { Instance as TippyInstance } from 'tippy.js'
import { TaskReferenceList } from '../TaskReferenceList'

export interface TaskReferenceOptions {
  workspaceId: string
}

interface TaskSearchResult {
  id: string
  taskNumber: number
  title: string
  status: string
  priority: string
  projectId?: string
}

// Note: options parameter kept for API consistency with other extensions
// workspaceId not used here as /api/pm/tasks derives workspace from session
export const createTaskReferenceExtension = (_options: TaskReferenceOptions) => {
  return Mention.extend({
    name: 'taskReference',
  }).configure({
    HTMLAttributes: {
      class: 'task-reference',
    },
    renderLabel({ node }) {
      return `#PM-${node.attrs.taskNumber || node.attrs.label}`
    },
    suggestion: {
      char: '#',
      items: async ({ query }) => {
        // Strip leading # if present
        const searchQuery = query.startsWith('#') ? query.slice(1) : query

        try {
          const response = await fetch(
            `/api/pm/tasks?search=${encodeURIComponent(searchQuery)}&limit=10`
          )
          if (!response.ok) {
            console.error('Failed to fetch tasks:', response.statusText)
            return []
          }
          const result = await response.json()

          // Transform to format expected by TaskReferenceList
          return (result.data || []).map((task: TaskSearchResult) => ({
            id: task.id,
            taskNumber: task.taskNumber,
            title: task.title,
            status: task.status,
            priority: task.priority,
          }))
        } catch (error) {
          console.error('Error fetching tasks:', error)
          return []
        }
      },
      render: () => {
        let component: ReactRenderer
        let popup: TippyInstance[]

        return {
          onStart: (props: SuggestionProps) => {
            component = new ReactRenderer(TaskReferenceList, {
              props,
              editor: props.editor,
            })

            popup = tippy('body', {
              getReferenceClientRect: props.clientRect as () => DOMRect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
              maxWidth: 'none',
            })
          },

          onUpdate(props: SuggestionProps) {
            component.updateProps(props)

            popup[0].setProps({
              getReferenceClientRect: props.clientRect as () => DOMRect,
            })
          },

          onKeyDown(props: { event: KeyboardEvent }) {
            if (props.event.key === 'Escape') {
              popup[0].hide()
              return true
            }

            const ref = component.ref as {
              onKeyDown?: (props: { event: KeyboardEvent }) => boolean
            }
            return ref?.onKeyDown?.(props) ?? false
          },

          onExit() {
            popup[0].destroy()
            component.destroy()
          },
        }
      },
    } as Partial<SuggestionOptions>,
  })
}
