'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * MemorySettings Component
 *
 * Memory and context retention settings.
 * Placeholder for future implementation.
 */
export function MemorySettings() {
  return (
    <section id="memory">
      <Card>
        <CardHeader>
          <CardTitle>Memory Settings</CardTitle>
          <CardDescription>
            Configure context retention and memory for this agent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-muted-foreground/25 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Memory settings coming in future release
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
