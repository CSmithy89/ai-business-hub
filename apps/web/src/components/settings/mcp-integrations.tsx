'use client'

import { useMemo, useState } from 'react'
import { Loader2, Plus, RefreshCw, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  useMCPServer,
  useMCPServerMutations,
  useMCPServers,
  type MCPServerSummary,
} from '@/hooks/use-mcp-servers'
import { AddMCPServerDialog } from '@/components/settings/add-mcp-server-dialog'
import { EditMCPServerDialog } from '@/components/settings/edit-mcp-server-dialog'

function healthBadgeVariant(status: string | null): 'success' | 'destructive' | 'secondary' {
  if (status === 'healthy') return 'success'
  if (status === 'unhealthy') return 'destructive'
  return 'secondary'
}

function healthLabel(status: string | null): string {
  if (status === 'healthy') return 'Healthy'
  if (status === 'unhealthy') return 'Unhealthy'
  return 'Unknown'
}

function formatTimestamp(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString()
}

export function MCPIntegrations() {
  const { data, isLoading, error, refetch } = useMCPServers()
  const { createServer, updateServer, deleteServer } = useMCPServerMutations()

  const [showAdd, setShowAdd] = useState(false)
  const [editingServerId, setEditingServerId] = useState<string | null>(null)

  const {
    data: editingServer,
    isLoading: isLoadingEditingServer,
  } = useMCPServer(editingServerId)

  const transports = data?.transports ?? []
  const permissionLevels = data?.permissionLevels ?? []
  const servers = data?.servers

  const isMutating = createServer.isPending || updateServer.isPending || deleteServer.isPending

  const sortedServers = useMemo(() => {
    const list = servers ?? []
    return [...list].sort((a, b) => a.name.localeCompare(b.name))
  }, [servers])

  const handleAdd = async (payload: Parameters<typeof createServer.mutateAsync>[0]) => {
    await createServer.mutateAsync(payload)
  }

  const handleToggleEnabled = async (server: MCPServerSummary, enabled: boolean) => {
    try {
      await updateServer.mutateAsync({ serverId: server.serverId, data: { enabled } })
      toast.success(enabled ? `${server.name} enabled` : `${server.name} disabled`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update MCP server')
    }
  }

  const handleUpdate = async (serverId: string, payload: Parameters<typeof updateServer.mutateAsync>[0]['data']) => {
    await updateServer.mutateAsync({ serverId, data: payload })
  }

  const handleDelete = async (serverId: string) => {
    await deleteServer.mutateAsync(serverId)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MCP Integrations</CardTitle>
          <CardDescription>Connect MCP servers to extend your agents with tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
            <p className="text-destructive">
              Failed to load MCP servers: {(error as Error).message}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">MCP Integrations</h2>
            <p className="text-sm text-muted-foreground">
              Add MCP servers to safely expand what your agents can read, write, and execute.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isMutating}>
              {isMutating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowAdd(true)} disabled={isMutating || transports.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Add Server
            </Button>
          </div>
        </div>

        {sortedServers.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                headline="No MCP servers connected"
                description="Add your first MCP server to give your agents secure access to tools."
                ctaText="Add MCP Server"
                onCtaClick={() => setShowAdd(true)}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sortedServers.map((server) => {
              const lastHealth = formatTimestamp(server.lastHealthCheck)
              const statusText = healthLabel(server.healthStatus)
              const statusVariant = healthBadgeVariant(server.healthStatus)

              return (
                <Card
                  key={server.serverId}
                  className="hover:border-[rgb(var(--color-border-default))] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-200 ease-out"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-lg truncate">{server.name}</CardTitle>
                          <Badge variant={statusVariant}>{statusText}</Badge>
                          <Badge variant="outline" className="font-mono">
                            {server.transport}
                          </Badge>
                          <Badge variant="outline">{server.permissionLevel}</Badge>
                        </div>
                        <CardDescription className="mt-1">
                          <span className="font-mono">{server.serverId}</span>
                          {lastHealth && (
                            <span className="ml-2">· Last checked {lastHealth}</span>
                          )}
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-3">
                        <Switch
                          checked={server.enabled}
                          disabled={isMutating}
                          onCheckedChange={(checked) => handleToggleEnabled(server, checked)}
                          aria-label={`Toggle ${server.name}`}
                        />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingServerId(server.serverId)}
                        disabled={isMutating}
                      >
                        <Settings2 className="mr-2 h-4 w-4" />
                        Configure
                      </Button>

                      {(updateServer.isPending || deleteServer.isPending) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving…
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <AddMCPServerDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onCreate={handleAdd}
        isCreating={createServer.isPending}
        transports={transports}
        permissionLevels={permissionLevels}
      />

      {editingServerId && (
        <>
          {isLoadingEditingServer || !editingServer ? (
            <DialogLoading open={true} onOpenChange={(open) => !open && setEditingServerId(null)} />
          ) : (
            <EditMCPServerDialog
              open={true}
              onOpenChange={(open) => !open && setEditingServerId(null)}
              server={editingServer}
              transports={transports}
              permissionLevels={permissionLevels}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              isSaving={isMutating}
            />
          )}
        </>
      )}
    </>
  )
}

function DialogLoading({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Loading…</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
