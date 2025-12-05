/**
 * Customer Discovery Workflow API Routes
 *
 * POST /api/validation/[businessId]/customer-discovery - Run customer discovery
 * GET /api/validation/[businessId]/customer-discovery - Get current customer data
 *
 * Story: 08.10 - Implement Customer Discovery Workflow
 */

import { NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { getSession } from '@/lib/auth-server'
import { z } from 'zod'

// ============================================================================
// Types & Validation Schemas
// ============================================================================

interface ICP {
  segment: string
  industry: string
  company_size: string
  characteristics: string[]
  must_haves: string[]
  disqualifiers: string[]
  confidence: 'high' | 'medium' | 'low'
}

interface Persona {
  name: string
  title: string
  demographics: string
  goals: string[]
  frustrations: string[]
  objections: string[]
  representative_quote: string
}

interface JTBD {
  functional_jobs: string[]
  emotional_jobs: string[]
  social_jobs: string[]
  opportunity_scores: Array<{
    job: string
    importance: number
    satisfaction: number
    opportunity: number
  }>
}

interface WillingnessToPay {
  assessment: string
  price_sensitivity: 'low' | 'medium' | 'high'
  value_drivers: string[]
}

/**
 * Structured output from the customer discovery workflow
 */
export interface CustomerDiscoveryOutput {
  icp: ICP
  personas: Persona[]
  jtbd: JTBD
  willingness_to_pay: WillingnessToPay
  recommended_segment: string
  analysis_summary: string
  next_workflow: 'validation_synthesis'
  is_complete: boolean
}

// Schema for triggering customer discovery
const customerDiscoveryRequestSchema = z.object({
  message: z.string().optional(),
})

// ============================================================================
// Mock Response Generator (will be replaced with actual Agno integration)
// ============================================================================

function generateCustomerDiscoveryResponse(
  _problemStatement: string | null,
  targetCustomer: string | null
): { content: string; output: CustomerDiscoveryOutput } {
  // Generate mock customer data based on business context
  // In production, this would call the Agno Persona agent

  const industryKeywords = (targetCustomer || '').toLowerCase()
  let icp: ICP
  let personas: Persona[]
  let segment: string

  // Generate industry-appropriate customer profiles
  if (industryKeywords.includes('enterprise') || industryKeywords.includes('b2b')) {
    segment = 'Mid-Market Enterprise'
    icp = {
      segment: 'Mid-Market B2B',
      industry: 'Technology, Professional Services, Financial Services',
      company_size: '100-1000 employees',
      characteristics: [
        'Digital transformation in progress',
        'Existing tech stack but seeking consolidation',
        'Dedicated IT/Operations team',
        'Growth-oriented leadership',
      ],
      must_haves: [
        'Budget authority for $20k-100k/year solutions',
        'Pain point directly related to operational efficiency',
        'Decision maker accessible within 2 calls',
      ],
      disqualifiers: [
        'Companies with less than 50 employees',
        'Heavily regulated industries with compliance blockers',
        'Companies in acquisition/merger process',
      ],
      confidence: 'high',
    }
    personas = [
      {
        name: 'Operations Olivia',
        title: 'VP of Operations',
        demographics: '35-50, MBA, 10+ years experience',
        goals: [
          'Reduce operational overhead by 30%',
          'Improve team productivity metrics',
          'Demonstrate ROI to leadership',
        ],
        frustrations: [
          'Too many disconnected tools',
          'Manual processes wasting team time',
          'Difficulty proving value of investments',
        ],
        objections: [
          'How does this integrate with our existing stack?',
          'What is the implementation timeline?',
          'Can we see case studies from similar companies?',
        ],
        representative_quote:
          '"I spend half my day in meetings and the other half firefighting issues that automation should have prevented."',
      },
      {
        name: 'Tech-Savvy Tom',
        title: 'Director of IT',
        demographics: '30-45, Technical background, Cloud-first mindset',
        goals: [
          'Modernize legacy systems',
          'Reduce technical debt',
          'Enable business agility',
        ],
        frustrations: [
          'Shadow IT proliferating across departments',
          'Security concerns with ungoverned tools',
          'Integration complexity',
        ],
        objections: [
          'What APIs and integrations are available?',
          'How is data security handled?',
          'What is your SLA and support model?',
        ],
        representative_quote:
          '"Every new tool means another integration to maintain. I need solutions that reduce complexity, not add to it."',
      },
      {
        name: 'CFO Frank',
        title: 'Chief Financial Officer',
        demographics: '45-60, Finance background, ROI-focused',
        goals: [
          'Reduce operating costs',
          'Improve financial forecasting',
          'Justify technology investments',
        ],
        frustrations: [
          'Unclear ROI from tech investments',
          'Hidden costs in software contracts',
          'Difficulty budgeting for variable costs',
        ],
        objections: [
          'What is the total cost of ownership?',
          'When will we see positive ROI?',
          'What happens if we need to scale down?',
        ],
        representative_quote:
          '"Show me the numbers. I need to know exactly what this will cost and what it will save us."',
      },
    ]
  } else {
    segment = 'SMB Founders & Teams'
    icp = {
      segment: 'Small Business / Startup',
      industry: 'Technology Startups, Professional Services, E-commerce',
      company_size: '5-50 employees',
      characteristics: [
        'Resource-constrained but growth-focused',
        'Founder-led decision making',
        'Looking for efficiency gains',
        'Price-sensitive but value-aware',
      ],
      must_haves: [
        'Active pain point with current solution',
        'Budget of $50-500/month per user',
        'Decision maker is end user',
      ],
      disqualifiers: [
        'Pre-revenue companies',
        'Heavily funded with enterprise requirements',
        'Industries requiring heavy customization',
      ],
      confidence: 'medium',
    }
    personas = [
      {
        name: 'Startup Sarah',
        title: 'Founder / CEO',
        demographics: '28-40, First-time or serial entrepreneur',
        goals: [
          'Grow revenue while keeping team lean',
          'Automate repetitive tasks',
          'Focus on product and customers',
        ],
        frustrations: [
          'Wearing too many hats',
          'Tools designed for enterprises',
          'Hidden complexity in simple-sounding solutions',
        ],
        objections: [
          'Is this really designed for companies our size?',
          'Can I try it before committing?',
          'How quickly can we see results?',
        ],
        representative_quote:
          '"I don\'t have time for a 6-week implementation. I need something that works out of the box."',
      },
      {
        name: 'Manager Mike',
        title: 'Operations Manager',
        demographics: '30-45, Hands-on manager, Small team lead',
        goals: [
          'Keep team organized',
          'Reduce manual data entry',
          'Hit monthly targets consistently',
        ],
        frustrations: [
          'Spreadsheet chaos',
          'No single source of truth',
          'Falling behind on admin tasks',
        ],
        objections: [
          'Will my team actually use this?',
          'How much training is required?',
          'Can we migrate our existing data?',
        ],
        representative_quote:
          '"I know there is a better way, but I cannot afford to lose productivity while we figure it out."',
      },
      {
        name: 'Solo Sam',
        title: 'Solopreneur / Freelancer',
        demographics: '25-50, Independent professional',
        goals: [
          'Professional appearance',
          'Time savings',
          'Business growth without hiring',
        ],
        frustrations: [
          'Enterprise pricing for basic features',
          'Complexity overkill for solo use',
          'Limited budget for tools',
        ],
        objections: [
          'Do you have a solo plan?',
          'Is there a free tier?',
          'Can this scale if I hire?',
        ],
        representative_quote: '"I just need something simple that makes me look professional without breaking the bank."',
      },
    ]
  }

  const jtbd: JTBD = {
    functional_jobs: [
      'Manage customer relationships efficiently',
      'Track sales pipeline and opportunities',
      'Automate repetitive administrative tasks',
      'Generate reports and insights',
    ],
    emotional_jobs: [
      'Feel in control of business operations',
      'Reduce stress from disorganization',
      'Confidence in business decisions',
      'Pride in professional appearance',
    ],
    social_jobs: [
      'Appear professional to customers',
      'Demonstrate competence to stakeholders',
      'Keep up with industry standards',
    ],
    opportunity_scores: [
      { job: 'Automate repetitive tasks', importance: 9, satisfaction: 4, opportunity: 14 },
      { job: 'Single source of truth', importance: 8, satisfaction: 3, opportunity: 13 },
      { job: 'Quick time-to-value', importance: 9, satisfaction: 5, opportunity: 13 },
      { job: 'Affordable pricing', importance: 8, satisfaction: 5, opportunity: 11 },
    ],
  }

  const willingnessToPay: WillingnessToPay = {
    assessment: `${segment} shows moderate willingness to pay for solutions that demonstrate clear ROI within 30 days`,
    price_sensitivity: segment.includes('Enterprise') ? 'low' : 'medium',
    value_drivers: [
      'Time savings (hours/week)',
      'Revenue impact (deals closed)',
      'Team productivity (tasks completed)',
      'Customer satisfaction (NPS improvement)',
    ],
  }

  const output: CustomerDiscoveryOutput = {
    icp,
    personas,
    jtbd,
    willingness_to_pay: willingnessToPay,
    recommended_segment: segment,
    analysis_summary: `Primary segment is ${segment}. The ICP is well-defined with ${icp.confidence} confidence. Three distinct buyer personas identified with clear goals, frustrations, and objections. JTBD analysis reveals high-opportunity areas in automation and single-source-of-truth functionality.`,
    next_workflow: 'validation_synthesis',
    is_complete: true,
  }

  const content = `## Customer Discovery Complete ✅

**Persona** (Customer Research) has completed the customer profiling.

### Ideal Customer Profile (ICP)
**Segment:** ${icp.segment}
**Industry:** ${icp.industry}
**Company Size:** ${icp.company_size}
**Confidence:** ${icp.confidence.toUpperCase()}

**Key Characteristics:**
${icp.characteristics.map((c) => `- ${c}`).join('\n')}

**Must-Haves:**
${icp.must_haves.map((m) => `- ✅ ${m}`).join('\n')}

**Disqualifiers:**
${icp.disqualifiers.map((d) => `- ❌ ${d}`).join('\n')}

---

### Buyer Personas

${personas
  .map(
    (p) => `
#### ${p.name} - ${p.title}
*${p.demographics}*

**Goals:** ${p.goals.join(' | ')}

**Frustrations:** ${p.frustrations.join(' | ')}

**Common Objections:**
${p.objections.map((o) => `- "${o}"`).join('\n')}

> ${p.representative_quote}
`
  )
  .join('\n---\n')}

---

### Jobs-to-be-Done Analysis

**Top Opportunities (Importance + Gap = Opportunity Score):**
| Job | Importance | Current Satisfaction | Opportunity |
|-----|------------|---------------------|-------------|
${jtbd.opportunity_scores.map((s) => `| ${s.job} | ${s.importance}/10 | ${s.satisfaction}/10 | **${s.opportunity}** |`).join('\n')}

---

### Willingness to Pay
${willingnessToPay.assessment}

**Price Sensitivity:** ${willingnessToPay.price_sensitivity.toUpperCase()}

**Value Drivers:**
${willingnessToPay.value_drivers.map((v) => `- ${v}`).join('\n')}

---

### Recommendation
**Primary Segment:** ${segment}

I'm ready for **Validation Synthesis**. **Vera** will:
- Combine all findings
- Calculate validation score
- Generate go/no-go recommendation`

  return { content, output }
}

// ============================================================================
// API Handlers
// ============================================================================

/**
 * POST /api/validation/[businessId]/customer-discovery
 *
 * Run the customer discovery workflow.
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
    const validation = customerDiscoveryRequestSchema.safeParse(body)

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
          message: 'Idea intake must be completed before customer discovery',
        },
        { status: 400 }
      )
    }

    // Generate customer discovery response
    const response = generateCustomerDiscoveryResponse(
      business.validationData.problemStatement,
      business.validationData.targetCustomer
    )

    // Update validation session with customer data
    await prisma.validationSession.update({
      where: { businessId },
      data: {
        icps: JSON.parse(
          JSON.stringify({
            icp: response.output.icp,
            personas: response.output.personas,
            jtbd: response.output.jtbd,
            willingness_to_pay: response.output.willingness_to_pay,
            recommended_segment: response.output.recommended_segment,
          })
        ),
        completedWorkflows: {
          push: 'customer_discovery',
        },
      },
    })

    // Update business progress
    await prisma.business.update({
      where: { id: businessId },
      data: {
        onboardingProgress: 65,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        message: {
          role: 'assistant',
          agent: 'persona',
          content: response.content,
          suggestedActions: [
            'Continue to Validation Synthesis',
            'Refine ICP criteria',
            'Deep dive on specific persona',
          ],
          timestamp: new Date().toISOString(),
        },
        output: response.output,
        workflow_status: 'completed',
      },
    })
  } catch (error) {
    console.error('Error in customer discovery workflow:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to run customer discovery' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/validation/[businessId]/customer-discovery
 *
 * Get the current customer discovery status and data.
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

    const isComplete = validationSession.completedWorkflows.includes('customer_discovery')

    return NextResponse.json({
      success: true,
      data: {
        status: isComplete ? 'completed' : 'pending',
        customerData: validationSession.icps,
        nextWorkflow: isComplete ? 'validation_synthesis' : null,
      },
    })
  } catch (error) {
    console.error('Error fetching customer discovery status:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch status' },
      { status: 500 }
    )
  }
}
