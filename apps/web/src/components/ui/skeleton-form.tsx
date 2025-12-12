/**
 * Skeleton Form Components
 *
 * Provides skeleton loading placeholders for form fields.
 * Matches typical form layouts to prevent layout shift.
 *
 * Epic: 16 - Premium Polish & Advanced Features
 * Story: 16-5 - Implement Skeleton Loading Screens
 */

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SkeletonFormProps {
  /** Number of fields to display */
  fields?: number
  /** Optional className */
  className?: string
}

/**
 * Single form field skeleton
 * Includes label and input
 */
export function SkeletonFormField({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

/**
 * Form field with helper text
 */
export function SkeletonFormFieldWithHelper({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-3 w-48" />
    </div>
  )
}

/**
 * Textarea field skeleton
 */
export function SkeletonFormTextarea({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

/**
 * Select/dropdown field skeleton
 */
export function SkeletonFormSelect({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

/**
 * Checkbox field skeleton
 */
export function SkeletonFormCheckbox({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-32" />
    </div>
  )
}

/**
 * Radio button group skeleton
 */
export function SkeletonFormRadioGroup({ options = 3, className }: { options?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <Skeleton className="h-4 w-24" />
      <div className="space-y-2">
        {Array.from({ length: options }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Full form skeleton
 * Multiple fields with submit button
 */
export function SkeletonForm({ fields = 4, className }: SkeletonFormProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <SkeletonFormField key={i} />
      ))}
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

/**
 * Form section skeleton
 * Section header with fields
 */
export function SkeletonFormSection({ fields = 3, className }: SkeletonFormProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <SkeletonFormField key={i} />
        ))}
      </div>
    </div>
  )
}

/**
 * Two-column form field skeleton
 * For side-by-side fields
 */
export function SkeletonFormFieldTwoColumn({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      <SkeletonFormField />
      <SkeletonFormField />
    </div>
  )
}
