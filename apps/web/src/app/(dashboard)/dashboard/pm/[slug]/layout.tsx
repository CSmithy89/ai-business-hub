/**
 * PM Project Layout
 *
 * Story: PM-02.3 - Quick Task Capture
 */

import type { ReactNode } from 'react'
import { ProjectShell } from './project-shell'

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return <ProjectShell>{children}</ProjectShell>
}

