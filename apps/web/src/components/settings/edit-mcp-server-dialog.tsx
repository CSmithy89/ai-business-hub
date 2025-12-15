'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, RotateCcw, Trash2 } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { MCPServerDetail, MCPServerUpdateRequest, MCPTransport } from '@/hooks/use-mcp-servers'

function parseStringArray(value: string): string[] {
  const parts = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return Array.from(new Set(parts))
}

function parseStringMapJSON(value: string, label: string): Record<string, string> {
  if (!value.trim()) return {}
  const parsed = JSON.parse(value) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object`)
  }

  const entries = Object.entries(parsed as Record<string, unknown>)
  for (const [key, val] of entries) {
    if (typeof val !== 'string') {
      throw new Error(`${label} values must be strings (key: ${key})`)
    }
  }

  return parsed as Record<string, string>
}

export interface EditMCPServerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  server: MCPServerDetail
  transports: Array<{ value: MCPTransport; name: string; description: string }>
  permissionLevels: Array<{ value: number; name: string; description: string }>
  onUpdate: (serverId: string, data: MCPServerUpdateRequest) => Promise<void>
  onDelete: (serverId: string) => Promise<void>
  isSaving: boolean
}

export function EditMCPServerDialog({
  open,
  onOpenChange,
  server,
  transports,
  permissionLevels,
  onUpdate,
  onDelete,
  isSaving,
}: EditMCPServerDialogProps) {
  const [name, setName] = useState(server.name)
  const [transport, setTransport] = useState<MCPTransport>(server.transport)
  const [command, setCommand] = useState(server.command ?? '')
  const [url, setUrl] = useState(server.url ?? '')
  const [permissions, setPermissions] = useState<number>(server.permissions)
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(server.timeoutSeconds)
  const [enabled, setEnabled] = useState<boolean>(server.enabled)
  const [includeTools, setIncludeTools] = useState(server.includeTools.join(', '))
  const [excludeTools, setExcludeTools] = useState(server.excludeTools.join(', '))
  const [headersJSON, setHeadersJSON] = useState(JSON.stringify(server.headers ?? {}, null, 2))
  const [envVarsJSON, setEnvVarsJSON] = useState(JSON.stringify(server.envVars ?? {}, null, 2))
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  const transportInfo = useMemo(
    () => transports.find((t) => t.value === transport),
    [transport, transports]
  )

  useEffect(() => {
    if (!open) return
    setName(server.name)
    setTransport(server.transport)
    setCommand(server.command ?? '')
    setUrl(server.url ?? '')
    setPermissions(server.permissions)
    setTimeoutSeconds(server.timeoutSeconds)
    setEnabled(server.enabled)
    setIncludeTools(server.includeTools.join(', '))
    setExcludeTools(server.excludeTools.join(', '))
    setHeadersJSON(JSON.stringify(server.headers ?? {}, null, 2))
    setEnvVarsJSON(JSON.stringify(server.envVars ?? {}, null, 2))
    setApiKey('')
    setError(null)
  }, [open, server])

  const handleReset = () => {
    setName(server.name)
    setTransport(server.transport)
    setCommand(server.command ?? '')
    setUrl(server.url ?? '')
    setPermissions(server.permissions)
    setTimeoutSeconds(server.timeoutSeconds)
    setEnabled(server.enabled)
    setIncludeTools(server.includeTools.join(', '))
    setExcludeTools(server.excludeTools.join(', '))
    setHeadersJSON(JSON.stringify(server.headers ?? {}, null, 2))
    setEnvVarsJSON(JSON.stringify(server.envVars ?? {}, null, 2))
    setApiKey('')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (transport === 'stdio' && !command.trim()) {
      setError('Command is required for stdio transport')
      return
    }

    if (transport !== 'stdio' && !url.trim()) {
      setError('URL is required for SSE/HTTP transport')
      return
    }

    let headers: Record<string, string> = {}
    let envVars: Record<string, string> = {}
    try {
      headers = parseStringMapJSON(headersJSON, 'Headers')
      envVars = parseStringMapJSON(envVarsJSON, 'Environment variables')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON in advanced settings')
      return
    }

    const payload: MCPServerUpdateRequest = {
      name: name.trim(),
      transport,
      permissions,
      timeoutSeconds,
      enabled,
      includeTools: parseStringArray(includeTools),
      excludeTools: parseStringArray(excludeTools),
      headers,
      envVars,
    }

    if (transport === 'stdio') {
      payload.command = command.trim()
      payload.url = null
    } else {
      payload.url = url.trim()
      payload.command = null
    }

    if (apiKey.trim()) {
      payload.apiKey = apiKey.trim()
    }

    try {
      await onUpdate(server.serverId, payload)
      toast.success('MCP server updated')
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update MCP server'
      setError(message)
      toast.error(message)
    }
  }

  const handleClearKey = async () => {
    try {
      await onUpdate(server.serverId, { apiKey: null })
      toast.success('API key cleared')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to clear API key')
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete MCP server "${server.name}"? This cannot be undone.`)
    if (!confirmed) return

    try {
      await onDelete(server.serverId)
      toast.success('MCP server deleted')
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete MCP server')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit MCP Server</DialogTitle>
            <DialogDescription>
              Server ID: <span className="font-mono">{server.serverId}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="transport">Transport</Label>
              <Select value={transport} onValueChange={(value) => setTransport(value as MCPTransport)}>
                <SelectTrigger id="transport">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transports.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {transportInfo && (
                <p className="text-xs text-muted-foreground">{transportInfo.description}</p>
              )}
            </div>

            {transport === 'stdio' ? (
              <div className="grid gap-2">
                <Label htmlFor="command">Command</Label>
                <Input
                  id="command"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={server.hasApiKey ? 'Key is set (enter new to replace)' : 'No key set'}
                autoComplete="off"
                disabled={isSaving}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearKey}
                  disabled={!server.hasApiKey || isSaving}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Key
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="permissions">Permissions</Label>
                <Select
                  value={String(permissions)}
                  onValueChange={(value) => setPermissions(Number(value))}
                >
                  <SelectTrigger id="permissions">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {permissionLevels.map((p) => (
                      <SelectItem key={p.value} value={String(p.value)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="timeout">Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min={5}
                  max={300}
                  value={timeoutSeconds}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw === '') {
                      setTimeoutSeconds(30)
                      return
                    }
                    const value = Number(raw)
                    if (!Number.isFinite(value)) {
                      return
                    }
                    const clamped = Math.min(300, Math.max(5, Math.round(value)))
                    setTimeoutSeconds(clamped)
                  }}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Enabled</p>
                <p className="text-xs text-muted-foreground">Disable to keep configured but inactive.</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} disabled={isSaving} />
            </div>

            <details className="rounded-lg border p-3">
              <summary className="cursor-pointer text-sm font-medium">Advanced settings</summary>
              <div className="mt-4 grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="includeTools">Include tools (comma-separated)</Label>
                  <Input
                    id="includeTools"
                    value={includeTools}
                    onChange={(e) => setIncludeTools(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="excludeTools">Exclude tools (comma-separated)</Label>
                  <Input
                    id="excludeTools"
                    value={excludeTools}
                    onChange={(e) => setExcludeTools(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="headers">Headers (JSON object)</Label>
                  <Textarea
                    id="headers"
                    value={headersJSON}
                    onChange={(e) => setHeadersJSON(e.target.value)}
                    className="min-h-[120px] font-mono text-sm"
                    spellCheck={false}
                    disabled={isSaving}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="envVars">Environment variables (JSON object, keys must start with MCP_)</Label>
                  <Textarea
                    id="envVars"
                    value={envVarsJSON}
                    onChange={(e) => setEnvVarsJSON(e.target.value)}
                    className="min-h-[120px] font-mono text-sm"
                    spellCheck={false}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </details>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={handleReset} disabled={isSaving}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
