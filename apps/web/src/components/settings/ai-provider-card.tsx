'use client'

import { CheckCircle2, XCircle, AlertCircle, MoreVertical, TestTube2, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AIProvider, PROVIDER_INFO } from '@/hooks/use-ai-providers'
import { formatDistanceToNow } from 'date-fns'

interface AIProviderCardProps {
  provider: AIProvider
  onTest: () => void
  onEdit: () => void
  onDelete: () => void
  isTesting: boolean
  isDeleting: boolean
}

export function AIProviderCard({
  provider,
  onTest,
  onEdit,
  onDelete,
  isTesting,
  isDeleting,
}: AIProviderCardProps) {
  const info = PROVIDER_INFO[provider.provider]
  const usagePercent = (provider.tokensUsedToday / provider.maxTokensPerDay) * 100

  const getStatusBadge = () => {
    if (provider.isValid) {
      return (
        <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Valid
        </Badge>
      )
    }

    if (provider.lastValidatedAt) {
      return (
        <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">
          <XCircle className="mr-1 h-3 w-3" />
          Invalid
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
        <AlertCircle className="mr-1 h-3 w-3" />
        Not Tested
      </Badge>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-2xl font-bold uppercase">
            {provider.provider.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{info?.name ?? provider.provider}</h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-muted-foreground">
              Model: {provider.defaultModel}
            </p>
            {provider.lastValidatedAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                Last tested {formatDistanceToNow(new Date(provider.lastValidatedAt), { addSuffix: true })}
              </p>
            )}
            {provider.validationError && (
              <p className="mt-1 text-xs text-red-600">
                Error: {provider.validationError}
              </p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onTest} disabled={isTesting}>
              {isTesting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TestTube2 className="mr-2 h-4 w-4" />
              )}
              Test Connection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              disabled={isDeleting}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Daily Token Usage</span>
          <span className="font-medium">
            {provider.tokensUsedToday.toLocaleString()} / {provider.maxTokensPerDay.toLocaleString()}
          </span>
        </div>
        <Progress
          value={usagePercent}
          className={usagePercent > 90 ? 'bg-red-100' : usagePercent > 75 ? 'bg-yellow-100' : ''}
        />
      </div>
    </div>
  )
}
