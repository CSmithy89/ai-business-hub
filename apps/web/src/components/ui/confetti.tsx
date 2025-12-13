'use client';

import { useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';

/**
 * Brand colors for celebration confetti
 */
const CELEBRATION_COLORS = [
  '#FF6B6B', // coral (primary)
  '#4B7BEC', // blue
  '#20B2AA', // teal
  '#FF9F43', // orange
  '#2ECC71', // green
];

export interface ConfettiProps {
  /** Whether to trigger the confetti animation */
  trigger: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Custom colors (defaults to brand colors) */
  colors?: string[];
  /** Duration in milliseconds (default: 2500ms) */
  duration?: number;
}

/**
 * Confetti celebration component
 *
 * Triggers a dual-origin confetti burst from both sides of the screen.
 * Respects prefers-reduced-motion for accessibility.
 *
 * @example
 * ```tsx
 * <Confetti trigger={showCelebration} onComplete={() => setShowCelebration(false)} />
 * ```
 */
export function Confetti({
  trigger,
  onComplete,
  colors = CELEBRATION_COLORS,
  duration = 2500,
}: ConfettiProps) {
  const hasTriggered = useRef(false);

  const fireConfetti = useCallback(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      // Skip animation for users who prefer reduced motion
      onComplete?.();
      return;
    }

    // Fire confetti from left side
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0, y: 0.6 },
      colors,
      disableForReducedMotion: true,
    });

    // Fire confetti from right side
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 1, y: 0.6 },
      colors,
      disableForReducedMotion: true,
    });

    // Call onComplete after animation duration
    if (onComplete) {
      setTimeout(onComplete, duration);
    }
  }, [colors, duration, onComplete]);

  useEffect(() => {
    if (trigger && !hasTriggered.current) {
      hasTriggered.current = true;
      fireConfetti();
    }

    // Reset trigger tracking when trigger becomes false
    if (!trigger) {
      hasTriggered.current = false;
    }
  }, [trigger, fireConfetti]);

  // This component doesn't render anything visible
  // canvas-confetti creates its own canvas overlay
  return null;
}

/**
 * Imperative confetti trigger function
 *
 * Use this for one-off celebrations without needing state management.
 * Respects prefers-reduced-motion.
 *
 * @example
 * ```tsx
 * onClick={() => triggerConfetti()}
 * ```
 */
export function triggerConfetti(options?: {
  colors?: string[];
  onComplete?: () => void;
}) {
  const { colors = CELEBRATION_COLORS, onComplete } = options || {};

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) {
    onComplete?.();
    return;
  }

  // Fire from both sides
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0, y: 0.6 },
    colors,
    disableForReducedMotion: true,
  });

  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 1, y: 0.6 },
    colors,
    disableForReducedMotion: true,
  });

  if (onComplete) {
    setTimeout(onComplete, 2500);
  }
}

export { CELEBRATION_COLORS };
