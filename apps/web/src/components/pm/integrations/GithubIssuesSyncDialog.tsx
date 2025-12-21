'use client'

import { useEffect, useMemo, useState } from 'react'
import { Github } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useConnectIntegration, useListIntegrations, useSyncGithubIssues } from '@/hooks/use-pm-integrations'

interface GithubIssuesSyncDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

export function GithubIssuesSyncDialog({ open, onOpenChange, projectId }: GithubIssuesSyncDialogProps) {
  const { data: integrations } = useListIntegrations()
  const connectIntegration = useConnectIntegration()
  const syncIssues = useSyncGithubIssues()

  const githubConnection = useMemo(
    () => integrations?.data.find((connection) => connection.provider === 'GITHUB'),
    [integrations],
  )

  const [token, setToken] = useState('')
  const [owner, setOwner] = useState('')
  const [repo, setRepo] = useState('')
  const [state, setState] = useState<'open' | 'closed' | 'all'>('open')

  useEffect(() => {
    if (!open) {
      setToken('')
      setOwner('')
      setRepo('')
      setState('open')
    }
  }, [open])

  const handleSync = async () => {
    if (!owner || !repo) {
      toast.error('Owner and repo are required')
      return
    }

    try {
      if (!githubConnection && !token) {
        toast.error('Add a GitHub token to connect first')
        return
      }

      if (token) {
        await connectIntegration.mutateAsync({
          provider: 'github',
          token,
          metadata: { defaultRepo: `${owner}/${repo}` },
        })
      }

      const result = await syncIssues.mutateAsync({
        projectId,
        owner,
        repo,
        state,
      })

      toast.success(`Synced ${result.data.created} issues (${result.data.skipped} skipped)`)
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sync GitHub issues'
      toast.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            Sync GitHub Issues
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={githubConnection?.status === 'CONNECTED' ? 'secondary' : 'outline'}>
              {githubConnection?.status === 'CONNECTED' ? 'Connected' : 'Not connected'}
            </Badge>
            {githubConnection?.metadata?.defaultRepo ? (
              <Badge variant="outline">Default: {String(githubConnection.metadata.defaultRepo)}</Badge>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Repository Owner</label>
            <Input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="octo-org" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Repository Name</label>
            <Input value={repo} onChange={(event) => setRepo(event.target.value)} placeholder="my-repo" />
          </div>

          {!githubConnection ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">GitHub Token</label>
              <Input
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="ghp_..."
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium">Issue State</label>
            <Select value={state} onValueChange={(value) => setState(value as 'open' | 'closed' | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSync} disabled={syncIssues.isPending || connectIntegration.isPending}>
            Sync Issues
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
