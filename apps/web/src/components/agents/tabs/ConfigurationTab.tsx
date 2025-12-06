'use client'

import { useState, useEffect } from 'react'
import type { Agent } from '@hyvve/shared'
import { useUpdateAgent } from '@/hooks/use-agent'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ConfigurationTabProps {
  agent: Agent
  isEditing: boolean
  onEditChange: (editing: boolean) => void
}

/**
 * ConfigurationTab Component
 *
 * Displays and allows editing of agent configuration settings.
 */
export function ConfigurationTab({
  agent,
  isEditing,
  onEditChange,
}: ConfigurationTabProps) {
  const updateAgent = useUpdateAgent(agent.id)

  // Form state
  const [formData, setFormData] = useState(agent.config)
  const [isDirty, setIsDirty] = useState(false)

  // Update form when agent changes
  useEffect(() => {
    setFormData(agent.config)
    setIsDirty(false)
  }, [agent.config])

  // Check if form is dirty
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(agent.config)
    setIsDirty(hasChanges)
  }, [formData, agent.config])

  const handleSave = async () => {
    try {
      await updateAgent.mutateAsync(formData)
      toast.success('Agent configuration has been updated successfully.')
      onEditChange(false)
      setIsDirty(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings')
    }
  }

  const handleCancel = () => {
    setFormData(agent.config)
    setIsDirty(false)
    onEditChange(false)
  }

  return (
    <div className="space-y-6">
      {/* AI Model Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Model Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Model */}
          <div className="space-y-2">
            <Label htmlFor="model">Primary Model (Optional Override)</Label>
            <Select
              value={formData.model || 'default'}
              onValueChange={value =>
                setFormData({ ...formData, model: value === 'default' ? null : value })
              }
              disabled={!isEditing}
            >
              <SelectTrigger id="model">
                <SelectValue placeholder="Use workspace default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Use Workspace Default</SelectItem>
                <SelectItem value="claude-sonnet-4">Claude Sonnet 4</SelectItem>
                <SelectItem value="claude-opus-4">Claude Opus 4</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature</Label>
              <span className="text-sm text-muted-foreground">
                {formData.temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[formData.temperature]}
              onValueChange={([value]: number[]) =>
                setFormData({ ...formData, temperature: value })
              }
              disabled={!isEditing}
            />
            <p className="text-xs text-muted-foreground">
              Controls randomness. Higher = more creative, Lower = more focused.
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              min={100}
              max={100000}
              value={formData.maxTokens}
              onChange={e =>
                setFormData({ ...formData, maxTokens: parseInt(e.target.value) || 0 })
              }
              disabled={!isEditing}
            />
          </div>

          {/* Context Window */}
          <div className="space-y-2">
            <Label>Context Window</Label>
            <RadioGroup
              value={formData.contextWindow.toString()}
              onValueChange={(value: string) =>
                setFormData({ ...formData, contextWindow: parseInt(value) })
              }
              disabled={!isEditing}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4000" id="ctx-4k" />
                <Label htmlFor="ctx-4k">4K</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="8000" id="ctx-8k" />
                <Label htmlFor="ctx-8k">8K</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="16000" id="ctx-16k" />
                <Label htmlFor="ctx-16k">16K</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Automation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Automation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Automation Level */}
          <div className="space-y-2">
            <Label>Automation Level</Label>
            <RadioGroup
              value={formData.automationLevel}
              onValueChange={(value: string) =>
                setFormData({
                  ...formData,
                  automationLevel: value as 'manual' | 'smart' | 'full_auto',
                })
              }
              disabled={!isEditing}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="auto-manual" />
                <Label htmlFor="auto-manual" className="font-normal">
                  Manual - Requires approval for all actions
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="smart" id="auto-smart" />
                <Label htmlFor="auto-smart" className="font-normal">
                  Smart - Auto-execute high-confidence tasks
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full_auto" id="auto-full" />
                <Label htmlFor="auto-full" className="font-normal">
                  Full Auto - Execute all tasks automatically
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Confidence Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="confidence">Confidence Threshold</Label>
              <span className="text-sm text-muted-foreground">
                {formData.confidenceThreshold}%
              </span>
            </div>
            <Slider
              id="confidence"
              min={0}
              max={100}
              step={5}
              value={[formData.confidenceThreshold]}
              onValueChange={([value]: number[]) =>
                setFormData({ ...formData, confidenceThreshold: value })
              }
              disabled={!isEditing}
            />
            <p className="text-xs text-muted-foreground">
              Minimum confidence score required for auto-execution.
            </p>
          </div>

          {/* Tone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="tone">Communication Tone</Label>
              <span className="text-sm text-muted-foreground">
                {formData.tone < 33 ? 'Professional' : formData.tone < 66 ? 'Balanced' : 'Casual'}
              </span>
            </div>
            <Slider
              id="tone"
              min={0}
              max={100}
              step={10}
              value={[formData.tone]}
              onValueChange={([value]: number[]) => setFormData({ ...formData, tone: value })}
              disabled={!isEditing}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Professional</span>
              <span>Casual</span>
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="instructions">Custom Instructions</Label>
              <span className="text-xs text-muted-foreground">
                {formData.customInstructions.length}/500
              </span>
            </div>
            <Textarea
              id="instructions"
              value={formData.customInstructions}
              onChange={e =>
                setFormData({ ...formData, customInstructions: e.target.value })
              }
              placeholder="Add custom instructions for this agent..."
              maxLength={500}
              rows={4}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!isDirty || updateAgent.isPending}>
            {updateAgent.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
