'use client'

import { CheckCircle2, XCircle, AlertCircle, MoreVertical, TestTube2, Pencil, Trash2, Loader2, Star } from 'lucide-react'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { AIProvider, PROVIDER_INFO } from '@/hooks/use-ai-providers'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

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
          Verified
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
        Not Configured
      </Badge>
    )
  }

  // Determine usage color based on percentage
  const getUsageColor = () => {
    if (usagePercent > 90) return 'text-red-600'
    if (usagePercent > 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-6 transition-all duration-200',
        'hover:border-[rgb(var(--color-border-strong))] hover:shadow-md',
        provider.isValid && 'border-l-4',
      )}
      style={{
        borderLeftColor: provider.isValid ? info?.color : undefined,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Provider Icon */}
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl text-3xl"
            style={{ backgroundColor: `${info?.color}20` }}
          >
            {info?.icon ?? '🔌'}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold">{info?.name ?? provider.provider}</h3>
              {getStatusBadge()}
              {provider.provider === 'claude' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 border-amber-200">
                      <Star className="h-3 w-3 fill-current" />
                      Recommended
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Best for strategy, content, and complex reasoning</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-1">
              Model: <span className="font-medium text-foreground">{provider.defaultModel}</span>
            </p>

            {/* Timestamps */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
              {provider.lastValidatedAt && (
                <span>
                  Last tested {formatDistanceToNow(new Date(provider.lastValidatedAt), { addSuffix: true })}
                </span>
              )}
              <span>
                Added {formatDistanceToNow(new Date(provider.createdAt), { addSuffix: true })}
              </span>
            </div>

            {/* Validation Error */}
            {provider.validationError && (
              <div className="mt-2 flex items-start gap-2 rounded-md bg-red-50 p-2 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{provider.validationError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
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
              Edit Configuration
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              disabled={isDeleting}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Provider
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Usage Progress Section */}
      <div className="mt-5 space-y-2 pt-4 border-t border-dashed">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Daily Token Usage</span>
          <span className={cn('font-medium', getUsageColor())}>
            {provider.tokensUsedToday.toLocaleString()} / {provider.maxTokensPerDay.toLocaleString()}
          </span>
        </div>
        <Progress
          value={Math.min(usagePercent, 100)}
          className={cn(
            'h-2',
            usagePercent > 90 ? '[&>div]:bg-red-500' :
            usagePercent > 75 ? '[&>div]:bg-yellow-500' :
            '[&>div]:bg-green-500'
          )}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{usagePercent.toFixed(1)}% used today</span>
          <span>{(provider.maxTokensPerDay - provider.tokensUsedToday).toLocaleString()} remaining</span>
        </div>
      </div>
    </div>
  )
}
