/**
 * Market Sizing Workflow API Routes
 *
 * POST /api/validation/[businessId]/market-sizing - Run market sizing analysis
 * GET /api/validation/[businessId]/market-sizing - Get current market sizing data
 *
 * Story: 08.8 - Implement Market Sizing Workflow
 */

import { NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { getSession } from '@/lib/auth-server'
import { z } from 'zod'

// ============================================================================
// Types & Validation Schemas
// ============================================================================

interface MarketSource {
  name: string
  url?: string
  date: string
  credibility: 'high' | 'medium' | 'low'
}

/**
 * Structured output from the market sizing workflow
 */
export interface MarketSizingOutput {
  tam: {
    value: number
    formatted: string
    methodology: string
    confidence: 'high' | 'medium' | 'low'
    sources: MarketSource[]
  }
  sam: {
    value: number
    formatted: string
    constraints: string[]
    confidence: 'high' | 'medium' | 'low'
    sources: MarketSource[]
  }
  som: {
    conservative: number
    realistic: number
    optimistic: number
    formatted: {
      conservative: string
      realistic: string
      optimistic: string
    }
    assumptions: string[]
    confidence: 'high' | 'medium' | 'low'
  }
  overall_confidence: 'high' | 'medium' | 'low'
  analysis_summary: string
  next_workflow: 'competitor_mapping'
  is_complete: boolean
}

// Schema for triggering market sizing
const marketSizingRequestSchema = z.object({
  message: z.string().optional(),
  ideaSummary: z.string().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(1)}T`
  }
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`
  }
  return `$${value}`
}

// ============================================================================
// Mock Response Generator (will be replaced with actual Agno integration)
// ============================================================================

function generateMarketSizingResponse(
  _problemStatement: string | null, // Will be used by actual Agno agent
  targetCustomer: string | null
): { content: string; output: MarketSizingOutput } {
  // Generate mock market data based on business context
  // In production, this would call the Agno Marco agent with web search

  const industryKeywords = (targetCustomer || '').toLowerCase()
  let tamValue: number
  let category: string

  // Adjust TAM based on detected industry
  if (industryKeywords.includes('enterprise') || industryKeywords.includes('b2b')) {
    tamValue = 85_000_000_000 // $85B
    category = 'Enterprise Software'
  } else if (industryKeywords.includes('smb') || industryKeywords.includes('small business')) {
    tamValue = 42_000_000_000 // $42B
    category = 'SMB Solutions'
  } else if (industryKeywords.includes('consumer') || industryKeywords.includes('b2c')) {
    tamValue = 120_000_000_000 // $120B
    category = 'Consumer Technology'
  } else {
    tamValue = 25_000_000_000 // $25B default
    category = 'Technology Services'
  }

  // Calculate SAM and SOM
  const samValue = Math.round(tamValue * 0.15) // 15% of TAM
  const somConservative = Math.round(samValue * 0.005) // 0.5% of SAM
  const somRealistic = Math.round(samValue * 0.02) // 2% of SAM
  const somOptimistic = Math.round(samValue * 0.05) // 5% of SAM

  const output: MarketSizingOutput = {
    tam: {
      value: tamValue,
      formatted: formatCurrency(tamValue),
      methodology: 'Top-down analysis from industry reports',
      confidence: 'high',
      sources: [
        {
          name: 'Gartner Market Analysis 2024',
          url: 'https://www.gartner.com/en/research',
          date: '2024-06',
          credibility: 'high',
        },
        {
          name: 'Forrester Wave Report 2024',
          url: 'https://www.forrester.com/research',
          date: '2024-03',
          credibility: 'high',
        },
      ],
    },
    sam: {
      value: samValue,
      formatted: formatCurrency(samValue),
      constraints: [
        `Geographic focus: North America and Western Europe`,
        `Target segment: ${category}`,
        `Price point compatibility: Mid-market pricing`,
      ],
      confidence: 'medium',
      sources: [
        {
          name: 'IDC Market Forecast 2024',
          url: 'https://www.idc.com/research',
          date: '2024-05',
          credibility: 'high',
        },
        {
          name: 'Industry Survey Data',
          date: '2024-02',
          credibility: 'medium',
        },
      ],
    },
    som: {
      conservative: somConservative,
      realistic: somRealistic,
      optimistic: somOptimistic,
      formatted: {
        conservative: formatCurrency(somConservative),
        realistic: formatCurrency(somRealistic),
        optimistic: formatCurrency(somOptimistic),
      },
      assumptions: [
        'Year 1-2 market entry assumptions',
        'Conservative: Organic growth only',
        'Realistic: Moderate marketing spend, 1-2 key partnerships',
        'Optimistic: Strong product-market fit, viral growth component',
      ],
      confidence: 'medium',
    },
    overall_confidence: 'medium',
    analysis_summary: `The ${category} market presents a significant opportunity with a TAM of ${formatCurrency(tamValue)}. Given the constraints of geographic focus and target segment, the serviceable market is ${formatCurrency(samValue)}. Initial market capture potential ranges from ${formatCurrency(somConservative)} (conservative) to ${formatCurrency(somOptimistic)} (optimistic) in the first 2 years.`,
    next_workflow: 'competitor_mapping',
    is_complete: true,
  }

  const content = `## Market Sizing Analysis Complete ✅

**Marco** (Market Research Specialist) has completed the market sizing analysis.

### Total Addressable Market (TAM)
**${output.tam.formatted}** [${output.tam.confidence.toUpperCase()} confidence]

*Methodology:* ${output.tam.methodology}

*Sources:*
${output.tam.sources.map((s) => `- ${s.name} (${s.date})${s.url ? ` [Link](${s.url})` : ''}`).join('\n')}

---

### Serviceable Available Market (SAM)
**${output.sam.formatted}** [${output.sam.confidence.toUpperCase()} confidence]

*Constraints Applied:*
${output.sam.constraints.map((c) => `- ${c}`).join('\n')}

*Sources:*
${output.sam.sources.map((s) => `- ${s.name} (${s.date})${s.url ? ` [Link](${s.url})` : ''}`).join('\n')}

---

### Serviceable Obtainable Market (SOM) - Year 1-2
| Scenario | Market Capture | Assumptions |
|----------|---------------|-------------|
| Conservative | ${output.som.formatted.conservative} | Organic growth only |
| Realistic | ${output.som.formatted.realistic} | Moderate marketing, 1-2 partnerships |
| Optimistic | ${output.som.formatted.optimistic} | Strong PMF, viral growth |

---

### Key Findings
${output.analysis_summary}

---

I'm ready to proceed to **Competitor Analysis**. **Cipher** will:
- Identify direct and indirect competitors
- Analyze competitive positioning
- Find market gaps and opportunities`

  return { content, output }
}

// ============================================================================
// API Handlers
// ============================================================================

/**
 * POST /api/validation/[businessId]/market-sizing
 *
 * Run the market sizing workflow.
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
    const validation = marketSizingRequestSchema.safeParse(body)

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

    // Check if idea intake is complete
    if (!business.validationData?.completedWorkflows.includes('idea_intake')) {
      return NextResponse.json(
        {
          success: false,
          error: 'PREREQUISITE_NOT_MET',
          message: 'Idea intake must be completed before market sizing',
        },
        { status: 400 }
      )
    }

    // Generate market sizing response
    const response = generateMarketSizingResponse(
      business.validationData.problemStatement,
      business.validationData.targetCustomer
    )

    // Update validation session with market sizing data
    // Serialize to JSON-compatible format for Prisma JSON fields
    await prisma.validationSession.update({
      where: { businessId },
      data: {
        tam: JSON.parse(JSON.stringify(response.output.tam)),
        sam: JSON.parse(JSON.stringify(response.output.sam)),
        som: JSON.parse(JSON.stringify(response.output.som)),
        completedWorkflows: {
          push: 'market_sizing',
        },
      },
    })

    // Update business progress
    await prisma.business.update({
      where: { id: businessId },
      data: {
        onboardingProgress: 35,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        message: {
          role: 'assistant',
          agent: 'marco',
          content: response.content,
          suggestedActions: ['Continue to Competitor Analysis', 'View detailed sources', 'Refine market focus'],
          timestamp: new Date().toISOString(),
        },
        output: response.output,
        workflow_status: 'completed',
      },
    })
  } catch (error) {
    console.error('Error in market sizing workflow:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to run market sizing' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/validation/[businessId]/market-sizing
 *
 * Get the current market sizing status and data.
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

    const isComplete = validationSession.completedWorkflows.includes('market_sizing')

    // Construct market sizing data from individual fields
    const marketSizingData = validationSession.tam
      ? {
          tam: validationSession.tam,
          sam: validationSession.sam,
          som: validationSession.som,
        }
      : null

    return NextResponse.json({
      success: true,
      data: {
        status: isComplete ? 'completed' : 'pending',
        marketSizing: marketSizingData,
        nextWorkflow: isComplete ? 'competitor_mapping' : null,
      },
    })
  } catch (error) {
    console.error('Error fetching market sizing status:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch status' },
      { status: 500 }
    )
  }
}
