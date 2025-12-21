'use client'

import { useEffect, useState } from 'react'
import { DownloadCloud } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useStartJiraImport } from '@/hooks/use-pm-imports'
import { toast } from 'sonner'

interface JiraImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

export function JiraImportDialog({ open, onOpenChange, projectId }: JiraImportDialogProps) {
  const startJiraImport = useStartJiraImport()

  const [baseUrl, setBaseUrl] = useState('')
  const [email, setEmail] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [jql, setJql] = useState('')
  const [maxResults, setMaxResults] = useState('50')
  const [result, setResult] = useState<{ processedRows: number; errorCount: number } | null>(null)

  useEffect(() => {
    if (!open) {
      setBaseUrl('')
      setEmail('')
      setApiToken('')
      setJql('')
      setMaxResults('50')
      setResult(null)
    }
  }, [open])

  const handleImport = async () => {
    if (!baseUrl || !email || !apiToken) {
      toast.error('Base URL, email, and API token are required')
      return
    }

    try {
      const response = await startJiraImport.mutateAsync({
        projectId,
        baseUrl,
        email,
        apiToken,
        jql: jql.trim() ? jql : undefined,
        maxResults: maxResults ? Number(maxResults) : undefined,
      })

      setResult({
        processedRows: response.data.processedRows,
        errorCount: response.data.errorCount,
      })
      toast.success('Jira import completed')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start Jira import'
      toast.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DownloadCloud className="h-4 w-4" />
            Import from Jira
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Jira Base URL</label>
            <Input
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder="https://your-domain.atlassian.net"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Jira Email</label>
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">API Token</label>
            <Input
              type="password"
              value={apiToken}
              onChange={(event) => setApiToken(event.target.value)}
              placeholder="Jira API token"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">JQL (optional)</label>
            <Textarea
              value={jql}
              onChange={(event) => setJql(event.target.value)}
              placeholder="project = PROJ ORDER BY created DESC"
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Max Results</label>
            <Input
              value={maxResults}
              onChange={(event) => setMaxResults(event.target.value)}
              placeholder="50"
            />
          </div>

          {result ? (
            <div className="flex gap-2">
              <Badge variant="secondary">Imported {result.processedRows}</Badge>
              <Badge variant={result.errorCount > 0 ? 'destructive' : 'outline'}>
                {result.errorCount} errors
              </Badge>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleImport} disabled={startJiraImport.isPending}>
            Start Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
