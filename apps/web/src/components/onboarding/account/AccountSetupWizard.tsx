/**
 * Account Setup Wizard Component
 *
 * Main orchestrator for the 4-step account onboarding wizard.
 * Manages step navigation and data flow between steps.
 *
 * Story: 15.3 - Implement 4-Step User Onboarding Wizard
 */

'use client';

import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  useAccountOnboardingStore,
  useAccountOnboardingStoreHydrated,
} from '@/stores/account-onboarding-store';
import { AccountStepIndicator } from './AccountStepIndicator';
import { StepWorkspace } from './StepWorkspace';
import { StepByoai } from './StepByoai';
import { StepAiTeam } from './StepAiTeam';
import { StepComplete } from './StepComplete';
import type { AiProvider } from '@/stores/account-onboarding-store';

interface AccountSetupWizardProps {
  userName?: string;
}

export function AccountSetupWizard({ userName }: AccountSetupWizardProps) {
  const router = useRouter();
  const isHydrated = useAccountOnboardingStoreHydrated();

  const {
    currentStep,
    isComplete,
    workspaceName,
    workspaceSlug,
    aiProvider,
    aiKeyVerified,
    setCurrentStep,
    setWorkspace,
    setWorkspaceId,
    setAiProvider,
    setAiKeyVerified,
    setSkippedAiSetup,
    markComplete,
    reset,
  } = useAccountOnboardingStore();

  // Redirect if already complete
  if (isHydrated && isComplete) {
    router.replace('/businesses' as Parameters<typeof router.replace>[0]);
    return null;
  }

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Step navigation
  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  // Step 1: Workspace created
  const handleWorkspaceComplete = (name: string, slug: string, workspaceId: string) => {
    setWorkspace(name, slug);
    setWorkspaceId(workspaceId);
    goToStep(2);
  };

  // Step 2: BYOAI configured or skipped
  const handleByoaiComplete = (provider: AiProvider | null, verified: boolean, skipped: boolean) => {
    setAiProvider(provider);
    setAiKeyVerified(verified);
    setSkippedAiSetup(skipped);
    goToStep(3);
  };

  // Step 3: AI Team intro done
  const handleAiTeamComplete = () => {
    goToStep(4);
  };

  // Step 4: All done
  const handleComplete = () => {
    markComplete();
    reset(); // Clear the store for next time
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Step Indicator */}
      <AccountStepIndicator
        currentStep={currentStep}
        onStepClick={(step) => step < currentStep && goToStep(step)}
      />

      {/* Step Content */}
      <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        {currentStep === 1 && (
          <StepWorkspace
            initialName={workspaceName}
            initialSlug={workspaceSlug}
            onContinue={handleWorkspaceComplete}
          />
        )}

        {currentStep === 2 && (
          <StepByoai
            initialProvider={aiProvider}
            initialVerified={aiKeyVerified}
            onContinue={handleByoaiComplete}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <StepAiTeam onContinue={handleAiTeamComplete} onBack={handleBack} />
        )}

        {currentStep === 4 && (
          <StepComplete
            userName={userName}
            workspaceName={workspaceName}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
}
