/**
 * EmptyBusinessState Component
 *
 * Empty state displayed when user has no businesses.
 * Encourages user to start their first business.
 *
 * Story: 08.2 - Implement Portfolio Dashboard with Business Cards
 */

'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Building2, PlusCircle } from 'lucide-react'

export function EmptyBusinessState() {
  const router = useRouter()

  const handleClick = () => {
    // Route created in Story 08.3
    router.push('/onboarding/wizard' as Parameters<typeof router.push>[0])
  }

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-6 rounded-full bg-muted p-6">
        <Building2 className="h-12 w-12 text-muted-foreground" />
      </div>

      <h2 className="mb-2 text-2xl font-bold">No businesses yet</h2>
      <p className="mb-8 max-w-md text-center text-muted-foreground">
        Start your first business and let AI guide you through validation,
        planning, and branding in minutes.
      </p>

      <Button size="lg" onClick={handleClick}>
        <PlusCircle className="mr-2 h-5 w-5" />
        Start Your First Business
      </Button>
    </div>
  )
}
