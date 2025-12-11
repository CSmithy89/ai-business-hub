/**
 * Wizard Step 4: Confirm and Launch Component
 *
 * Displays:
 * - Business name with logo placeholder
 * - AI team introduction (Vera, Blake, Bella)
 * - What happens next timeline
 * - Summary sections with edit capability
 *
 * Per wireframe BO-05: Launch & Summary
 *
 * Story: 08.3 - Implement Onboarding Wizard UI
 * Story: 15.16 - Enhance Business Onboarding Wizard
 */

'use client'

import { useState } from 'react'
import { ArrowLeft, Rocket, Loader2, Edit, FileText, Sparkles, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface WizardData {
  hasDocuments: boolean | null
  businessName: string
  businessDescription: string
  industry?: string
  stage?: string
  teamSize?: string
  fundingStatus?: string
  problemStatement: string
  targetCustomer: string
  proposedSolution: string
}

interface WizardStepConfirmProps {
  wizardData: WizardData
  onLaunch: () => Promise<void>
  onBack: () => void
  onEdit: (step: number) => void
}

/**
 * AI Team agents that will work on the business
 */
const AI_TEAM = [
  {
    name: 'Vera',
    role: 'Validation Lead',
    emoji: '🎯',
    color: 'bg-coral-100 dark:bg-coral-900/20',
    textColor: 'text-coral-600 dark:text-coral-400',
  },
  {
    name: 'Blake',
    role: 'Planning Lead',
    emoji: '📋',
    color: 'bg-blue-100 dark:bg-blue-900/20',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    name: 'Bella',
    role: 'Brand Lead',
    emoji: '🎨',
    color: 'bg-purple-100 dark:bg-purple-900/20',
    textColor: 'text-purple-600 dark:text-purple-400',
  },
]

/**
 * What happens next steps
 */
const NEXT_STEPS = [
  { agent: 'Vera', action: 'will validate your business idea' },
  { agent: 'Blake', action: 'will create your business plan' },
  { agent: 'Bella', action: 'will develop your brand identity' },
  { agent: 'You', action: 'will be ready to operate' },
]

export function WizardStepConfirm({
  wizardData,
  onLaunch,
  onBack,
  onEdit,
}: WizardStepConfirmProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLaunch = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await onLaunch()
    } catch (err) {
      console.error('Launch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create business. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Header with Business Name */}
      <div className="text-center space-y-4">
        {/* Celebration Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Rocket className="h-10 w-10 text-primary" />
        </div>

        {/* Business Name Display */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Step 4 of 4</p>
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to launch: {wizardData.businessName}
          </h2>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button variant="link" onClick={handleLaunch} disabled={isLoading} className="mt-2 p-0">
            Try again
          </Button>
        </div>
      )}

      {/* AI Team Introduction */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-center">Your AI Team is ready</h3>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
          {AI_TEAM.map((agent) => (
            <div key={agent.name} className="text-center">
              <div className={cn(
                'mx-auto h-16 w-16 rounded-full flex items-center justify-center text-3xl',
                agent.color
              )}>
                {agent.emoji}
              </div>
              <p className="mt-2 font-semibold">{agent.emoji} {agent.name}</p>
              <p className="text-sm text-muted-foreground">{agent.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What Happens Next */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-center">What happens next</h3>
        <ul className="space-y-3">
          {NEXT_STEPS.map((step, index) => (
            <li
              key={index}
              className="flex items-start gap-3 rounded-lg bg-muted/50 p-3"
            >
              <CheckCircle2 className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
              <span className="text-sm sm:text-base">
                <strong>{step.agent}</strong> {step.action}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Summary Sections - Collapsible */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Review your details</h3>

        {/* Starting Method */}
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {wizardData.hasDocuments ? (
                  <FileText className="h-4 w-4 text-primary" />
                ) : (
                  <Sparkles className="h-4 w-4 text-primary" />
                )}
                Starting Method
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onEdit(1)} disabled={isLoading}>
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit starting method</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              {wizardData.hasDocuments
                ? 'Starting with existing documents'
                : 'Starting from scratch with AI guidance'}
            </p>
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Business Details</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onEdit(2)} disabled={isLoading}>
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit business details</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{wizardData.businessName}</span>
              {wizardData.industry && (
                <>
                  <span className="text-muted-foreground">Industry:</span>
                  <span>{wizardData.industry}</span>
                </>
              )}
              {wizardData.stage && (
                <>
                  <span className="text-muted-foreground">Stage:</span>
                  <span className="capitalize">{wizardData.stage.replace('-', ' ')}</span>
                </>
              )}
              {wizardData.teamSize && (
                <>
                  <span className="text-muted-foreground">Team size:</span>
                  <span>{wizardData.teamSize}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business Idea */}
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Business Idea</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onEdit(3)} disabled={isLoading}>
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit business idea</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Problem: </span>
              <span>{wizardData.problemStatement}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Target: </span>
              <span>{wizardData.targetCustomer}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Solution: </span>
              <span>{wizardData.proposedSolution}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleLaunch} disabled={isLoading} size="lg">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Launch Business
              <Rocket className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
