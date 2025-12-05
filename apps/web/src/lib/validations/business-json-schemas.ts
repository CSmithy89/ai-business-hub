/**
 * Business JSON Field Validation Schemas
 *
 * Zod schemas for validating JSON fields stored in Prisma models.
 * Security: Prevents injection of arbitrary data structures.
 *
 * Story: Epic 08 Code Review - P0 JSON Schema Validation
 */

import { z } from 'zod'

// =============================================================================
// Constants for max sizes (prevent DoS via large JSON payloads)
// =============================================================================

const MAX_STRING_LENGTH = 5000
const MAX_ARRAY_LENGTH = 100
const MAX_MEDIUM_STRING = 1000
const MAX_SHORT_STRING = 200

// =============================================================================
// Business Model Canvas Schema
// =============================================================================

export const businessModelCanvasSchema = z.object({
  customerSegments: z.array(z.string().max(MAX_MEDIUM_STRING)).max(MAX_ARRAY_LENGTH).optional(),
  valuePropositions: z.array(z.string().max(MAX_MEDIUM_STRING)).max(MAX_ARRAY_LENGTH).optional(),
  channels: z.array(z.string().max(MAX_MEDIUM_STRING)).max(MAX_ARRAY_LENGTH).optional(),
  customerRelationships: z.array(z.string().max(MAX_MEDIUM_STRING)).max(MAX_ARRAY_LENGTH).optional(),
  revenueStreams: z.array(z.string().max(MAX_MEDIUM_STRING)).max(MAX_ARRAY_LENGTH).optional(),
  keyResources: z.array(z.string().max(MAX_MEDIUM_STRING)).max(MAX_ARRAY_LENGTH).optional(),
  keyActivities: z.array(z.string().max(MAX_MEDIUM_STRING)).max(MAX_ARRAY_LENGTH).optional(),
  keyPartners: z.array(z.string().max(MAX_MEDIUM_STRING)).max(MAX_ARRAY_LENGTH).optional(),
  costStructure: z.array(z.string().max(MAX_MEDIUM_STRING)).max(MAX_ARRAY_LENGTH).optional(),
})

export type BusinessModelCanvas = z.infer<typeof businessModelCanvasSchema>

// =============================================================================
// Financial Projections Schema
// =============================================================================

const monthlyProjectionSchema = z.object({
  month: z.number().int().min(1).max(60),
  revenue: z.number().min(0),
  expenses: z.number().min(0),
  profit: z.number(),
  cumulativeCashflow: z.number(),
})

export const financialProjectionsSchema = z.object({
  assumptions: z.object({
    startingCapital: z.number().min(0).optional(),
    monthlyBurnRate: z.number().min(0).optional(),
    projectedGrowthRate: z.number().min(-100).max(1000).optional(),
    averageRevenuePerUser: z.number().min(0).optional(),
    customerAcquisitionCost: z.number().min(0).optional(),
    customerLifetimeValue: z.number().min(0).optional(),
  }).optional(),
  projections: z.array(monthlyProjectionSchema).max(60).optional(),
  unitEconomics: z.object({
    grossMargin: z.number().min(-100).max(100).optional(),
    netMargin: z.number().min(-100).max(100).optional(),
    paybackPeriod: z.number().min(0).optional(),
    ltv_cac_ratio: z.number().min(0).optional(),
  }).optional(),
  fundingNeeds: z.object({
    totalRequired: z.number().min(0).optional(),
    runwayMonths: z.number().int().min(0).optional(),
    breakEvenMonth: z.number().int().min(0).optional(),
  }).optional(),
})

export type FinancialProjections = z.infer<typeof financialProjectionsSchema>

// =============================================================================
// Market Sizing Schema (TAM/SAM/SOM)
// =============================================================================

const marketSizeSchema = z.object({
  value: z.number().min(0),
  currency: z.string().max(10).default('USD'),
  unit: z.enum(['billion', 'million', 'thousand']).optional(),
  methodology: z.string().max(MAX_STRING_LENGTH).optional(),
  sources: z.array(z.string().max(MAX_SHORT_STRING)).max(20).optional(),
})

export const marketSizingDataSchema = z.object({
  tam: marketSizeSchema.optional(),
  sam: marketSizeSchema.optional(),
  som: marketSizeSchema.optional(),
  growthRate: z.number().min(-100).max(1000).optional(),
  timeframe: z.string().max(50).optional(),
})

export type MarketSizingData = z.infer<typeof marketSizingDataSchema>

// =============================================================================
// Competitor Data Schema
// =============================================================================

const competitorSchema = z.object({
  name: z.string().max(MAX_SHORT_STRING),
  website: z.string().url().max(MAX_SHORT_STRING).optional(),
  description: z.string().max(MAX_MEDIUM_STRING).optional(),
  strengths: z.array(z.string().max(MAX_SHORT_STRING)).max(10).optional(),
  weaknesses: z.array(z.string().max(MAX_SHORT_STRING)).max(10).optional(),
  marketPosition: z.enum(['leader', 'challenger', 'niche', 'emerging']).optional(),
  pricingModel: z.string().max(MAX_SHORT_STRING).optional(),
  targetMarket: z.string().max(MAX_MEDIUM_STRING).optional(),
})

export const competitorDataSchema = z.object({
  competitors: z.array(competitorSchema).max(50).optional(),
  competitiveAdvantage: z.string().max(MAX_STRING_LENGTH).optional(),
  marketGaps: z.array(z.string().max(MAX_MEDIUM_STRING)).max(20).optional(),
})

export type CompetitorData = z.infer<typeof competitorDataSchema>

// =============================================================================
// ICP (Ideal Customer Profile) Schema
// =============================================================================

const icpSchema = z.object({
  name: z.string().max(MAX_SHORT_STRING),
  description: z.string().max(MAX_MEDIUM_STRING).optional(),
  demographics: z.object({
    ageRange: z.string().max(50).optional(),
    location: z.string().max(MAX_SHORT_STRING).optional(),
    income: z.string().max(50).optional(),
    occupation: z.string().max(MAX_SHORT_STRING).optional(),
  }).optional(),
  painPoints: z.array(z.string().max(MAX_MEDIUM_STRING)).max(20).optional(),
  goals: z.array(z.string().max(MAX_MEDIUM_STRING)).max(20).optional(),
  buyingBehavior: z.string().max(MAX_MEDIUM_STRING).optional(),
})

export const icpDataSchema = z.object({
  profiles: z.array(icpSchema).max(10).optional(),
  primaryIcp: z.string().max(MAX_SHORT_STRING).optional(),
})

export type IcpData = z.infer<typeof icpDataSchema>

// =============================================================================
// Brand Positioning Schema
// =============================================================================

export const brandPositioningSchema = z.object({
  archetype: z.string().max(50).optional(),
  archetypeDescription: z.string().max(MAX_MEDIUM_STRING).optional(),
  coreValues: z.array(z.string().max(MAX_SHORT_STRING)).max(10).optional(),
  missionStatement: z.string().max(MAX_MEDIUM_STRING).optional(),
  visionStatement: z.string().max(MAX_MEDIUM_STRING).optional(),
  uniqueSellingProposition: z.string().max(MAX_MEDIUM_STRING).optional(),
  brandPromise: z.string().max(MAX_MEDIUM_STRING).optional(),
  targetAudience: z.string().max(MAX_MEDIUM_STRING).optional(),
  competitiveDifferentiator: z.string().max(MAX_MEDIUM_STRING).optional(),
})

export type BrandPositioning = z.infer<typeof brandPositioningSchema>

// =============================================================================
// Brand Voice Guidelines Schema
// =============================================================================

const toneDimensionSchema = z.object({
  dimension: z.string().max(50),
  value: z.number().min(1).max(10),
  description: z.string().max(MAX_MEDIUM_STRING).optional(),
})

export const brandVoiceGuidelinesSchema = z.object({
  toneDimensions: z.array(toneDimensionSchema).max(10).optional(),
  vocabulary: z.object({
    preferredWords: z.array(z.string().max(100)).max(50).optional(),
    avoidWords: z.array(z.string().max(100)).max(50).optional(),
    industryTerms: z.array(z.string().max(100)).max(50).optional(),
  }).optional(),
  messagingTemplates: z.array(z.object({
    type: z.string().max(50),
    template: z.string().max(MAX_STRING_LENGTH),
  })).max(20).optional(),
  writingGuidelines: z.array(z.string().max(MAX_MEDIUM_STRING)).max(20).optional(),
})

export type BrandVoiceGuidelines = z.infer<typeof brandVoiceGuidelinesSchema>

// =============================================================================
// Visual Identity Schema
// =============================================================================

const colorSchema = z.object({
  name: z.string().max(50),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).max(7),
  rgb: z.object({
    r: z.number().int().min(0).max(255),
    g: z.number().int().min(0).max(255),
    b: z.number().int().min(0).max(255),
  }).optional(),
  cmyk: z.object({
    c: z.number().min(0).max(100),
    m: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    k: z.number().min(0).max(100),
  }).optional(),
  usage: z.string().max(MAX_MEDIUM_STRING).optional(),
})

const typographySchema = z.object({
  category: z.enum(['primary', 'secondary', 'accent', 'body', 'heading']),
  fontFamily: z.string().max(100),
  fallback: z.string().max(100).optional(),
  weights: z.array(z.number().int().min(100).max(900)).max(10).optional(),
  usage: z.string().max(MAX_MEDIUM_STRING).optional(),
})

const logoConceptSchema = z.object({
  name: z.string().max(100),
  description: z.string().max(MAX_MEDIUM_STRING),
  style: z.string().max(100).optional(),
  symbolism: z.string().max(MAX_MEDIUM_STRING).optional(),
})

export const visualIdentitySchema = z.object({
  colorPalette: z.object({
    primary: z.array(colorSchema).max(5).optional(),
    secondary: z.array(colorSchema).max(5).optional(),
    accent: z.array(colorSchema).max(5).optional(),
    neutral: z.array(colorSchema).max(10).optional(),
  }).optional(),
  typography: z.array(typographySchema).max(10).optional(),
  logoConcepts: z.array(logoConceptSchema).max(10).optional(),
  designPrinciples: z.array(z.string().max(MAX_MEDIUM_STRING)).max(10).optional(),
  moodKeywords: z.array(z.string().max(50)).max(20).optional(),
})

export type VisualIdentity = z.infer<typeof visualIdentitySchema>

// =============================================================================
// Generated Assets Schema
// =============================================================================

const assetSchema = z.object({
  name: z.string().max(MAX_SHORT_STRING),
  type: z.enum(['logo', 'icon', 'social', 'document', 'presentation', 'other']),
  format: z.string().max(20).optional(),
  dimensions: z.string().max(50).optional(),
  url: z.string().max(MAX_SHORT_STRING).optional(),
  status: z.enum(['pending', 'generated', 'approved', 'rejected']).optional(),
})

export const generatedAssetsSchema = z.object({
  assets: z.array(assetSchema).max(100).optional(),
  brandKit: z.object({
    logoVariants: z.array(assetSchema).max(20).optional(),
    socialMediaPack: z.array(assetSchema).max(20).optional(),
    documentTemplates: z.array(assetSchema).max(20).optional(),
  }).optional(),
  exportFormats: z.array(z.string().max(20)).max(20).optional(),
})

export type GeneratedAssets = z.infer<typeof generatedAssetsSchema>

// =============================================================================
// Validation Helper Functions
// =============================================================================

/**
 * Safely parse JSON and validate against schema
 * Returns parsed data or null if invalid
 */
export function safeParseJson<T>(
  schema: z.ZodType<T>,
  json: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  try {
    // If it's a string, parse it first
    const data = typeof json === 'string' ? JSON.parse(json) : json
    return schema.safeParse(data) as { success: true; data: T } | { success: false; error: z.ZodError }
  } catch {
    // JSON parse failed
    return {
      success: false,
      error: new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          message: 'Invalid JSON format',
          path: [],
        },
      ]),
    }
  }
}

/**
 * Validate JSON data and return clean object or throw
 */
export function validateJsonField<T>(
  schema: z.ZodType<T>,
  data: unknown,
  fieldName: string
): T {
  const result = safeParseJson(schema, data)
  if (!result.success) {
    throw new Error(`Invalid ${fieldName} data: ${result.error.message}`)
  }
  return result.data
}
