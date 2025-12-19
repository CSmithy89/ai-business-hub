'use client'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { cn } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

interface MentionListProps {
  items: User[]
  command: (item: { id: string; label: string }) => void
}

export interface MentionListRef {
  onKeyDown: (args: { event: KeyboardEvent }) => boolean
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command({
        id: item.id,
        label: item.name,
      })
    }
  }

  const upHandler = () => {
    setSelectedIndex(
      (selectedIndex + props.items.length - 1) % props.items.length
    )
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        enterHandler()
        return true
      }

      return false
    },
  }))

  if (props.items.length === 0) {
    return (
      <div className="mention-list bg-popover border rounded-lg shadow-md p-2">
        <div className="px-3 py-2 text-sm text-muted-foreground">
          No users found
        </div>
      </div>
    )
  }

  return (
    <div className="mention-list bg-popover border rounded-lg shadow-md p-1 min-w-[280px] max-w-[320px] max-h-64 overflow-y-auto">
      {props.items.map((item, index) => (
        <button
          type="button"
          key={item.id}
          onClick={() => selectItem(index)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 text-left rounded-md transition-colors',
            'hover:bg-accent cursor-pointer',
            index === selectedIndex && 'bg-accent'
          )}
        >
          {item.avatarUrl ? (
            <img
              src={item.avatarUrl}
              alt={item.name}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
              {item.name[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {item.name}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {item.email}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
})

MentionList.displayName = 'MentionList'
