'use client'

import { AlertTriangle, AlertCircle, X } from 'lucide-react'
import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useProvidersWithWarnings, TokenLimitStatus } from '@/hooks/use-token-limits'

/**
 * Provider info mapping
 */
const PROVIDER_INFO: Record<string, { name: string }> = {
  claude: { name: 'Claude (Anthropic)' },
  openai: { name: 'OpenAI' },
  gemini: { name: 'Google Gemini' },
  deepseek: { name: 'DeepSeek' },
  openrouter: { name: 'OpenRouter' },
}

interface TokenLimitAlertProps {
  className?: string
  onDismiss?: () => void
  onIncreaseLimit?: (status: TokenLimitStatus) => void
}

/**
 * Alert banner showing token limit warnings and exceeded status
 */
export function TokenLimitAlert({
  className,
  onDismiss,
  onIncreaseLimit,
}: TokenLimitAlertProps) {
  const { warnings, exceeded, hasWarnings, hasExceeded } = useProvidersWithWarnings()
  const [dismissed, setDismissed] = useState(false)

  // Don't show if dismissed or no issues
  if (dismissed || (!hasWarnings && !hasExceeded)) {
    return null
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  // Show exceeded providers first (they are more critical)
  if (hasExceeded) {
    const provider = exceeded[0]
    const providerName = PROVIDER_INFO[provider.provider]?.name || provider.provider

    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>Token Limit Exceeded</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p>
            {providerName} has exceeded its daily token limit ({provider.tokensUsed.toLocaleString()} / {provider.maxTokens.toLocaleString()} tokens).
            AI requests using this provider will fail until the limit resets at midnight UTC.
          </p>
          {exceeded.length > 1 && (
            <p className="mt-1 text-sm">
              +{exceeded.length - 1} other provider(s) also exceeded
            </p>
          )}
          {onIncreaseLimit && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => onIncreaseLimit(provider)}
            >
              Increase Limit
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  // Show warnings
  if (hasWarnings) {
    const provider = warnings[0]
    const providerName = PROVIDER_INFO[provider.provider]?.name || provider.provider

    return (
      <Alert variant="default" className={`border-yellow-500 ${className}`}>
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <AlertTitle className="flex items-center justify-between">
          <span className="text-yellow-700">Token Limit Warning</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p>
            {providerName} is at {provider.percentageUsed}% of its daily token limit ({provider.tokensUsed.toLocaleString()} / {provider.maxTokens.toLocaleString()} tokens).
          </p>
          {warnings.length > 1 && (
            <p className="mt-1 text-sm">
              +{warnings.length - 1} other provider(s) also approaching limit
            </p>
          )}
          {onIncreaseLimit && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => onIncreaseLimit(provider)}
            >
              Increase Limit
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return null
}

/**
 * Compact version of the alert for dashboard/header use
 */
export function TokenLimitAlertCompact({ className }: { className?: string }) {
  const { warnings, exceeded, hasWarnings, hasExceeded } = useProvidersWithWarnings()

  if (!hasWarnings && !hasExceeded) {
    return null
  }

  if (hasExceeded) {
    return (
      <div className={`flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-1.5 text-sm text-destructive ${className}`}>
        <AlertCircle className="h-4 w-4" />
        <span>
          {exceeded.length} provider{exceeded.length > 1 ? 's' : ''} exceeded token limit
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 rounded-md bg-yellow-100 px-3 py-1.5 text-sm text-yellow-700 ${className}`}>
      <AlertTriangle className="h-4 w-4" />
      <span>
        {warnings.length} provider{warnings.length > 1 ? 's' : ''} approaching token limit
      </span>
    </div>
  )
}
