'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { Agent } from '@hyvve/shared'

interface AIModelSettingsProps {
  formData: Partial<Agent['config']>
  onChange: (field: keyof Agent['config'], value: string | number | null | undefined) => void
}

/**
 * AIModelSettings Component
 *
 * AI model configuration including provider, model selection, temperature, tokens, and context window.
 */
export function AIModelSettings({ formData, onChange }: AIModelSettingsProps) {
  const temperature = formData.temperature ?? 1.0
  const maxTokens = formData.maxTokens ?? 4000
  const contextWindow = formData.contextWindow ?? 8000
  const model = formData.model ?? 'default'

  const getTemperatureDescription = (value: number) => {
    if (value <= 0.5) return 'Deterministic'
    if (value <= 1.5) return 'Balanced'
    return 'Creative'
  }

  const handleResetToDefaults = () => {
    onChange('model', null)
    onChange('temperature', 1.0)
    onChange('maxTokens', 4000)
    onChange('contextWindow', 8000)
  }

  return (
    <section id="ai-model">
      <Card>
        <CardHeader>
          <CardTitle>AI Model Settings</CardTitle>
          <CardDescription>
            Override workspace AI settings for this agent. Leave blank to use workspace defaults.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Model */}
          <div className="space-y-2">
            <Label htmlFor="model">Primary Model (Optional Override)</Label>
            <Select
              value={model || 'default'}
              onValueChange={value => onChange('model', value === 'default' ? null : value)}
            >
              <SelectTrigger id="model">
                <SelectValue placeholder="Use workspace default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Use Workspace Default</SelectItem>
                <SelectItem value="claude-sonnet-4">Claude Sonnet 4</SelectItem>
                <SelectItem value="claude-opus-4">Claude Opus 4</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                <SelectItem value="deepseek-chat">DeepSeek Chat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fallback Model */}
          <div className="space-y-2">
            <Label htmlFor="fallbackModel">Fallback Model (Optional)</Label>
            <Select disabled value="default">
              <SelectTrigger id="fallbackModel">
                <SelectValue placeholder="Use workspace fallback" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Use Workspace Fallback</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Fallback configuration coming in future release.
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature</Label>
              <span className="text-sm text-muted-foreground">
                {temperature.toFixed(1)} - {getTemperatureDescription(temperature)}
              </span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[temperature]}
              onValueChange={([value]: number[]) => onChange('temperature', value)}
            />
            <p className="text-xs text-muted-foreground">
              Controls randomness. Higher = more creative, Lower = more focused and deterministic.
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              min={100}
              max={32000}
              value={maxTokens}
              onChange={e => onChange('maxTokens', parseInt(e.target.value) || 100)}
            />
            <p className="text-xs text-muted-foreground">
              Maximum tokens per request (100-32,000).
            </p>
          </div>

          {/* Context Window */}
          <div className="space-y-2">
            <Label>Context Window</Label>
            <RadioGroup
              value={contextWindow.toString()}
              onValueChange={(value: string) => onChange('contextWindow', parseInt(value))}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4000" id="ctx-4k" />
                <Label htmlFor="ctx-4k" className="font-normal">
                  4K
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="8000" id="ctx-8k" />
                <Label htmlFor="ctx-8k" className="font-normal">
                  8K
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="16000" id="ctx-16k" />
                <Label htmlFor="ctx-16k" className="font-normal">
                  16K
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Cost Indicator (Placeholder) */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              💡 Estimated cost: ~$0.50 per 1K requests with current settings
            </p>
          </div>

          {/* Reset Button */}
          <Button variant="outline" onClick={handleResetToDefaults} className="w-full">
            Reset to Workspace Defaults
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}
