/**
 * Onboarding Progress Constants
 *
 * Centralized workflow progress values to avoid magic numbers.
 * Each workflow completion advances progress by a defined amount.
 *
 * Story: Epic 08 Code Review - Fix hardcoded magic numbers
 */

/**
 * Validation phase workflow progress values
 * Total validation phase: 0-40%
 */
export const VALIDATION_PROGRESS = {
  /** Initial idea intake - 20% */
  IDEA_INTAKE: 20,
  /** Market sizing analysis - 25% */
  MARKET_SIZING: 25,
  /** Competitor mapping - 30% */
  COMPETITOR_MAPPING: 30,
  /** Customer discovery - 35% */
  CUSTOMER_DISCOVERY: 35,
  /** Validation synthesis - 40% */
  SYNTHESIS: 40,
} as const

/**
 * Planning phase workflow progress values
 * Total planning phase: 40-70%
 */
export const PLANNING_PROGRESS = {
  /** Business model canvas - 50% */
  BUSINESS_MODEL_CANVAS: 50,
  /** Financial projections - 60% */
  FINANCIAL_PROJECTIONS: 60,
  /** Business plan synthesis - 70% */
  BUSINESS_PLAN_SYNTHESIS: 70,
} as const

/**
 * Branding phase workflow progress values
 * Total branding phase: 70-95%
 */
export const BRANDING_PROGRESS = {
  /** Brand strategy - 75% */
  BRAND_STRATEGY: 75,
  /** Brand voice - 80% */
  BRAND_VOICE: 80,
  /** Visual identity - 85% */
  VISUAL_IDENTITY: 85,
  /** Asset generation - 90% */
  ASSET_GENERATION: 90,
} as const

/**
 * Handoff and completion progress values
 */
export const HANDOFF_PROGRESS = {
  /** Validation to planning handoff - 40% */
  VALIDATION_TO_PLANNING: 40,
  /** Planning to branding handoff - 70% */
  PLANNING_TO_BRANDING: 70,
  /** Document upload complete - 25% */
  DOCUMENT_UPLOAD: 25,
  /** Full onboarding complete - 100% */
  COMPLETE: 100,
} as const

/**
 * Phase boundaries for progress calculation
 */
export const PHASE_BOUNDARIES = {
  VALIDATION_START: 0,
  VALIDATION_END: 40,
  PLANNING_START: 40,
  PLANNING_END: 70,
  BRANDING_START: 70,
  BRANDING_END: 95,
  COMPLETE: 100,
} as const

/**
 * Helper to get the minimum progress for a phase
 */
export function getPhaseMinProgress(phase: 'validation' | 'planning' | 'branding' | 'complete'): number {
  switch (phase) {
    case 'validation':
      return PHASE_BOUNDARIES.VALIDATION_START
    case 'planning':
      return PHASE_BOUNDARIES.PLANNING_START
    case 'branding':
      return PHASE_BOUNDARIES.BRANDING_START
    case 'complete':
      return PHASE_BOUNDARIES.COMPLETE
  }
}

/**
 * All workflow progress values combined
 */
export const WORKFLOW_PROGRESS = {
  ...VALIDATION_PROGRESS,
  ...PLANNING_PROGRESS,
  ...BRANDING_PROGRESS,
  ...HANDOFF_PROGRESS,
} as const
