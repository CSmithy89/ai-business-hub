/**
 * Business Model Canvas Workflow API Routes
 *
 * POST /api/planning/[businessId]/business-model-canvas - Process canvas message
 * PUT /api/planning/[businessId]/business-model-canvas - Update canvas block
 * GET /api/planning/[businessId]/business-model-canvas - Get canvas status
 *
 * Story: 08.14 - Implement Business Model Canvas Workflow
 */

import { NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { getSession } from '@/lib/auth-server'
import { z } from 'zod'

// ============================================================================
// Types & Validation Schemas
// ============================================================================

/**
 * Canvas block structure
 */
interface CanvasBlock {
  items: string[]
  notes: string
  confidence: 'high' | 'medium' | 'low'
  sources: string[]
}

/**
 * Complete Business Model Canvas structure
 */
export interface BusinessModelCanvas {
  customer_segments: CanvasBlock
  value_propositions: CanvasBlock
  channels: CanvasBlock
  customer_relationships: CanvasBlock
  revenue_streams: CanvasBlock
  key_resources: CanvasBlock
  key_activities: CanvasBlock
  key_partnerships: CanvasBlock
  cost_structure: CanvasBlock
  metadata: {
    version: string
    createdAt: string
    updatedAt: string
    completionPercentage: number
  }
}

/**
 * Workflow output structure
 */
export interface CanvasWorkflowOutput {
  currentBlock: string
  blockIndex: number
  totalBlocks: number
  canvas: Partial<BusinessModelCanvas>
  is_complete: boolean
  next_workflow?: 'financial_projections'
}

// Canvas block definitions
const CANVAS_BLOCKS = [
  'customer_segments',
  'value_propositions',
  'channels',
  'customer_relationships',
  'revenue_streams',
  'key_resources',
  'key_activities',
  'key_partnerships',
  'cost_structure',
] as const

type CanvasBlockKey = (typeof CANVAS_BLOCKS)[number]

// Schema for incoming message
const canvasMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  context: z.string().optional(),
})

// Schema for updating a canvas block
const canvasBlockUpdateSchema = z.object({
  block: z.enum(CANVAS_BLOCKS),
  items: z.array(z.string()).optional(),
  notes: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
})

// ============================================================================
// Canvas Block Prompts & Guidance
// ============================================================================

const BLOCK_PROMPTS: Record<
  CanvasBlockKey,
  { title: string; question: string; examples: string[]; tips: string[] }
> = {
  customer_segments: {
    title: 'Customer Segments',
    question: 'Who are your most important customers?',
    examples: [
      'Small business owners',
      'Enterprise companies (500+ employees)',
      'Tech-savvy millennials',
      'Healthcare professionals',
    ],
    tips: [
      'Be specific about demographics and behaviors',
      'Consider both B2B and B2C if applicable',
      'Identify your ideal customer profile',
    ],
  },
  value_propositions: {
    title: 'Value Propositions',
    question: 'What value do you deliver to your customers?',
    examples: [
      'Save 10 hours per week on repetitive tasks',
      'Reduce costs by 30%',
      'Access to exclusive network',
      'Peace of mind through automation',
    ],
    tips: [
      'Focus on problems you solve',
      'Quantify benefits where possible',
      'Differentiate from competitors',
    ],
  },
  channels: {
    title: 'Channels',
    question: 'How do you reach and deliver value to your customers?',
    examples: [
      'Direct sales team',
      'Website/E-commerce',
      'Partner network',
      'Mobile app',
      'Social media',
    ],
    tips: [
      'Consider awareness, evaluation, purchase, delivery, and support phases',
      'Match channels to customer preferences',
      'Evaluate cost-effectiveness of each channel',
    ],
  },
  customer_relationships: {
    title: 'Customer Relationships',
    question: 'What type of relationship does each customer segment expect?',
    examples: [
      'Personal assistance',
      'Self-service portal',
      'Automated services',
      'Community platform',
      'Co-creation',
    ],
    tips: [
      'Align with customer expectations',
      'Consider acquisition vs retention',
      'Balance personalization with scalability',
    ],
  },
  revenue_streams: {
    title: 'Revenue Streams',
    question: 'How does your business generate revenue?',
    examples: [
      'Subscription (monthly/annual)',
      'Pay-per-use',
      'Licensing',
      'Advertising',
      'Commission/Marketplace fees',
    ],
    tips: [
      'Match pricing to value delivered',
      'Consider recurring vs one-time revenue',
      'Think about willingness to pay',
    ],
  },
  key_resources: {
    title: 'Key Resources',
    question: 'What key resources does your value proposition require?',
    examples: [
      'Technology platform',
      'Skilled team',
      'Intellectual property',
      'Brand/Reputation',
      'Customer data',
    ],
    tips: [
      'Include physical, intellectual, human, and financial resources',
      'Identify what makes you unique',
      'Consider resources needed for scale',
    ],
  },
  key_activities: {
    title: 'Key Activities',
    question: 'What key activities does your value proposition require?',
    examples: [
      'Product development',
      'Platform maintenance',
      'Marketing and sales',
      'Customer support',
      'Partner management',
    ],
    tips: [
      'Focus on activities essential for your business model',
      'Consider production, problem-solving, and network activities',
      'Identify activities for competitive advantage',
    ],
  },
  key_partnerships: {
    title: 'Key Partnerships',
    question: 'Who are your key partners and suppliers?',
    examples: [
      'Technology providers',
      'Distribution partners',
      'Strategic alliances',
      'Suppliers',
      'Integration partners',
    ],
    tips: [
      'Identify partners for optimization, risk reduction, or resource acquisition',
      'Consider strategic alliances with non-competitors',
      'Think about coopetition (competitors who partner)',
    ],
  },
  cost_structure: {
    title: 'Cost Structure',
    question: 'What are the most important costs in your business model?',
    examples: [
      'Personnel costs',
      'Technology infrastructure',
      'Marketing and customer acquisition',
      'Operations and delivery',
      'R&D and product development',
    ],
    tips: [
      'Identify fixed vs variable costs',
      'Consider economies of scale',
      'Align with your value proposition (cost-driven vs value-driven)',
    ],
  },
}

// ============================================================================
// Mock Response Generator (will be replaced with actual Agno integration)
// ============================================================================

interface CanvasContext {
  currentBlock: CanvasBlockKey
  completedBlocks: CanvasBlockKey[]
  canvas: Partial<BusinessModelCanvas>
  validationData: {
    targetCustomer?: string
    proposedSolution?: string
    problemStatement?: string
    revenueModel?: string
  }
}

function createEmptyBlock(): CanvasBlock {
  return {
    items: [],
    notes: '',
    confidence: 'medium',
    sources: [],
  }
}

function createEmptyCanvas(): BusinessModelCanvas {
  return {
    customer_segments: createEmptyBlock(),
    value_propositions: createEmptyBlock(),
    channels: createEmptyBlock(),
    customer_relationships: createEmptyBlock(),
    revenue_streams: createEmptyBlock(),
    key_resources: createEmptyBlock(),
    key_activities: createEmptyBlock(),
    key_partnerships: createEmptyBlock(),
    cost_structure: createEmptyBlock(),
    metadata: {
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completionPercentage: 0,
    },
  }
}

function parseCanvasContext(
  planningData: { canvas?: unknown; completedWorkflows?: string[] } | null,
  validationData: {
    targetCustomer?: string | null
    proposedSolution?: string | null
    problemStatement?: string | null
    ideaDescription?: string | null
  } | null
): CanvasContext {
  // Parse existing canvas or create empty
  let canvas: Partial<BusinessModelCanvas> = {}
  const completedBlocks: CanvasBlockKey[] = []

  if (planningData?.canvas) {
    try {
      canvas = planningData.canvas as BusinessModelCanvas
      // Determine completed blocks
      for (const block of CANVAS_BLOCKS) {
        if (canvas[block] && canvas[block]!.items.length > 0) {
          completedBlocks.push(block)
        }
      }
    } catch {
      // Use empty canvas if parsing fails
    }
  }

  // Determine current block (first incomplete)
  const currentBlock = CANVAS_BLOCKS.find((b) => !completedBlocks.includes(b)) || 'customer_segments'

  // Extract validation data for pre-fill
  let revenueModel = ''
  if (validationData?.ideaDescription) {
    try {
      const ideaData = JSON.parse(validationData.ideaDescription)
      revenueModel = ideaData.initialHypothesis?.revenue_model || ''
    } catch {
      // Ignore parse errors
    }
  }

  return {
    currentBlock,
    completedBlocks,
    canvas,
    validationData: {
      targetCustomer: validationData?.targetCustomer || undefined,
      proposedSolution: validationData?.proposedSolution || undefined,
      problemStatement: validationData?.problemStatement || undefined,
      revenueModel,
    },
  }
}

function generateCanvasResponse(
  userMessage: string,
  context: CanvasContext
): {
  content: string
  suggestedActions: string[]
  output?: CanvasWorkflowOutput
  updatedCanvas?: Partial<BusinessModelCanvas>
} {
  const lowerMessage = userMessage.toLowerCase()
  const blockPrompt = BLOCK_PROMPTS[context.currentBlock]

  // Check if user is providing items for current block
  const isProvidingItems =
    lowerMessage.includes(',') ||
    lowerMessage.includes('\n') ||
    userMessage.length > 30 ||
    lowerMessage.includes('include') ||
    lowerMessage.includes('focus on') ||
    lowerMessage.includes('target')

  // Check for navigation commands
  const wantsNext =
    lowerMessage.includes('next') || lowerMessage.includes('continue') || lowerMessage.includes('move on')
  const wantsPrevious = lowerMessage.includes('previous') || lowerMessage.includes('back')
  const wantsComplete =
    lowerMessage.includes('done') || lowerMessage.includes('finish') || lowerMessage.includes('complete')

  // Handle navigation
  if (wantsPrevious && context.completedBlocks.length > 0) {
    const prevBlock = context.completedBlocks[context.completedBlocks.length - 1]
    const prevPrompt = BLOCK_PROMPTS[prevBlock]

    return {
      content: `Going back to **${prevPrompt.title}**.

**Current items:**
${context.canvas[prevBlock]?.items.map((item) => `- ${item}`).join('\n') || '- (none)'}

Would you like to modify these items?`,
      suggestedActions: ['Keep current items', 'Replace all', 'Add more items'],
    }
  }

  // If starting or continuing workflow without items
  if (!isProvidingItems && !wantsNext && !wantsComplete) {
    // Generate pre-fill suggestion if available
    let preFillSuggestion = ''
    if (context.currentBlock === 'customer_segments' && context.validationData.targetCustomer) {
      preFillSuggestion = `\n\n📝 **From your validation:** "${context.validationData.targetCustomer}"`
    } else if (context.currentBlock === 'value_propositions' && context.validationData.proposedSolution) {
      preFillSuggestion = `\n\n📝 **From your validation:** "${context.validationData.proposedSolution}"`
    } else if (context.currentBlock === 'revenue_streams' && context.validationData.revenueModel) {
      preFillSuggestion = `\n\n📝 **From your validation:** "${context.validationData.revenueModel}"`
    }

    return {
      content: `## ${blockPrompt.title} (${context.completedBlocks.length + 1}/9)

**${blockPrompt.question}**

💡 **Examples:**
${blockPrompt.examples.map((e) => `- ${e}`).join('\n')}

📋 **Tips:**
${blockPrompt.tips.map((t) => `• ${t}`).join('\n')}${preFillSuggestion}

Share your thoughts, and I'll help structure them for your canvas.`,
      suggestedActions: blockPrompt.examples.slice(0, 3),
    }
  }

  // If providing items for current block
  if (isProvidingItems || wantsNext) {
    // Parse items from user message
    const items = isProvidingItems
      ? userMessage
          .split(/[,\n]/)
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      : context.canvas[context.currentBlock]?.items || []

    // Update canvas with new items
    const updatedBlock: CanvasBlock = {
      items,
      notes: '',
      confidence: 'medium',
      sources: [],
    }

    const updatedCanvas = {
      ...context.canvas,
      [context.currentBlock]: updatedBlock,
    }

    const updatedCompletedBlocks = [...context.completedBlocks]
    if (!updatedCompletedBlocks.includes(context.currentBlock)) {
      updatedCompletedBlocks.push(context.currentBlock)
    }

    // Determine next block
    const currentIndex = CANVAS_BLOCKS.indexOf(context.currentBlock)
    const nextIndex = currentIndex + 1

    // Check if canvas is complete
    if (nextIndex >= CANVAS_BLOCKS.length || wantsComplete) {
      const completionPercentage = Math.round(
        ((updatedCompletedBlocks.length + 1) / CANVAS_BLOCKS.length) * 100
      )

      const canvasPreview = CANVAS_BLOCKS.map((block) => {
        const blockData = updatedCanvas[block]
        const prompt = BLOCK_PROMPTS[block]
        return `**${prompt.title}:** ${blockData?.items.slice(0, 2).join(', ') || '(not filled)'}${blockData?.items && blockData.items.length > 2 ? ` (+${blockData.items.length - 2} more)` : ''}`
      }).join('\n')

      return {
        content: `## Business Model Canvas Complete! ✅

I've captured your ${blockPrompt.title}:
${items.map((item) => `- ${item}`).join('\n')}

---

### Canvas Overview

${canvasPreview}

---

Your Business Model Canvas is ready! You can:
- **Export** it as a visual diagram
- **Continue** to Financial Projections with Finn
- **Edit** any section before moving on`,
        suggestedActions: ['Continue to Financial Projections', 'Export Canvas', 'Edit a section'],
        output: {
          currentBlock: context.currentBlock,
          blockIndex: 8,
          totalBlocks: 9,
          canvas: {
            ...updatedCanvas,
            metadata: {
              version: '1.0',
              createdAt: context.canvas.metadata?.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              completionPercentage,
            },
          },
          is_complete: true,
          next_workflow: 'financial_projections',
        },
        updatedCanvas: {
          ...updatedCanvas,
          metadata: {
            version: '1.0',
            createdAt: context.canvas.metadata?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completionPercentage,
          },
        },
      }
    }

    // Move to next block
    const nextBlock = CANVAS_BLOCKS[nextIndex]
    const nextPrompt = BLOCK_PROMPTS[nextBlock]

    // Generate pre-fill for next block
    let preFillSuggestion = ''
    if (nextBlock === 'value_propositions' && context.validationData.proposedSolution) {
      preFillSuggestion = `\n\n📝 **From your validation:** "${context.validationData.proposedSolution}"`
    } else if (nextBlock === 'revenue_streams' && context.validationData.revenueModel) {
      preFillSuggestion = `\n\n📝 **From your validation:** "${context.validationData.revenueModel}"`
    }

    const completionPercentage = Math.round(
      ((updatedCompletedBlocks.length + 1) / CANVAS_BLOCKS.length) * 100
    )

    return {
      content: `Great! I've captured your **${blockPrompt.title}**:
${items.map((item) => `- ${item}`).join('\n')}

---

## ${nextPrompt.title} (${nextIndex + 1}/9)

**${nextPrompt.question}**

💡 **Examples:**
${nextPrompt.examples.map((e) => `- ${e}`).join('\n')}${preFillSuggestion}`,
      suggestedActions: nextPrompt.examples.slice(0, 3),
      output: {
        currentBlock: nextBlock,
        blockIndex: nextIndex,
        totalBlocks: 9,
        canvas: {
          ...updatedCanvas,
          metadata: {
            version: '1.0',
            createdAt: context.canvas.metadata?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completionPercentage,
          },
        },
        is_complete: false,
      },
      updatedCanvas: {
        ...updatedCanvas,
        metadata: {
          version: '1.0',
          createdAt: context.canvas.metadata?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completionPercentage,
        },
      },
    }
  }

  // Default: show current block prompt
  return {
    content: `## ${blockPrompt.title} (${context.completedBlocks.length + 1}/9)

**${blockPrompt.question}**

💡 **Examples:**
${blockPrompt.examples.map((e) => `- ${e}`).join('\n')}`,
    suggestedActions: blockPrompt.examples.slice(0, 3),
  }
}

// ============================================================================
// API Handlers
// ============================================================================

/**
 * POST /api/planning/[businessId]/business-model-canvas
 *
 * Process a message in the business model canvas workflow.
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
    const validation = canvasMessageSchema.safeParse(body)

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
    const context = parseCanvasContext(business.planningData, business.validationData)
    const response = generateCanvasResponse(validation.data.message, context)

    // If canvas was updated, save to database
    if (response.updatedCanvas) {
      // Upsert planning session
      await prisma.planningSession.upsert({
        where: { businessId },
        create: {
          businessId,
          canvas: response.updatedCanvas as object,
          completedWorkflows: response.output?.is_complete ? ['business_model_canvas'] : [],
        },
        update: {
          canvas: response.updatedCanvas as object,
          completedWorkflows: response.output?.is_complete
            ? { push: 'business_model_canvas' }
            : undefined,
        },
      })

      // Update business progress if workflow completed
      if (response.output?.is_complete) {
        await prisma.business.update({
          where: { id: businessId },
          data: {
            planningStatus: 'IN_PROGRESS',
            onboardingProgress: Math.max(business.onboardingProgress || 0, 50),
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: {
          role: 'assistant',
          agent: 'model',
          content: response.content,
          suggestedActions: response.suggestedActions,
          timestamp: new Date().toISOString(),
        },
        output: response.output || null,
        workflow_status: response.output?.is_complete ? 'completed' : 'in_progress',
      },
    })
  } catch (error) {
    console.error('Error in business model canvas workflow:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to process message' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/planning/[businessId]/business-model-canvas
 *
 * Update a specific canvas block.
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
    const validation = canvasBlockUpdateSchema.safeParse(body)

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

    // Merge updates with existing canvas
    const existingCanvas = (planningSession.canvas as unknown as BusinessModelCanvas) || createEmptyCanvas()
    const updatedBlock: CanvasBlock = {
      ...existingCanvas[validation.data.block],
      items: validation.data.items || existingCanvas[validation.data.block]?.items || [],
      notes: validation.data.notes || existingCanvas[validation.data.block]?.notes || '',
      confidence: validation.data.confidence || existingCanvas[validation.data.block]?.confidence || 'medium',
    }

    const updatedCanvas = {
      ...existingCanvas,
      [validation.data.block]: updatedBlock,
      metadata: {
        ...existingCanvas.metadata,
        updatedAt: new Date().toISOString(),
      },
    }

    // Update planning session
    const updated = await prisma.planningSession.update({
      where: { businessId },
      data: {
        canvas: updatedCanvas as object,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        planningSession: updated,
        message: `Canvas block '${validation.data.block}' updated successfully`,
      },
    })
  } catch (error) {
    console.error('Error updating canvas block:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to update canvas' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/planning/[businessId]/business-model-canvas
 *
 * Get the current canvas status and data.
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
      // Return empty canvas for new sessions
      return NextResponse.json({
        success: true,
        data: {
          status: 'not_started',
          canvas: null,
          completedBlocks: [],
          currentBlock: 'customer_segments',
          nextWorkflow: null,
        },
      })
    }

    const canvas = planningSession.canvas as BusinessModelCanvas | null
    const isComplete = planningSession.completedWorkflows.includes('business_model_canvas')

    // Determine completed blocks
    const completedBlocks: string[] = []
    if (canvas) {
      for (const block of CANVAS_BLOCKS) {
        if (canvas[block] && canvas[block].items.length > 0) {
          completedBlocks.push(block)
        }
      }
    }

    // Determine current block
    const currentBlock = CANVAS_BLOCKS.find((b) => !completedBlocks.includes(b)) || 'customer_segments'

    return NextResponse.json({
      success: true,
      data: {
        status: isComplete ? 'completed' : completedBlocks.length > 0 ? 'in_progress' : 'not_started',
        canvas,
        completedBlocks,
        currentBlock,
        nextWorkflow: isComplete ? 'financial_projections' : null,
      },
    })
  } catch (error) {
    console.error('Error fetching canvas status:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch status' },
      { status: 500 }
    )
  }
}
