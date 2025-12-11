/**
 * Wizard Step 2: Business Details Component
 *
 * Captures:
 * - Business name (3-100 chars, alphanumeric + spaces/hyphens)
 * - Industry selection
 * - Business stage (idea, startup, existing, side-project)
 * - Team size (optional)
 * - Funding status (optional)
 *
 * Includes real-time validation per wireframe BO-03.
 *
 * Story: 08.3 - Implement Onboarding Wizard UI
 * Story: 15.16 - Enhance Business Onboarding Wizard
 */

'use client'

import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  businessDetailsSchema,
  INDUSTRY_OPTIONS,
  BUSINESS_STAGE_OPTIONS,
  TEAM_SIZE_OPTIONS,
  FUNDING_STATUS_OPTIONS,
  type BusinessDetailsFormData,
} from '@/lib/validations/onboarding'
import { cn } from '@/lib/utils'

interface WizardStepDetailsProps {
  initialData?: Partial<BusinessDetailsFormData>
  onContinue: (data: BusinessDetailsFormData) => void
  onBack: () => void
}

export function WizardStepDetails({ initialData, onContinue, onBack }: WizardStepDetailsProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BusinessDetailsFormData>({
    resolver: standardSchemaResolver(businessDetailsSchema),
    mode: 'onBlur',
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      industry: initialData?.industry || '',
      stage: initialData?.stage || undefined,
      teamSize: initialData?.teamSize || undefined,
      fundingStatus: initialData?.fundingStatus || undefined,
    },
  })

  const name = watch('name', '')
  const nameLength = name.length
  const nameMaxLength = 100

  const onSubmit = async (data: BusinessDetailsFormData) => {
    onContinue(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">Step 2 of 4</p>
        <h2 className="text-2xl font-bold mb-2">Business Details</h2>
        <p className="text-muted-foreground">
          Tell us about your business so we can personalize your experience
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Business Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            What&apos;s your business called? <span className="text-red-600">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="e.g., Acme Solutions"
            {...register('name')}
            disabled={isSubmitting}
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'name-error name-hint' : 'name-hint'}
          />
          <div className="flex justify-between">
            {errors.name ? (
              <p id="name-error" className="text-sm text-red-600">
                {errors.name.message}
              </p>
            ) : (
              <p id="name-hint" className="text-xs text-muted-foreground">
                You can change this later.
              </p>
            )}
            <p className={cn(
              'text-xs',
              nameLength > nameMaxLength ? 'text-red-600' : 'text-muted-foreground'
            )}>
              {nameLength}/{nameMaxLength}
            </p>
          </div>
        </div>

        {/* Industry Selection */}
        <div className="space-y-2">
          <Label htmlFor="industry">
            What industry are you in? <span className="text-red-600">*</span>
          </Label>
          <Select
            value={watch('industry')}
            onValueChange={(value) => setValue('industry', value, { shouldValidate: true })}
            disabled={isSubmitting}
          >
            <SelectTrigger
              id="industry"
              className={cn(errors.industry && 'border-red-600')}
              aria-invalid={errors.industry ? 'true' : 'false'}
            >
              <SelectValue placeholder="Select an industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRY_OPTIONS.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.industry && (
            <p className="text-sm text-red-600">{errors.industry.message}</p>
          )}
        </div>

        {/* Business Stage */}
        <div className="space-y-3">
          <Label>
            What type of business is this? <span className="text-red-600">*</span>
          </Label>
          <RadioGroup
            value={watch('stage')}
            onValueChange={(value) => setValue('stage', value as BusinessDetailsFormData['stage'], { shouldValidate: true })}
            disabled={isSubmitting}
            className="space-y-3"
          >
            {BUSINESS_STAGE_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-start space-x-3">
                <RadioGroupItem
                  value={option.value}
                  id={`stage-${option.value}`}
                  className="mt-1"
                />
                <div className="grid gap-0.5 leading-none">
                  <Label
                    htmlFor={`stage-${option.value}`}
                    className="font-medium cursor-pointer"
                  >
                    {option.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
          {errors.stage && (
            <p className="text-sm text-red-600">{errors.stage.message}</p>
          )}
        </div>

        {/* Team Size (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="teamSize">
            How big is your team?
            <span className="text-muted-foreground font-normal ml-1">(optional)</span>
          </Label>
          <Select
            value={watch('teamSize') || ''}
            onValueChange={(value) => setValue('teamSize', value as BusinessDetailsFormData['teamSize'], { shouldValidate: true })}
            disabled={isSubmitting}
          >
            <SelectTrigger id="teamSize">
              <SelectValue placeholder="Select team size" />
            </SelectTrigger>
            <SelectContent>
              {TEAM_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Funding Status (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="fundingStatus">
            Funding status
            <span className="text-muted-foreground font-normal ml-1">(optional)</span>
          </Label>
          <Select
            value={watch('fundingStatus') || ''}
            onValueChange={(value) => setValue('fundingStatus', value as BusinessDetailsFormData['fundingStatus'], { shouldValidate: true })}
            disabled={isSubmitting}
          >
            <SelectTrigger id="fundingStatus">
              <SelectValue placeholder="Select funding status" />
            </SelectTrigger>
            <SelectContent>
              {FUNDING_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span>{option.label}</span>
                  <span className="text-muted-foreground ml-2">— {option.description}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t">
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
