/**
 * Business Plan Synthesis Workflow API Routes
 *
 * POST /api/planning/[businessId]/business-plan - Process synthesis message
 * PUT /api/planning/[businessId]/business-plan - Update plan section
 * GET /api/planning/[businessId]/business-plan - Get plan status
 *
 * Story: 08.16 - Implement Business Plan Synthesis Workflow
 */

import { NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { getSession } from '@/lib/auth-server'
import { z } from 'zod'

// ============================================================================
// Types & Validation Schemas
// ============================================================================

interface BusinessPlanSections {
  executiveSummary: string
  companyDescription: string
  marketAnalysis: string
  productsServices: string
  businessModel: string
  goToMarket: string
  operations: string
  management: string
  financials: string
  funding: string
}

export interface BusinessPlan {
  sections: BusinessPlanSections
  metadata: {
    version: string
    createdAt: string
    updatedAt: string
    status: 'draft' | 'pending_approval' | 'approved' | 'final'
    completionPercentage: number
  }
}

// Schema for incoming message
const planMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  context: z.string().optional(),
})

// Schema for updating a section
const planSectionUpdateSchema = z.object({
  section: z.enum([
    'executiveSummary',
    'companyDescription',
    'marketAnalysis',
    'productsServices',
    'businessModel',
    'goToMarket',
    'operations',
    'management',
    'financials',
    'funding',
  ]),
  content: z.string(),
})

// ============================================================================
// Section Configuration
// ============================================================================

const PLAN_SECTIONS = [
  { id: 'executiveSummary', title: 'Executive Summary', order: 1 },
  { id: 'companyDescription', title: 'Company Description', order: 2 },
  { id: 'marketAnalysis', title: 'Market Analysis', order: 3 },
  { id: 'productsServices', title: 'Products & Services', order: 4 },
  { id: 'businessModel', title: 'Business Model', order: 5 },
  { id: 'goToMarket', title: 'Go-to-Market Strategy', order: 6 },
  { id: 'operations', title: 'Operations Plan', order: 7 },
  { id: 'management', title: 'Management Team', order: 8 },
  { id: 'financials', title: 'Financial Projections', order: 9 },
  { id: 'funding', title: 'Funding Requirements', order: 10 },
] as const

type SectionId = (typeof PLAN_SECTIONS)[number]['id']

// ============================================================================
// Mock Response Generator (will be replaced with actual Agno integration)
// ============================================================================

interface PlanContext {
  currentSection: SectionId
  completedSections: SectionId[]
  plan: Partial<BusinessPlan>
  businessData: {
    name?: string
    problemStatement?: string
    proposedSolution?: string
    targetCustomer?: string
  }
}

function parsePlanContext(
  _planningData: { canvas?: unknown; financials?: unknown; completedWorkflows?: string[] } | null,
  business: { name?: string },
  validationData: {
    problemStatement?: string | null
    proposedSolution?: string | null
    targetCustomer?: string | null
  } | null
): PlanContext {
  const completedSections: SectionId[] = []
  const plan: Partial<BusinessPlan> = {}

  // Note: planningData reserved for future use when parsing existing plan data
  // Currently, we track completion through workflow status

  // Determine current section based on completed sections
  const currentSection =
    PLAN_SECTIONS.find((s) => !completedSections.includes(s.id))?.id || 'executiveSummary'

  return {
    currentSection,
    completedSections,
    plan,
    businessData: {
      name: business.name || 'Your Business',
      problemStatement: validationData?.problemStatement || undefined,
      proposedSolution: validationData?.proposedSolution || undefined,
      targetCustomer: validationData?.targetCustomer || undefined,
    },
  }
}

function createEmptyPlan(): BusinessPlan {
  return {
    sections: {
      executiveSummary: '',
      companyDescription: '',
      marketAnalysis: '',
      productsServices: '',
      businessModel: '',
      goToMarket: '',
      operations: '',
      management: '',
      financials: '',
      funding: '',
    },
    metadata: {
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      completionPercentage: 0,
    },
  }
}

function generateSectionContent(
  section: SectionId,
  context: PlanContext
): string {
  const { businessData } = context
  const name = businessData.name || 'Your Business'
  const problem = businessData.problemStatement || 'solve key business challenges'
  const solution = businessData.proposedSolution || 'innovative AI-powered solutions'
  const target = businessData.targetCustomer || 'mid-market businesses'

  switch (section) {
    case 'executiveSummary':
      return `# Executive Summary

## Business Overview
${name} is a technology company focused on helping ${target} ${problem}.

## The Opportunity
The market for our solution represents a significant opportunity:
- TAM: $4.2B globally
- SAM: $840M in target regions
- SOM: $42M achievable in first 3 years

## Our Solution
We offer ${solution} that delivers:
- 90% automation of routine operations
- ~5 hours/week human involvement required
- AI-powered decision support

## Financial Highlights
- Year 1 Revenue: $500K
- Year 3 Revenue: $4.2M
- Break-even: Month 14
- LTV:CAC Ratio: 3.6:1

## Funding Requirements
Seeking $1.5M seed funding to:
- Build core product
- Hire initial team
- Acquire first 50 customers`

    case 'companyDescription':
      return `# Company Description

## Mission Statement
To empower ${target} with AI-driven solutions that transform how they operate and grow.

## Vision
To become the leading platform for AI-powered business automation, enabling companies to achieve the 90/5 promise - 90% automation with ~5 hours of human involvement per week.

## Company History
${name} was founded to address the growing need for intelligent business automation in the ${target} segment.

## Legal Structure
Incorporated as a Delaware C-Corporation, structured for venture capital investment.

## Location
Headquarters located in [City], with remote-first team structure enabling global talent acquisition.`

    case 'marketAnalysis':
      return `# Market Analysis

## Industry Overview
The business automation and AI services market is experiencing rapid growth, driven by:
- Increasing labor costs
- Digital transformation initiatives
- AI technology maturation
- Remote work trends

## Market Size
| Segment | Size | CAGR |
|---------|------|------|
| TAM | $4.2B | 15% |
| SAM | $840M | 18% |
| SOM | $42M | 25% |

## Target Market
Primary: ${target}
- Company size: 100-1,000 employees
- Industries: Technology, Professional Services
- Geography: North America initially

## Competitive Landscape
Key competitors include established players and emerging startups. Our differentiation lies in the 90/5 promise and confidence-based AI routing.

## Market Trends
1. Increasing AI adoption in business operations
2. Growing demand for automation ROI
3. Shift toward intelligent decision support`

    case 'productsServices':
      return `# Products & Services

## Core Platform
${solution}

### Key Features
1. **AI Agents** - Specialized agents for different business functions
2. **Human-in-the-Loop** - Confidence-based routing for oversight
3. **Integration Hub** - Connect with existing business tools
4. **Analytics Dashboard** - Real-time performance metrics

## Service Tiers

| Tier | Features | Price |
|------|----------|-------|
| Starter | Core automation, 5 users | $99/mo |
| Growth | Advanced AI, 20 users | $299/mo |
| Enterprise | Full suite, unlimited | Custom |

## Product Roadmap
- Q1: Core platform launch
- Q2: Integration marketplace
- Q3: Advanced analytics
- Q4: Industry-specific modules`

    case 'businessModel':
      return `# Business Model

## Revenue Model
SaaS subscription with tiered pricing based on:
- Number of users
- AI agent usage
- Integration requirements
- Support level

## Pricing Strategy
- Entry point: $99/month (attracts SMBs)
- Average contract value: $50,000/year
- Enterprise custom pricing

## Unit Economics
| Metric | Value |
|--------|-------|
| ARPU | $200/month |
| LTV | $7,200 |
| CAC | $2,000 |
| LTV:CAC | 3.6:1 |
| Payback | 10 months |

## Revenue Projections
| Year | ARR | Customers |
|------|-----|-----------|
| Y1 | $500K | 10 |
| Y2 | $1.5M | 30 |
| Y3 | $4.2M | 84 |`

    case 'goToMarket':
      return `# Go-to-Market Strategy

## Market Entry Strategy
1. **Focus on beachhead** - Mid-market technology companies
2. **Content-led growth** - Thought leadership and education
3. **Product-led acquisition** - Free trial and self-serve

## Marketing Channels
- Content marketing (blog, webinars, podcasts)
- Social media (LinkedIn, Twitter)
- Industry events and conferences
- Partner referral program

## Sales Strategy
- Inside sales for SMB ($5K-$50K ACV)
- Account executives for Enterprise ($50K+ ACV)
- Channel partners for scale

## Customer Acquisition Funnel
1. Awareness → Content, ads
2. Interest → Free trial, demo
3. Consideration → Sales engagement
4. Purchase → Contract negotiation
5. Retention → Customer success

## Partnership Strategy
- Technology partnerships (CRM, ERP integrations)
- Channel partnerships (consultants, agencies)
- Strategic partnerships (complementary solutions)`

    case 'operations':
      return `# Operations Plan

## Technology Infrastructure
- Cloud-native architecture (AWS/GCP)
- Multi-tenant SaaS platform
- SOC 2 Type II compliance
- 99.9% uptime SLA

## Development Process
- Agile methodology (2-week sprints)
- CI/CD pipeline
- Automated testing
- Feature flags for gradual rollout

## Customer Support
| Tier | Response Time | Channels |
|------|---------------|----------|
| Basic | 24 hours | Email, chat |
| Premium | 4 hours | Email, chat, phone |
| Enterprise | 1 hour | Dedicated CSM |

## Security & Compliance
- End-to-end encryption
- GDPR compliant
- SOC 2 Type II certified
- Regular penetration testing

## Key Operational Metrics
- System uptime: >99.9%
- Average response time: <200ms
- Support satisfaction: >95%`

    case 'management':
      return `# Management Team

## Leadership Team

### CEO/Founder
- Background: [Industry experience]
- Responsibilities: Vision, strategy, fundraising

### CTO/Co-Founder
- Background: [Technical experience]
- Responsibilities: Product, engineering, infrastructure

### VP Sales
- Background: [Sales experience]
- Responsibilities: Revenue, partnerships

### VP Marketing
- Background: [Marketing experience]
- Responsibilities: Brand, demand generation

## Advisory Board
- Industry experts
- Successful founders
- Domain specialists

## Hiring Plan
| Role | Timeline | Priority |
|------|----------|----------|
| Engineers (5) | Q1-Q2 | High |
| Sales (3) | Q2 | High |
| Support (2) | Q2-Q3 | Medium |
| Marketing (2) | Q3 | Medium |

## Culture & Values
1. Customer obsession
2. Move fast, learn faster
3. Transparency and trust
4. Excellence in execution`

    case 'financials':
      return `# Financial Projections

## Revenue Forecast

| Year | Revenue | Growth |
|------|---------|--------|
| Y1 | $500K | - |
| Y2 | $1.5M | 200% |
| Y3 | $4.2M | 180% |
| Y4 | $8.4M | 100% |
| Y5 | $14.7M | 75% |

## P&L Summary

| Metric | Y1 | Y2 | Y3 |
|--------|-----|-----|-----|
| Revenue | $500K | $1.5M | $4.2M |
| Gross Profit | $375K | $1.1M | $3.2M |
| Net Income | $(100K) | $225K | $1.3M |
| Net Margin | -20% | 15% | 30% |

## Unit Economics

| Metric | Value |
|--------|-------|
| LTV | $7,200 |
| CAC | $2,000 |
| LTV:CAC | 3.6:1 |
| Gross Margin | 75% |
| Payback | 10 months |

## Break-Even Analysis
- Break-even revenue: $700K ARR
- Break-even customers: 14
- Months to break-even: 14

## Key Assumptions
- ACV: $50,000/year
- Customer churn: 2.5%/month
- Gross margin: 75%`

    case 'funding':
      return `# Funding Requirements

## Current Funding Status
- Bootstrapped to date
- Seeking seed funding

## Funding Request
**Amount:** $1.5M Seed Round

## Use of Funds

| Category | Amount | % |
|----------|--------|---|
| Product Development | $600K | 40% |
| Sales & Marketing | $450K | 30% |
| Operations | $300K | 20% |
| General & Admin | $150K | 10% |

## Milestones & Timeline

| Milestone | Timeline | Funding Need |
|-----------|----------|--------------|
| MVP Launch | Month 3 | $500K |
| First 10 Customers | Month 6 | $750K |
| Product-Market Fit | Month 12 | $1.5M |

## Investment Terms
- Target: $1.5M
- Valuation: $6M pre-money
- Equity: 20%
- Lead investor: TBD

## Exit Strategy
- Acquisition by larger enterprise software company
- IPO potential at $100M+ ARR
- Target exit timeline: 5-7 years

## Risk Factors
1. Market adoption rate
2. Competitive pressure
3. Economic conditions
4. Technology changes

## Return Potential
- 10x return potential over 5-7 years
- Based on comparable SaaS exits`

    default:
      return ''
  }
}

function generatePlanResponse(
  userMessage: string,
  context: PlanContext
): {
  content: string
  suggestedActions: string[]
  output?: BusinessPlan
  isComplete?: boolean
} {
  const lowerMessage = userMessage.toLowerCase()

  // Check for completion/generation commands
  const wantsGenerate =
    lowerMessage.includes('generate') ||
    lowerMessage.includes('create') ||
    lowerMessage.includes('start')
  const wantsComplete =
    lowerMessage.includes('complete') ||
    lowerMessage.includes('finish') ||
    lowerMessage.includes('finalize')
  const wantsSection = PLAN_SECTIONS.find(
    (s) =>
      lowerMessage.includes(s.title.toLowerCase()) ||
      lowerMessage.includes(s.id.toLowerCase())
  )
  const wantsPreview =
    lowerMessage.includes('preview') || lowerMessage.includes('review')
  const wantsApprove =
    lowerMessage.includes('approve') || lowerMessage.includes('looks good')

  // Initial request - generate full plan
  if (wantsGenerate || context.completedSections.length === 0) {
    // Generate all sections
    const plan = createEmptyPlan()

    for (const section of PLAN_SECTIONS) {
      plan.sections[section.id] = generateSectionContent(section.id, context)
    }

    plan.metadata.completionPercentage = 100
    plan.metadata.status = 'pending_approval'

    return {
      content: `## Business Plan Generated! 📄

I've synthesized your validation and planning data into a comprehensive business plan.

### Document Overview

The plan includes **10 sections**:

1. ✅ **Executive Summary** - Overview and highlights
2. ✅ **Company Description** - Mission, vision, structure
3. ✅ **Market Analysis** - TAM/SAM/SOM, competition
4. ✅ **Products & Services** - Features, tiers, roadmap
5. ✅ **Business Model** - Revenue model, unit economics
6. ✅ **Go-to-Market** - Marketing, sales strategy
7. ✅ **Operations** - Infrastructure, support
8. ✅ **Management** - Team, hiring plan
9. ✅ **Financial Projections** - 5-year forecast
10. ✅ **Funding Requirements** - Ask, use of funds

---

### Key Highlights

- **Funding Ask:** $1.5M seed round
- **Valuation:** $6M pre-money
- **Break-even:** Month 14
- **Year 3 Revenue:** $4.2M ARR

---

**Please review the plan and approve to finalize.**

Would you like to:
- Preview specific sections
- Make edits before approval
- Approve and finalize the plan`,
      suggestedActions: ['Preview Executive Summary', 'Approve & Finalize', 'Edit a section'],
      output: plan,
    }
  }

  // Preview specific section
  if (wantsSection) {
    const sectionContent = generateSectionContent(wantsSection.id, context)

    return {
      content: `## ${wantsSection.title}

${sectionContent}

---

Would you like to edit this section or continue reviewing?`,
      suggestedActions: ['Edit this section', 'Preview next section', 'Approve & Finalize'],
    }
  }

  // Preview/review request
  if (wantsPreview) {
    return {
      content: `## Business Plan Preview

Here's an overview of your plan sections:

| Section | Status | Length |
|---------|--------|--------|
| Executive Summary | ✅ Complete | ~300 words |
| Company Description | ✅ Complete | ~200 words |
| Market Analysis | ✅ Complete | ~250 words |
| Products & Services | ✅ Complete | ~300 words |
| Business Model | ✅ Complete | ~200 words |
| Go-to-Market | ✅ Complete | ~350 words |
| Operations | ✅ Complete | ~250 words |
| Management | ✅ Complete | ~250 words |
| Financials | ✅ Complete | ~300 words |
| Funding | ✅ Complete | ~350 words |

**Total:** ~2,750 words | ~11 pages

Which section would you like to preview in detail?`,
      suggestedActions: ['Executive Summary', 'Financial Projections', 'Funding Requirements'],
    }
  }

  // Approve and finalize
  if (wantsApprove || wantsComplete) {
    const plan = createEmptyPlan()

    for (const section of PLAN_SECTIONS) {
      plan.sections[section.id] = generateSectionContent(section.id, context)
    }

    plan.metadata.completionPercentage = 100
    plan.metadata.status = 'final'

    return {
      content: `## Business Plan Finalized! ✅

Your business plan has been approved and saved.

### Document Details
- **Status:** Final
- **Version:** 1.0
- **Pages:** ~11 pages
- **Word Count:** ~2,750 words

### Export Options
- **PDF** - Professional formatting with branding
- **DOCX** - Editable Microsoft Word format
- **Google Docs** - Collaborative editing

### Next Steps

🎉 **Congratulations!** You've completed the Planning phase!

You can now:
1. **Export** your business plan
2. **Share** with advisors or investors
3. **Continue** to Branding to develop your visual identity

Ready to create your brand identity with Bella?`,
      suggestedActions: ['Continue to Branding', 'Export as PDF', 'Share with team'],
      output: plan,
      isComplete: true,
    }
  }

  // Default response
  return {
    content: `I can help you with your business plan. What would you like to do?

**Current Status:** Plan generated, pending approval

**Options:**
- **Preview** - Review specific sections
- **Edit** - Modify any section
- **Approve** - Finalize the plan

Which would you like to do?`,
    suggestedActions: ['Preview plan', 'Approve & Finalize', 'Generate new plan'],
  }
}

// ============================================================================
// API Handlers
// ============================================================================

/**
 * POST /api/planning/[businessId]/business-plan
 *
 * Process a message in the business plan synthesis workflow.
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

    // Parse and validate request
    const body = await req.json()
    const validation = planMessageSchema.safeParse(body)

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

    // Get business with planning and validation data
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        planningData: true,
        validationData: true,
      },
    })

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Business not found' },
        { status: 404 }
      )
    }

    // Generate response
    const context = parsePlanContext(
      business.planningData,
      { name: business.name },
      business.validationData
    )
    const response = generatePlanResponse(validation.data.message, context)

    // If plan was generated/finalized, save to database
    if (response.output) {
      // For now, store as JSON in a field. In production, would generate and store PDF URL
      const businessPlanUrl = `data:application/json;base64,${Buffer.from(JSON.stringify(response.output)).toString('base64')}`

      await prisma.planningSession.upsert({
        where: { businessId },
        create: {
          businessId,
          businessPlanUrl,
          completedWorkflows: response.isComplete ? ['business_plan_synthesis'] : [],
        },
        update: {
          businessPlanUrl,
          completedWorkflows: response.isComplete
            ? { push: 'business_plan_synthesis' }
            : undefined,
        },
      })

      // Update business progress if workflow completed
      if (response.isComplete) {
        await prisma.business.update({
          where: { id: businessId },
          data: {
            planningStatus: 'COMPLETE',
            onboardingProgress: Math.max(business.onboardingProgress || 0, 70),
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: {
          role: 'assistant',
          agent: 'blake',
          content: response.content,
          suggestedActions: response.suggestedActions,
          timestamp: new Date().toISOString(),
        },
        output: response.output || null,
        workflow_status: response.isComplete ? 'completed' : 'in_progress',
      },
    })
  } catch (error) {
    console.error('Error in business plan synthesis workflow:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to process message' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/planning/[businessId]/business-plan
 *
 * Update a specific section of the business plan.
 */
export async function PUT(
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

    // Parse and validate request
    const body = await req.json()
    const validation = planSectionUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid update data',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    // Get current planning session
    const planningSession = await prisma.planningSession.findUnique({
      where: { businessId },
    })

    if (!planningSession || !planningSession.businessPlanUrl) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Business plan not found' },
        { status: 404 }
      )
    }

    // Parse existing plan
    let existingPlan: BusinessPlan
    try {
      const base64Data = planningSession.businessPlanUrl.replace(
        'data:application/json;base64,',
        ''
      )
      existingPlan = JSON.parse(Buffer.from(base64Data, 'base64').toString())
    } catch {
      return NextResponse.json(
        { success: false, error: 'PARSE_ERROR', message: 'Failed to parse existing plan' },
        { status: 500 }
      )
    }

    // Update section
    existingPlan.sections[validation.data.section] = validation.data.content
    existingPlan.metadata.updatedAt = new Date().toISOString()
    existingPlan.metadata.status = 'draft' // Reset to draft after edit

    // Save updated plan
    const businessPlanUrl = `data:application/json;base64,${Buffer.from(JSON.stringify(existingPlan)).toString('base64')}`

    const updated = await prisma.planningSession.update({
      where: { businessId },
      data: { businessPlanUrl },
    })

    return NextResponse.json({
      success: true,
      data: {
        planningSession: updated,
        message: `Section '${validation.data.section}' updated successfully`,
      },
    })
  } catch (error) {
    console.error('Error updating business plan section:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to update plan' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/planning/[businessId]/business-plan
 *
 * Get the current business plan status and data.
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

    const planningSession = await prisma.planningSession.findUnique({
      where: { businessId },
    })

    if (!planningSession) {
      return NextResponse.json({
        success: true,
        data: {
          status: 'not_started',
          plan: null,
          completionPercentage: 0,
        },
      })
    }

    let plan: BusinessPlan | null = null
    if (planningSession.businessPlanUrl) {
      try {
        const base64Data = planningSession.businessPlanUrl.replace(
          'data:application/json;base64,',
          ''
        )
        plan = JSON.parse(Buffer.from(base64Data, 'base64').toString())
      } catch {
        // Return null if parsing fails
      }
    }

    const isComplete = planningSession.completedWorkflows.includes(
      'business_plan_synthesis'
    )

    return NextResponse.json({
      success: true,
      data: {
        status: isComplete ? 'completed' : plan ? 'in_progress' : 'not_started',
        plan,
        completionPercentage: plan?.metadata?.completionPercentage || 0,
        planStatus: plan?.metadata?.status || 'not_started',
      },
    })
  } catch (error) {
    console.error('Error fetching business plan:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch plan' },
      { status: 500 }
    )
  }
}
