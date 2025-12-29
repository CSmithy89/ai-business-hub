/**
 * Onboarding Wizard Page
 *
 * Multi-step wizard for business onboarding with 4 steps:
 * 1. Choice: Upload documents vs fresh start
 * 2. Details: Business name and description
 * 3. Idea: Problem, customer, solution
 * 4. Confirm: Review and launch
 *
 * Features:
 * - State persistence to localStorage (resume after abandonment)
 * - URL parameter sync for deep linking
 * - Back navigation with data preservation
 * - Business creation API call on completion
 *
 * Story: 08.3 - Implement Onboarding Wizard UI
 */

'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  useOnboardingWizardStore,
  useOnboardingWizardStoreHydrated,
} from '@/stores/onboarding-wizard-store'
import { useAccountOnboardingStore, useAccountOnboardingStoreHydrated } from '@/stores/account-onboarding-store'
import { WizardProgress } from '@/components/onboarding/WizardProgress'
import { WizardStepChoice } from '@/components/onboarding/WizardStepChoice'
import { WizardStepDetails } from '@/components/onboarding/WizardStepDetails'
import { WizardStepIdea } from '@/components/onboarding/WizardStepIdea'
import { WizardStepConfirm } from '@/components/onboarding/WizardStepConfirm'
import type { BusinessDetailsFormData, BusinessIdeaFormData } from '@/lib/validations/onboarding'
import { Loader2 } from 'lucide-react'

function WizardPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isWizardHydrated = useOnboardingWizardStoreHydrated()
  const isAccountHydrated = useAccountOnboardingStoreHydrated()

  // Both stores need to be hydrated before we can proceed
  const isHydrated = isWizardHydrated && isAccountHydrated

  const {
    currentStep,
    hasDocuments,
    uploadedFiles,
    businessName,
    businessDescription,
    industry,
    stage,
    teamSize,
    fundingStatus,
    problemStatement,
    targetCustomer,
    proposedSolution,
    setCurrentStep,
    setHasDocuments,
    setUploadedFiles,
    setBusinessName,
    setBusinessDescription,
    setIndustry,
    setStage,
    setTeamSize,
    setFundingStatus,
    setProblemStatement,
    setTargetCustomer,
    setProposedSolution,
    reset,
  } = useOnboardingWizardStore()

  // Sync URL with current step
  // Extract step param to a stable variable for dependency array
  const stepParam = searchParams.get('step')

  useEffect(() => {
    if (!isHydrated) return

    const urlStep = parseInt(stepParam || '1', 10)

    // Handle invalid parse result
    if (Number.isNaN(urlStep)) {
      router.replace(`/onboarding/wizard?step=${currentStep}` as Parameters<typeof router.replace>[0])
      return
    }

    // Guard: If trying to access step 2+ but step 1 not completed (hasDocuments is null),
    // redirect back to step 1 to ensure proper flow
    if (urlStep > 1 && hasDocuments === null) {
      router.replace('/onboarding/wizard?step=1' as Parameters<typeof router.replace>[0])
      setCurrentStep(1)
      return
    }

    if (urlStep !== currentStep) {
      if (urlStep >= 1 && urlStep <= 4) {
        setCurrentStep(urlStep)
      } else {
        router.replace(`/onboarding/wizard?step=${currentStep}` as Parameters<typeof router.replace>[0])
      }
    }
  }, [stepParam, currentStep, setCurrentStep, router, isHydrated, hasDocuments])

  // Navigation handlers
  const goToStep = (step: number) => {
    setCurrentStep(step)
    router.push(`/onboarding/wizard?step=${step}` as Parameters<typeof router.push>[0])
  }

  const handleBack = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1)
    }
  }

  const handleEdit = (step: number) => {
    goToStep(step)
  }

  // Step 1: Choice handler
  const handleChoiceContinue = (hasDocsChoice: boolean, fileNames?: string[]) => {
    setHasDocuments(hasDocsChoice)
    if (fileNames) {
      setUploadedFiles(fileNames)
    }
    goToStep(2)
  }

  // Step 2: Details handler
  const handleDetailsContinue = (data: BusinessDetailsFormData) => {
    setBusinessName(data.name)
    setBusinessDescription(data.description ?? '')
    // Always update optional fields to support clearing previously set values
    // Use || '' to convert undefined to empty string for the store
    setIndustry(data.industry || '')
    setStage(data.stage || '')
    setTeamSize(data.teamSize || '')
    setFundingStatus(data.fundingStatus || '')
    goToStep(3)
  }

  // Step 3: Idea handler
  const handleIdeaContinue = (data: BusinessIdeaFormData) => {
    setProblemStatement(data.problemStatement)
    setTargetCustomer(data.targetCustomer)
    setProposedSolution(data.proposedSolution)
    goToStep(4)
  }

  // Step 4: Launch handler
  // Get workspaceId from account setup wizard (in case session cookie cache is stale)
  const { workspaceId: accountWorkspaceId } = useAccountOnboardingStore()

  const handleLaunch = async () => {
    try {
      // Call API to create business
      // Include workspaceId explicitly to handle session cookie cache staleness after workspace creation
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: businessName,
          description: businessDescription,
          hasDocuments: hasDocuments ?? false,
          // Convert empty strings to undefined for API payload
          industry: industry || undefined,
          stage: stage || undefined,
          teamSize: teamSize || undefined,
          fundingStatus: fundingStatus || undefined,
          ideaDescription: {
            problemStatement,
            targetCustomer,
            proposedSolution,
          },
          // Pass workspaceId explicitly from account setup wizard
          // This ensures business creation works even if session cookie cache is stale
          workspaceId: accountWorkspaceId || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create business')
      }

      const business = result.data

      // Clear wizard state
      reset()

      // Navigate to appropriate next step
      if (hasDocuments) {
        // Upload path: Go to document upload page (Story 08.4)
        router.push(`/onboarding/documents?businessId=${business.id}` as Parameters<typeof router.push>[0])
      } else {
        // Fresh start path: Go to validation page (Story 08.6)
        router.push(`/dashboard/${business.id}/validation` as Parameters<typeof router.push>[0])
      }
    } catch (error) {
      console.error('Business creation error:', error)
      throw error // Re-throw to be caught by WizardStepConfirm
    }
  }

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Wizard Progress */}
      <WizardProgress currentStep={currentStep} onStepClick={handleEdit} />

      {/* Step Content */}
      <div className="bg-card border rounded-lg p-8">
        {currentStep === 1 && (
          <WizardStepChoice
            initialValue={hasDocuments}
            initialFiles={uploadedFiles}
            onContinue={handleChoiceContinue}
          />
        )}

        {currentStep === 2 && (
          <WizardStepDetails
            initialData={{
              name: businessName,
              description: businessDescription,
              industry: industry,
              // Convert empty strings to undefined for the form component's typed props
              stage: stage || undefined,
              teamSize: teamSize || undefined,
              fundingStatus: fundingStatus || undefined,
            }}
            onContinue={handleDetailsContinue}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <WizardStepIdea
            initialData={{
              problemStatement,
              targetCustomer,
              proposedSolution,
            }}
            onContinue={handleIdeaContinue}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && (
          <WizardStepConfirm
            wizardData={{
              hasDocuments,
              businessName,
              businessDescription,
              // Convert empty strings to undefined for the confirm component's typed props
              industry: industry || undefined,
              stage: stage || undefined,
              teamSize: teamSize || undefined,
              fundingStatus: fundingStatus || undefined,
              problemStatement,
              targetCustomer,
              proposedSolution,
            }}
            onLaunch={handleLaunch}
            onBack={handleBack}
            onEdit={handleEdit}
          />
        )}
      </div>

      {/* Start Over Button (for testing/development) */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            if (confirm('Are you sure you want to start over? All entered data will be lost.')) {
              reset()
              router.push('/onboarding/wizard?step=1' as Parameters<typeof router.push>[0])
            }
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  )
}

function WizardLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function WizardPage() {
  return (
    <Suspense fallback={<WizardLoadingFallback />}>
      <WizardPageContent />
    </Suspense>
  )
}
