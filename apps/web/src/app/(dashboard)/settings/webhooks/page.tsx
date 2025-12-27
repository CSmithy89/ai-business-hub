'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreateWebhookDialog } from './create-webhook-dialog'
import { useWebhooks } from '@/hooks/use-webhooks'
import { formatDistanceToNow } from 'date-fns'
import { Trash2, ExternalLink, TrendingUp, AlertCircle } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export default function WebhooksPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null)
  const { webhooks, isLoading, deleteWebhook, toggleWebhook } = useWebhooks()

  const handleDeleteClick = (webhookId: string) => {
    setSelectedWebhookId(webhookId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (selectedWebhookId) {
      await deleteWebhook(selectedWebhookId)
      setDeleteDialogOpen(false)
      setSelectedWebhookId(null)
    }
  }

  const handleToggle = async (webhookId: string, enabled: boolean) => {
    await toggleWebhook(webhookId, enabled)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">
            Configure webhook subscriptions to receive real-time updates from PM events
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          Create Webhook
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : webhooks && webhooks.length > 0 ? (
        <div className="space-y-4">
          {webhooks.map((webhook: any) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle>{webhook.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`webhook-${webhook.id}`} className="text-sm text-muted-foreground">
                          {webhook.enabled ? 'Enabled' : 'Disabled'}
                        </Label>
                        <Switch
                          id={`webhook-${webhook.id}`}
                          checked={webhook.enabled}
                          onCheckedChange={(checked) => handleToggle(webhook.id, checked)}
                        />
                      </div>
                    </div>
                    {webhook.description && (
                      <CardDescription className="mt-1">
                        {webhook.description}
                      </CardDescription>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      <CardDescription className="font-mono text-xs">
                        {webhook.url}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(webhook.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">Subscribed Events</p>
                    <div className="flex flex-wrap gap-2">
                      {webhook.events.map((event: string) => (
                        <Badge key={event} variant="secondary">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Total Deliveries</p>
                        <p className="text-sm font-semibold">{webhook.deliveryCount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Failures</p>
                        <p className="text-sm font-semibold">{webhook.failureCount}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Last Delivery</p>
                      <p className="text-sm">
                        {webhook.lastDeliveredAt
                          ? formatDistanceToNow(new Date(webhook.lastDeliveredAt), { addSuffix: true })
                          : 'Never'}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Created {formatDistanceToNow(new Date(webhook.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No webhooks configured yet</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                Create Your First Webhook
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateWebhookDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this webhook? This action cannot be undone.
              You will no longer receive events at this endpoint.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
