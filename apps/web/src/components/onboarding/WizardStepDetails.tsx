/**
 * Wizard Step 2: Business Details Component
 *
 * Captures:
 * - Business name (3-100 chars, alphanumeric + spaces/hyphens)
 * - Business description (10-500 chars)
 *
 * Includes real-time validation and character count.
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
import {
  businessDetailsSchema,
  type BusinessDetailsFormData,
} from '@/lib/validations/onboarding'
import { cn } from '@/lib/utils'

interface WizardStepDetailsProps {
  initialData?: BusinessDetailsFormData
  onContinue: (data: BusinessDetailsFormData) => void
  onBack: () => void
}

export function WizardStepDetails({ initialData, onContinue, onBack }: WizardStepDetailsProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BusinessDetailsFormData>({
    resolver: standardSchemaResolver(businessDetailsSchema),
    mode: 'onBlur',
    defaultValues: initialData || {
      name: '',
      description: '',
    },
  })

  const description = watch('description', '')
  const descriptionLength = description.length
  const descriptionMaxLength = 500
  const isDescriptionNearLimit = descriptionLength > descriptionMaxLength * 0.9

  const onSubmit = async (data: BusinessDetailsFormData) => {
    onContinue(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Tell us about your business</h2>
        <p className="text-muted-foreground">
          We'll use this information to personalize your experience
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Business Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Business Name <span className="text-red-600">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="My Business Name"
            {...register('name')}
            disabled={isSubmitting}
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-red-600">
              {errors.name.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">3-100 characters</p>
        </div>

        {/* Business Description */}
        <div className="space-y-2">
          <Label htmlFor="description">
            Business Description <span className="text-red-600">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="A brief description of what your business does..."
            rows={4}
            {...register('description')}
            disabled={isSubmitting}
            aria-invalid={errors.description ? 'true' : 'false'}
            aria-describedby={
              errors.description ? 'description-error description-count' : 'description-count'
            }
          />
          {errors.description && (
            <p id="description-error" className="text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
          <p
            id="description-count"
            className={cn(
              'text-xs',
              isDescriptionNearLimit ? 'text-yellow-600' : 'text-muted-foreground',
              descriptionLength > descriptionMaxLength && 'text-red-600'
            )}
          >
            {descriptionLength}/{descriptionMaxLength} characters
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
