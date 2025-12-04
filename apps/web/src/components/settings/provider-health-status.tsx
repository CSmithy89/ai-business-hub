'use client'

import { Activity, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Clock } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  useWorkspaceHealth,
  useTriggerHealthCheck,
  useProvidersWithHealthIssues,
  ProviderHealthInfo
} from '@/hooks/use-provider-health'
import { cn } from '@/lib/utils'

/**
 * Provider info mapping
 */
const PROVIDER_INFO: Record<string, { name: string; color: string }> = {
  claude: { name: 'Claude (Anthropic)', color: 'bg-orange-500' },
  openai: { name: 'OpenAI', color: 'bg-green-500' },
  gemini: { name: 'Google Gemini', color: 'bg-blue-500' },
  deepseek: { name: 'DeepSeek', color: 'bg-purple-500' },
  openrouter: { name: 'OpenRouter', color: 'bg-pink-500' },
}

interface ProviderHealthCardProps {
  provider: ProviderHealthInfo
  onTriggerCheck: () => void
  isChecking: boolean
}

/**
 * Individual provider health card
 */
function ProviderHealthCard({ provider, onTriggerCheck, isChecking }: ProviderHealthCardProps) {
  const providerInfo = PROVIDER_INFO[provider.provider] || {
    name: provider.provider,
    color: 'bg-gray-500'
  }

  const lastChecked = provider.lastValidatedAt
    ? new Date(provider.lastValidatedAt).toLocaleString()
    : 'Never'

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className={cn('h-3 w-3 rounded-full', providerInfo.color)} />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{providerInfo.name}</span>
            {provider.isValid ? (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Healthy
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="mr-1 h-3 w-3" />
                Unhealthy
              </Badge>
            )}
            {provider.consecutiveFailures >= 3 && (
              <Badge variant="outline" className="border-red-500 text-red-500">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Critical
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last checked: {lastChecked}
          </div>
          {provider.validationError && (
            <div className="mt-1 text-sm text-destructive">
              Error: {provider.validationError}
            </div>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onTriggerCheck}
        disabled={isChecking}
        title="Trigger health check"
      >
        <RefreshCw className={cn('h-4 w-4', isChecking && 'animate-spin')} />
      </Button>
    </div>
  )
}

/**
 * Provider health status dashboard
 */
export function ProviderHealthStatus() {
  const { data: health, isLoading, error, refetch } = useWorkspaceHealth()
  const triggerHealthCheck = useTriggerHealthCheck()
  const [checkingProviderId, setCheckingProviderId] = useState<string | null>(null)

  const handleTriggerCheck = async (providerId: string) => {
    setCheckingProviderId(providerId)
    try {
      await triggerHealthCheck.mutateAsync(providerId)
    } finally {
      setCheckingProviderId(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Provider Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Loading health status...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Provider Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-destructive">
            Failed to load health status
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!health || health.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Provider Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            No providers configured
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Provider Health
          </CardTitle>
          <CardDescription>
            {health.healthy} of {health.total} providers healthy
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {/* Summary badges */}
        <div className="mb-4 flex gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            {health.healthy} Healthy
          </Badge>
          {health.unhealthy > 0 && (
            <Badge variant="destructive">
              <XCircle className="mr-1 h-3 w-3" />
              {health.unhealthy} Unhealthy
            </Badge>
          )}
        </div>

        {/* Provider list */}
        <div className="space-y-3">
          {health.providers.map((provider) => (
            <ProviderHealthCard
              key={provider.id}
              provider={provider}
              onTriggerCheck={() => handleTriggerCheck(provider.id)}
              isChecking={checkingProviderId === provider.id}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Compact health indicator for header/sidebar
 */
export function ProviderHealthIndicator({ className }: { className?: string }) {
  const { hasCritical, hasUnhealthy, unhealthyProviders, criticalProviders } = useProvidersWithHealthIssues()

  if (!hasCritical && !hasUnhealthy) {
    return (
      <div className={cn('flex items-center gap-1 text-sm text-green-600', className)}>
        <CheckCircle2 className="h-4 w-4" />
        <span>All healthy</span>
      </div>
    )
  }

  if (hasCritical) {
    return (
      <div className={cn('flex items-center gap-1 text-sm text-destructive', className)}>
        <AlertTriangle className="h-4 w-4" />
        <span>{criticalProviders.length} critical</span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-1 text-sm text-yellow-600', className)}>
      <XCircle className="h-4 w-4" />
      <span>{unhealthyProviders.length} unhealthy</span>
    </div>
  )
}

/**
 * Health alert banner
 */
export function ProviderHealthAlert({ className }: { className?: string }) {
  const { hasCritical, hasUnhealthy, unhealthyProviders, criticalProviders } = useProvidersWithHealthIssues()

  if (!hasCritical && !hasUnhealthy) {
    return null
  }

  if (hasCritical) {
    const providerNames = criticalProviders
      .map((p) => PROVIDER_INFO[p.provider]?.name || p.provider)
      .join(', ')

    return (
      <div className={cn('flex items-center gap-2 rounded-md bg-destructive/10 px-4 py-3 text-sm', className)}>
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <div>
          <span className="font-medium text-destructive">Critical Health Issues</span>
          <p className="text-muted-foreground">
            {providerNames} {criticalProviders.length > 1 ? 'have' : 'has'} failed multiple consecutive health checks.
            AI requests may fail until the issue is resolved.
          </p>
        </div>
      </div>
    )
  }

  const providerNames = unhealthyProviders
    .map((p) => PROVIDER_INFO[p.provider]?.name || p.provider)
    .join(', ')

  return (
    <div className={cn('flex items-center gap-2 rounded-md bg-yellow-100 px-4 py-3 text-sm', className)}>
      <XCircle className="h-5 w-5 text-yellow-600" />
      <div>
        <span className="font-medium text-yellow-700">Provider Health Warning</span>
        <p className="text-muted-foreground">
          {providerNames} {unhealthyProviders.length > 1 ? 'are' : 'is'} currently unhealthy.
          Check your API key configuration.
        </p>
      </div>
    </div>
  )
}
