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
 * Business Details Schema (Step 2)
 *
 * Validates:
 * - Business name: 3-100 chars, letters/numbers/spaces/hyphens only
 * - Description: 10-500 chars
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
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters'),
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

// Type exports
export type BusinessDetailsFormData = z.infer<typeof businessDetailsSchema>
export type BusinessIdeaFormData = z.infer<typeof businessIdeaSchema>
export type BusinessCreateData = z.infer<typeof businessCreateSchema>
