import Mention from '@tiptap/extension-mention'
import { ReactRenderer } from '@tiptap/react'
import { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion'
import tippy, { Instance as TippyInstance } from 'tippy.js'
import { toast } from 'sonner'
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

// Configuration constants
const FETCH_TIMEOUT_MS = 5000

export const createMentionExtension = (options: MentionSuggestionOptions) => {
  return Mention.configure({
    HTMLAttributes: {
      class: 'mention',
    },
    renderLabel({ node }) {
      // Sanitize label to prevent XSS - strip any HTML-like characters
      const sanitizedLabel = String(node.attrs.label || '')
        .replace(/[<>]/g, '')
        .slice(0, 100) // Limit length
      return `@${sanitizedLabel}`
    },
    suggestion: {
      char: '@',
      items: async ({ query }) => {
        // Fetch workspace members from API with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

        try {
          const response = await fetch(
            `/api/workspaces/${options.workspaceId}/members?q=${encodeURIComponent(query)}`,
            { signal: controller.signal }
          )
          clearTimeout(timeoutId)

          if (!response.ok) {
            console.error('Failed to fetch members:', response.statusText)
            toast.error('Failed to load workspace members')
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
          clearTimeout(timeoutId)
          if (error instanceof Error && error.name === 'AbortError') {
            console.error('Fetch members request timed out')
            toast.error('Request timed out - please try again')
          } else {
            console.error('Error fetching members:', error)
            toast.error('Failed to load workspace members')
          }
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
            component?.updateProps(props)

            // Guard against popup not being initialized (if onStart bailed early)
            if (popup?.[0]) {
              popup[0].setProps({
                getReferenceClientRect: props.clientRect as () => DOMRect,
              })
            }
          },

          onKeyDown(props: { event: KeyboardEvent }) {
            if (props.event.key === 'Escape') {
              // Guard against popup not being initialized (if onStart bailed early)
              if (popup?.[0]) {
                popup[0].hide()
                return true
              }
              return false
            }

            const ref = component?.ref as { onKeyDown?: (props: { event: KeyboardEvent }) => boolean } | undefined
            return ref?.onKeyDown?.(props) ?? false
          },

          onExit() {
            // Safe cleanup with error handling to prevent memory leaks
            // Destroy popup first, then component to prevent React unmount warnings
            try {
              if (popup?.[0] && !popup[0].state.isDestroyed) {
                popup[0].destroy()
              }
              // Clear reference to allow garbage collection
              popup = []
            } catch (error) {
              console.warn('Error cleaning up mention popup:', error)
            }

            // Defer component destruction to ensure popup cleanup completes
            // This prevents React warnings about unmounting with pending updates
            setTimeout(() => {
              try {
                component?.destroy()
              } catch (error) {
                console.warn('Error cleaning up mention component:', error)
              }
            }, 0)
          },
        }
      },
    } as Partial<SuggestionOptions>,
  })
}
