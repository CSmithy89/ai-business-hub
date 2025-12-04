'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAIProviderMutations, AIProvider, PROVIDER_INFO } from '@/hooks/use-ai-providers'

interface EditProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: AIProvider
}

export function EditProviderDialog({
  open,
  onOpenChange,
  provider,
}: EditProviderDialogProps) {
  const { updateProviderAsync, isUpdating } = useAIProviderMutations()

  const [model, setModel] = useState(provider.defaultModel)
  const [apiKey, setApiKey] = useState('')
  const [maxTokensPerDay, setMaxTokensPerDay] = useState(provider.maxTokensPerDay)
  const [error, setError] = useState<string | null>(null)

  const providerInfo = PROVIDER_INFO[provider.provider]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Build update object with only changed fields
    const updateData: { defaultModel?: string; apiKey?: string; maxTokensPerDay?: number } = {}

    if (model !== provider.defaultModel) {
      updateData.defaultModel = model
    }
    if (apiKey) {
      updateData.apiKey = apiKey
    }
    if (maxTokensPerDay !== provider.maxTokensPerDay) {
      updateData.maxTokensPerDay = maxTokensPerDay
    }

    if (Object.keys(updateData).length === 0) {
      onOpenChange(false)
      return
    }

    try {
      await updateProviderAsync({
        providerId: provider.id,
        data: updateData,
      })

      // Reset and close
      setApiKey('')
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update provider')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit {providerInfo?.name ?? provider.provider}</DialogTitle>
            <DialogDescription>
              Update your AI provider configuration.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="model">Default Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {providerInfo?.models.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="apiKey">New API Key (optional)</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Leave empty to keep current key"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Enter a new key only if you want to change it
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxTokens">Daily Token Limit</Label>
              <Input
                id="maxTokens"
                type="number"
                value={maxTokensPerDay}
                onChange={(e) => setMaxTokensPerDay(parseInt(e.target.value) || 0)}
                min={1000}
                max={10000000}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
