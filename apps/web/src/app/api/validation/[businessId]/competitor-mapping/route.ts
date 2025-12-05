/**
 * Competitor Mapping Workflow API Routes
 *
 * POST /api/validation/[businessId]/competitor-mapping - Run competitor analysis
 * GET /api/validation/[businessId]/competitor-mapping - Get current competitor data
 *
 * Story: 08.9 - Implement Competitor Mapping Workflow
 */

import { NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { getSession } from '@/lib/auth-server'
import { z } from 'zod'

// ============================================================================
// Types & Validation Schemas
// ============================================================================

interface Competitor {
  name: string
  type: 'direct' | 'indirect' | 'substitute'
  pricing: string
  features: string[]
  strengths: string[]
  weaknesses: string[]
  market_position: string
  source_url?: string
}

interface PositioningMap {
  x_axis: string
  y_axis: string
  positions: Array<{
    name: string
    x: number
    y: number
  }>
}

interface PorterFiveForces {
  competitive_rivalry: string
  supplier_power: string
  buyer_power: string
  threat_of_substitutes: string
  threat_of_new_entrants: string
}

/**
 * Structured output from the competitor mapping workflow
 */
export interface CompetitorMappingOutput {
  competitors: Competitor[]
  positioning_map: PositioningMap
  opportunity_gaps: string[]
  porter_five_forces: PorterFiveForces
  analysis_summary: string
  next_workflow: 'customer_discovery'
  is_complete: boolean
}

// Schema for triggering competitor mapping
const competitorMappingRequestSchema = z.object({
  message: z.string().optional(),
})

// ============================================================================
// Mock Response Generator (will be replaced with actual Agno integration)
// ============================================================================

function generateCompetitorMappingResponse(
  _proposedSolution: string | null,
  targetCustomer: string | null
): { content: string; output: CompetitorMappingOutput } {
  // Generate mock competitor data based on business context
  // In production, this would call the Agno Cipher agent with web search

  const industryKeywords = (targetCustomer || '').toLowerCase()
  let competitors: Competitor[]
  let category: string

  // Generate industry-appropriate competitors
  if (industryKeywords.includes('enterprise') || industryKeywords.includes('b2b')) {
    category = 'Enterprise Software'
    competitors = [
      {
        name: 'Salesforce',
        type: 'direct',
        pricing: '$25-300/user/month',
        features: ['CRM', 'Sales automation', 'AI insights', 'Integrations'],
        strengths: ['Market leader', 'Extensive ecosystem', 'Enterprise features'],
        weaknesses: ['Complex pricing', 'Steep learning curve', 'Expensive'],
        market_position: 'Premium enterprise leader',
        source_url: 'https://salesforce.com/pricing',
      },
      {
        name: 'HubSpot',
        type: 'direct',
        pricing: '$0-1200/month',
        features: ['CRM', 'Marketing automation', 'Sales tools', 'Service hub'],
        strengths: ['Free tier', 'All-in-one platform', 'User friendly'],
        weaknesses: ['Add-on costs', 'Limited customization'],
        market_position: 'Mid-market all-in-one',
        source_url: 'https://hubspot.com/pricing',
      },
      {
        name: 'Pipedrive',
        type: 'indirect',
        pricing: '$14-99/user/month',
        features: ['Pipeline management', 'Sales tracking', 'Automation'],
        strengths: ['Visual pipeline', 'Affordable', 'Easy to use'],
        weaknesses: ['Limited marketing', 'Basic reporting'],
        market_position: 'SMB sales-focused',
        source_url: 'https://pipedrive.com/pricing',
      },
      {
        name: 'Notion + Airtable',
        type: 'substitute',
        pricing: '$10-25/user/month',
        features: ['Custom databases', 'Workflow automation', 'Documentation'],
        strengths: ['Flexible', 'Low cost', 'No-code'],
        weaknesses: ['Not purpose-built', 'Manual setup', 'Limited CRM features'],
        market_position: 'DIY alternative',
      },
    ]
  } else if (industryKeywords.includes('smb') || industryKeywords.includes('small business')) {
    category = 'SMB Solutions'
    competitors = [
      {
        name: 'Zoho CRM',
        type: 'direct',
        pricing: '$14-52/user/month',
        features: ['CRM', 'Automation', 'AI', 'Social CRM'],
        strengths: ['Affordable', 'Suite integration', 'Feature-rich'],
        weaknesses: ['UI complexity', 'Support quality'],
        market_position: 'Value-focused all-in-one',
        source_url: 'https://zoho.com/crm/pricing',
      },
      {
        name: 'Monday.com',
        type: 'indirect',
        pricing: '$8-16/user/month',
        features: ['Project management', 'CRM templates', 'Automation'],
        strengths: ['Visual', 'Flexible', 'Easy onboarding'],
        weaknesses: ['Not CRM-native', 'Add-on costs'],
        market_position: 'Work OS with CRM features',
        source_url: 'https://monday.com/pricing',
      },
      {
        name: 'Spreadsheets',
        type: 'substitute',
        pricing: '$0-12/user/month',
        features: ['Data storage', 'Basic formulas', 'Sharing'],
        strengths: ['Free', 'Familiar', 'Flexible'],
        weaknesses: ['No automation', 'Manual work', 'Error-prone'],
        market_position: 'Free DIY alternative',
      },
    ]
  } else {
    category = 'Technology Services'
    competitors = [
      {
        name: 'Industry Leader A',
        type: 'direct',
        pricing: '$50-200/month',
        features: ['Core solution', 'Integrations', 'Support'],
        strengths: ['Brand recognition', 'Mature product'],
        weaknesses: ['Legacy tech', 'Slow innovation'],
        market_position: 'Established incumbent',
      },
      {
        name: 'Emerging Player B',
        type: 'direct',
        pricing: '$30-100/month',
        features: ['Modern UX', 'API-first', 'AI features'],
        strengths: ['Innovation', 'User experience'],
        weaknesses: ['Less proven', 'Smaller ecosystem'],
        market_position: 'Innovative challenger',
      },
      {
        name: 'Alternative Solution C',
        type: 'indirect',
        pricing: '$20-80/month',
        features: ['Different approach', 'Niche focus'],
        strengths: ['Specialized', 'Deep expertise'],
        weaknesses: ['Limited scope', 'Smaller market'],
        market_position: 'Niche specialist',
      },
    ]
  }

  const output: CompetitorMappingOutput = {
    competitors,
    positioning_map: {
      x_axis: 'Price (Low → High)',
      y_axis: 'Feature Complexity (Simple → Enterprise)',
      positions: [
        { name: 'Your Position', x: 35, y: 50 },
        ...competitors.map((c, i) => ({
          name: c.name,
          x: 20 + i * 25,
          y: c.type === 'direct' ? 70 : c.type === 'indirect' ? 50 : 30,
        })),
      ],
    },
    opportunity_gaps: [
      `AI-first approach lacking in ${category} incumbents`,
      'Small business segment underserved by enterprise players',
      'Integration complexity creates opportunity for unified platform',
      'Price-performance gap between free and enterprise tiers',
    ],
    porter_five_forces: {
      competitive_rivalry: 'HIGH - Multiple established players with strong market presence',
      supplier_power: 'LOW - Multiple cloud providers and technology options',
      buyer_power: 'MEDIUM - Switching costs moderate but customers price-sensitive',
      threat_of_substitutes: 'MEDIUM - DIY solutions and manual processes remain common',
      threat_of_new_entrants: 'MEDIUM - Low barriers but distribution is challenging',
    },
    analysis_summary: `The ${category} market is competitive with ${competitors.length} key players identified. Despite competition, opportunities exist in AI automation, SMB pricing, and platform integration.`,
    next_workflow: 'customer_discovery',
    is_complete: true,
  }

  const content = `## Competitor Analysis Complete ✅

**Cipher** (Competitive Intelligence) has completed the competitor mapping.

### Competitive Landscape Overview
${competitors.length} competitors identified in the ${category} market.

---

### Direct Competitors
${competitors
  .filter((c) => c.type === 'direct')
  .map(
    (c) => `
**${c.name}**
- Pricing: ${c.pricing}
- Position: ${c.market_position}
- Strengths: ${c.strengths.join(', ')}
- Weaknesses: ${c.weaknesses.join(', ')}
${c.source_url ? `- [Source](${c.source_url})` : ''}`
  )
  .join('\n')}

---

### Indirect Competitors
${competitors
  .filter((c) => c.type === 'indirect')
  .map(
    (c) => `
**${c.name}**
- Pricing: ${c.pricing}
- Position: ${c.market_position}`
  )
  .join('\n')}

---

### Substitutes
${competitors
  .filter((c) => c.type === 'substitute')
  .map((c) => `- **${c.name}**: ${c.market_position}`)
  .join('\n')}

---

### Opportunity Gaps Identified
${output.opportunity_gaps.map((gap, i) => `${i + 1}. ${gap}`).join('\n')}

---

### Porter's Five Forces Summary
| Force | Assessment |
|-------|------------|
| Competitive Rivalry | ${output.porter_five_forces.competitive_rivalry.split(' - ')[0]} |
| Supplier Power | ${output.porter_five_forces.supplier_power.split(' - ')[0]} |
| Buyer Power | ${output.porter_five_forces.buyer_power.split(' - ')[0]} |
| Threat of Substitutes | ${output.porter_five_forces.threat_of_substitutes.split(' - ')[0]} |
| Threat of New Entrants | ${output.porter_five_forces.threat_of_new_entrants.split(' - ')[0]} |

---

I'm ready to proceed to **Customer Discovery**. **Persona** will:
- Define your Ideal Customer Profile (ICP)
- Create buyer personas
- Analyze Jobs-to-be-Done`

  return { content, output }
}

// ============================================================================
// API Handlers
// ============================================================================

/**
 * POST /api/validation/[businessId]/competitor-mapping
 *
 * Run the competitor mapping workflow.
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
    const validation = competitorMappingRequestSchema.safeParse(body)

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
          message: 'Idea intake must be completed before competitor mapping',
        },
        { status: 400 }
      )
    }

    // Generate competitor mapping response
    const response = generateCompetitorMappingResponse(
      business.validationData.proposedSolution,
      business.validationData.targetCustomer
    )

    // Update validation session with competitor data
    await prisma.validationSession.update({
      where: { businessId },
      data: {
        competitors: JSON.parse(JSON.stringify(response.output.competitors)),
        positioningMap: JSON.parse(JSON.stringify(response.output.positioning_map)),
        opportunityGaps: JSON.parse(JSON.stringify(response.output.opportunity_gaps)),
        completedWorkflows: {
          push: 'competitor_mapping',
        },
      },
    })

    // Update business progress
    await prisma.business.update({
      where: { id: businessId },
      data: {
        onboardingProgress: 50,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        message: {
          role: 'assistant',
          agent: 'cipher',
          content: response.content,
          suggestedActions: [
            'Continue to Customer Discovery',
            'View positioning map',
            'Deep dive on specific competitor',
          ],
          timestamp: new Date().toISOString(),
        },
        output: response.output,
        workflow_status: 'completed',
      },
    })
  } catch (error) {
    console.error('Error in competitor mapping workflow:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to run competitor mapping' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/validation/[businessId]/competitor-mapping
 *
 * Get the current competitor mapping status and data.
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

    const isComplete = validationSession.completedWorkflows.includes('competitor_mapping')

    const competitorData = validationSession.competitors
      ? {
          competitors: validationSession.competitors,
          positioningMap: validationSession.positioningMap,
          opportunityGaps: validationSession.opportunityGaps,
        }
      : null

    return NextResponse.json({
      success: true,
      data: {
        status: isComplete ? 'completed' : 'pending',
        competitorData,
        nextWorkflow: isComplete ? 'customer_discovery' : null,
      },
    })
  } catch (error) {
    console.error('Error fetching competitor mapping status:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch status' },
      { status: 500 }
    )
  }
}
