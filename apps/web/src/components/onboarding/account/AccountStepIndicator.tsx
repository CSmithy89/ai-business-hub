/**
 * Account Step Indicator Component
 *
 * Displays progress through the 4-step account onboarding wizard.
 * Shows step dots with current step highlighted.
 *
 * Story: 15.3 - Implement 4-Step User Onboarding Wizard
 */

'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { label: 'Workspace' },
  { label: 'AI Setup' },
  { label: 'Meet Team' },
  { label: 'Ready' },
];

interface AccountStepIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function AccountStepIndicator({ currentStep, onStepClick }: AccountStepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const isComplete = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const canClick = onStepClick && stepNumber < currentStep;

        return (
          <div key={step.label} className="flex items-center">
            {/* Step Dot */}
            <button
              type="button"
              onClick={() => canClick && onStepClick(stepNumber)}
              disabled={!canClick}
              className={cn(
                'relative flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all',
                isComplete &&
                  'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer',
                isCurrent && 'bg-coral text-white ring-4 ring-coral/20',
                !isComplete && !isCurrent && 'bg-muted text-muted-foreground',
                canClick && 'cursor-pointer'
              )}
              aria-label={`Step ${stepNumber}: ${step.label}${isComplete ? ' (complete)' : isCurrent ? ' (current)' : ''}`}
            >
              {isComplete ? <Check className="h-4 w-4" /> : stepNumber}
            </button>

            {/* Connector Line (not after last step) */}
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-0.5 w-8 sm:w-12',
                  stepNumber < currentStep ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
