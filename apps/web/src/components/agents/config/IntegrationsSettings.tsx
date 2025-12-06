'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

/**
 * IntegrationsSettings Component
 *
 * Connected services and integrations for this agent.
 * Placeholder for future implementation.
 */
export function IntegrationsSettings() {
  return (
    <section id="integrations">
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Manage connected services and integrations for this agent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed border-muted-foreground/25 p-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                No integrations configured yet
              </p>
              <Button disabled variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Connect New Service
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Integration management coming in future release.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
