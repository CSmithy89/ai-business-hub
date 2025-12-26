import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiKeyListItem } from '@hyvve/shared'

export function useApiKeys() {
  const queryClient = useQueryClient()

  const { data: apiKeys, isLoading } = useQuery<ApiKeyListItem[]>({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await fetch('/api/settings/api-keys')
      if (!res.ok) {
        throw new Error('Failed to fetch API keys')
      }
      return res.json()
    },
  })

  const { mutateAsync: revokeApiKey } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/settings/api-keys/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error('Failed to revoke API key')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })

  return { apiKeys, isLoading, revokeApiKey }
}

export function useCreateApiKey() {
  const queryClient = useQueryClient()

  const { mutateAsync: createApiKey, isPending: isLoading } = useMutation({
    mutationFn: async (data: { name: string; scopes: string[] }) => {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        throw new Error('Failed to create API key')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })

  return { createApiKey, isLoading }
}
