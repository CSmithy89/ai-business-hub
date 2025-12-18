import Mention from '@tiptap/extension-mention'
import { ReactRenderer } from '@tiptap/react'
import { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion'
import tippy, { Instance as TippyInstance } from 'tippy.js'
import { MentionList } from '../MentionList'

export interface MentionSuggestionOptions {
  workspaceId: string
}

interface WorkspaceMember {
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

export const createMentionExtension = (options: MentionSuggestionOptions) => {
  return Mention.configure({
    HTMLAttributes: {
      class: 'mention',
    },
    renderLabel({ node }) {
      return `@${node.attrs.label}`
    },
    suggestion: {
      char: '@',
      items: async ({ query }) => {
        // Fetch workspace members from API
        try {
          const response = await fetch(
            `/api/workspaces/${options.workspaceId}/members?q=${encodeURIComponent(query)}`
          )
          if (!response.ok) {
            console.error('Failed to fetch members:', response.statusText)
            return []
          }
          const members = await response.json()

          // Transform to the format expected by MentionList
          return members.map((member: WorkspaceMember) => ({
            id: member.user.id,
            name: member.user.name || member.user.email,
            email: member.user.email,
            avatarUrl: member.user.image,
          }))
        } catch (error) {
          console.error('Error fetching members:', error)
          return []
        }
      },
      render: () => {
        let component: ReactRenderer
        let popup: TippyInstance[]

        return {
          onStart: (props: SuggestionProps) => {
            component = new ReactRenderer(MentionList, {
              props,
              editor: props.editor,
            })

            popup = tippy('body', {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              getReferenceClientRect: props.clientRect as any,
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              getReferenceClientRect: props.clientRect as any,
            })
          },

          onKeyDown(props: { event: KeyboardEvent }) {
            if (props.event.key === 'Escape') {
              popup[0].hide()
              return true
            }

            const ref = component.ref as { onKeyDown?: (props: { event: KeyboardEvent }) => boolean }
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
