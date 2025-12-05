/**
 * Onboarding Validation Tests
 *
 * Unit tests for onboarding form validation schemas.
 */

import { describe, it, expect } from 'vitest'
import {
  businessDetailsSchema,
  businessIdeaSchema,
  businessCreateSchema,
  type BusinessDetailsFormData,
  type BusinessIdeaFormData,
} from './onboarding'

describe('businessDetailsSchema', () => {
  it('should validate valid business details', () => {
    const validData: BusinessDetailsFormData = {
      name: 'My Test Business',
      description: 'A business that does amazing things for customers worldwide.',
    }

    const result = businessDetailsSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should reject name shorter than 3 characters', () => {
    const invalidData = {
      name: 'AB',
      description: 'Valid description here that is long enough.',
    }

    const result = businessDetailsSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('name')
    }
  })

  it('should reject name longer than 100 characters', () => {
    const invalidData = {
      name: 'A'.repeat(101),
      description: 'Valid description here.',
    }

    const result = businessDetailsSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject description shorter than 10 characters', () => {
    const invalidData = {
      name: 'Valid Name',
      description: 'Short',
    }

    const result = businessDetailsSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('description')
    }
  })

  it('should reject description longer than 500 characters', () => {
    const invalidData = {
      name: 'Valid Name',
      description: 'A'.repeat(501),
    }

    const result = businessDetailsSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject empty name', () => {
    const invalidData = {
      name: '',
      description: 'Valid description here.',
    }

    const result = businessDetailsSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should accept names with leading/trailing spaces', () => {
    // Note: Schema does not trim whitespace - that should be done at form submission
    const data = {
      name: '  My Business  ',
      description: 'Valid description here.',
    }

    const result = businessDetailsSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      // Whitespace is preserved - trimming should be done at the form/API layer
      expect(result.data.name).toBe('  My Business  ')
    }
  })
})

describe('businessIdeaSchema', () => {
  it('should validate valid business idea', () => {
    const validData: BusinessIdeaFormData = {
      problemStatement: 'SMBs struggle with managing customer relationships effectively.',
      targetCustomer: 'Small businesses with 5-50 employees in the service industry.',
      proposedSolution: 'An AI-powered CRM that automates data entry and follow-ups.',
    }

    const result = businessIdeaSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should reject problemStatement shorter than 10 characters', () => {
    const invalidData = {
      problemStatement: 'Too short',
      targetCustomer: 'Valid target customer description here.',
      proposedSolution: 'Valid solution description here.',
    }

    const result = businessIdeaSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject problemStatement longer than 300 characters', () => {
    const invalidData = {
      problemStatement: 'A'.repeat(301),
      targetCustomer: 'Valid target.',
      proposedSolution: 'Valid solution.',
    }

    const result = businessIdeaSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject targetCustomer shorter than 5 characters', () => {
    const invalidData = {
      problemStatement: 'Valid problem statement here.',
      targetCustomer: 'SMB',
      proposedSolution: 'Valid solution description.',
    }

    const result = businessIdeaSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject proposedSolution shorter than 10 characters', () => {
    const invalidData = {
      problemStatement: 'Valid problem statement.',
      targetCustomer: 'Valid target.',
      proposedSolution: 'Too short',
    }

    const result = businessIdeaSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should accept minimum valid lengths', () => {
    const data = {
      problemStatement: 'A'.repeat(10), // exactly 10
      targetCustomer: 'A'.repeat(5), // exactly 5
      proposedSolution: 'A'.repeat(10), // exactly 10
    }

    const result = businessIdeaSchema.safeParse(data)
    expect(result.success).toBe(true)
  })
})

describe('businessCreateSchema', () => {
  it('should validate complete business creation data', () => {
    const validData = {
      name: 'My Test Business',
      description: 'A business that does amazing things.',
      hasDocuments: false,
      ideaDescription: {
        problemStatement: 'A problem that needs solving.',
        targetCustomer: 'Target audience.',
        proposedSolution: 'My solution approach.',
      },
    }

    const result = businessCreateSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should validate with hasDocuments true', () => {
    const validData = {
      name: 'My Test Business',
      description: 'A business that does amazing things.',
      hasDocuments: true,
      ideaDescription: {
        problemStatement: 'A problem that needs solving.',
        targetCustomer: 'Target audience.',
        proposedSolution: 'My solution approach.',
      },
    }

    const result = businessCreateSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should reject missing name', () => {
    const invalidData = {
      description: 'A business description.',
      hasDocuments: false,
      ideaDescription: {
        problemStatement: 'A problem.',
        targetCustomer: 'Target.',
        proposedSolution: 'Solution.',
      },
    }

    const result = businessCreateSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject missing ideaDescription', () => {
    const invalidData = {
      name: 'My Business',
      description: 'A business description.',
      hasDocuments: false,
    }

    const result = businessCreateSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should validate ideaDescription fields', () => {
    const invalidData = {
      name: 'My Business',
      description: 'A business description.',
      hasDocuments: false,
      ideaDescription: {
        problemStatement: 'Short', // Too short
        targetCustomer: 'Target audience.',
        proposedSolution: 'My solution approach.',
      },
    }

    const result = businessCreateSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})
