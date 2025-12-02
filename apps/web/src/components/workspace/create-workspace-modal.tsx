'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CreateWorkspaceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Modal for creating a new workspace
 * Creates the workspace and switches to it on success
 */
export function CreateWorkspaceModal({ open, onOpenChange }: CreateWorkspaceModalProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validation
  const isValidName = name.length >= 3 && name.length <= 50

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()

    if (!isValidName) {
      setError('Workspace name must be between 3 and 50 characters')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      // Create workspace
      const createResponse = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      const createData = await createResponse.json()

      if (!createResponse.ok) {
        throw new Error(createData.message || 'Failed to create workspace')
      }

      const workspaceId = createData.data.id

      // Switch to new workspace
      const switchResponse = await fetch('/api/workspaces/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      })

      if (!switchResponse.ok) {
        const switchData = await switchResponse.json()
        throw new Error(switchData.message || 'Failed to switch to new workspace')
      }

      toast.success(`Workspace "${name}" created successfully`)

      // Reset form and close
      setName('')
      onOpenChange(false)

      // Refresh to load new workspace context
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create workspace'
      setError(message)
      toast.error(message)
    } finally {
      setIsCreating(false)
    }
  }

  function handleClose() {
    if (!isCreating) {
      setName('')
      setError(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Create a workspace to organize your business data. You&apos;ll be the owner.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(null)
                }}
                placeholder="My Business"
                minLength={3}
                maxLength={50}
                disabled={isCreating}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {name.length}/50 characters (minimum 3)
              </p>
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValidName || isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Workspace'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
