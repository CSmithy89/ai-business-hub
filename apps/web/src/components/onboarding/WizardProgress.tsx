/**
 * Wizard Progress Component
 *
 * Visual stepper showing wizard progress with 4 steps:
 * 1. Choice - Document upload vs fresh start
 * 2. Details - Business name and description
 * 3. Idea - Problem, customer, solution
 * 4. Launch - Review and confirm
 *
 * Story: 08.3 - Implement Onboarding Wizard UI
 * Story: 16-20 - Onboarding Step Indicator Polish
 */

'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WizardProgressProps {
  currentStep: number
  totalSteps?: number
  stepLabels?: string[]
  onStepClick?: (step: number) => void
}

const DEFAULT_STEP_LABELS = ['Choice', 'Details', 'Idea', 'Launch']
const DEFAULT_TOTAL_STEPS = 4

export function WizardProgress({
  currentStep,
  totalSteps = DEFAULT_TOTAL_STEPS,
  stepLabels = DEFAULT_STEP_LABELS,
  onStepClick,
}: WizardProgressProps) {
  // Guard against division by zero
  const safeTotal = Math.max(1, totalSteps)
  const progressPercentage = (currentStep / safeTotal) * 100
  // For line progress, we need at least 2 steps; otherwise show 0% or 100%
  const lineProgressPercentage = safeTotal <= 1
    ? (currentStep >= 1 ? 100 : 0)
    : ((currentStep - 1) / (safeTotal - 1)) * 100

  return (
    <div className="mb-8">
      {/* Step counter and percentage */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </div>
        <div className="text-sm font-medium text-[rgb(var(--color-primary-500))]">
          {Math.round(progressPercentage)}% Complete
        </div>
      </div>

      {/* Progress Bar with CSS transition */}
      <div className="h-2 bg-[rgb(var(--color-bg-muted))] rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-[rgb(var(--color-primary-500))] transition-all duration-400 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Step Indicators with connecting lines */}
      <div className="relative flex items-start justify-between">
        {/* Connecting line (behind steps) */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-[rgb(var(--color-border-default))]">
          <div
            className="h-full bg-[rgb(var(--color-primary-500))] transition-all duration-400 ease-out"
            style={{ width: `${lineProgressPercentage}%` }}
          />
        </div>

        {stepLabels.map((label, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isClickable = isCompleted && onStepClick

          return (
            <button
              key={stepNumber}
              type="button"
              onClick={() => isClickable && onStepClick(stepNumber)}
              disabled={!isClickable}
              className={cn(
                'relative z-10 flex flex-col items-center transition-opacity',
                isClickable && 'cursor-pointer hover:opacity-80',
                !isClickable && 'cursor-default'
              )}
            >
              {/* Step circle with CSS transition */}
              <div
                className={cn(
                  'mb-2 flex h-8 w-8 items-center justify-center rounded-full border-2',
                  'transition-all duration-300 ease-out',
                  // Completed: coral fill
                  isCompleted && 'border-[rgb(var(--color-primary-500))] bg-[rgb(var(--color-primary-500))] text-white',
                  // Active: coral fill with scale and ring
                  isCurrent && 'border-[rgb(var(--color-primary-500))] bg-[rgb(var(--color-primary-500))] text-white scale-115 shadow-[0_0_0_4px_rgba(255,107,107,0.2)]',
                  // Upcoming: gray outline
                  !isCompleted &&
                    !isCurrent &&
                    'border-[rgb(var(--color-border-default))] bg-background text-muted-foreground'
                )}
              >
                {/* Checkmark or number */}
                <span className="transition-transform duration-200">
                  {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
                </span>
              </div>

              {/* Step label */}
              <div
                className={cn(
                  'text-xs whitespace-nowrap transition-all duration-200',
                  isCurrent && 'font-medium text-foreground',
                  isCompleted && 'text-[rgb(var(--color-primary-500))]',
                  !isCurrent && !isCompleted && 'text-muted-foreground'
                )}
              >
                {label}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
