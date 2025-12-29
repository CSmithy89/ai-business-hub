/**
 * CCR Routing Configuration Component
 *
 * Allows users to configure CCR routing mode, fallback chains,
 * and per-agent routing overrides.
 *
 * @module components/settings
 * @story DM-01.6
 */

'use client';

import { useState } from 'react';
import {
  useCCRRoutingConfig,
  useAvailableRoutingProviders,
  useUpdateRoutingConfig,
  useUpdateAgentOverride,
  getRoutingModeLabel,
  getRoutingModeDescription,
  type RoutingMode,
  type RoutingProvider,
  type AgentRoutingOverride,
} from '@/hooks/useCCRRouting';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Network,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Check,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Routing mode options
 */
const ROUTING_MODES: RoutingMode[] = ['auto', 'cost-optimized', 'performance', 'manual'];

/**
 * Status indicator colors
 */
const STATUS_COLORS = {
  healthy: 'bg-green-500',
  degraded: 'bg-yellow-500',
  down: 'bg-red-500',
  unknown: 'bg-gray-400',
} as const;

/**
 * Routing mode selector
 */
function RoutingModeSelector({
  currentMode,
  onModeChange,
  disabled,
}: {
  currentMode: RoutingMode;
  onModeChange: (mode: RoutingMode) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Routing Mode</Label>
      <div className="grid gap-3 sm:grid-cols-2">
        {ROUTING_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onModeChange(mode)}
            disabled={disabled}
            className={cn(
              'relative flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors',
              'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              currentMode === mode
                ? 'border-primary bg-primary/5'
                : 'border-border',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            data-testid={`routing-mode-${mode}`}
          >
            {currentMode === mode && (
              <Check className="absolute right-3 top-3 h-4 w-4 text-primary" />
            )}
            <span className="font-medium">{getRoutingModeLabel(mode)}</span>
            <span className="text-sm text-muted-foreground">
              {getRoutingModeDescription(mode)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Provider status badge
 */
function ProviderStatusBadge({ status }: { status: RoutingProvider['status'] }) {
  const statusLabel = status ?? 'unknown';
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn('h-2 w-2 rounded-full', STATUS_COLORS[statusLabel])}
        data-testid={`provider-status-${statusLabel}`}
      />
      <span className="text-xs text-muted-foreground capitalize">{statusLabel}</span>
    </div>
  );
}

/**
 * Single fallback chain item
 */
function FallbackChainItem({
  provider,
  index,
  onToggle,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  disabled,
}: {
  provider: RoutingProvider;
  index: number;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-opacity',
        !provider.enabled && 'opacity-50'
      )}
      data-testid={`fallback-chain-item-${provider.id}`}
    >
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp || disabled}
          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label="Move up"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown || disabled}
          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label="Move down"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      <GripVertical className="h-4 w-4 text-muted-foreground" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{provider.name}</span>
          <ProviderStatusBadge status={provider.status} />
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {provider.provider} / {provider.model}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Priority {index + 1}</span>
        <Switch
          checked={provider.enabled}
          onCheckedChange={onToggle}
          disabled={disabled}
          aria-label={`Enable ${provider.name}`}
        />
      </div>
    </div>
  );
}

/**
 * Fallback chain configuration
 */
function FallbackChainConfig({
  chain,
  onChange,
  disabled,
}: {
  chain: RoutingProvider[];
  onChange: (chain: RoutingProvider[]) => void;
  disabled: boolean;
}) {
  const handleToggle = (index: number) => {
    const newChain = [...chain];
    newChain[index] = { ...newChain[index], enabled: !newChain[index].enabled };
    onChange(newChain);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newChain = [...chain];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newChain[index], newChain[targetIndex]] = [newChain[targetIndex], newChain[index]];
    // Update priorities
    newChain.forEach((p, i) => {
      p.priority = i + 1;
    });
    onChange(newChain);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Fallback Chain</Label>
        <span className="text-sm text-muted-foreground">
          {chain.filter((p) => p.enabled).length} of {chain.length} enabled
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        When a provider fails, requests automatically route to the next enabled provider.
      </p>
      <div className="space-y-2" data-testid="fallback-chain">
        {chain.map((provider, index) => (
          <FallbackChainItem
            key={provider.id}
            provider={provider}
            index={index}
            onToggle={() => handleToggle(index)}
            onMoveUp={() => handleMove(index, 'up')}
            onMoveDown={() => handleMove(index, 'down')}
            canMoveUp={index > 0}
            canMoveDown={index < chain.length - 1}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Agent routing override card
 */
function AgentOverrideCard({
  override,
  availableProviders,
  onUpdate,
  disabled,
}: {
  override: AgentRoutingOverride;
  availableProviders: RoutingProvider[];
  onUpdate: (preferredProviderId: string | null, fallbackEnabled: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-3"
      data-testid={`agent-override-${override.agentId}`}
    >
      <div className="flex-1 min-w-0">
        <span className="font-medium">{override.agentName}</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <select
          className="w-full sm:w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={override.preferredProviderId ?? ''}
          onChange={(e) => onUpdate(e.target.value || null, override.fallbackEnabled)}
          disabled={disabled}
          aria-label={`Provider for ${override.agentName}`}
        >
          <option value="">Use default routing</option>
          {availableProviders
            .filter((p) => p.enabled)
            .map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
        </select>

        <div className="flex items-center gap-2">
          <Switch
            id={`fallback-${override.agentId}`}
            checked={override.fallbackEnabled}
            onCheckedChange={(checked) => onUpdate(override.preferredProviderId, checked)}
            disabled={disabled}
          />
          <Label htmlFor={`fallback-${override.agentId}`} className="text-sm whitespace-nowrap">
            Allow fallback
          </Label>
        </div>
      </div>
    </div>
  );
}

/**
 * Agent routing overrides section
 */
function AgentRoutingOverrides({
  overrides,
  availableProviders,
  onUpdate,
  disabled,
}: {
  overrides: AgentRoutingOverride[];
  availableProviders: RoutingProvider[];
  onUpdate: (agentId: string, preferredProviderId: string | null, fallbackEnabled: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Per-Agent Overrides</Label>
      <p className="text-sm text-muted-foreground">
        Override routing settings for specific agents. Leave on default to use the global routing mode.
      </p>
      <div className="space-y-2" data-testid="agent-overrides">
        {overrides.map((override) => (
          <AgentOverrideCard
            key={override.agentId}
            override={override}
            availableProviders={availableProviders}
            onUpdate={(preferredProviderId, fallbackEnabled) =>
              onUpdate(override.agentId, preferredProviderId, fallbackEnabled)
            }
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Main CCR Routing Configuration component
 */
export function CCRRoutingConfig() {
  const { data: config, isLoading: isLoadingConfig, error: configError } = useCCRRoutingConfig();
  const { data: providers, isLoading: isLoadingProviders } = useAvailableRoutingProviders();
  const updateConfigMutation = useUpdateRoutingConfig();
  const updateOverrideMutation = useUpdateAgentOverride();

  const [localChain, setLocalChain] = useState<RoutingProvider[] | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isLoading = isLoadingConfig || isLoadingProviders;
  const isSaving = updateConfigMutation.isPending || updateOverrideMutation.isPending;

  // Use local chain if modified, otherwise use config
  const displayChain = localChain ?? config?.fallbackChain ?? [];

  const handleModeChange = async (mode: RoutingMode) => {
    await updateConfigMutation.mutateAsync({ mode });
  };

  const handleAutoFailoverChange = async (enabled: boolean) => {
    await updateConfigMutation.mutateAsync({ autoFailover: enabled });
  };

  const handleChainChange = (chain: RoutingProvider[]) => {
    setLocalChain(chain);
    setHasUnsavedChanges(true);
  };

  const handleSaveChain = async () => {
    if (localChain) {
      await updateConfigMutation.mutateAsync({ fallbackChain: localChain });
      setLocalChain(null);
      setHasUnsavedChanges(false);
    }
  };

  const handleAgentOverrideUpdate = async (
    agentId: string,
    preferredProviderId: string | null,
    fallbackEnabled: boolean
  ) => {
    await updateOverrideMutation.mutateAsync({
      agentId,
      preferredProviderId,
      fallbackEnabled,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Routing Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (configError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Routing Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load routing configuration</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Routing Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No routing configuration found. Add AI providers first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="ccr-routing-config">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Routing Configuration
        </CardTitle>
        <CardDescription>
          Configure how AI requests are routed between providers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Routing Mode */}
        <RoutingModeSelector
          currentMode={config.mode}
          onModeChange={handleModeChange}
          disabled={isSaving}
        />

        {/* Auto Failover Toggle */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="text-base">Automatic Failover</Label>
            <p className="text-sm text-muted-foreground">
              Automatically switch to backup providers when primary fails
            </p>
          </div>
          <Switch
            checked={config.autoFailover}
            onCheckedChange={handleAutoFailoverChange}
            disabled={isSaving}
            data-testid="auto-failover-toggle"
          />
        </div>

        {/* Fallback Chain */}
        <div className="space-y-4">
          <FallbackChainConfig
            chain={displayChain}
            onChange={handleChainChange}
            disabled={isSaving}
          />
          {hasUnsavedChanges && (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLocalChain(null);
                  setHasUnsavedChanges(false);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveChain}
                disabled={isSaving}
                data-testid="save-fallback-chain"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* Agent Overrides */}
        {config.agentOverrides.length > 0 && (
          <AgentRoutingOverrides
            overrides={config.agentOverrides}
            availableProviders={providers ?? []}
            onUpdate={handleAgentOverrideUpdate}
            disabled={isSaving}
          />
        )}

        {/* Info box */}
        <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium">How routing works</p>
            <p className="text-muted-foreground">
              CCR (Claude Code Router) intelligently routes requests based on your configuration.
              In auto mode, it considers task complexity, provider health, and cost to select
              the optimal provider. Manual mode gives you full control over routing decisions.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
