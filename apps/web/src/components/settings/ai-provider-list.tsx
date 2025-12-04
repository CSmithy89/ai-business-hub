'use client'

import { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAIProviders, useAIProviderMutations, PROVIDER_INFO, AIProviderType } from '@/hooks/use-ai-providers'
import { AIProviderCard } from './ai-provider-card'
import { AddProviderDialog } from './add-provider-dialog'
import { EditProviderDialog } from './edit-provider-dialog'

export function AIProviderList() {
  const { data, isLoading, error, refetch } = useAIProviders()
  const { deleteProvider, isDeleting, testProvider, isTesting } = useAIProviderMutations()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingProvider, setEditingProvider] = useState<string | null>(null)
  const [testingProvider, setTestingProvider] = useState<string | null>(null)

  // Get list of configured provider types
  const configuredProviders = data?.data.map((p) => p.provider) ?? []

  // Get list of available (not yet configured) providers
  const availableProviders = (Object.keys(PROVIDER_INFO) as AIProviderType[]).filter(
    (p) => !configuredProviders.includes(p)
  )

  const handleTest = async (providerId: string) => {
    setTestingProvider(providerId)
    testProvider(providerId, {
      onSettled: () => setTestingProvider(null),
    })
  }

  const handleDelete = (providerId: string) => {
    if (confirm('Are you sure you want to remove this AI provider?')) {
      deleteProvider(providerId)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">Failed to load AI providers: {error.message}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  const providers = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">AI Providers</h2>
          <p className="text-sm text-muted-foreground">
            Configure your AI provider API keys to enable AI features
          </p>
        </div>
        {availableProviders.length > 0 && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Provider
          </Button>
        )}
      </div>

      {providers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No AI providers configured yet.</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add your first provider
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {providers.map((provider) => (
            <AIProviderCard
              key={provider.id}
              provider={provider}
              onTest={() => handleTest(provider.id)}
              onEdit={() => setEditingProvider(provider.id)}
              onDelete={() => handleDelete(provider.id)}
              isTesting={testingProvider === provider.id || isTesting}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}

      <AddProviderDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        availableProviders={availableProviders}
      />

      {editingProvider && (
        <EditProviderDialog
          open={true}
          onOpenChange={(open) => !open && setEditingProvider(null)}
          provider={providers.find((p) => p.id === editingProvider)!}
        />
      )}
    </div>
  )
}
