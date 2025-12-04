/**
 * Wizard Step 4: Confirm and Launch Component
 *
 * Displays summary of all captured data:
 * - Chosen path (documents or fresh start)
 * - Business details (name, description)
 * - Business idea (problem, customer, solution)
 *
 * Allows editing any section before final submission.
 *
 * Story: 08.3 - Implement Onboarding Wizard UI
 */

'use client'

import { useState } from 'react'
import { ArrowLeft, Rocket, Loader2, Edit, FileText, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface WizardData {
  hasDocuments: boolean | null
  businessName: string
  businessDescription: string
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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Review and Launch</h2>
        <p className="text-muted-foreground">Review your information before launching</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="link" onClick={handleLaunch} disabled={isLoading} className="mt-2 p-0">
            Try again
          </Button>
        </div>
      )}

      {/* Summary Sections */}
      <div className="space-y-4">
        {/* Starting Method */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {wizardData.hasDocuments ? (
                  <>
                    <FileText className="h-5 w-5 text-primary" />
                    Starting Method
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 text-primary" />
                    Starting Method
                  </>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onEdit(1)} disabled={isLoading}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {wizardData.hasDocuments
                ? 'Starting with existing documents - AI will extract information and identify gaps'
                : 'Starting from scratch - AI will guide you through validation, planning, and branding'}
            </p>
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Business Details</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onEdit(2)} disabled={isLoading}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Business Name</div>
              <div className="font-medium">{wizardData.businessName}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Description</div>
              <div className="text-sm">{wizardData.businessDescription}</div>
            </div>
          </CardContent>
        </Card>

        {/* Business Idea */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Business Idea</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onEdit(3)} disabled={isLoading}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Problem Statement</div>
              <div className="text-sm">{wizardData.problemStatement}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Target Customer</div>
              <div className="text-sm">{wizardData.targetCustomer}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Proposed Solution</div>
              <div className="text-sm">{wizardData.proposedSolution}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
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
