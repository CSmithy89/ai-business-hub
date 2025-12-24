'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { API_SCOPES } from '@hyvve/shared'
import { useCreateApiKey } from '@/hooks/use-api-keys'
import { Copy, Check } from 'lucide-react'

interface CreateApiKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateApiKeyDialog({ open, onOpenChange }: CreateApiKeyDialogProps) {
  const [name, setName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { createApiKey, isLoading } = useCreateApiKey()

  const scopeOptions = [
    { value: API_SCOPES.PM_READ, label: 'PM Read', description: 'Read projects, tasks, phases' },
    { value: API_SCOPES.PM_WRITE, label: 'PM Write', description: 'Create/update projects, tasks' },
    { value: API_SCOPES.PM_ADMIN, label: 'PM Admin', description: 'Delete operations' },
    { value: API_SCOPES.KB_READ, label: 'KB Read', description: 'Read knowledge base pages' },
    { value: API_SCOPES.KB_WRITE, label: 'KB Write', description: 'Create/update KB pages' },
    { value: API_SCOPES.WEBHOOK_READ, label: 'Webhook Read', description: 'List webhooks' },
    { value: API_SCOPES.WEBHOOK_WRITE, label: 'Webhook Write', description: 'Create/delete webhooks' },
  ]

  const handleCreate = async () => {
    const result = await createApiKey({
      name,
      scopes: selectedScopes,
    })
    setCreatedKey(result.plainKey)
  }

  const copyToClipboard = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setName('')
    setSelectedScopes([])
    setCreatedKey(null)
    setCopied(false)
    onOpenChange(false)
  }

  if (createdKey) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Copy this API key now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertDescription className="font-mono text-sm break-all">
              {createdKey}
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={copyToClipboard} variant="secondary">
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </>
              )}
            </Button>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            Create a new API key for external integrations
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production Integration"
            />
          </div>
          <div>
            <Label>Permissions</Label>
            <div className="space-y-2 mt-2">
              {scopeOptions.map((scope) => (
                <div key={scope.value} className="flex items-start space-x-2">
                  <Checkbox
                    id={scope.value}
                    checked={selectedScopes.includes(scope.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedScopes([...selectedScopes, scope.value])
                      } else {
                        setSelectedScopes(selectedScopes.filter((s) => s !== scope.value))
                      }
                    }}
                  />
                  <div className="flex-1">
                    <label htmlFor={scope.value} className="text-sm font-medium cursor-pointer">
                      {scope.label}
                    </label>
                    <p className="text-sm text-muted-foreground">{scope.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name || selectedScopes.length === 0 || isLoading}>
            Create API Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
