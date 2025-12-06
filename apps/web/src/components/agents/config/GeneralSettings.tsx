'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface GeneralSettingsProps {
  formData: Record<string, unknown>
  onChange: (field: string, value: unknown) => void
}

/**
 * GeneralSettings Component
 *
 * General agent settings including display name, description, avatar, and theme.
 */
export function GeneralSettings(_props: GeneralSettingsProps) {
  return (
    <section id="general">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Basic information and appearance settings for this agent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="Enter agent name"
              maxLength={50}
              disabled
              value="Agent Name"
            />
            <p className="text-xs text-muted-foreground">
              Note: Agent names are fixed character identities. Display customization coming soon.
            </p>
          </div>

          {/* Role Description */}
          <div className="space-y-2">
            <Label htmlFor="roleDescription">Role Description</Label>
            <Textarea
              id="roleDescription"
              placeholder="Describe this agent's role and responsibilities..."
              maxLength={200}
              rows={3}
              disabled
            />
            <p className="text-xs text-muted-foreground">Role customization coming soon.</p>
          </div>

          {/* Avatar and Theme */}
          <div className="space-y-2">
            <Label>Avatar & Theme</Label>
            <div className="rounded-lg border border-dashed border-muted-foreground/25 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Avatar and theme customization coming soon
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
