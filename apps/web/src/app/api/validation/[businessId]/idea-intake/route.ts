/**
 * Idea Intake Workflow API Routes
 *
 * POST /api/validation/[businessId]/idea-intake - Process idea intake message
 * PUT /api/validation/[businessId]/idea-intake - Update captured idea
 *
 * Story: 08.7 - Implement Idea Intake Workflow
 */

import { NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { getSession } from '@/lib/auth-server'
import { z } from 'zod'

// ============================================================================
// Types & Validation Schemas
// ============================================================================

/**
 * Structured output from the idea intake workflow
 */
export interface IdeaIntakeOutput {
  problem_statement: string
  target_customer: string
  proposed_solution: string
  initial_hypothesis: {
    value_proposition: string
    revenue_model: string
  }
  clarifying_answers: Array<{
    question: string
    answer: string
  }>
  confidence_score: number
  next_workflow: 'market_sizing'
  is_complete: boolean
}

// Schema for incoming message
const ideaIntakeMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  context: z.string().optional(),
})

// Schema for updating idea
const ideaIntakeUpdateSchema = z.object({
  problem_statement: z.string().optional(),
  target_customer: z.string().optional(),
  proposed_solution: z.string().optional(),
  initial_hypothesis: z
    .object({
      value_proposition: z.string().optional(),
      revenue_model: z.string().optional(),
    })
    .optional(),
})

// ============================================================================
// Mock Response Generator (will be replaced with actual Agno integration)
// ============================================================================

interface ConversationContext {
  hasProvidedProblem: boolean
  hasProvidedCustomer: boolean
  hasProvidedSolution: boolean
  answers: Array<{ question: string; answer: string }>
}

function parseConversationContext(
  validationData: { ideaDescription?: string | null } | null
): ConversationContext {
  const context: ConversationContext = {
    hasProvidedProblem: false,
    hasProvidedCustomer: false,
    hasProvidedSolution: false,
    answers: [],
  }

  if (!validationData?.ideaDescription) return context

  try {
    const data = JSON.parse(validationData.ideaDescription)
    context.hasProvidedProblem = !!data.problemStatement
    context.hasProvidedCustomer = !!data.targetCustomer
    context.hasProvidedSolution = !!data.proposedSolution
    context.answers = data.clarifyingAnswers || []
  } catch {
    // If parsing fails, return default context
  }

  return context
}

function generateIdeaIntakeResponse(
  userMessage: string,
  context: ConversationContext
): { content: string; suggestedActions: string[]; output?: Partial<IdeaIntakeOutput> } {
  const lowerMessage = userMessage.toLowerCase()

  // Detect what information is being provided
  const isProblemRelated =
    lowerMessage.includes('problem') ||
    lowerMessage.includes('struggle') ||
    lowerMessage.includes('challenge') ||
    lowerMessage.includes('pain')
  const isCustomerRelated =
    lowerMessage.includes('customer') ||
    lowerMessage.includes('target') ||
    lowerMessage.includes('market') ||
    lowerMessage.includes('audience')
  const isSolutionRelated =
    lowerMessage.includes('solution') ||
    lowerMessage.includes('product') ||
    lowerMessage.includes('service') ||
    lowerMessage.includes('offer')

  // Update context based on message
  if (isProblemRelated || (!context.hasProvidedProblem && userMessage.length > 20)) {
    context.hasProvidedProblem = true
    context.answers.push({
      question: 'What problem are you trying to solve?',
      answer: userMessage,
    })
  } else if (isCustomerRelated || (context.hasProvidedProblem && !context.hasProvidedCustomer)) {
    context.hasProvidedCustomer = true
    context.answers.push({
      question: 'Who is your target customer?',
      answer: userMessage,
    })
  } else if (isSolutionRelated || (context.hasProvidedCustomer && !context.hasProvidedSolution)) {
    context.hasProvidedSolution = true
    context.answers.push({
      question: 'What solution are you proposing?',
      answer: userMessage,
    })
  }

  // Generate appropriate response
  if (!context.hasProvidedProblem) {
    return {
      content: `Thanks for sharing! Let me understand your business idea better.

**What specific problem are you trying to solve?**

Think about:
- What pain point exists in the market?
- Who is experiencing this problem?
- How significant is this problem for them?`,
      suggestedActions: ['The problem is...', 'I noticed that...'],
    }
  }

  if (!context.hasProvidedCustomer) {
    return {
      content: `Excellent! I've captured the problem you're addressing. Now let's understand your target market.

**Who is your ideal customer?**

Consider:
- What industry or segment?
- Company size or demographics?
- Geographic focus?
- Key characteristics that make them ideal?`,
      suggestedActions: ['My target customers are...', 'I\'m focusing on...'],
    }
  }

  if (!context.hasProvidedSolution) {
    return {
      content: `Perfect! I have a clear picture of your target customer. Now let's understand your solution.

**What solution are you proposing?**

Think about:
- How does your product/service solve the problem?
- What makes it unique?
- How do you plan to generate revenue?`,
      suggestedActions: ['My solution is...', 'I plan to...'],
    }
  }

  // All core info captured - provide summary and move to next stage
  const lastAnswer = context.answers[context.answers.length - 1]?.answer || userMessage

  return {
    content: `## Idea Intake Complete ✅

I've captured your business idea. Here's a summary:

**Problem Statement:**
> ${context.answers.find((a) => a.question.includes('problem'))?.answer || 'To be refined'}

**Target Customer:**
> ${context.answers.find((a) => a.question.includes('customer'))?.answer || 'To be refined'}

**Proposed Solution:**
> ${lastAnswer}

---

I'm now ready to move to **Market Sizing**. I'll have **Marco** research:
- Total Addressable Market (TAM)
- Serviceable Available Market (SAM)
- Serviceable Obtainable Market (SOM)

He'll need at least 2 independent sources for each calculation.`,
    suggestedActions: ['Continue to Market Sizing', 'Edit my answers', 'Ask clarifying questions'],
    output: {
      problem_statement: context.answers.find((a) => a.question.includes('problem'))?.answer || '',
      target_customer: context.answers.find((a) => a.question.includes('customer'))?.answer || '',
      proposed_solution: lastAnswer,
      initial_hypothesis: {
        value_proposition: 'To be determined after market validation',
        revenue_model: 'To be determined after market validation',
      },
      clarifying_answers: context.answers,
      confidence_score: 70,
      next_workflow: 'market_sizing',
      is_complete: true,
    },
  }
}

// ============================================================================
// API Handlers
// ============================================================================

/**
 * POST /api/validation/[businessId]/idea-intake
 *
 * Process a message in the idea intake workflow.
 * Returns agent response and optionally structured idea output.
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
    const validation = ideaIntakeMessageSchema.safeParse(body)

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

    // Generate response (mock for MVP - will integrate with Agno)
    const context = parseConversationContext(business.validationData)
    const response = generateIdeaIntakeResponse(validation.data.message, context)

    // If workflow completed, update validation data
    if (response.output?.is_complete) {
      await prisma.validationSession.update({
        where: { businessId },
        data: {
          ideaDescription: JSON.stringify({
            problemStatement: response.output.problem_statement,
            targetCustomer: response.output.target_customer,
            proposedSolution: response.output.proposed_solution,
            initialHypothesis: response.output.initial_hypothesis,
            clarifyingAnswers: response.output.clarifying_answers,
            completedAt: new Date().toISOString(),
          }),
          problemStatement: response.output.problem_statement,
          targetCustomer: response.output.target_customer,
          proposedSolution: response.output.proposed_solution,
          completedWorkflows: {
            push: 'idea_intake',
          },
        },
      })

      // Update business progress
      await prisma.business.update({
        where: { id: businessId },
        data: {
          validationStatus: 'IN_PROGRESS',
          onboardingProgress: 20,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        message: {
          role: 'assistant',
          agent: 'vera',
          content: response.content,
          suggestedActions: response.suggestedActions,
          timestamp: new Date().toISOString(),
        },
        output: response.output || null,
        workflow_status: response.output?.is_complete ? 'completed' : 'in_progress',
      },
    })
  } catch (error) {
    console.error('Error in idea intake workflow:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to process message' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/validation/[businessId]/idea-intake
 *
 * Update the captured idea data.
 * Allows users to edit their answers before proceeding.
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
    const validation = ideaIntakeUpdateSchema.safeParse(body)

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

    // Get current validation data
    const validationSession = await prisma.validationSession.findUnique({
      where: { businessId },
    })

    if (!validationSession) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Validation session not found' },
        { status: 404 }
      )
    }

    // Merge updates with existing data
    let existingData = {}
    try {
      existingData = JSON.parse(validationSession.ideaDescription || '{}')
    } catch {
      // Use empty object if parsing fails
    }

    const updatedData = {
      ...existingData,
      ...validation.data,
      updatedAt: new Date().toISOString(),
    }

    // Update validation session
    const updated = await prisma.validationSession.update({
      where: { businessId },
      data: {
        ideaDescription: JSON.stringify(updatedData),
        problemStatement: validation.data.problem_statement || validationSession.problemStatement,
        targetCustomer: validation.data.target_customer || validationSession.targetCustomer,
        proposedSolution: validation.data.proposed_solution || validationSession.proposedSolution,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        validationSession: updated,
        message: 'Idea updated successfully',
      },
    })
  } catch (error) {
    console.error('Error updating idea:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to update idea' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/validation/[businessId]/idea-intake
 *
 * Get the current idea intake status and data.
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

    let ideaData = null
    try {
      ideaData = JSON.parse(validationSession.ideaDescription || 'null')
    } catch {
      // Return null if parsing fails
    }

    const isComplete = validationSession.completedWorkflows.includes('idea_intake')

    return NextResponse.json({
      success: true,
      data: {
        status: isComplete ? 'completed' : 'in_progress',
        ideaData,
        problemStatement: validationSession.problemStatement,
        targetCustomer: validationSession.targetCustomer,
        proposedSolution: validationSession.proposedSolution,
        nextWorkflow: isComplete ? 'market_sizing' : null,
      },
    })
  } catch (error) {
    console.error('Error fetching idea intake status:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch status' },
      { status: 500 }
    )
  }
}
