'use client';

import * as React from 'react';
import {
  Bot,
  Brain,
  Compass,
  Lightbulb,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/** Available AI character types */
export type CelebrationCharacter = 'Hub' | 'Maya' | 'Atlas' | 'Nova' | 'Echo';

/** Character icon mapping using Lucide icons */
const CHARACTER_ICONS: Record<CelebrationCharacter, LucideIcon> = {
  Hub: Bot,
  Maya: Lightbulb,
  Atlas: Compass,
  Nova: Sparkles,
  Echo: Brain,
};

/** Character display names */
const CHARACTER_NAMES: Record<CelebrationCharacter, string> = {
  Hub: 'Hub',
  Maya: 'Maya',
  Atlas: 'Atlas',
  Nova: 'Nova',
  Echo: 'Echo',
};

/** Character color classes */
const CHARACTER_COLORS: Record<CelebrationCharacter, string> = {
  Hub: 'text-coral-500',
  Maya: 'text-yellow-500',
  Atlas: 'text-blue-500',
  Nova: 'text-purple-500',
  Echo: 'text-teal-500',
};

export interface CelebrationMessageProps {
  /** Which AI character is celebrating */
  character?: CelebrationCharacter;
  /** Celebration message to display */
  message: string;
  /** Optional additional content below the message */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Whether to show the celebration (controls animation) */
  show?: boolean;
}

/**
 * Character Celebration Message
 *
 * Displays an inline celebration message from an AI character.
 * Used for empty states, completion messages, etc.
 * Features subtle fade-in and bounce animation.
 *
 * @example
 * ```tsx
 * <CelebrationMessage
 *   character="Hub"
 *   message="Great job! All approvals are complete."
 *   show={approvals.length === 0}
 * />
 * ```
 */
export function CelebrationMessage({
  character = 'Hub',
  message,
  children,
  className,
  show = true,
}: CelebrationMessageProps) {
  const Icon = CHARACTER_ICONS[character];
  const name = CHARACTER_NAMES[character];
  const colorClass = CHARACTER_COLORS[character];

  if (!show) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        'animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
        'motion-reduce:animate-none',
        className
      )}
    >
      {/* Character icon with bounce */}
      <div
        className={cn(
          'mb-4 flex h-16 w-16 items-center justify-center rounded-full',
          'bg-gray-100 dark:bg-gray-800',
          'animate-celebration-bounce motion-reduce:animate-none'
        )}
      >
        <Icon className={cn('h-8 w-8', colorClass)} />
      </div>

      {/* Character name */}
      <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
        {name} says
      </p>

      {/* Message */}
      <p className="text-lg font-medium text-gray-900 dark:text-white">
        {message}
      </p>

      {/* Optional children */}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

/**
 * Quick celebration messages for common scenarios
 */
export const CELEBRATION_MESSAGES = {
  approvalsEmpty: {
    character: 'Hub' as CelebrationCharacter,
    message: "You're all caught up! No pending approvals.",
  },
  notificationsRead: {
    character: 'Nova' as CelebrationCharacter,
    message: 'All notifications read. Nice work!',
  },
  firstApproval: {
    character: 'Maya' as CelebrationCharacter,
    message: 'Your first approval is complete!',
  },
  taskComplete: {
    character: 'Atlas' as CelebrationCharacter,
    message: 'Task completed successfully!',
  },
  onboardingComplete: {
    character: 'Hub' as CelebrationCharacter,
    message: 'Welcome aboard! Your setup is complete.',
  },
};
