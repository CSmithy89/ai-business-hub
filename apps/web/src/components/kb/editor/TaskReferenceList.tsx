'use client'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface Task {
  id: string
  taskNumber: number
  title: string
  status: string
  priority: string
}

interface TaskReferenceListProps {
  items: Task[]
  command: (item: { id: string; label: string; taskNumber: number }) => void
}

export interface TaskReferenceListRef {
  onKeyDown: (args: { event: KeyboardEvent }) => boolean
}

const statusColors: Record<string, string> = {
  TODO: 'bg-slate-500',
  IN_PROGRESS: 'bg-blue-500',
  IN_REVIEW: 'bg-purple-500',
  DONE: 'bg-green-500',
  BLOCKED: 'bg-red-500',
}

const priorityColors: Record<string, string> = {
  LOW: 'text-slate-500',
  MEDIUM: 'text-blue-500',
  HIGH: 'text-orange-500',
  URGENT: 'text-red-500',
}

export const TaskReferenceList = forwardRef<
  TaskReferenceListRef,
  TaskReferenceListProps
>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command({
        id: item.id,
        label: `PM-${item.taskNumber}`,
        taskNumber: item.taskNumber,
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
      <div className="task-reference-list bg-popover border rounded-lg shadow-md p-2">
        <div className="px-3 py-2 text-sm text-muted-foreground">
          No tasks found
        </div>
      </div>
    )
  }

  return (
    <div className="task-reference-list bg-popover border rounded-lg shadow-md p-1 min-w-[320px] max-w-[400px] max-h-64 overflow-y-auto">
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
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm font-mono text-blue-600 dark:text-blue-400 shrink-0">
              #PM-{item.taskNumber}
            </span>
            <span className="text-sm text-foreground truncate flex-1">
              {item.title}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                statusColors[item.status] || 'bg-slate-500'
              )}
              title={item.status.replace('_', ' ')}
            />
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] px-1.5 py-0',
                priorityColors[item.priority]
              )}
            >
              {item.priority}
            </Badge>
          </div>
        </button>
      ))}
    </div>
  )
})

TaskReferenceList.displayName = 'TaskReferenceList'
