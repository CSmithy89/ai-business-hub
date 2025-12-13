'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface AnimatedCheckmarkProps {
  /** Whether to show the checkmark animation */
  show: boolean;
  /** Size of the checkmark in pixels (default: 64) */
  size?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Additional className */
  className?: string;
  /** Auto-hide after animation (default: false) */
  autoHide?: boolean;
  /** Duration before auto-hide in ms (default: 1500) */
  autoHideDuration?: number;
}

/**
 * Animated Checkmark Component
 *
 * Displays a circular progress animation that reveals a checkmark.
 * Used for form submissions, settings saved, and other success states.
 * Respects prefers-reduced-motion.
 *
 * @example
 * ```tsx
 * <AnimatedCheckmark
 *   show={saved}
 *   onComplete={() => setSaved(false)}
 *   autoHide
 * />
 * ```
 */
export function AnimatedCheckmark({
  show,
  size = 64,
  onComplete,
  className,
  autoHide = false,
  autoHideDuration = 1500,
}: AnimatedCheckmarkProps) {
  const [visible, setVisible] = useState(show);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Handle show/hide and callbacks
  useEffect(() => {
    if (!show) {
      setVisible(false);
      return;
    }

    setVisible(true);

    // Animation duration: circle (800ms) + checkmark (500ms) = 1300ms
    // Round to 1000ms for "1 second" feel
    const animationDuration = prefersReducedMotion ? 0 : 1000;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const completeTimer = setTimeout(() => {
      onComplete?.();

      if (autoHide) {
        hideTimer = setTimeout(() => {
          setVisible(false);
        }, autoHideDuration - animationDuration);
      }
    }, animationDuration);

    return () => {
      clearTimeout(completeTimer);
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
    };
  }, [show, onComplete, autoHide, autoHideDuration, prefersReducedMotion]);

  if (!visible) {
    return null;
  }

  // For reduced motion, show static checkmark
  if (prefersReducedMotion) {
    return (
      <div
        className={cn('flex items-center justify-center', className)}
        style={{ width: size, height: size }}
        role="img"
        aria-label="Success"
      >
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          className="text-green-500"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
          />
          <path
            d="M30 50 L45 65 L70 35"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Success"
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {/* Background circle (static) */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="6"
          className="dark:stroke-gray-700"
        />

        {/* Animated progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#2ECC71"
          strokeWidth="6"
          strokeLinecap="round"
          className="animate-circle-progress"
          style={{
            transformOrigin: 'center',
            transform: 'rotate(-90deg)',
          }}
        />

        {/* Animated checkmark */}
        <path
          d="M30 50 L45 65 L70 35"
          fill="none"
          stroke="#2ECC71"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-checkmark-draw"
          style={{
            animationDelay: '0.5s',
          }}
        />
      </svg>
    </div>
  );
}

/**
 * Inline checkmark for smaller contexts
 */
export function InlineCheckmark({
  show,
  className,
}: {
  show: boolean;
  className?: string;
}) {
  if (!show) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'h-5 w-5 rounded-full bg-green-500 text-white',
        'animate-in zoom-in-50 duration-200',
        'motion-reduce:animate-none',
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12l5 5L19 7" />
      </svg>
    </span>
  );
}
