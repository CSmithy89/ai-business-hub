'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useWebhooks } from '@/hooks/use-webhooks'
import { toast } from 'sonner'

const AVAILABLE_EVENTS = [
  { id: 'task.created', label: 'Task Created', description: 'When a new task is created' },
  { id: 'task.updated', label: 'Task Updated', description: 'When a task is updated' },
  { id: 'task.deleted', label: 'Task Deleted', description: 'When a task is deleted' },
  { id: 'project.created', label: 'Project Created', description: 'When a new project is created' },
  { id: 'project.updated', label: 'Project Updated', description: 'When a project is updated' },
  { id: 'project.deleted', label: 'Project Deleted', description: 'When a project is deleted' },
  { id: 'phase.created', label: 'Phase Created', description: 'When a new phase is created' },
  { id: 'phase.updated', label: 'Phase Updated', description: 'When a phase is updated' },
  { id: 'phase.completed', label: 'Phase Completed', description: 'When a phase is completed' },
]

interface CreateWebhookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateWebhookDialog({ open, onOpenChange }: CreateWebhookDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const { createWebhook, isCreating } = useWebhooks()

  const handleEventToggle = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    )
  }

  const handleGenerateSecret = () => {
    const randomBytes = new Uint8Array(32)
    crypto.getRandomValues(randomBytes)
    const secret = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    setSecret(secret)
  }

  const handleSubmit = async () => {
    if (!name || !url || !secret || selectedEvents.length === 0) {
      toast.error('Please fill in all required fields and select at least one event')
      return
    }

    try {
      await createWebhook({
        name,
        description: description || undefined,
        url,
        secret,
        events: selectedEvents,
      })

      // Reset form
      setName('')
      setDescription('')
      setUrl('')
      setSecret('')
      setSelectedEvents([])
      onOpenChange(false)

      toast.success('Webhook created successfully')
    } catch (error) {
      toast.error('Failed to create webhook')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Webhook</DialogTitle>
          <DialogDescription>
            Configure a webhook to receive real-time updates when events occur in your workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Production webhook"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Webhook for production integrations"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Endpoint URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://api.example.com/webhooks"
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The URL that will receive webhook POST requests
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="secret">Signing Secret *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateSecret}
              >
                Generate Secret
              </Button>
            </div>
            <Input
              id="secret"
              type="password"
              placeholder="Your webhook signing secret"
              value={secret}
              onChange={e => setSecret(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Used to generate HMAC-SHA256 signatures in the X-Webhook-Signature header
            </p>
          </div>

          <div className="space-y-2">
            <Label>Subscribed Events *</Label>
            <div className="border rounded-md p-4 space-y-3 max-h-64 overflow-y-auto">
              {AVAILABLE_EVENTS.map(event => (
                <div key={event.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={event.id}
                    checked={selectedEvents.includes(event.id)}
                    onCheckedChange={() => handleEventToggle(event.id)}
                  />
                  <div className="grid gap-1 leading-none">
                    <label
                      htmlFor={event.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {event.label}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Select the events you want to receive notifications for
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Webhook'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
