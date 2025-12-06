'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * NotificationsSettings Component
 *
 * Notification preferences for this agent.
 * Placeholder for future implementation.
 */
export function NotificationsSettings() {
  return (
    <section id="notifications">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure notification preferences for this agent&apos;s activities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-muted-foreground/25 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Notification settings coming in future release
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
