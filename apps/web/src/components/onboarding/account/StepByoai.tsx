/**
 * Step 2: Add AI Provider (BYOAI) Component
 *
 * Second step of account onboarding wizard.
 * Allows user to configure their AI provider with API key validation.
 *
 * Story: 15.3 - Implement 4-Step User Onboarding Wizard
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  AlertTriangle,
  Brain,
  Bot,
  Sparkles,
  Zap,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AiProvider } from '@/stores/account-onboarding-store';

const PROVIDERS: {
  id: AiProvider;
  name: string;
  icon: typeof Brain;
  recommended?: boolean;
  description: string;
}[] = [
  {
    id: 'anthropic',
    name: 'Claude (Anthropic)',
    icon: Brain,
    recommended: true,
    description: 'Best for strategy, content, and complex reasoning',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: Bot,
    description: 'Versatile AI for general tasks',
  },
  {
    id: 'google',
    name: 'Google Gemini',
    icon: Sparkles,
    description: 'Great for research and analysis',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: Zap,
    description: 'Cost-effective for high-volume tasks',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: Globe,
    description: 'Access 100+ models through one API',
  },
];

interface StepByoaiProps {
  initialProvider: AiProvider | null;
  initialVerified: boolean;
  onContinue: (provider: AiProvider | null, verified: boolean, skipped: boolean) => void;
  onBack: () => void;
}

export function StepByoai({
  initialProvider,
  initialVerified,
  onContinue,
  onBack,
}: StepByoaiProps) {
  const [selectedProvider, setSelectedProvider] = useState<AiProvider | null>(initialProvider);
  const [apiKey, setApiKey] = useState('');
  const [verified, setVerified] = useState(initialVerified);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProviderSelect = (provider: AiProvider) => {
    setSelectedProvider(provider);
    setApiKey('');
    setVerified(false);
    setError(null);
  };

  const handleTestKey = async () => {
    if (!selectedProvider || !apiKey.trim()) return;

    setTesting(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-providers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKey.trim(),
        }),
      });

      const result = await response.json();

      if (result.valid) {
        setVerified(true);
      } else {
        setError(result.message || 'Invalid API key. Please check and try again.');
      }
    } catch {
      setError('Failed to validate API key. Please try again.');
    } finally {
      setTesting(false);
    }
  };

  const handleContinue = () => {
    if (verified && selectedProvider) {
      // Save provider config and continue
      saveProviderConfig();
      onContinue(selectedProvider, true, false);
    }
  };

  const handleSkip = () => {
    onContinue(null, false, true);
  };

  const saveProviderConfig = async () => {
    if (!selectedProvider || !apiKey.trim()) return;

    try {
      await fetch('/api/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKey.trim(),
        }),
      });
    } catch {
      // Silent fail - user can configure later in settings
      console.error('Failed to save AI provider configuration');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">Add Your AI Provider</h2>
        <p className="mt-2 text-muted-foreground">
          Bring your own AI key to power your agents. You can change this anytime.
        </p>
      </div>

      {/* Provider Selection */}
      <div className="mx-auto max-w-lg space-y-3">
        {PROVIDERS.map((provider) => {
          const Icon = provider.icon;
          const isSelected = selectedProvider === provider.id;

          return (
            <Card
              key={provider.id}
              className={cn(
                'cursor-pointer transition-all hover:border-primary/50',
                isSelected && 'border-primary ring-2 ring-primary/20'
              )}
              onClick={() => handleProviderSelect(provider.id)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{provider.name}</span>
                    {provider.recommended && (
                      <Badge variant="secondary" className="text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{provider.description}</p>
                </div>
                {isSelected && <Check className="h-5 w-5 text-primary" />}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* API Key Input */}
      {selectedProvider && (
        <div className="mx-auto max-w-lg space-y-3">
          <Label htmlFor="api-key">API Key</Label>
          <div className="flex gap-2">
            <Input
              id="api-key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setVerified(false);
                setError(null);
              }}
              autoComplete="off"
              disabled={testing || verified}
            />
            <Button
              variant="outline"
              onClick={handleTestKey}
              disabled={!apiKey.trim() || testing || verified}
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : verified ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                'Test'
              )}
            </Button>
          </div>

          {/* Success Message */}
          {verified && (
            <p className="flex items-center gap-1 text-sm text-green-600">
              <Check className="h-4 w-4" /> API key verified successfully
            </p>
          )}

          {/* Error Message */}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="mx-auto flex max-w-lg items-center justify-between gap-4 pt-4">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSkip}>
            Skip for now
          </Button>
          <Button onClick={handleContinue} disabled={!verified}>
            Continue
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Skip Warning */}
      <div className="mx-auto max-w-lg rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
        <div className="flex gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Without an AI provider, you&apos;ll have limited functionality. Your AI agents won&apos;t
            be able to process requests until you add a provider in Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
