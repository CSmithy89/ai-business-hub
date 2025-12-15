'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { WorkspaceModule } from '@/hooks/use-workspace-modules'

export interface ModuleConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  module: WorkspaceModule
  onSave: (config: Record<string, unknown>) => Promise<void>
  isSaving: boolean
}

function formatJSON(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return '{}'
  }
}

export function ModuleConfigDialog({
  open,
  onOpenChange,
  module,
  onSave,
  isSaving,
}: ModuleConfigDialogProps) {
  const initialValue = useMemo(() => formatJSON(module.config), [module.config])
  const [rawJSON, setRawJSON] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setRawJSON(initialValue)
      setError(null)
    }
  }, [open, initialValue])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    let parsed: unknown
    try {
      parsed = JSON.parse(rawJSON || '{}')
    } catch {
      setError('Invalid JSON. Please fix syntax errors and try again.')
      return
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      setError('Config must be a JSON object (e.g. { "key": "value" }).')
      return
    }

    try {
      await onSave(parsed as Record<string, unknown>)
      toast.success('Module configuration saved')
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save module configuration'
      toast.error(message)
      setError(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Configure {module.name}</DialogTitle>
            <DialogDescription>
              Advanced settings are stored as JSON for this workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            <div className="grid gap-2">
              <Label htmlFor="moduleConfig">Configuration (JSON)</Label>
              <Textarea
                id="moduleConfig"
                value={rawJSON}
                onChange={(e) => setRawJSON(e.target.value)}
                className="min-h-[280px] font-mono text-sm"
                spellCheck={false}
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Tip: keep this as an object. Arrays and primitives are not supported.
              </p>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

