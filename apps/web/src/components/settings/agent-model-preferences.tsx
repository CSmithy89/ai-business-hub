/**
 * Agent Model Preferences Component
 *
 * Allows users to configure which AI model each agent team should use.
 *
 * @module components/settings
 */

'use client';

import { useState } from 'react';
import {
  useAgentPreferences,
  useAvailableModels,
  useUpdateAgentPreference,
  useResetAgentPreference,
  AgentPreference,
  AvailableModel,
} from '@/hooks/use-agent-preferences';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw, Check, AlertCircle, Cpu, Bot } from 'lucide-react';

/**
 * Group models by provider
 */
function groupModelsByProvider(
  models: AvailableModel[]
): Record<string, AvailableModel[]> {
  return models.reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<string, AvailableModel[]>
  );
}

/**
 * Model selector dropdown
 */
function ModelSelector({
  currentModel,
  currentProviderId,
  availableModels,
  onSelect,
  disabled,
}: {
  currentModel: string | null;
  currentProviderId: string | null;
  availableModels: AvailableModel[];
  onSelect: (providerId: string, model: string) => void;
  disabled: boolean;
}) {
  const groupedModels = groupModelsByProvider(availableModels);
  const currentValue = currentProviderId && currentModel
    ? `${currentProviderId}:${currentModel}`
    : '';

  return (
    <select
      className="w-full md:w-[280px] rounded-md border border-input bg-background px-3 py-2 text-sm"
      value={currentValue}
      onChange={(e) => {
        const [providerId, model] = e.target.value.split(':');
        if (providerId && model) {
          onSelect(providerId, model);
        }
      }}
      disabled={disabled}
    >
      <option value="">Use default model</option>
      {Object.entries(groupedModels).map(([provider, models]) => (
        <optgroup key={provider} label={provider.toUpperCase()}>
          {models.map((m) => (
            <option
              key={`${m.providerId}:${m.model}`}
              value={`${m.providerId}:${m.model}`}
            >
              {m.model} (${m.costPer1MTokens}/1M tokens)
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

/**
 * Single agent preference card
 */
function AgentPreferenceCard({
  preference,
  availableModels,
  onUpdate,
  onReset,
  isUpdating,
}: {
  preference: AgentPreference;
  availableModels: AvailableModel[];
  onUpdate: (providerId: string, model: string) => void;
  onReset: () => void;
  isUpdating: boolean;
}) {
  const { agent, currentProviderId, currentModel, isCustom } = preference;
  const categoryColor = agent.category === 'core'
    ? 'bg-blue-100 text-blue-800'
    : 'bg-green-100 text-green-800';

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-muted rounded-lg">
            {agent.category === 'core' ? (
              <Cpu className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Bot className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{agent.name}</h3>
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${categoryColor}`}
              >
                {agent.category}
              </span>
              {isCustom && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800">
                  Custom
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {agent.description}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Default: {agent.defaultProvider} / {agent.defaultModel}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <ModelSelector
          currentModel={currentModel}
          currentProviderId={currentProviderId}
          availableModels={availableModels}
          onSelect={onUpdate}
          disabled={isUpdating}
        />
        {isCustom && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={isUpdating}
            title="Reset to default"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Agent Model Preferences main component
 */
export function AgentModelPreferences() {
  const {
    data: preferences,
    isLoading: isLoadingPrefs,
    error: prefsError,
  } = useAgentPreferences();
  const {
    data: availableModels,
    isLoading: isLoadingModels,
  } = useAvailableModels();
  const updateMutation = useUpdateAgentPreference();
  const resetMutation = useResetAgentPreference();
  const [updatingAgentId, setUpdatingAgentId] = useState<string | null>(null);

  const handleUpdate = async (agentId: string, providerId: string, model: string) => {
    setUpdatingAgentId(agentId);
    try {
      await updateMutation.mutateAsync({ agentId, providerId, model });
    } finally {
      setUpdatingAgentId(null);
    }
  };

  const handleReset = async (agentId: string) => {
    setUpdatingAgentId(agentId);
    try {
      await resetMutation.mutateAsync(agentId);
    } finally {
      setUpdatingAgentId(null);
    }
  };

  if (isLoadingPrefs || isLoadingModels) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Model Preferences</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (prefsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Model Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load agent preferences</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preferences?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Model Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No agent teams configured. Add AI providers first.
          </p>
        </CardContent>
      </Card>
    );
  }

  const coreAgents = preferences.filter((p) => p.agent.category === 'core');
  const moduleAgents = preferences.filter((p) => p.agent.category === 'module');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          Agent Model Preferences
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure which AI model each agent team should use.
          Custom preferences override the default model for each agent.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core Agents */}
        {coreAgents.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Core Agent Teams</h3>
            <div className="space-y-4">
              {coreAgents.map((pref) => (
                <AgentPreferenceCard
                  key={pref.agent.id}
                  preference={pref}
                  availableModels={availableModels || []}
                  onUpdate={(providerId, model) =>
                    handleUpdate(pref.agent.id, providerId, model)
                  }
                  onReset={() => handleReset(pref.agent.id)}
                  isUpdating={updatingAgentId === pref.agent.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Module Agents */}
        {moduleAgents.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Module Agent Teams</h3>
            <div className="space-y-4">
              {moduleAgents.map((pref) => (
                <AgentPreferenceCard
                  key={pref.agent.id}
                  preference={pref}
                  availableModels={availableModels || []}
                  onUpdate={(providerId, model) =>
                    handleUpdate(pref.agent.id, providerId, model)
                  }
                  onReset={() => handleReset(pref.agent.id)}
                  isUpdating={updatingAgentId === pref.agent.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Info box */}
        <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
          <Check className="h-5 w-5 text-green-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">How preferences work</p>
            <p className="text-muted-foreground">
              When an agent runs, it will use your custom model preference if set,
              otherwise it uses its default model. More expensive models may
              provide better results but will use more of your token budget.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
