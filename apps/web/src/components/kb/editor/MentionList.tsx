'use client'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { cn } from '@/lib/utils'

interface WorkspaceMember {
  id: string
  userId: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

interface MentionListProps {
  items: WorkspaceMember[]
  command: (item: { id: string; label: string }) => void
}

export const MentionList = forwardRef<
  { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
  MentionListProps
>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0)
  }, [items])

  const selectItem = (index: number) => {
    const item = items[index]
    if (item) {
      command({ id: item.userId, label: item.user.name || item.user.email })
    }
  }

  const onKeyDown = ({ event }: { event: KeyboardEvent }) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
      return true
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % items.length)
      return true
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      selectItem(selectedIndex)
      return true
    }
    return false
  }

  useImperativeHandle(ref, () => ({ onKeyDown }))

  if (items.length === 0) {
    return (
      <div className="mention-list">
        <div className="px-3 py-2 text-sm text-muted-foreground">No members found</div>
      </div>
    )
  }

  return (
    <div className="mention-list">
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className={cn('mention-item', index === selectedIndex && 'selected')}
          onClick={() => selectItem(index)}
        >
          {item.user.image ? (
            <img src={item.user.image} alt={item.user.name || item.user.email} className="h-6 w-6 rounded-full" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {(item.user.name || item.user.email).charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col items-start overflow-hidden">
            <div className="name truncate">{item.user.name || item.user.email}</div>
            {item.user.name && <div className="email truncate">{item.user.email}</div>}
          </div>
        </button>
      ))}
    </div>
  )
})

MentionList.displayName = 'MentionList'
