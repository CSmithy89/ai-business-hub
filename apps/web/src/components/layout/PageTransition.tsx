'use client'

/**
 * PageTransition Component
 *
 * Wrapper component that applies enter animations to page content.
 * Uses CSS animations for performance (GPU-accelerated transforms).
 *
 * Features:
 * - Fade in + slide up animation on mount
 * - Respects prefers-reduced-motion
 * - No exit animation (instant) for snappy navigation
 *
 * Story 16-10: Implement Page Transition Animations
 */

import { ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

/**
 * PageTransition wraps page content with enter animation.
 *
 * Uses CSS classes defined in globals.css:
 * - .page-enter: Fade in + slide up animation
 *
 * @example
 * // In template.tsx:
 * export default function Template({ children }) {
 *   return <PageTransition>{children}</PageTransition>
 * }
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  // Track if this is initial mount (skip animation on SSR)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Set mounted after hydration to enable animation
    setMounted(true)
  }, [])

  return (
    <div
      className={cn(
        // Only apply animation after initial mount
        mounted && 'page-enter',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * PageTransitionFade - Fade-only variant (no slide)
 *
 * Use this for modals or overlays where slide would look off.
 */
export function PageTransitionFade({ children, className }: PageTransitionProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div
      className={cn(
        mounted && 'page-enter-fade',
        className
      )}
    >
      {children}
    </div>
  )
}
