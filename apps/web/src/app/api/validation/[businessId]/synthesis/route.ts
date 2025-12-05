/**
 * Validation Synthesis Workflow API Routes
 *
 * POST /api/validation/[businessId]/synthesis - Run validation synthesis
 * GET /api/validation/[businessId]/synthesis - Get final recommendation
 *
 * Story: 08.11 - Implement Validation Synthesis Workflow
 */

import { NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { getSession } from '@/lib/auth-server'
import { z } from 'zod'

// ============================================================================
// Types & Validation Schemas
// ============================================================================

type RecommendationType = 'GO' | 'CONDITIONAL_GO' | 'PIVOT' | 'NO_GO'
type ConfidenceLevel = 'high' | 'medium' | 'low'
type SeverityLevel = 'high' | 'medium' | 'low'

interface Risk {
  risk: string
  severity: SeverityLevel
  mitigation: string
}

/**
 * Structured output from the validation synthesis workflow
 */
export interface ValidationSynthesisOutput {
  validation_score: number
  recommendation: RecommendationType
  confidence: ConfidenceLevel
  summary: string
  key_strengths: string[]
  key_risks: Risk[]
  conditions?: string[]
  pivot_suggestions?: string[]
  next_steps: string[]
  requires_approval: boolean
  is_complete: boolean
}

// Schema for triggering validation synthesis
const validationSynthesisRequestSchema = z.object({
  message: z.string().optional(),
})

// ============================================================================
// Score Calculation Logic
// ============================================================================

interface ValidationData {
  tam?: { value: number; confidence: string } | null
  sam?: { value: number } | null
  som?: { realistic: number } | null
  competitors?: Array<{ type: string }> | null
  opportunityGaps?: string[] | null
  icps?: {
    icp?: { confidence: string }
    jtbd?: { opportunity_scores: Array<{ opportunity: number }> }
    willingness_to_pay?: { price_sensitivity: string }
  } | null
}

function calculateValidationScore(data: ValidationData): {
  score: number
  breakdown: { market: number; competition: number; customer: number; feasibility: number }
} {
  let marketScore = 50
  let competitionScore = 50
  let customerScore = 50
  let feasibilityScore = 50

  // Market scoring (TAM, SAM, SOM)
  if (data.tam) {
    const tamValue = (data.tam as { value: number }).value || 0
    if (tamValue > 10_000_000_000) marketScore += 20 // $10B+ TAM
    else if (tamValue > 1_000_000_000) marketScore += 15 // $1B+ TAM
    else if (tamValue > 100_000_000) marketScore += 10 // $100M+ TAM

    if ((data.tam as { confidence: string }).confidence === 'high') marketScore += 10
  }
  if (data.som) {
    const somValue = (data.som as { realistic: number }).realistic || 0
    if (somValue > 10_000_000) marketScore += 10 // $10M+ SOM realistic
    else if (somValue > 1_000_000) marketScore += 5 // $1M+ SOM realistic
  }
  marketScore = Math.min(100, marketScore)

  // Competition scoring
  if (data.competitors && Array.isArray(data.competitors)) {
    const directCompetitors = data.competitors.filter((c) => c.type === 'direct').length
    if (directCompetitors <= 3) competitionScore += 15 // Less crowded
    else if (directCompetitors <= 5) competitionScore += 10
    else competitionScore -= 10 // Very crowded
  }
  if (data.opportunityGaps && Array.isArray(data.opportunityGaps)) {
    competitionScore += Math.min(20, data.opportunityGaps.length * 5) // Gaps = opportunities
  }
  competitionScore = Math.max(0, Math.min(100, competitionScore))

  // Customer scoring (ICP, JTBD)
  if (data.icps) {
    const icps = data.icps as {
      icp?: { confidence: string }
      jtbd?: { opportunity_scores: Array<{ opportunity: number }> }
      willingness_to_pay?: { price_sensitivity: string }
    }
    if (icps.icp?.confidence === 'high') customerScore += 15
    else if (icps.icp?.confidence === 'medium') customerScore += 10

    if (icps.jtbd?.opportunity_scores) {
      const avgOpportunity =
        icps.jtbd.opportunity_scores.reduce((a, b) => a + b.opportunity, 0) /
        icps.jtbd.opportunity_scores.length
      if (avgOpportunity > 12) customerScore += 15
      else if (avgOpportunity > 10) customerScore += 10
    }

    if (icps.willingness_to_pay?.price_sensitivity === 'low') customerScore += 10
    else if (icps.willingness_to_pay?.price_sensitivity === 'medium') customerScore += 5
  }
  customerScore = Math.min(100, customerScore)

  // Feasibility scoring (aggregated from other scores)
  feasibilityScore = Math.round((marketScore + competitionScore + customerScore) / 3)

  // Overall weighted score
  const score = Math.round(
    marketScore * 0.3 + competitionScore * 0.2 + customerScore * 0.25 + feasibilityScore * 0.25
  )

  return {
    score,
    breakdown: {
      market: marketScore,
      competition: competitionScore,
      customer: customerScore,
      feasibility: feasibilityScore,
    },
  }
}

function determineRecommendation(
  score: number,
  hasOpportunityGaps: boolean
): { recommendation: RecommendationType; conditions?: string[] } {
  if (score >= 70) {
    return { recommendation: 'GO' }
  } else if (score >= 50) {
    return {
      recommendation: 'CONDITIONAL_GO',
      conditions: [
        'Conduct customer interviews to validate ICP',
        'Test pricing assumptions with target segment',
        'Develop MVP for market validation',
      ],
    }
  } else if (hasOpportunityGaps) {
    return { recommendation: 'PIVOT' }
  } else {
    return { recommendation: 'NO_GO' }
  }
}

// ============================================================================
// Mock Response Generator (will be replaced with actual Agno integration)
// ============================================================================

function generateValidationSynthesisResponse(
  validationData: ValidationData,
  businessName: string
): { content: string; output: ValidationSynthesisOutput } {
  const { score, breakdown } = calculateValidationScore(validationData)
  const hasOpportunityGaps =
    validationData.opportunityGaps && validationData.opportunityGaps.length > 0
  const { recommendation, conditions } = determineRecommendation(score, hasOpportunityGaps || false)

  const confidence: ConfidenceLevel =
    score >= 70 || score < 30 ? 'high' : score >= 50 ? 'medium' : 'low'

  const summaries: Record<RecommendationType, string> = {
    GO: `"${businessName}" shows strong market potential with manageable risks. Validation score of ${score}/100 indicates a solid foundation for proceeding to business planning.`,
    CONDITIONAL_GO: `"${businessName}" has potential but requires addressing key conditions before full commitment. The ${score}/100 score suggests opportunity with caveats.`,
    PIVOT: `"${businessName}" in its current form faces significant challenges, but market analysis reveals viable pivot opportunities worth exploring.`,
    NO_GO: `"${businessName}" faces substantial obstacles that make success unlikely. The ${score}/100 score indicates fundamental issues that need addressing.`,
  }

  const keyStrengths: string[] = []
  if (breakdown.market >= 70) keyStrengths.push('Strong market opportunity with significant TAM')
  if (breakdown.competition >= 70) keyStrengths.push('Favorable competitive landscape with clear gaps')
  if (breakdown.customer >= 70) keyStrengths.push('Well-defined target customer with validated pain points')
  if (breakdown.feasibility >= 70) keyStrengths.push('High overall feasibility score')
  if (keyStrengths.length === 0) keyStrengths.push('Identified market opportunity exists')

  const keyRisks: Risk[] = []
  if (breakdown.market < 50) {
    keyRisks.push({
      risk: 'Market size may be insufficient for scale',
      severity: 'high',
      mitigation: 'Expand geographic scope or adjacent segments',
    })
  }
  if (breakdown.competition < 50) {
    keyRisks.push({
      risk: 'Highly competitive market with established players',
      severity: 'medium',
      mitigation: 'Focus on underserved niche or unique value proposition',
    })
  }
  if (breakdown.customer < 50) {
    keyRisks.push({
      risk: 'Customer segment not well validated',
      severity: 'high',
      mitigation: 'Conduct customer discovery interviews before proceeding',
    })
  }
  if (keyRisks.length === 0) {
    keyRisks.push({
      risk: 'Standard execution risks',
      severity: 'low',
      mitigation: 'Follow best practices and iterate based on feedback',
    })
  }

  const nextStepsMap: Record<RecommendationType, string[]> = {
    GO: [
      'Proceed to Business Planning (BMP module)',
      'Develop detailed go-to-market strategy',
      'Begin MVP development planning',
      'Create financial projections',
    ],
    CONDITIONAL_GO: [
      'Address the conditions listed above',
      'Conduct additional customer validation',
      'Revisit validation after conditions are met',
      'Consider limited pilot before full commitment',
    ],
    PIVOT: [
      'Explore identified market gaps as new focus areas',
      'Re-run validation with pivot direction',
      'Leverage existing research for new approach',
      'Consider adjacent customer segments',
    ],
    NO_GO: [
      'Document learnings for future reference',
      'Evaluate if any components are salvageable',
      'Consider alternative business ideas',
      'Review market trends for future opportunities',
    ],
  }

  const pivotSuggestions =
    recommendation === 'PIVOT' && validationData.opportunityGaps
      ? (validationData.opportunityGaps as string[]).slice(0, 3).map((gap) => `Consider pivoting to: ${gap}`)
      : undefined

  const output: ValidationSynthesisOutput = {
    validation_score: score,
    recommendation,
    confidence,
    summary: summaries[recommendation],
    key_strengths: keyStrengths,
    key_risks: keyRisks,
    conditions: recommendation === 'CONDITIONAL_GO' ? conditions : undefined,
    pivot_suggestions: pivotSuggestions,
    next_steps: nextStepsMap[recommendation],
    requires_approval: recommendation !== 'GO',
    is_complete: true,
  }

  const content = `## Validation Synthesis Complete ✅

**Vera** (Validation Lead) has synthesized all findings into a final recommendation.

---

### Validation Score: ${score}/100

| Dimension | Score |
|-----------|-------|
| Market Opportunity | ${breakdown.market}/100 |
| Competitive Position | ${breakdown.competition}/100 |
| Customer Validation | ${breakdown.customer}/100 |
| Overall Feasibility | ${breakdown.feasibility}/100 |

---

### Recommendation: **${recommendation.replace('_', ' ')}** (${confidence.toUpperCase()} confidence)

${output.summary}

---

### Key Strengths
${keyStrengths.map((s) => `✅ ${s}`).join('\n')}

---

### Key Risks
${keyRisks.map((r) => `⚠️ **${r.risk}** (${r.severity.toUpperCase()})\n   *Mitigation:* ${r.mitigation}`).join('\n\n')}

${
  conditions
    ? `
---

### Conditions for Proceeding
${conditions.map((c, i) => `${i + 1}. ${c}`).join('\n')}
`
    : ''
}

${
  pivotSuggestions
    ? `
---

### Pivot Suggestions
${pivotSuggestions.map((p) => `💡 ${p}`).join('\n')}
`
    : ''
}

---

### Next Steps
${nextStepsMap[recommendation].map((s, i) => `${i + 1}. ${s}`).join('\n')}

---

${
  output.requires_approval
    ? '**⏳ This recommendation requires human approval before proceeding.**'
    : '**✅ Ready to proceed to Business Planning (BMP module).**'
}`

  return { content, output }
}

// ============================================================================
// API Handlers
// ============================================================================

/**
 * POST /api/validation/[businessId]/synthesis
 *
 * Run the validation synthesis workflow.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getSession()
    const { businessId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request
    const body = await req.json()
    const validation = validationSynthesisRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    // Get business with validation data
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { validationData: true },
    })

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Business not found' },
        { status: 404 }
      )
    }

    // Check prerequisites
    const requiredWorkflows = ['idea_intake', 'market_sizing', 'competitor_mapping', 'customer_discovery']
    const completedWorkflows = business.validationData?.completedWorkflows || []
    const missingWorkflows = requiredWorkflows.filter((w) => !completedWorkflows.includes(w))

    if (missingWorkflows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'PREREQUISITE_NOT_MET',
          message: `Missing prerequisites: ${missingWorkflows.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Generate validation synthesis response
    const validationData: ValidationData = {
      tam: business.validationData?.tam as ValidationData['tam'],
      sam: business.validationData?.sam as ValidationData['sam'],
      som: business.validationData?.som as ValidationData['som'],
      competitors: business.validationData?.competitors as ValidationData['competitors'],
      opportunityGaps: business.validationData?.opportunityGaps as ValidationData['opportunityGaps'],
      icps: business.validationData?.icps as ValidationData['icps'],
    }

    const response = generateValidationSynthesisResponse(validationData, business.name)

    // Map recommendation to Prisma enum
    const recommendationMap: Record<RecommendationType, 'GO' | 'NO_GO' | 'CONDITIONAL_GO' | 'PIVOT'> = {
      GO: 'GO',
      NO_GO: 'NO_GO',
      CONDITIONAL_GO: 'CONDITIONAL_GO',
      PIVOT: 'PIVOT',
    }

    // Update validation session with synthesis results
    await prisma.validationSession.update({
      where: { businessId },
      data: {
        validationScore: response.output.validation_score,
        recommendation: recommendationMap[response.output.recommendation],
        strengths: JSON.parse(JSON.stringify(response.output.key_strengths)),
        risks: JSON.parse(JSON.stringify(response.output.key_risks)),
        nextSteps: JSON.parse(JSON.stringify(response.output.next_steps)),
        completedWorkflows: {
          push: 'validation_synthesis',
        },
      },
    })

    // Update business status
    const validationStatus =
      response.output.recommendation === 'GO' || response.output.recommendation === 'CONDITIONAL_GO'
        ? 'COMPLETE'
        : 'IN_PROGRESS'

    await prisma.business.update({
      where: { id: businessId },
      data: {
        validationStatus,
        validationScore: response.output.validation_score,
        onboardingProgress: response.output.recommendation === 'GO' ? 80 : 75,
        onboardingStatus:
          response.output.recommendation === 'GO' || response.output.recommendation === 'CONDITIONAL_GO'
            ? 'PLANNING'
            : 'VALIDATION',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        message: {
          role: 'assistant',
          agent: 'vera',
          content: response.content,
          suggestedActions:
            response.output.recommendation === 'GO'
              ? ['Continue to Business Planning', 'View detailed report', 'Share validation results']
              : ['Review conditions', 'Request human approval', 'Explore pivot options'],
          timestamp: new Date().toISOString(),
        },
        output: response.output,
        workflow_status: 'completed',
      },
    })
  } catch (error) {
    console.error('Error in validation synthesis workflow:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to run validation synthesis' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/validation/[businessId]/synthesis
 *
 * Get the final validation recommendation.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getSession()
    const { businessId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const validationSession = await prisma.validationSession.findUnique({
      where: { businessId },
    })

    if (!validationSession) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Validation session not found' },
        { status: 404 }
      )
    }

    const isComplete = validationSession.completedWorkflows.includes('validation_synthesis')

    const synthesisData = isComplete
      ? {
          validation_score: validationSession.validationScore,
          recommendation: validationSession.recommendation,
          strengths: validationSession.strengths,
          risks: validationSession.risks,
          next_steps: validationSession.nextSteps,
        }
      : null

    return NextResponse.json({
      success: true,
      data: {
        status: isComplete ? 'completed' : 'pending',
        synthesis: synthesisData,
        canProceedToPlanning:
          isComplete &&
          (validationSession.recommendation === 'GO' || validationSession.recommendation === 'CONDITIONAL_GO'),
      },
    })
  } catch (error) {
    console.error('Error fetching validation synthesis:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch synthesis' },
      { status: 500 }
    )
  }
}
