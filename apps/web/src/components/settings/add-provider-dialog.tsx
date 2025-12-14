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
import { useAIProviderMutations, PROVIDER_INFO, AIProviderType } from '@/hooks/use-ai-providers'

interface AddProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableProviders: AIProviderType[]
}

export function AddProviderDialog({
  open,
  onOpenChange,
  availableProviders,
}: AddProviderDialogProps) {
  const { createProviderAsync, isCreating } = useAIProviderMutations()

  const [provider, setProvider] = useState<AIProviderType | ''>('')
  const [model, setModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [maxTokensPerDay, setMaxTokensPerDay] = useState(100000)
  const [error, setError] = useState<string | null>(null)

  const selectedProviderInfo = provider ? PROVIDER_INFO[provider] : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!provider || !apiKey || !model) {
      setError('Please fill in all required fields')
      return
    }

    try {
      await createProviderAsync({
        provider,
        apiKey,
        defaultModel: model,
        maxTokensPerDay,
      })

      // Reset form and close
      setProvider('')
      setModel('')
      setApiKey('')
      setMaxTokensPerDay(100000)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add provider')
    }
  }

  const handleProviderChange = (value: AIProviderType) => {
    setProvider(value)
    // Set default model when provider changes
    const info = PROVIDER_INFO[value]
    if (info?.models.length) {
      setModel(info.models[0])
    } else {
      setModel('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add AI Key</DialogTitle>
            <DialogDescription>
              Add an API key for an AI provider to enable AI features for your workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="provider">Provider</Label>
              <Select value={provider} onValueChange={handleProviderChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider">
                    {provider && (
                      <span className="flex items-center gap-2">
                        <span>{PROVIDER_INFO[provider].icon}</span>
                        <span>{PROVIDER_INFO[provider].name}</span>
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableProviders.map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className="flex items-center gap-2">
                        <span>{PROVIDER_INFO[p].icon}</span>
                        <span>{PROVIDER_INFO[p].name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProviderInfo && (
                <p className="text-xs text-muted-foreground">
                  {selectedProviderInfo.description}
                </p>
              )}
            </div>

            {provider && (
              <div className="grid gap-2">
                <Label htmlFor="model">Default Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProviderInfo?.models.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                autoComplete="off"
              />
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
              <p className="text-xs text-muted-foreground">
                Maximum tokens per day (1K - 10M)
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
