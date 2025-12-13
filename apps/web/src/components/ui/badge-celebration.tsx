'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

export interface BadgeCelebrationProps {
  /** Whether the celebration modal is visible */
  show: boolean;
  /** Badge content */
  badge: {
    /** Icon to display (ReactNode for flexibility) */
    icon: React.ReactNode;
    /** Badge title */
    title: string;
    /** Badge description */
    description: string;
  };
  /** Callback when modal is closed */
  onClose: () => void;
  /** Custom dismiss button text (default: "Awesome!") */
  dismissText?: string;
}

/**
 * Badge Celebration Modal
 *
 * Displays an achievement/badge celebration with scale-in animation.
 * Uses Radix Dialog for accessibility (focus trap, keyboard dismiss).
 * Respects prefers-reduced-motion for accessibility.
 *
 * @example
 * ```tsx
 * <BadgeCelebration
 *   show={showBadge}
 *   badge={{
 *     icon: <Trophy className="h-12 w-12 text-yellow-500" />,
 *     title: "First Approval!",
 *     description: "You've completed your first approval."
 *   }}
 *   onClose={() => setShowBadge(false)}
 * />
 * ```
 */
export function BadgeCelebration({
  show,
  badge,
  onClose,
  dismissText = 'Awesome!',
}: BadgeCelebrationProps) {
  return (
    <Dialog.Root open={show} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl',
            'dark:bg-gray-900',
            // Animation classes
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            'duration-200',
            // Reduced motion
            'motion-reduce:animate-none'
          )}
        >
          <div className="flex flex-col items-center text-center">
            {/* Icon with celebration glow effect */}
            <div
              className={cn(
                'mb-6 flex h-24 w-24 items-center justify-center rounded-full',
                'bg-gradient-to-br from-coral-100 to-coral-50',
                'dark:from-coral-900/30 dark:to-coral-800/20',
                'animate-badge-glow motion-reduce:animate-none'
              )}
            >
              {badge.icon}
            </div>

            {/* Title */}
            <Dialog.Title className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              {badge.title}
            </Dialog.Title>

            {/* Description */}
            <Dialog.Description className="mb-8 text-gray-600 dark:text-gray-400">
              {badge.description}
            </Dialog.Description>

            {/* Dismiss button */}
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'w-full rounded-xl px-6 py-3 font-semibold',
                'bg-gradient-to-r from-coral-500 to-coral-600',
                'text-white shadow-lg shadow-coral-500/25',
                'transition-all duration-150',
                'hover:from-coral-600 hover:to-coral-700 hover:shadow-xl',
                'active:scale-[0.98]',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-coral-500 focus-visible:ring-offset-2',
                'motion-reduce:transition-none'
              )}
            >
              {dismissText}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Add custom keyframes to globals.css for badge glow animation
// @keyframes badge-glow {
//   0%, 100% { box-shadow: 0 0 20px rgba(255, 107, 107, 0.3); }
//   50% { box-shadow: 0 0 40px rgba(255, 107, 107, 0.5); }
// }
