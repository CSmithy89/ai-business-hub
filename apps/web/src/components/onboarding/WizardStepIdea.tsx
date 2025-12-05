/**
 * Wizard Step 3: Initial Idea Component
 *
 * Captures business idea details:
 * - Problem statement (10-300 chars)
 * - Target customer (5-200 chars)
 * - Proposed solution (10-300 chars)
 *
 * Includes helper text and character counts.
 *
 * Story: 08.3 - Implement Onboarding Wizard UI
 */

'use client'

import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { businessIdeaSchema, type BusinessIdeaFormData } from '@/lib/validations/onboarding'
import { cn } from '@/lib/utils'

interface WizardStepIdeaProps {
  initialData?: BusinessIdeaFormData
  onContinue: (data: BusinessIdeaFormData) => void
  onBack: () => void
}

export function WizardStepIdea({ initialData, onContinue, onBack }: WizardStepIdeaProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BusinessIdeaFormData>({
    resolver: standardSchemaResolver(businessIdeaSchema),
    mode: 'onBlur',
    defaultValues: initialData || {
      problemStatement: '',
      targetCustomer: '',
      proposedSolution: '',
    },
  })

  const problemStatement = watch('problemStatement', '')
  const targetCustomer = watch('targetCustomer', '')
  const proposedSolution = watch('proposedSolution', '')

  const onSubmit = async (data: BusinessIdeaFormData) => {
    onContinue(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Capture your business idea</h2>
        <p className="text-muted-foreground">
          Help us understand the problem you&apos;re solving and who you&apos;re solving it for
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Problem Statement */}
        <div className="space-y-2">
          <Label htmlFor="problemStatement">
            Problem Statement <span className="text-red-600">*</span>
          </Label>
          <p className="text-sm text-muted-foreground">
            What problem are you solving? (e.g., SMBs struggle with outdated CRM systems)
          </p>
          <Textarea
            id="problemStatement"
            placeholder="Describe the problem your business addresses..."
            rows={3}
            {...register('problemStatement')}
            disabled={isSubmitting}
            aria-invalid={errors.problemStatement ? 'true' : 'false'}
            aria-describedby={
              errors.problemStatement
                ? 'problemStatement-error problemStatement-count'
                : 'problemStatement-count'
            }
          />
          {errors.problemStatement && (
            <p id="problemStatement-error" className="text-sm text-red-600">
              {errors.problemStatement.message}
            </p>
          )}
          <p
            id="problemStatement-count"
            className={cn(
              'text-xs',
              problemStatement.length > 300 ? 'text-red-600' : 'text-muted-foreground'
            )}
          >
            {problemStatement.length}/300 characters
          </p>
        </div>

        {/* Target Customer */}
        <div className="space-y-2">
          <Label htmlFor="targetCustomer">
            Target Customer <span className="text-red-600">*</span>
          </Label>
          <p className="text-sm text-muted-foreground">
            Who is your ideal customer? (e.g., Small businesses with 5-50 employees)
          </p>
          <Input
            id="targetCustomer"
            type="text"
            placeholder="Describe your target customer..."
            {...register('targetCustomer')}
            disabled={isSubmitting}
            aria-invalid={errors.targetCustomer ? 'true' : 'false'}
            aria-describedby={
              errors.targetCustomer
                ? 'targetCustomer-error targetCustomer-count'
                : 'targetCustomer-count'
            }
          />
          {errors.targetCustomer && (
            <p id="targetCustomer-error" className="text-sm text-red-600">
              {errors.targetCustomer.message}
            </p>
          )}
          <p
            id="targetCustomer-count"
            className={cn(
              'text-xs',
              targetCustomer.length > 200 ? 'text-red-600' : 'text-muted-foreground'
            )}
          >
            {targetCustomer.length}/200 characters
          </p>
        </div>

        {/* Proposed Solution */}
        <div className="space-y-2">
          <Label htmlFor="proposedSolution">
            Proposed Solution <span className="text-red-600">*</span>
          </Label>
          <p className="text-sm text-muted-foreground">
            How will you solve this problem? (e.g., AI-powered CRM that automates data entry)
          </p>
          <Textarea
            id="proposedSolution"
            placeholder="Describe your solution..."
            rows={3}
            {...register('proposedSolution')}
            disabled={isSubmitting}
            aria-invalid={errors.proposedSolution ? 'true' : 'false'}
            aria-describedby={
              errors.proposedSolution
                ? 'proposedSolution-error proposedSolution-count'
                : 'proposedSolution-count'
            }
          />
          {errors.proposedSolution && (
            <p id="proposedSolution-error" className="text-sm text-red-600">
              {errors.proposedSolution.message}
            </p>
          )}
          <p
            id="proposedSolution-count"
            className={cn(
              'text-xs',
              proposedSolution.length > 300 ? 'text-red-600' : 'text-muted-foreground'
            )}
          >
            {proposedSolution.length}/300 characters
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting} size="lg">
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
