/**
 * StartBusinessCard Component
 *
 * CTA card prompting users to start a new business.
 * Visual design differentiates from business cards with dashed border.
 *
 * Story: 08.2 - Implement Portfolio Dashboard with Business Cards
 */

'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'

export function StartBusinessCard() {
  const router = useRouter()

  const handleClick = () => {
    // Route created in Story 08.3
    router.push('/onboarding/wizard' as Parameters<typeof router.push>[0])
  }

  return (
    <Card className="cursor-pointer border-2 border-dashed card-hover-lift hover:border-primary">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 rounded-full bg-primary/10 p-4">
          <PlusCircle className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mb-2 text-xl font-semibold">Start a New Business</h3>
        <p className="mb-4 max-w-sm text-center text-sm text-muted-foreground">
          AI will guide you through validation, planning, and branding
        </p>
        <Button onClick={handleClick}>Get Started</Button>
      </CardContent>
    </Card>
  )
}
