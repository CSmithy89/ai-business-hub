/**
 * Agent Avatar Component
 *
 * Displays an agent's avatar with their character color.
 * Used in approval cards, chat messages, and agent cards.
 *
 * Story 15-17: Approval Cards with Agent Avatar
 */

'use client';

import { cn } from '@/lib/utils';
import { getAgentConfig, getAgentColor, getAgentIcon } from '@/config/agent-colors';

interface AgentAvatarProps {
  /** Agent name (e.g., 'hub', 'maya', 'nova') */
  agentName: string;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Show ring border with agent color */
  showRing?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Size configurations
 */
const sizeConfig = {
  xs: {
    container: 'h-5 w-5',
    icon: 'text-xs',
    ring: 'ring-1 ring-offset-1',
  },
  sm: {
    container: 'h-7 w-7',
    icon: 'text-sm',
    ring: 'ring-2 ring-offset-1',
  },
  md: {
    container: 'h-9 w-9',
    icon: 'text-base',
    ring: 'ring-2 ring-offset-2',
  },
  lg: {
    container: 'h-12 w-12',
    icon: 'text-xl',
    ring: 'ring-2 ring-offset-2',
  },
};

/**
 * AgentAvatar Component
 *
 * Renders an agent's icon with their character color background
 */
export function AgentAvatar({
  agentName,
  size = 'sm',
  showRing = false,
  className,
}: AgentAvatarProps) {
  const config = getAgentConfig(agentName);
  const color = config?.color || getAgentColor(agentName);
  const icon = config?.icon || getAgentIcon(agentName);
  // Provide fallback to 'sm' size if an invalid size is passed
  const sizes = sizeConfig[size] ?? sizeConfig.sm;

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full shrink-0',
        sizes.container,
        showRing && sizes.ring,
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        ...(showRing ? { '--tw-ring-color': color } as React.CSSProperties : {}),
      }}
      title={config?.name || agentName}
    >
      <span className={cn(sizes.icon)} role="img" aria-label={config?.name || agentName}>
        {icon}
      </span>
    </div>
  );
}

/**
 * AgentBadge Component
 *
 * Combines agent avatar with name for inline display
 */
export function AgentBadge({
  agentName,
  size = 'sm',
  showRole = false,
  className,
}: AgentAvatarProps & { showRole?: boolean }) {
  const config = getAgentConfig(agentName);
  const displayName = config?.name || agentName;
  const color = config?.color || getAgentColor(agentName);

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <AgentAvatar agentName={agentName} size={size === 'lg' ? 'md' : 'xs'} />
      <span
        className={cn(
          'font-medium',
          size === 'xs' && 'text-xs',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base'
        )}
        style={{ color }}
      >
        {displayName}
      </span>
      {showRole && config?.role && (
        <span className="text-xs text-gray-500">({config.role})</span>
      )}
    </div>
  );
}
