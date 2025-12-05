/**
 * Onboarding Layout
 *
 * Simple centered layout for onboarding wizard pages.
 * Removes dashboard sidebar/header for focused onboarding experience.
 *
 * Story: 08.3 - Implement Onboarding Wizard UI
 */

import { Building2 } from 'lucide-react'
import Link from 'next/link'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple header with logo */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold">
            <Building2 className="h-6 w-6 text-primary" />
            <span>HYVVE</span>
          </Link>

          {/* Exit to dashboard */}
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Exit to Dashboard
          </Link>
        </div>
      </header>

      {/* Centered container for wizard */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {children}
      </main>
    </div>
  )
}
