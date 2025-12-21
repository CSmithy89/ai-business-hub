'use client'

import { useEffect, useState } from 'react'
import { DownloadCloud } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useStartAsanaImport, useStartTrelloImport } from '@/hooks/use-pm-imports'

interface AsanaTrelloImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

type Provider = 'asana' | 'trello'

export function AsanaTrelloImportDialog({ open, onOpenChange, projectId }: AsanaTrelloImportDialogProps) {
  const startAsanaImport = useStartAsanaImport()
  const startTrelloImport = useStartTrelloImport()

  const [provider, setProvider] = useState<Provider>('asana')
  const [asanaToken, setAsanaToken] = useState('')
  const [asanaProjectGid, setAsanaProjectGid] = useState('')
  const [trelloKey, setTrelloKey] = useState('')
  const [trelloToken, setTrelloToken] = useState('')
  const [trelloBoardId, setTrelloBoardId] = useState('')
  const [result, setResult] = useState<{ processedRows: number; errorCount: number } | null>(null)

  useEffect(() => {
    if (!open) {
      setProvider('asana')
      setAsanaToken('')
      setAsanaProjectGid('')
      setTrelloKey('')
      setTrelloToken('')
      setTrelloBoardId('')
      setResult(null)
    }
  }, [open])

  const handleImport = async () => {
    try {
      if (provider === 'asana') {
        if (!asanaToken || !asanaProjectGid) {
          toast.error('Asana token and project GID are required')
          return
        }
        const response = await startAsanaImport.mutateAsync({
          projectId,
          accessToken: asanaToken,
          projectGid: asanaProjectGid,
        })
        setResult({
          processedRows: response.data.processedRows,
          errorCount: response.data.errorCount,
        })
        toast.success('Asana import completed')
      } else {
        if (!trelloKey || !trelloToken || !trelloBoardId) {
          toast.error('Trello key, token, and board ID are required')
          return
        }
        const response = await startTrelloImport.mutateAsync({
          projectId,
          apiKey: trelloKey,
          token: trelloToken,
          boardId: trelloBoardId,
        })
        setResult({
          processedRows: response.data.processedRows,
          errorCount: response.data.errorCount,
        })
        toast.success('Trello import completed')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start import'
      toast.error(message)
    }
  }

  const isLoading = startAsanaImport.isPending || startTrelloImport.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DownloadCloud className="h-4 w-4" />
            Import from Asana or Trello
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Provider</label>
            <Select value={provider} onValueChange={(value) => setProvider(value as Provider)}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asana">Asana</SelectItem>
                <SelectItem value="trello">Trello</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {provider === 'asana' ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Asana Token</label>
                <Input
                  type="password"
                  value={asanaToken}
                  onChange={(event) => setAsanaToken(event.target.value)}
                  placeholder="Personal access token"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Project GID</label>
                <Input
                  value={asanaProjectGid}
                  onChange={(event) => setAsanaProjectGid(event.target.value)}
                  placeholder="123456789"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Trello API Key</label>
                <Input
                  value={trelloKey}
                  onChange={(event) => setTrelloKey(event.target.value)}
                  placeholder="API key"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Trello Token</label>
                <Input
                  type="password"
                  value={trelloToken}
                  onChange={(event) => setTrelloToken(event.target.value)}
                  placeholder="API token"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Board ID</label>
                <Input
                  value={trelloBoardId}
                  onChange={(event) => setTrelloBoardId(event.target.value)}
                  placeholder="Board ID"
                />
              </div>
            </div>
          )}

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
          <Button onClick={handleImport} disabled={isLoading}>
            Start Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
