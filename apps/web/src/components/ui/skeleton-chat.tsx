/**
 * Skeleton Chat Components
 *
 * Provides skeleton loading placeholders for chat messages.
 * Matches chat message layouts for both user and AI messages.
 *
 * Epic: 16 - Premium Polish & Advanced Features
 * Story: 16-5 - Implement Skeleton Loading Screens
 */

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SkeletonChatMessageProps {
  /** Optional className */
  className?: string
}

interface SkeletonChatProps {
  /** Number of messages to display */
  messages?: number
  /** Optional className */
  className?: string
}

/**
 * User message skeleton
 * Right-aligned with avatar
 */
export function SkeletonChatMessageUser({ className }: SkeletonChatMessageProps) {
  return (
    <div className={cn('flex items-start justify-end gap-3', className)}>
      <div className="max-w-[70%] space-y-2">
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
      <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
    </div>
  )
}

/**
 * AI/Agent message skeleton
 * Left-aligned with avatar
 */
export function SkeletonChatMessageAI({ className }: SkeletonChatMessageProps) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
      <div className="max-w-[70%] space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  )
}

/**
 * System message skeleton
 * Centered, smaller
 */
export function SkeletonChatMessageSystem({ className }: SkeletonChatMessageProps) {
  return (
    <div className={cn('flex justify-center', className)}>
      <Skeleton className="h-3 w-48" />
    </div>
  )
}

/**
 * Chat message with typing indicator
 * Shows animated dots
 */
export function SkeletonChatMessageTyping({ className }: SkeletonChatMessageProps) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
      <div className="flex items-center gap-1 rounded-lg bg-muted p-3">
        <Skeleton className="h-2 w-2 animate-pulse rounded-full" />
        <Skeleton className="h-2 w-2 animate-pulse rounded-full [animation-delay:0.2s]" />
        <Skeleton className="h-2 w-2 animate-pulse rounded-full [animation-delay:0.4s]" />
      </div>
    </div>
  )
}

/**
 * Full chat conversation skeleton
 * Alternating user and AI messages
 */
export function SkeletonChat({ messages = 4, className }: SkeletonChatProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: messages }).map((_, i) => (
        i % 2 === 0 ? (
          <SkeletonChatMessageAI key={i} />
        ) : (
          <SkeletonChatMessageUser key={i} />
        )
      ))}
    </div>
  )
}

/**
 * Chat input area skeleton
 */
export function SkeletonChatInput({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-end gap-2', className)}>
      <Skeleton className="h-20 flex-1" />
      <Skeleton className="h-10 w-10" />
    </div>
  )
}

/**
 * Chat header skeleton
 */
export function SkeletonChatHeader({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-between border-b p-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-8 w-8" />
    </div>
  )
}

/**
 * Full chat interface skeleton
 * Header, messages, and input
 */
export function SkeletonChatInterface({ messages = 4, className }: SkeletonChatProps) {
  return (
    <div className={cn('flex h-full flex-col', className)}>
      <SkeletonChatHeader />
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <SkeletonChat messages={messages} />
      </div>
      <div className="border-t p-4">
        <SkeletonChatInput />
      </div>
    </div>
  )
}
