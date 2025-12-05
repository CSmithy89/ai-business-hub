/**
 * Financial Projections Workflow API Routes
 *
 * POST /api/planning/[businessId]/financial-projections - Process financial message
 * PUT /api/planning/[businessId]/financial-projections - Update projections
 * GET /api/planning/[businessId]/financial-projections - Get projections status
 *
 * Story: 08.15 - Implement Financial Projections Workflow
 *
 * ⚠️ PHASE 1 IMPLEMENTATION NOTE:
 * This implementation uses mock response generators instead of actual Agno AI integration.
 * The responses provide realistic financial projections based on business context, but
 * are not powered by actual AI analysis. Full Agno integration is tracked as follow-up work.
 *
 * Tech Debt: Implement actual Agno agent integration for AI-powered financial analysis.
 * See: docs/epics/EPIC-09 for Agno integration planning.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { getSession } from '@/lib/auth-server'
import { z } from 'zod'

// ============================================================================
// Types & Validation Schemas
// ============================================================================

interface YearlyProjection {
  year: number
  amount: number
  growthRate: number
}

interface CostCategory {
  category: string
  amount: number
  type: 'fixed' | 'variable'
}

interface CostProjection {
  yearly: YearlyProjection[]
  categories: CostCategory[]
}

interface PLStatement {
  year: number
  revenue: number
  cogs: number
  grossProfit: number
  grossMargin: number
  operatingExpenses: number
  operatingIncome: number
  netIncome: number
  netMargin: number
}

interface CashFlowStatement {
  year: number
  operatingCashFlow: number
  investingCashFlow: number
  financingCashFlow: number
  netCashFlow: number
  endingCash: number
}

interface UnitEconomics {
  ltv: number
  cac: number
  ltvCacRatio: number
  arpu: number
  churnRate: number
  grossMargin: number
  paybackPeriod: number
}

interface ScenarioData {
  name: string
  description: string
  revenue: YearlyProjection[]
  costs: CostProjection
  pnl: PLStatement[]
  cashFlow: CashFlowStatement[]
  unitEconomics: UnitEconomics
}

interface Assumption {
  category: string
  assumption: string
  value: string
  rationale: string
}

interface BreakEvenAnalysis {
  monthsToBreakeven: number
  breakEvenRevenue: number
  breakEvenUnits: number
  fixedCosts: number
  contributionMargin: number
}

export interface FinancialProjections {
  scenarios: {
    conservative: ScenarioData
    realistic: ScenarioData
    optimistic: ScenarioData
  }
  breakEvenAnalysis: BreakEvenAnalysis
  assumptions: Assumption[]
  metadata: {
    createdAt: string
    updatedAt: string
    version: string
    completionPercentage: number
  }
}

// Schema for incoming message
const financialMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  context: z.string().optional(),
})

// Schema for updating projections
const financialUpdateSchema = z.object({
  scenario: z.enum(['conservative', 'realistic', 'optimistic']).optional(),
  assumptions: z
    .array(
      z.object({
        category: z.string(),
        assumption: z.string(),
        value: z.string(),
        rationale: z.string(),
      })
    )
    .optional(),
})

// ============================================================================
// Workflow Steps & Prompts
// ============================================================================

type WorkflowStep = 'assumptions' | 'revenue' | 'costs' | 'scenarios' | 'complete'

const WORKFLOW_STEPS: { id: WorkflowStep; title: string }[] = [
  { id: 'assumptions', title: 'Key Assumptions' },
  { id: 'revenue', title: 'Revenue Model' },
  { id: 'costs', title: 'Cost Structure' },
  { id: 'scenarios', title: 'Scenario Analysis' },
  { id: 'complete', title: 'Summary' },
]

// ============================================================================
// Mock Response Generator (will be replaced with actual Agno integration)
// ============================================================================

interface FinancialContext {
  currentStep: WorkflowStep
  completedSteps: WorkflowStep[]
  projections: Partial<FinancialProjections>
  validationData: {
    marketSize?: string
    targetCustomer?: string
    revenueModel?: string
  }
}

function parseFinancialContext(
  planningData: { financials?: unknown; completedWorkflows?: string[] } | null,
  validationData: {
    marketSizing?: string | null
    targetCustomer?: string | null
    ideaDescription?: string | null
  } | null
): FinancialContext {
  let projections: Partial<FinancialProjections> = {}
  const completedSteps: WorkflowStep[] = []

  if (planningData?.financials) {
    try {
      projections = planningData.financials as FinancialProjections
      // Determine completed steps
      if (projections.assumptions && projections.assumptions.length > 0) {
        completedSteps.push('assumptions')
      }
      if (projections.scenarios?.realistic?.revenue?.length) {
        completedSteps.push('revenue')
      }
      if (projections.scenarios?.realistic?.costs?.yearly?.length) {
        completedSteps.push('costs')
      }
      if (
        projections.scenarios?.conservative &&
        projections.scenarios?.realistic &&
        projections.scenarios?.optimistic
      ) {
        completedSteps.push('scenarios')
      }
    } catch {
      // Use empty projections if parsing fails
    }
  }

  // Determine current step
  const currentStep =
    WORKFLOW_STEPS.find((s) => !completedSteps.includes(s.id))?.id || 'assumptions'

  // Extract validation data for context
  let marketSize = ''
  let revenueModel = ''
  if (validationData?.marketSizing) {
    try {
      const marketData = JSON.parse(validationData.marketSizing)
      marketSize = `TAM: $${marketData.tam?.total || 'TBD'}, SAM: $${marketData.sam?.total || 'TBD'}, SOM: $${marketData.som?.total || 'TBD'}`
    } catch {
      // Ignore parse errors
    }
  }
  if (validationData?.ideaDescription) {
    try {
      const ideaData = JSON.parse(validationData.ideaDescription)
      revenueModel = ideaData.initialHypothesis?.revenue_model || ''
    } catch {
      // Ignore parse errors
    }
  }

  return {
    currentStep,
    completedSteps,
    projections,
    validationData: {
      marketSize,
      targetCustomer: validationData?.targetCustomer || undefined,
      revenueModel,
    },
  }
}

function createDefaultProjections(): FinancialProjections {
  const createScenario = (
    name: string,
    description: string,
    multiplier: number
  ): ScenarioData => ({
    name,
    description,
    revenue: [
      { year: 1, amount: 500000 * multiplier, growthRate: 0 },
      { year: 2, amount: 1500000 * multiplier, growthRate: 200 },
      { year: 3, amount: 4200000 * multiplier, growthRate: 180 },
      { year: 4, amount: 8400000 * multiplier, growthRate: 100 },
      { year: 5, amount: 14700000 * multiplier, growthRate: 75 },
    ],
    costs: {
      yearly: [
        { year: 1, amount: 600000 * multiplier, growthRate: 0 },
        { year: 2, amount: 1200000 * multiplier, growthRate: 100 },
        { year: 3, amount: 2500000 * multiplier, growthRate: 108 },
        { year: 4, amount: 4200000 * multiplier, growthRate: 68 },
        { year: 5, amount: 6300000 * multiplier, growthRate: 50 },
      ],
      categories: [
        { category: 'Personnel', amount: 400000 * multiplier, type: 'fixed' },
        { category: 'Technology', amount: 100000 * multiplier, type: 'fixed' },
        { category: 'Marketing', amount: 150000 * multiplier, type: 'variable' },
        { category: 'Operations', amount: 50000 * multiplier, type: 'variable' },
      ],
    },
    pnl: [
      {
        year: 1,
        revenue: 500000 * multiplier,
        cogs: 125000 * multiplier,
        grossProfit: 375000 * multiplier,
        grossMargin: 75,
        operatingExpenses: 475000 * multiplier,
        operatingIncome: -100000 * multiplier,
        netIncome: -100000 * multiplier,
        netMargin: -20,
      },
      {
        year: 2,
        revenue: 1500000 * multiplier,
        cogs: 375000 * multiplier,
        grossProfit: 1125000 * multiplier,
        grossMargin: 75,
        operatingExpenses: 825000 * multiplier,
        operatingIncome: 300000 * multiplier,
        netIncome: 225000 * multiplier,
        netMargin: 15,
      },
      {
        year: 3,
        revenue: 4200000 * multiplier,
        cogs: 1050000 * multiplier,
        grossProfit: 3150000 * multiplier,
        grossMargin: 75,
        operatingExpenses: 1450000 * multiplier,
        operatingIncome: 1700000 * multiplier,
        netIncome: 1275000 * multiplier,
        netMargin: 30,
      },
    ],
    cashFlow: [
      {
        year: 1,
        operatingCashFlow: -80000 * multiplier,
        investingCashFlow: -50000 * multiplier,
        financingCashFlow: 500000 * multiplier,
        netCashFlow: 370000 * multiplier,
        endingCash: 370000 * multiplier,
      },
      {
        year: 2,
        operatingCashFlow: 280000 * multiplier,
        investingCashFlow: -100000 * multiplier,
        financingCashFlow: 0,
        netCashFlow: 180000 * multiplier,
        endingCash: 550000 * multiplier,
      },
      {
        year: 3,
        operatingCashFlow: 1350000 * multiplier,
        investingCashFlow: -200000 * multiplier,
        financingCashFlow: 0,
        netCashFlow: 1150000 * multiplier,
        endingCash: 1700000 * multiplier,
      },
    ],
    unitEconomics: {
      ltv: 7200 * multiplier,
      cac: 2000,
      ltvCacRatio: 3.6 * multiplier,
      arpu: 200 * multiplier,
      churnRate: 2.5 / multiplier,
      grossMargin: 75,
      paybackPeriod: 10 / multiplier,
    },
  })

  return {
    scenarios: {
      conservative: createScenario('Conservative', 'Lower growth, higher costs', 0.7),
      realistic: createScenario('Realistic', 'Base case projections', 1.0),
      optimistic: createScenario('Optimistic', 'Strong growth, efficiency gains', 1.4),
    },
    breakEvenAnalysis: {
      monthsToBreakeven: 14,
      breakEvenRevenue: 700000,
      breakEvenUnits: 140,
      fixedCosts: 500000,
      contributionMargin: 150,
    },
    assumptions: [
      {
        category: 'Revenue',
        assumption: 'Average contract value',
        value: '$50,000/year',
        rationale: 'Based on mid-market enterprise pricing',
      },
      {
        category: 'Revenue',
        assumption: 'Customer acquisition rate',
        value: '10 customers Y1, 30 Y2, 84 Y3',
        rationale: 'Conservative growth matching sales capacity',
      },
      {
        category: 'Costs',
        assumption: 'Gross margin',
        value: '75%',
        rationale: 'SaaS industry standard for B2B',
      },
      {
        category: 'Costs',
        assumption: 'CAC payback',
        value: '10 months',
        rationale: 'Target for healthy unit economics',
      },
      {
        category: 'Growth',
        assumption: 'Churn rate',
        value: '2.5% monthly',
        rationale: 'Industry benchmark for B2B SaaS',
      },
    ],
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0',
      completionPercentage: 0,
    },
  }
}

function generateFinancialResponse(
  userMessage: string,
  context: FinancialContext
): {
  content: string
  suggestedActions: string[]
  output?: Partial<FinancialProjections>
  updatedProjections?: Partial<FinancialProjections>
  isComplete?: boolean
} {
  const lowerMessage = userMessage.toLowerCase()

  // Check for navigation/completion commands
  const wantsComplete =
    lowerMessage.includes('done') ||
    lowerMessage.includes('finish') ||
    lowerMessage.includes('complete') ||
    lowerMessage.includes('generate')
  const wantsNext = lowerMessage.includes('next') || lowerMessage.includes('continue')
  const wantsScenarios =
    lowerMessage.includes('scenario') ||
    lowerMessage.includes('conservative') ||
    lowerMessage.includes('optimistic')
  const wantsAssumptions =
    lowerMessage.includes('assumption') || lowerMessage.includes('adjust')
  const wantsRevenue = lowerMessage.includes('revenue') || lowerMessage.includes('growth')
  const wantsCosts = lowerMessage.includes('cost') || lowerMessage.includes('expense')
  const wantsBreakeven = lowerMessage.includes('break') || lowerMessage.includes('even')

  // Handle first message or general inquiry
  if (context.currentStep === 'assumptions' && context.completedSteps.length === 0) {
    const marketContext = context.validationData.marketSize
      ? `\n\n📊 **From your validation:**\n${context.validationData.marketSize}`
      : ''

    return {
      content: `## Financial Projections (Step 1/4)

Hi! I'm **Finance** (Finn), your Financial Analyst. I'll help you build comprehensive financial projections with three scenarios.

Let's start by reviewing key **assumptions** that will drive your projections.
${marketContext}

**Key Assumptions to Define:**

1. **Revenue Model**
   - Average contract value (ACV)
   - Pricing tier distribution
   - Expected customer count by year

2. **Cost Structure**
   - Gross margin target
   - Operating expense ratio
   - CAC (Customer Acquisition Cost)

3. **Growth Metrics**
   - Monthly/annual churn rate
   - Expansion revenue rate
   - Sales cycle length

Would you like to adjust any of these assumptions, or shall I use industry benchmarks?`,
      suggestedActions: ['Use industry benchmarks', 'Customize assumptions', 'Review market data'],
    }
  }

  // Handle assumptions review/customization
  if (wantsAssumptions || (context.currentStep === 'assumptions' && !wantsNext)) {
    const defaultProjections = createDefaultProjections()

    return {
      content: `## Key Assumptions

Based on your business model and market validation, here are the core assumptions:

**Revenue Assumptions:**
| Assumption | Value | Rationale |
|------------|-------|-----------|
| ACV | $50,000/year | Mid-market enterprise pricing |
| Y1 Customers | 10 | Conservative sales ramp |
| Y2 Customers | 30 | 200% growth |
| Y3 Customers | 84 | 180% growth |

**Cost Assumptions:**
| Assumption | Value | Rationale |
|------------|-------|-----------|
| Gross Margin | 75% | SaaS industry standard |
| CAC | $2,000 | Inbound + content marketing |
| Payback Period | 10 months | Healthy unit economics |

**Growth Assumptions:**
| Assumption | Value | Rationale |
|------------|-------|-----------|
| Monthly Churn | 2.5% | B2B SaaS benchmark |
| LTV:CAC Ratio | 3.6:1 | Target for venture scale |

Would you like to adjust any assumptions before I generate the projections?`,
      suggestedActions: ['Generate projections', 'Adjust revenue assumptions', 'Adjust cost assumptions'],
      updatedProjections: {
        ...context.projections,
        assumptions: defaultProjections.assumptions,
        metadata: {
          ...defaultProjections.metadata,
          completionPercentage: 25,
        },
      },
    }
  }

  // Handle revenue projections
  if (wantsRevenue || (context.currentStep === 'revenue' && !wantsNext && !wantsComplete)) {
    const defaultProjections = createDefaultProjections()
    const realistic = defaultProjections.scenarios.realistic

    return {
      content: `## Revenue Projections (Step 2/4)

Based on your assumptions, here are the **5-year revenue projections** (Realistic Scenario):

| Year | Revenue | Growth Rate | Customers |
|------|---------|-------------|-----------|
| Y1 | $500K | - | 10 |
| Y2 | $1.5M | 200% | 30 |
| Y3 | $4.2M | 180% | 84 |
| Y4 | $8.4M | 100% | 168 |
| Y5 | $14.7M | 75% | 294 |

**Revenue Composition:**
- New ARR: 60%
- Expansion: 25%
- Renewals: 15%

The growth trajectory follows a typical SaaS S-curve with aggressive early growth that moderates as you scale.

Ready to move to cost structure analysis?`,
      suggestedActions: ['Continue to costs', 'Adjust growth rates', 'View all scenarios'],
      updatedProjections: {
        ...context.projections,
        scenarios: {
          ...context.projections.scenarios,
          realistic: realistic,
        } as FinancialProjections['scenarios'],
        metadata: {
          ...defaultProjections.metadata,
          completionPercentage: 50,
        },
      },
    }
  }

  // Handle cost structure
  if (wantsCosts || (context.currentStep === 'costs' && !wantsNext && !wantsComplete)) {
    const defaultProjections = createDefaultProjections()

    return {
      content: `## Cost Structure (Step 3/4)

Here's your projected **cost structure** for the Realistic Scenario:

**Fixed Costs (Annual):**
| Category | Y1 | Y2 | Y3 |
|----------|-----|-----|-----|
| Personnel | $400K | $800K | $1.5M |
| Technology | $100K | $200K | $400K |
| G&A | $50K | $100K | $200K |

**Variable Costs:**
| Category | % of Revenue |
|----------|--------------|
| Marketing/Sales | 30% |
| Customer Success | 10% |
| Infrastructure | 5% |

**P&L Summary:**

| Metric | Y1 | Y2 | Y3 |
|--------|-----|-----|-----|
| Revenue | $500K | $1.5M | $4.2M |
| Gross Profit | $375K | $1.1M | $3.2M |
| Operating Income | $(100K) | $300K | $1.7M |
| Net Margin | -20% | 15% | 30% |

You'll reach profitability in **Year 2**! Ready to see all three scenarios?`,
      suggestedActions: ['Generate all scenarios', 'Adjust cost structure', 'View break-even analysis'],
      updatedProjections: {
        ...context.projections,
        scenarios: defaultProjections.scenarios,
        metadata: {
          ...defaultProjections.metadata,
          completionPercentage: 75,
        },
      },
    }
  }

  // Handle break-even analysis
  if (wantsBreakeven) {
    const defaultProjections = createDefaultProjections()

    return {
      content: `## Break-Even Analysis

Based on your financial model:

**Break-Even Point:**
- **Months to break-even:** 14 months
- **Break-even revenue:** $700K ARR
- **Break-even customers:** 14 customers

**Calculation:**
- Fixed costs: $500K/year
- Average contribution margin: $35,000/customer
- Required customers: 500K ÷ 35K = 14.3 customers

**Key Drivers:**
1. ACV increase → faster break-even
2. CAC reduction → faster break-even
3. Churn reduction → faster break-even

**Sensitivity Analysis:**
| Scenario | Months to Break-Even |
|----------|---------------------|
| -10% ACV | 16 months |
| Base Case | 14 months |
| +10% ACV | 12 months |

Would you like to generate the complete financial projections report?`,
      suggestedActions: ['Generate complete report', 'Adjust assumptions', 'View scenarios'],
      updatedProjections: {
        ...context.projections,
        breakEvenAnalysis: defaultProjections.breakEvenAnalysis,
      },
    }
  }

  // Handle scenario comparison or completion
  if (wantsScenarios || wantsComplete || wantsNext) {
    const defaultProjections = createDefaultProjections()

    const completionPercentage = 100
    const updatedProjections: FinancialProjections = {
      ...defaultProjections,
      metadata: {
        ...defaultProjections.metadata,
        completionPercentage,
        updatedAt: new Date().toISOString(),
      },
    }

    return {
      content: `## Financial Projections Complete! ✅

I've generated comprehensive projections with **3 scenarios**:

### Scenario Comparison (Year 3)

| Metric | Conservative | Realistic | Optimistic |
|--------|--------------|-----------|------------|
| Revenue | $2.9M | $4.2M | $5.9M |
| Net Income | $630K | $1.3M | $2.1M |
| Net Margin | 22% | 30% | 36% |
| Customers | 59 | 84 | 118 |

### Key Metrics (Realistic Scenario)

**Unit Economics:**
- LTV: $7,200
- CAC: $2,000
- LTV:CAC: 3.6:1 ✅
- Payback: 10 months ✅

**Growth Metrics:**
- Y1→Y2 Growth: 200%
- Y2→Y3 Growth: 180%
- Break-even: Month 14

---

Your financial projections are ready! You can:
- **Export** to Excel/CSV
- **Continue** to Business Plan synthesis with Blake
- **Adjust** any assumptions`,
      suggestedActions: ['Continue to Business Plan', 'Export to Excel', 'Adjust projections'],
      output: updatedProjections,
      updatedProjections,
      isComplete: true,
    }
  }

  // Default response
  return {
    content: `I understand you want to work on financial projections.

Currently, we're on **${context.currentStep}**. Would you like to:
- Review and adjust **assumptions**
- See **revenue projections**
- Analyze **cost structure**
- Generate **all scenarios**
- View **break-even analysis**

What would you like to focus on?`,
    suggestedActions: ['Generate all scenarios', 'Review assumptions', 'View break-even'],
  }
}

// ============================================================================
// API Handlers
// ============================================================================

/**
 * POST /api/planning/[businessId]/financial-projections
 *
 * Process a message in the financial projections workflow.
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
    const validation = financialMessageSchema.safeParse(body)

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

    // Generate response (mock for MVP - will integrate with Agno)
    const context = parseFinancialContext(business.planningData, business.validationData)
    const response = generateFinancialResponse(validation.data.message, context)

    // If projections were updated, save to database
    if (response.updatedProjections) {
      // Upsert planning session
      await prisma.planningSession.upsert({
        where: { businessId },
        create: {
          businessId,
          financials: response.updatedProjections as object,
          completedWorkflows: response.isComplete ? ['financial_projections'] : [],
        },
        update: {
          financials: response.updatedProjections as object,
          completedWorkflows: response.isComplete
            ? { push: 'financial_projections' }
            : undefined,
        },
      })

      // Update business progress if workflow completed
      if (response.isComplete) {
        await prisma.business.update({
          where: { id: businessId },
          data: {
            planningStatus: 'IN_PROGRESS',
            onboardingProgress: Math.max(business.onboardingProgress || 0, 60),
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: {
          role: 'assistant',
          agent: 'finance',
          content: response.content,
          suggestedActions: response.suggestedActions,
          timestamp: new Date().toISOString(),
        },
        output: response.output || null,
        workflow_status: response.isComplete ? 'completed' : 'in_progress',
      },
    })
  } catch (error) {
    console.error('Error in financial projections workflow:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to process message' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/planning/[businessId]/financial-projections
 *
 * Update financial projections or assumptions.
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
    const validation = financialUpdateSchema.safeParse(body)

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

    if (!planningSession) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Planning session not found' },
        { status: 404 }
      )
    }

    // Merge updates with existing financials
    const existingFinancials =
      (planningSession.financials as unknown as FinancialProjections) ||
      createDefaultProjections()

    const updatedFinancials = {
      ...existingFinancials,
      assumptions: validation.data.assumptions || existingFinancials.assumptions,
      metadata: {
        ...existingFinancials.metadata,
        updatedAt: new Date().toISOString(),
      },
    }

    // Update planning session
    const updated = await prisma.planningSession.update({
      where: { businessId },
      data: {
        financials: updatedFinancials as object,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        planningSession: updated,
        message: 'Financial projections updated successfully',
      },
    })
  } catch (error) {
    console.error('Error updating financial projections:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to update projections' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/planning/[businessId]/financial-projections
 *
 * Get the current financial projections status and data.
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
          financials: null,
          completionPercentage: 0,
          nextWorkflow: null,
        },
      })
    }

    const financials = planningSession.financials as unknown as FinancialProjections | null
    const isComplete = planningSession.completedWorkflows.includes('financial_projections')

    return NextResponse.json({
      success: true,
      data: {
        status: isComplete ? 'completed' : financials ? 'in_progress' : 'not_started',
        financials,
        completionPercentage: financials?.metadata?.completionPercentage || 0,
        nextWorkflow: isComplete ? 'business_plan_synthesis' : null,
      },
    })
  } catch (error) {
    console.error('Error fetching financial projections:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch projections' },
      { status: 500 }
    )
  }
}
