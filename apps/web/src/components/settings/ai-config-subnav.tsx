'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Route } from 'next'
import { cn } from '@/lib/utils'

const ITEMS: Array<{ label: string; href: Route }> = [
  { label: 'Agent Preferences', href: '/settings/ai-config/agent-preferences' as Route },
  { label: 'Routing & Fallbacks', href: '/settings/ai-config/routing' as Route },
  { label: 'Token Usage', href: '/settings/ai-config/usage' as Route },
]

export function AIConfigSubnav() {
  const pathname = usePathname()

  return (
    <div className="flex flex-wrap gap-2 rounded-[16px] border border-[rgb(var(--color-border-subtle))] bg-card p-2">
      {ITEMS.map((item) => {
        const normalizedPath =
          (pathname ?? '').split(/[?#]/)[0].replace(/\/+$/, '')
        const normalizedHref =
          String(item.href).split(/[?#]/)[0].replace(/\/+$/, '')
        const isActive = normalizedPath === normalizedHref
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-[10px] px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-[rgb(var(--color-bg-soft))] hover:text-foreground'
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
