'use client'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { Agent, AgentStatus } from '@hyvve/shared'
import { cn } from '@/lib/utils'
import { getAgentColor } from '@/config/agent-colors'

interface AgentAvatarProps {
  agent: Agent
  size?: 'sm' | 'md' | 'lg'
  showStatus?: boolean
  /** Show colored ring around avatar based on agent character color */
  showColorRing?: boolean
  className?: string
}

/**
 * AgentAvatar Component
 *
 * Displays agent avatar with optional status indicator.
 * Supports emoji avatars or image URLs with fallback to initials.
 *
 * @param agent - Agent data object
 * @param size - Avatar size (sm: 32px, md: 48px, lg: 64px)
 * @param showStatus - Show status indicator dot
 */
export function AgentAvatar({
  agent,
  size = 'md',
  showStatus = false,
  showColorRing = false,
  className,
}: AgentAvatarProps) {
  // Get agent character color
  const agentColor = getAgentColor(agent.name)

  // Size classes
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  }

  // Ring size classes
  const ringClasses = {
    sm: 'ring-2 ring-offset-1',
    md: 'ring-2 ring-offset-2',
    lg: 'ring-[3px] ring-offset-2',
  }

  // Status dot size classes
  const statusDotSize = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  }

  // Status color classes
  const statusColors: Record<AgentStatus, string> = {
    online: 'bg-green-500',
    busy: 'bg-yellow-500',
    offline: 'bg-gray-500',
    error: 'bg-red-500',
  }

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Check if avatar is emoji (single character, non-ASCII)
  const isEmoji = (str: string) => {
    return /^\p{Emoji}$/u.test(str)
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar
        className={cn(
          sizeClasses[size],
          showColorRing && ringClasses[size]
        )}
        style={showColorRing ? { '--tw-ring-color': agentColor } as React.CSSProperties : undefined}
      >
        {isEmoji(agent.avatar) ? (
          <div className="flex h-full w-full items-center justify-center text-2xl">
            {agent.avatar}
          </div>
        ) : (
          <>
            <AvatarImage src={agent.avatar} alt={agent.name} />
            <AvatarFallback>{getInitials(agent.name)}</AvatarFallback>
          </>
        )}
      </Avatar>

      {/* Status Indicator */}
      {showStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-800',
            statusDotSize[size],
            statusColors[agent.status],
            agent.status === 'online' && 'status-dot-online'
          )}
          data-testid="status-indicator"
          aria-label={`Status: ${agent.status}`}
        />
      )}
    </div>
  )
}
