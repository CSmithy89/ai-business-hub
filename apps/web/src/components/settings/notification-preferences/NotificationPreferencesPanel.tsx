'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Save, RotateCcw } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { QuietHoursTimePicker } from './QuietHoursTimePicker'
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useResetNotificationPreferences,
} from '@/hooks/use-notification-preferences'
import { DigestFrequency } from '@hyvve/shared'

export function NotificationPreferencesPanel() {
  const { data: preferences, isPending, isError } = useNotificationPreferences()
  const updateMutation = useUpdateNotificationPreferences()
  const resetMutation = useResetNotificationPreferences()

  // Form state
  const [formData, setFormData] = useState({
    // Task notifications
    emailTaskAssigned: true,
    inAppTaskAssigned: true,
    emailTaskMentioned: true,
    inAppTaskMentioned: true,
    emailDueDateReminder: true,
    inAppDueDateReminder: true,

    // Agent notifications
    emailAgentCompletion: true,
    inAppAgentCompletion: true,
    emailHealthAlert: true,
    inAppHealthAlert: true,

    // Quiet hours
    quietHoursStart: null as string | null,
    quietHoursEnd: null as string | null,
    quietHoursTimezone: 'UTC',

    // Digest
    digestEnabled: false,
    digestFrequency: 'daily' as DigestFrequency,
  })

  const [hasChanges, setHasChanges] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)

  // Initialize form from fetched preferences
  useEffect(() => {
    if (preferences) {
      setFormData({
        emailTaskAssigned: preferences.emailTaskAssigned,
        inAppTaskAssigned: preferences.inAppTaskAssigned,
        emailTaskMentioned: preferences.emailTaskMentioned,
        inAppTaskMentioned: preferences.inAppTaskMentioned,
        emailDueDateReminder: preferences.emailDueDateReminder,
        inAppDueDateReminder: preferences.inAppDueDateReminder,
        emailAgentCompletion: preferences.emailAgentCompletion,
        inAppAgentCompletion: preferences.inAppAgentCompletion,
        emailHealthAlert: preferences.emailHealthAlert,
        inAppHealthAlert: preferences.inAppHealthAlert,
        quietHoursStart: preferences.quietHoursStart,
        quietHoursEnd: preferences.quietHoursEnd,
        quietHoursTimezone: preferences.quietHoursTimezone,
        digestEnabled: preferences.digestEnabled,
        digestFrequency: preferences.digestFrequency as DigestFrequency,
      })
    }
  }, [preferences])

  // Track changes
  useEffect(() => {
    if (preferences) {
      const changed =
        formData.emailTaskAssigned !== preferences.emailTaskAssigned ||
        formData.inAppTaskAssigned !== preferences.inAppTaskAssigned ||
        formData.emailTaskMentioned !== preferences.emailTaskMentioned ||
        formData.inAppTaskMentioned !== preferences.inAppTaskMentioned ||
        formData.emailDueDateReminder !== preferences.emailDueDateReminder ||
        formData.inAppDueDateReminder !== preferences.inAppDueDateReminder ||
        formData.emailAgentCompletion !== preferences.emailAgentCompletion ||
        formData.inAppAgentCompletion !== preferences.inAppAgentCompletion ||
        formData.emailHealthAlert !== preferences.emailHealthAlert ||
        formData.inAppHealthAlert !== preferences.inAppHealthAlert ||
        formData.quietHoursStart !== preferences.quietHoursStart ||
        formData.quietHoursEnd !== preferences.quietHoursEnd ||
        formData.quietHoursTimezone !== preferences.quietHoursTimezone ||
        formData.digestEnabled !== preferences.digestEnabled ||
        formData.digestFrequency !== preferences.digestFrequency

      setHasChanges(changed)
    }
  }, [formData, preferences])

  const handleSave = () => {
    updateMutation.mutate(formData)
  }

  const handleReset = () => {
    if (preferences) {
      setFormData({
        emailTaskAssigned: preferences.emailTaskAssigned,
        inAppTaskAssigned: preferences.inAppTaskAssigned,
        emailTaskMentioned: preferences.emailTaskMentioned,
        inAppTaskMentioned: preferences.inAppTaskMentioned,
        emailDueDateReminder: preferences.emailDueDateReminder,
        inAppDueDateReminder: preferences.inAppDueDateReminder,
        emailAgentCompletion: preferences.emailAgentCompletion,
        inAppAgentCompletion: preferences.inAppAgentCompletion,
        emailHealthAlert: preferences.emailHealthAlert,
        inAppHealthAlert: preferences.inAppHealthAlert,
        quietHoursStart: preferences.quietHoursStart,
        quietHoursEnd: preferences.quietHoursEnd,
        quietHoursTimezone: preferences.quietHoursTimezone,
        digestEnabled: preferences.digestEnabled,
        digestFrequency: preferences.digestFrequency as DigestFrequency,
      })
    }
  }

  const handleResetToDefaults = () => {
    setShowResetDialog(false)
    resetMutation.mutate()
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Failed to load notification preferences. Please try again later.
        </p>
      </div>
    )
  }

  const isSaving = updateMutation.isPending || resetMutation.isPending

  return (
    <div className="space-y-6">
      {/* Task Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Task Notifications</CardTitle>
          <CardDescription>
            Choose how you want to be notified about task updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Task Assigned */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <Label htmlFor="task-assigned" className="text-base">
                Task Assigned
              </Label>
              <p className="text-sm text-muted-foreground">
                When you're assigned to a task
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="email-task-assigned" className="text-sm font-normal">
                  Email
                </Label>
                <Switch
                  id="email-task-assigned"
                  checked={formData.emailTaskAssigned}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, emailTaskAssigned: checked })
                  }
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="inapp-task-assigned" className="text-sm font-normal">
                  In-App
                </Label>
                <Switch
                  id="inapp-task-assigned"
                  checked={formData.inAppTaskAssigned}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, inAppTaskAssigned: checked })
                  }
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          <div className="border-t" />

          {/* Mentioned in Comments */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <Label htmlFor="task-mentioned" className="text-base">
                Mentioned in Comments
              </Label>
              <p className="text-sm text-muted-foreground">
                When someone mentions you in a task comment
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="email-task-mentioned" className="text-sm font-normal">
                  Email
                </Label>
                <Switch
                  id="email-task-mentioned"
                  checked={formData.emailTaskMentioned}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, emailTaskMentioned: checked })
                  }
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="inapp-task-mentioned" className="text-sm font-normal">
                  In-App
                </Label>
                <Switch
                  id="inapp-task-mentioned"
                  checked={formData.inAppTaskMentioned}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, inAppTaskMentioned: checked })
                  }
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          <div className="border-t" />

          {/* Due Date Reminders */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <Label htmlFor="due-date-reminder" className="text-base">
                Due Date Reminders
              </Label>
              <p className="text-sm text-muted-foreground">
                Reminders when tasks are approaching their due date
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="email-due-date" className="text-sm font-normal">
                  Email
                </Label>
                <Switch
                  id="email-due-date"
                  checked={formData.emailDueDateReminder}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, emailDueDateReminder: checked })
                  }
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="inapp-due-date" className="text-sm font-normal">
                  In-App
                </Label>
                <Switch
                  id="inapp-due-date"
                  checked={formData.inAppDueDateReminder}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, inAppDueDateReminder: checked })
                  }
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Notifications</CardTitle>
          <CardDescription>
            Notifications about AI agent activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Agent Task Completed */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <Label htmlFor="agent-completion" className="text-base">
                Task Completed by Agent
              </Label>
              <p className="text-sm text-muted-foreground">
                When an AI agent completes a task
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="email-agent-completion" className="text-sm font-normal">
                  Email
                </Label>
                <Switch
                  id="email-agent-completion"
                  checked={formData.emailAgentCompletion}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, emailAgentCompletion: checked })
                  }
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="inapp-agent-completion" className="text-sm font-normal">
                  In-App
                </Label>
                <Switch
                  id="inapp-agent-completion"
                  checked={formData.inAppAgentCompletion}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, inAppAgentCompletion: checked })
                  }
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          <div className="border-t" />

          {/* Project Health Alerts */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <Label htmlFor="health-alert" className="text-base">
                Project Health Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                When project health status changes
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="email-health-alert" className="text-sm font-normal">
                  Email
                </Label>
                <Switch
                  id="email-health-alert"
                  checked={formData.emailHealthAlert}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, emailHealthAlert: checked })
                  }
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="inapp-health-alert" className="text-sm font-normal">
                  In-App
                </Label>
                <Switch
                  id="inapp-health-alert"
                  checked={formData.inAppHealthAlert}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, inAppHealthAlert: checked })
                  }
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
          <CardDescription>
            Set times when notifications should be suppressed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuietHoursTimePicker
            startTime={formData.quietHoursStart}
            endTime={formData.quietHoursEnd}
            timezone={formData.quietHoursTimezone}
            onStartTimeChange={(time) => setFormData({ ...formData, quietHoursStart: time })}
            onEndTimeChange={(time) => setFormData({ ...formData, quietHoursEnd: time })}
            onTimezoneChange={(tz) => setFormData({ ...formData, quietHoursTimezone: tz })}
            disabled={isSaving}
          />
        </CardContent>
      </Card>

      {/* Email Digest */}
      <Card>
        <CardHeader>
          <CardTitle>Email Digest</CardTitle>
          <CardDescription>
            Receive a summary of notifications via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="digest-enabled" className="text-base">
                Enable Email Digest
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive batched notifications in a digest email
              </p>
            </div>
            <Switch
              id="digest-enabled"
              checked={formData.digestEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, digestEnabled: checked })}
              disabled={isSaving}
            />
          </div>

          {formData.digestEnabled && (
            <>
              <div className="border-t" />
              <div className="space-y-2">
                <Label htmlFor="digest-frequency">Frequency</Label>
                <Select
                  value={formData.digestFrequency}
                  onValueChange={(value: DigestFrequency) =>
                    setFormData({ ...formData, digestFrequency: value })
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger id="digest-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowResetDialog(true)}
          disabled={isSaving}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>

        {hasChanges && (
          <Button type="button" variant="outline" onClick={handleReset} disabled={isSaving}>
            Cancel
          </Button>
        )}

        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all notification preferences to their default values. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetToDefaults}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
