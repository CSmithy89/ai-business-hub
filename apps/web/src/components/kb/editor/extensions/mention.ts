'use client'

import Mention from '@tiptap/extension-mention'
import { ReactRenderer } from '@tiptap/react'
import type { SuggestionOptions } from '@tiptap/suggestion'
import tippy, { type Instance } from 'tippy.js'
import { MentionList } from '../MentionList'

export const createMentionExtension = (workspaceId: string) => {
  return Mention.configure({
    HTMLAttributes: {
      class: 'mention',
    },
    renderLabel({ node }) {
      return `@${node.attrs.label}`
    },
    suggestion: {
      items: async ({ query }) => {
        try {
          // Fetch workspace members matching query
          const response = await fetch(
            `/api/workspaces/${workspaceId}/members${query ? `?q=${encodeURIComponent(query)}` : ''}`,
          )
          if (!response.ok) {
            console.error('Failed to fetch workspace members')
            return []
          }
          const data = await response.json()
          return data || []
        } catch (error) {
          console.error('Error fetching workspace members:', error)
          return []
        }
      },
      render: () => {
        let component: ReactRenderer
        let popup: Instance[]

        return {
          onStart: (props) => {
            component = new ReactRenderer(MentionList, {
              props,
              editor: props.editor,
            })

            if (!props.clientRect) {
              return
            }

            popup = tippy('body', {
              getReferenceClientRect: props.clientRect as () => DOMRect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
            })
          },
          onUpdate: (props) => {
            component.updateProps(props)

            if (!props.clientRect) {
              return
            }

            popup[0].setProps({
              getReferenceClientRect: props.clientRect as () => DOMRect,
            })
          },
          onKeyDown: (props) => {
            if (props.event.key === 'Escape') {
              popup[0].hide()
              return true
            }
            const ref = component.ref as { onKeyDown?: (props: { event: KeyboardEvent }) => boolean } | null
            return ref?.onKeyDown?.(props) || false
          },
          onExit: () => {
            popup[0].destroy()
            component.destroy()
          },
        }
      },
    } as Partial<SuggestionOptions>,
  })
}
