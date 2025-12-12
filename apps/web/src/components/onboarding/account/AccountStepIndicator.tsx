/**
 * Account Step Indicator Component
 *
 * Displays progress through the 4-step account onboarding wizard.
 * Shows step dots with current step highlighted in coral.
 *
 * Story: 15.3 - Implement 4-Step User Onboarding Wizard
 * Story: 16-20 - Onboarding Step Indicator Polish
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
  const progressPercentage = (currentStep / STEPS.length) * 100;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Progress percentage */}
      <div className="text-sm text-muted-foreground">
        {Math.round(progressPercentage)}% Complete
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const canClick = onStepClick && stepNumber < currentStep;

          return (
            <div key={step.label} className="flex items-center">
              {/* Step Dot with CSS transition */}
              <button
                type="button"
                onClick={() => canClick && onStepClick(stepNumber)}
                disabled={!canClick}
                className={cn(
                  'relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium',
                  'transition-all duration-300 ease-out',
                  // Completed: coral fill with checkmark
                  isComplete &&
                    'bg-[rgb(var(--color-primary-500))] text-white cursor-pointer',
                  // Active: coral fill with ring effect
                  isCurrent && 'bg-[rgb(var(--color-primary-500))] text-white scale-110 shadow-[0_0_0_4px_rgba(255,107,107,0.2)]',
                  // Upcoming: gray outline
                  !isComplete && !isCurrent && 'border-2 border-[rgb(var(--color-border-default))] bg-background text-muted-foreground',
                  canClick && 'hover:opacity-90'
                )}
                aria-label={`Step ${stepNumber}: ${step.label}${isComplete ? ' (complete)' : isCurrent ? ' (current)' : ''}`}
              >
                {/* Icon/Number */}
                <span className="transition-transform duration-200">
                  {isComplete ? <Check className="h-4 w-4" /> : stepNumber}
                </span>
              </button>

              {/* Connector Line (not after last step) */}
              {index < STEPS.length - 1 && (
                <div className="relative mx-1 h-0.5 w-8 sm:w-12 bg-[rgb(var(--color-border-default))] overflow-hidden">
                  {/* Filled portion for completed steps - animated */}
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 bg-[rgb(var(--color-primary-500))]',
                      'transition-all duration-400 ease-out'
                    )}
                    style={{
                      width: stepNumber < currentStep ? '100%' : '0%',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Step labels below */}
      <div className="flex items-center justify-center gap-6 sm:gap-10">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isCurrent = stepNumber === currentStep;
          const isComplete = stepNumber < currentStep;

          return (
            <span
              key={step.label}
              className={cn(
                'text-xs transition-all duration-200',
                isCurrent && 'font-medium text-foreground',
                isComplete && 'text-[rgb(var(--color-primary-500))]',
                !isCurrent && !isComplete && 'text-muted-foreground'
              )}
            >
              {step.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
