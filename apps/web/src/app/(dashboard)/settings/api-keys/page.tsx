'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreateApiKeyDialog } from './create-api-key-dialog'
import { useApiKeys } from '@/hooks/use-api-keys'
import { formatDistanceToNow } from 'date-fns'
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function ApiKeysPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null)
  const { apiKeys, isLoading, revokeApiKey } = useApiKeys()

  const handleRevokeClick = (keyId: string) => {
    setSelectedKeyId(keyId)
    setRevokeDialogOpen(true)
  }

  const handleConfirmRevoke = async () => {
    if (selectedKeyId) {
      await revokeApiKey(selectedKeyId)
      setRevokeDialogOpen(false)
      setSelectedKeyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Manage API keys for external integrations and third-party applications
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          Create API Key
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : apiKeys && apiKeys.length > 0 ? (
        <div className="space-y-4">
          {apiKeys.map((key: any) => (
            <Card key={key.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{key.name}</CardTitle>
                    <CardDescription className="font-mono text-xs mt-1">
                      {key.keyPrefix}***
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRevokeClick(key.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {key.permissions.scopes.map((scope: string) => (
                      <Badge key={scope} variant="secondary">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {key.lastUsedAt ? (
                      <>Last used {formatDistanceToNow(new Date(key.lastUsedAt))} ago</>
                    ) : (
                      <>Never used</>
                    )}
                  </div>
                  {key.expiresAt && (
                    <div className="text-sm text-muted-foreground">
                      Expires {formatDistanceToNow(new Date(key.expiresAt))} from now
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Created {formatDistanceToNow(new Date(key.createdAt))} ago by {key.createdBy.name || key.createdBy.email}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No API keys created yet</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                Create Your First API Key
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateApiKeyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The API key will be immediately disabled and any applications using it will no longer have access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRevoke} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
