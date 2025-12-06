'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, RotateCcw, Power, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface DangerZoneProps {
  agentId: string
  agentName: string
}

/**
 * DangerZone Component
 *
 * Dangerous actions: reset to defaults, disable agent, delete configuration.
 * All actions require confirmation.
 */
export function DangerZone({ agentId, agentName }: DangerZoneProps) {
  const router = useRouter()
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [disableDialogOpen, setDisableDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [confirmationName, setConfirmationName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleReset = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/agents/${agentId}/reset`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to reset agent configuration')
      }

      toast.success('Agent configuration reset to defaults')
      setResetDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisable = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/agents/${agentId}/disable`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to disable agent')
      }

      toast.success('Agent has been disabled')
      setDisableDialogOpen(false)
      router.push('/agents')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to disable agent')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (confirmationName !== agentName) {
      toast.error('Agent name does not match')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmName: confirmationName }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete agent configuration')
      }

      toast.success('Agent configuration deleted')
      setDeleteDialogOpen(false)
      router.push('/agents')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete configuration')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section id="danger">
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            These actions are permanent and cannot be undone. Proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reset to Defaults */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <h4 className="font-semibold">Reset to Defaults</h4>
              <p className="text-sm text-muted-foreground">
                Reset all configuration to workspace defaults
              </p>
            </div>
            <Button variant="outline" onClick={() => setResetDialogOpen(true)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Disable Agent */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <h4 className="font-semibold">Disable Agent</h4>
              <p className="text-sm text-muted-foreground">
                Stop agent from processing tasks (preserves history)
              </p>
            </div>
            <Button variant="outline" onClick={() => setDisableDialogOpen(true)}>
              <Power className="h-4 w-4 mr-2" />
              Disable
            </Button>
          </div>

          {/* Delete Configuration */}
          <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
            <div>
              <h4 className="font-semibold text-destructive">Delete Agent Configuration</h4>
              <p className="text-sm text-muted-foreground">
                Remove all custom configuration (cannot be undone)
              </p>
            </div>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Agent Configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all configuration settings to workspace defaults. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset to Defaults
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable Confirmation Dialog */}
      <AlertDialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Agent?</AlertDialogTitle>
            <AlertDialogDescription>
              This agent will stop processing tasks. Activity history will be preserved. You can
              re-enable the agent later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisable} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disable Agent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent Configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all custom configuration for this agent. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="confirmName">
              Type <strong>{agentName}</strong> to confirm
            </Label>
            <Input
              id="confirmName"
              value={confirmationName}
              onChange={e => setConfirmationName(e.target.value)}
              placeholder="Enter agent name"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading || confirmationName !== agentName}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Configuration
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
