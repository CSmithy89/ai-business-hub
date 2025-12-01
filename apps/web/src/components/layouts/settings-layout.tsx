'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { User, Lock, Shield, Key, Bot, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Route } from 'next'

/**
 * Props for SettingsLayout component
 */
export interface SettingsLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
}

/**
 * Navigation item configuration
 */
interface NavItem {
  title: string
  href: Route
  icon: React.ComponentType<{ className?: string }>
}

/**
 * Settings navigation items
 */
const settingsNavItems: NavItem[] = [
  {
    title: 'Profile',
    href: '/settings' as Route,
    icon: User,
  },
  {
    title: 'Security',
    href: '/settings/security' as Route,
    icon: Lock,
  },
  {
    title: 'Sessions',
    href: '/settings/sessions' as Route,
    icon: Shield,
  },
  {
    title: 'API Keys',
    href: '/settings/api-keys' as Route,
    icon: Key,
  },
  {
    title: 'AI Configuration',
    href: '/settings/ai-config' as Route,
    icon: Bot,
  },
  {
    title: 'Appearance',
    href: '/settings/appearance' as Route,
    icon: Palette,
  },
]

/**
 * SettingsLayout Component
 *
 * Consistent layout for all /settings/* pages with sidebar navigation.
 *
 * **Features:**
 * - Sidebar navigation with icons and active state highlighting
 * - Main content area with title and description
 * - Responsive design (side-by-side on desktop, stacked on mobile)
 * - Active link highlighted in HYVVE brand color
 *
 * **Layout Structure:**
 * ```
 * ┌────────────────────────────────────────────────────────┐
 * │ Settings                                               │
 * ├────────────────┬───────────────────────────────────────┤
 * │                │                                       │
 * │ 👤 Profile     │  [Page Title]                        │
 * │                │  [Optional Description]               │
 * │ 🔐 Security    │                                       │
 * │                │  [Page Content from children]         │
 * │ 🔒 Sessions    │                                       │
 * │                │                                       │
 * │ 🔑 API Keys    │                                       │
 * │                │                                       │
 * │ 🤖 AI Config   │                                       │
 * │                │                                       │
 * │ 🎨 Appearance  │                                       │
 * │                │                                       │
 * └────────────────┴───────────────────────────────────────┘
 * ```
 *
 * @example
 * ```tsx
 * // In a settings page
 * export default function SessionsPage() {
 *   return (
 *     <SettingsLayout
 *       title="Active Sessions"
 *       description="Manage your active sessions across different devices"
 *     >
 *       <SessionList />
 *     </SettingsLayout>
 *   )
 * }
 * ```
 */
export function SettingsLayout({
  children,
  title,
  description,
}: SettingsLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Page Title */}
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Settings</h1>

      {/* Layout: Sidebar + Content */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-60 flex-shrink-0">
          <nav className="space-y-1">
            {settingsNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    isActive
                      ? 'bg-[#FF6B6B]/10 text-[#FF6B6B] border-l-4 border-[#FF6B6B]'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="space-y-6">
            {/* Section Header */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              {description && (
                <p className="text-gray-600 mt-1">{description}</p>
              )}
            </div>

            {/* Page Content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
