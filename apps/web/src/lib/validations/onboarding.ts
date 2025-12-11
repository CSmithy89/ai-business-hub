/**
 * Onboarding Wizard Validation Schemas
 *
 * Zod schemas for validating business onboarding wizard forms.
 * Used with react-hook-form via standardSchemaResolver.
 *
 * Story: 08.3 - Implement Onboarding Wizard UI
 */

import { z } from 'zod'

/**
 * Industry options for business onboarding
 * Story: 15.16 - Enhance Business Onboarding Wizard
 */
export const INDUSTRY_OPTIONS = [
  'Technology',
  'E-commerce',
  'Professional Services',
  'Healthcare',
  'Education',
  'Food & Beverage',
  'Retail',
  'Manufacturing',
  'Finance',
  'Real Estate',
  'Media & Entertainment',
  'Other',
] as const

/**
 * Business stage options
 * Story: 15.16 - Enhance Business Onboarding Wizard
 */
export const BUSINESS_STAGE_OPTIONS = [
  { value: 'idea', label: 'Just an idea', description: 'Exploring the concept' },
  { value: 'startup', label: 'New startup', description: 'Just getting started' },
  { value: 'existing', label: 'Existing business', description: 'Already operating' },
  { value: 'side-project', label: 'Side project', description: 'Testing an idea' },
] as const

/**
 * Team size options
 * Story: 15.16 - Enhance Business Onboarding Wizard
 */
export const TEAM_SIZE_OPTIONS = [
  { value: 'solo', label: 'Just me' },
  { value: '2-5', label: '2-5 people' },
  { value: '6-10', label: '6-10 people' },
  { value: '11-50', label: '11-50 people' },
  { value: '50+', label: '50+ people' },
] as const

/**
 * Funding status options
 * Story: 15.16 - Enhance Business Onboarding Wizard
 */
export const FUNDING_STATUS_OPTIONS = [
  { value: 'bootstrapped', label: 'Bootstrapped', description: 'Self-funded' },
  { value: 'pre-seed', label: 'Pre-seed', description: 'Friends & family' },
  { value: 'seed', label: 'Seed', description: 'Angel or early VC' },
  { value: 'series-a', label: 'Series A+', description: 'Institutional funding' },
  { value: 'not-applicable', label: 'Not applicable', description: 'Not seeking funding' },
] as const

/**
 * Business Details Schema (Step 2)
 *
 * Validates:
 * - Business name: 3-100 chars, letters/numbers/spaces/hyphens only
 * - Description: 10-500 chars (optional now)
 * - Industry: Required selection
 * - Stage: Required selection
 * - Team size: Optional
 * - Funding status: Optional
 *
 * Story: 08.3 - Implement Onboarding Wizard UI
 * Story: 15.16 - Enhance Business Onboarding Wizard
 */
export const businessDetailsSchema = z.object({
  name: z
    .string()
    .min(3, 'Business name must be at least 3 characters')
    .max(100, 'Business name must not exceed 100 characters')
    .regex(
      /^[a-zA-Z0-9\s-]+$/,
      'Business name can only contain letters, numbers, spaces, and hyphens'
    ),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters'),
  industry: z
    .string()
    .min(1, 'Please select an industry'),
  stage: z
    .enum(['idea', 'startup', 'existing', 'side-project'], {
      message: 'Please select a business stage',
    }),
  teamSize: z
    .enum(['solo', '2-5', '6-10', '11-50', '50+'])
    .optional(),
  fundingStatus: z
    .enum(['bootstrapped', 'pre-seed', 'seed', 'series-a', 'not-applicable'])
    .optional(),
})

/**
 * Business Idea Schema (Step 3)
 *
 * Validates:
 * - Problem statement: 10-300 chars
 * - Target customer: 5-200 chars
 * - Proposed solution: 10-300 chars
 */
export const businessIdeaSchema = z.object({
  problemStatement: z
    .string()
    .min(10, 'Problem statement must be at least 10 characters')
    .max(300, 'Problem statement must not exceed 300 characters'),
  targetCustomer: z
    .string()
    .min(5, 'Target customer must be at least 5 characters')
    .max(200, 'Target customer must not exceed 200 characters'),
  proposedSolution: z
    .string()
    .min(10, 'Proposed solution must be at least 10 characters')
    .max(300, 'Proposed solution must not exceed 300 characters'),
})

/**
 * Business Creation Schema (API validation)
 *
 * Used to validate the complete payload sent to POST /api/businesses
 */
export const businessCreateSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  hasDocuments: z.boolean(),
  ideaDescription: z.object({
    problemStatement: z.string().min(10).max(300),
    targetCustomer: z.string().min(5).max(200),
    proposedSolution: z.string().min(10).max(300),
  }),
})

/**
 * Document Upload Schema (Step 4)
 *
 * Validates:
 * - File type: PDF, DOCX, or MD only
 * - File size: Max 10MB per file
 * - File count: Max 5 files
 */
export const documentUploadSchema = z.object({
  files: z
    .array(z.instanceof(File))
    .min(1, 'At least one file is required')
    .max(5, 'Maximum 5 files allowed')
    .refine(
      (files) => files.every((f) => f.size <= 10 * 1024 * 1024),
      'Each file must be less than 10MB'
    )
    .refine(
      (files) =>
        files.every((f) =>
          [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/markdown',
          ].includes(f.type)
        ),
      'Only PDF, DOCX, and MD files are allowed'
    ),
})

// Type exports
export type BusinessDetailsFormData = z.infer<typeof businessDetailsSchema>
export type BusinessIdeaFormData = z.infer<typeof businessIdeaSchema>
export type BusinessCreateData = z.infer<typeof businessCreateSchema>
export type DocumentUploadData = z.infer<typeof documentUploadSchema>
