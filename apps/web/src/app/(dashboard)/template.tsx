/**
 * Dashboard Template
 *
 * Template files in Next.js App Router re-render on every route change,
 * making them perfect for page transition animations.
 *
 * Unlike layout.tsx (which persists across navigations), template.tsx
 * creates a new instance for each route, triggering the enter animation.
 *
 * Story 16-10: Implement Page Transition Animations
 */

import { ReactNode } from 'react'
import { PageTransition } from '@/components/layout/PageTransition'

interface TemplateProps {
  children: ReactNode
}

export default function Template({ children }: TemplateProps) {
  return <PageTransition>{children}</PageTransition>
}
