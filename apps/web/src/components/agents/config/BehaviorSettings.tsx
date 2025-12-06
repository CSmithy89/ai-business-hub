'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { Agent } from '@hyvve/shared'

interface BehaviorSettingsProps {
  formData: Partial<Agent['config']>
  onChange: (field: keyof Agent['config'], value: string | number | null | undefined) => void
}

/**
 * BehaviorSettings Component
 *
 * Agent behavior configuration including automation level, confidence threshold, tone, and custom instructions.
 */
export function BehaviorSettings({ formData, onChange }: BehaviorSettingsProps) {
  const automationLevel = formData.automationLevel ?? 'smart'
  const confidenceThreshold = formData.confidenceThreshold ?? 70
  const tone = formData.tone ?? 50
  const customInstructions = formData.customInstructions ?? ''

  const getConfidenceDescription = (value: number) => {
    if (value < 60) return 'Low - More human review required'
    if (value < 85) return 'Medium - Balanced automation'
    return 'High - Maximum automation'
  }

  const getTonePreview = (value: number) => {
    if (value < 33) return 'Formal: "Please find the analysis attached herewith."'
    if (value < 66)
      return 'Balanced: "Here is the analysis you requested. Let me know if you need anything else."'
    return "Casual: \"Here's the analysis! Feel free to ping me if you need more info 😊\""
  }

  return (
    <section id="behavior">
      <Card>
        <CardHeader>
          <CardTitle>Behavior Settings</CardTitle>
          <CardDescription>
            Configure how this agent operates and communicates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Automation Level */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label>Automation Level</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Controls how much autonomy this agent has to execute tasks without human
                      approval.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <RadioGroup
              value={automationLevel}
              onValueChange={(value: string) =>
                onChange('automationLevel', value as Agent['config']['automationLevel'])
              }
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <RadioGroupItem value="manual" id="auto-manual" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="auto-manual" className="font-semibold">
                    Manual
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Agent suggests, human approves all actions
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 rounded-lg border p-4 bg-primary/5">
                <RadioGroupItem value="smart" id="auto-smart" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="auto-smart" className="font-semibold">
                    Smart (Recommended)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Agent auto-executes high-confidence tasks (&gt;85%)
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <RadioGroupItem value="full_auto" id="auto-full" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="auto-full" className="font-semibold">
                    Full Auto
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Agent handles everything, notifies on completion
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Confidence Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="confidence">Confidence Threshold</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Minimum confidence score required for the agent to auto-execute tasks in
                        Smart mode.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm text-muted-foreground">{confidenceThreshold}%</span>
            </div>
            <Slider
              id="confidence"
              min={0}
              max={100}
              step={5}
              value={[confidenceThreshold]}
              onValueChange={([value]: number[]) => onChange('confidenceThreshold', value)}
            />
            <p className="text-xs text-muted-foreground">
              {getConfidenceDescription(confidenceThreshold)}
            </p>
          </div>

          {/* Tone Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="tone">Communication Tone</Label>
              <span className="text-sm text-muted-foreground">
                {tone < 33 ? 'Professional' : tone < 66 ? 'Balanced' : 'Casual'}
              </span>
            </div>
            <Slider
              id="tone"
              min={0}
              max={100}
              step={10}
              value={[tone]}
              onValueChange={([value]: number[]) => onChange('tone', value)}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Professional</span>
              <span>Casual</span>
            </div>
            <div className="mt-2 rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">
              Preview: {getTonePreview(tone)}
            </p>
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="instructions">Custom Instructions</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Additional instructions to guide this agent&apos;s behavior. Supports basic
                        Markdown formatting.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-xs text-muted-foreground">
                {customInstructions.length}/500
              </span>
            </div>
            <Textarea
              id="instructions"
              value={customInstructions}
              onChange={e => onChange('customInstructions', e.target.value)}
              placeholder="Add custom instructions for this agent..."
              maxLength={500}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
