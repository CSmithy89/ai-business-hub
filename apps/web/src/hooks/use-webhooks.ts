import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface CreateWebhookData {
  name: string
  description?: string
  url: string
  secret: string
  events: string[]
}

export function useWebhooks() {
  const queryClient = useQueryClient()

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const res = await fetch('/api/settings/webhooks')
      if (!res.ok) {
        throw new Error('Failed to fetch webhooks')
      }
      return res.json()
    },
  })

  const { mutateAsync: createWebhook, isPending: isCreating } = useMutation({
    mutationFn: async (data: CreateWebhookData) => {
      const res = await fetch('/api/settings/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        throw new Error('Failed to create webhook')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    },
  })

  const { mutateAsync: deleteWebhook } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/settings/webhooks/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error('Failed to delete webhook')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    },
  })

  const { mutateAsync: toggleWebhook } = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await fetch(`/api/settings/webhooks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      if (!res.ok) {
        throw new Error('Failed to update webhook')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    },
  })

  return {
    webhooks,
    isLoading,
    createWebhook,
    isCreating,
    deleteWebhook,
    toggleWebhook: (id: string, enabled: boolean) => toggleWebhook({ id, enabled }),
  }
}
