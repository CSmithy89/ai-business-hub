'use client'

import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
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
import type { MCPServerCreateRequest, MCPTransport } from '@/hooks/use-mcp-servers'

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

export interface AddMCPServerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (data: MCPServerCreateRequest) => Promise<void>
  isCreating: boolean
  transports: Array<{ value: MCPTransport; name: string; description: string }>
  permissionLevels: Array<{ value: number; name: string; description: string }>
}

export function AddMCPServerDialog({
  open,
  onOpenChange,
  onCreate,
  isCreating,
  transports,
  permissionLevels,
}: AddMCPServerDialogProps) {
  const defaultTransport = transports[0]?.value ?? 'stdio'
  const defaultPermissions = permissionLevels[0]?.value ?? 1

  const [serverId, setServerId] = useState('')
  const [name, setName] = useState('')
  const [transport, setTransport] = useState<MCPTransport>(defaultTransport)
  const [command, setCommand] = useState('')
  const [url, setUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [permissions, setPermissions] = useState<number>(defaultPermissions)
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(30)
  const [enabled, setEnabled] = useState(true)
  const [includeTools, setIncludeTools] = useState('')
  const [excludeTools, setExcludeTools] = useState('')
  const [headersJSON, setHeadersJSON] = useState('{}')
  const [envVarsJSON, setEnvVarsJSON] = useState('{}')
  const [error, setError] = useState<string | null>(null)

  const transportInfo = useMemo(
    () => transports.find((t) => t.value === transport),
    [transport, transports]
  )

  const reset = () => {
    setServerId('')
    setName('')
    setTransport(defaultTransport)
    setCommand('')
    setUrl('')
    setApiKey('')
    setPermissions(defaultPermissions)
    setTimeoutSeconds(30)
    setEnabled(true)
    setIncludeTools('')
    setExcludeTools('')
    setHeadersJSON('{}')
    setEnvVarsJSON('{}')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!serverId.trim() || !name.trim()) {
      setError('Server ID and name are required')
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

    const payload: MCPServerCreateRequest = {
      serverId: serverId.trim(),
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

    if (transport === 'stdio') payload.command = command.trim()
    if (transport !== 'stdio') payload.url = url.trim()
    if (apiKey.trim()) payload.apiKey = apiKey.trim()

    try {
      await onCreate(payload)
      toast.success('MCP server added')
      reset()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add MCP server')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add MCP Server</DialogTitle>
            <DialogDescription>
              Connect an MCP server to make tools available to your agents.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="serverId">Server ID</Label>
              <Input
                id="serverId"
                value={serverId}
                onChange={(e) => setServerId(e.target.value)}
                placeholder="e.g. filesystem, github, brave-search"
                autoComplete="off"
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground">
                Lowercase, hyphens allowed. Must be unique within the workspace.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Display name"
                disabled={isCreating}
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
                  placeholder="e.g. npx -y @modelcontextprotocol/server-filesystem"
                  disabled={isCreating}
                />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={isCreating}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key (optional)</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Will be stored encrypted"
                autoComplete="off"
                disabled={isCreating}
              />
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
                  onChange={(e) => setTimeoutSeconds(Number(e.target.value) || 0)}
                  disabled={isCreating}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Enabled</p>
                <p className="text-xs text-muted-foreground">Disable to keep configured but inactive.</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} disabled={isCreating} />
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
                    placeholder="e.g. filesystem.readFile, github.search"
                    disabled={isCreating}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="excludeTools">Exclude tools (comma-separated)</Label>
                  <Input
                    id="excludeTools"
                    value={excludeTools}
                    onChange={(e) => setExcludeTools(e.target.value)}
                    placeholder="e.g. filesystem.writeFile"
                    disabled={isCreating}
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
                    disabled={isCreating}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="envVars">Environment variables (JSON object)</Label>
                  <Textarea
                    id="envVars"
                    value={envVarsJSON}
                    onChange={(e) => setEnvVarsJSON(e.target.value)}
                    className="min-h-[120px] font-mono text-sm"
                    spellCheck={false}
                    disabled={isCreating}
                  />
                </div>
              </div>
            </details>

            {error && <p className="text-sm text-destructive">{error}</p>}
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
              Add Server
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

