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
  const progressPercentage = (currentStep / totalSteps) * 100

  return (
    <div className="mb-8">
      {/* Step counter and percentage */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </div>
        <div className="text-sm font-medium">{Math.round(progressPercentage)}% Complete</div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Step Labels */}
      <div className="flex items-center justify-between">
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
                'flex flex-col items-center transition-opacity',
                isClickable && 'cursor-pointer hover:opacity-80',
                !isClickable && 'cursor-default'
              )}
            >
              {/* Step circle */}
              <div
                className={cn(
                  'mb-2 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                  isCompleted && 'border-primary bg-primary text-primary-foreground',
                  isCurrent && 'border-primary bg-background text-primary',
                  !isCompleted &&
                    !isCurrent &&
                    'border-muted-foreground/30 bg-background text-muted-foreground'
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
              </div>

              {/* Step label */}
              <div
                className={cn(
                  'text-xs',
                  isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
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
