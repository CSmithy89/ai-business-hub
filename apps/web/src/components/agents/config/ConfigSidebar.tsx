'use client'

import { cn } from '@/lib/utils'
import {
  Settings,
  Brain,
  Activity,
  Database,
  Plug,
  Bell,
  Wrench,
  AlertTriangle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Section {
  id: string
  label: string
  icon: LucideIcon
  variant?: 'danger'
}

const sections: Section[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'ai-model', label: 'AI Model', icon: Brain },
  { id: 'behavior', label: 'Behavior', icon: Activity },
  { id: 'memory', label: 'Memory', icon: Database },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'advanced', label: 'Advanced', icon: Wrench },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, variant: 'danger' },
]

interface ConfigSidebarProps {
  activeSectionId?: string
}

/**
 * ConfigSidebar Component
 *
 * 8-section navigation sidebar for agent configuration page.
 * Sticky on desktop, can be adapted to dropdown on mobile.
 */
export function ConfigSidebar({ activeSectionId = 'general' }: ConfigSidebarProps) {
  const handleSectionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      // Calculate offset for sticky header
      const offset = 80 // Adjust based on header height
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  return (
    <aside className="w-64 shrink-0">
      <div className="sticky top-6 space-y-1">
        <nav className="space-y-1" role="navigation" aria-label="Configuration sections">
          {sections.map(section => {
            const Icon = section.icon
            const isActive = activeSectionId === section.id
            const isDanger = section.variant === 'danger'

            return (
              <button
                type="button"
                key={section.id}
                onClick={() => handleSectionClick(section.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-left',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                  isActive && !isDanger && 'bg-primary text-primary-foreground',
                  !isActive && !isDanger && 'hover:bg-muted text-foreground',
                  isDanger && !isActive && 'text-destructive hover:bg-destructive/10',
                  isDanger && isActive && 'bg-destructive/10 text-destructive'
                )}
                aria-current={isActive ? 'location' : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="font-medium">{section.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
