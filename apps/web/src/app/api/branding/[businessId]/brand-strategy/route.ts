import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { z } from 'zod'
import { brandPositioningSchema } from '@/lib/validations/business-json-schemas'

// Brand archetypes from classic brand archetype model
const BRAND_ARCHETYPES = [
  'The Innocent',
  'The Sage',
  'The Explorer',
  'The Outlaw',
  'The Magician',
  'The Hero',
  'The Lover',
  'The Jester',
  'The Everyman',
  'The Caregiver',
  'The Ruler',
  'The Creator',
] as const

interface BrandPositioning {
  archetype: (typeof BRAND_ARCHETYPES)[number]
  archetypeRationale: string
  coreValues: string[]
  personalityTraits: string[]
  positioningStatement: string
  taglineOptions: string[]
  competitiveDifferentiators: string[]
  targetAudienceProfile: string
  brandPromise: string
  emotionalBenefits: string[]
  functionalBenefits: string[]
}

// Request validation schemas
const brandStrategyRequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('analyze'),
    data: z.record(z.string(), z.unknown()).optional(),
  }),
  z.object({
    action: z.literal('select_archetype'),
    data: z.object({
      archetype: z.enum(BRAND_ARCHETYPES),
      context: z.record(z.string(), z.unknown()).optional(),
    }),
  }),
  z.object({
    action: z.literal('generate_taglines'),
    data: z.object({
      archetype: z.string().max(50),
      brandPromise: z.string().max(500),
    }),
  }),
  z.object({
    action: z.literal('finalize'),
    data: z.object({
      positioning: brandPositioningSchema,
    }),
  }),
])

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get business with branding session
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        brandingData: true,
      },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const body = await request.json()

    // Validate request body
    const validation = brandStrategyRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { action, data } = validation.data

    // Handle different brand strategy actions
    switch (action) {
      case 'analyze': {
        // Sage agent analyzes business context to recommend archetype
        const mockAnalysis = generateBrandStrategyAnalysis(business.name, data ?? {})
        return NextResponse.json({
          success: true,
          analysis: mockAnalysis,
          message: 'Brand strategy analysis complete. Review the recommended archetype and positioning.',
        })
      }

      case 'select_archetype': {
        // User selects or confirms archetype (already validated by schema)
        const { archetype, context } = data

        // Update branding session with selected archetype
        const positioning = generatePositioningForArchetype(
          archetype,
          business.name,
          context
        )

        await updateBrandingSession(businessId, business.brandingData?.id, {
          positioning,
        })

        return NextResponse.json({
          success: true,
          positioning,
          message: `${archetype} archetype selected. Brand positioning framework created.`,
        })
      }

      case 'generate_taglines': {
        // Generate tagline options based on positioning
        const taglines = generateTaglineOptions(
          data.archetype,
          data.brandPromise,
          business.name
        )

        return NextResponse.json({
          success: true,
          taglines,
          message: 'Tagline options generated. Select your preferred option or request more.',
        })
      }

      case 'finalize': {
        // Finalize brand strategy (already validated by schema)
        const { positioning: finalPositioning } = data

        await updateBrandingSession(businessId, business.brandingData?.id, {
          positioning: finalPositioning as unknown as BrandPositioning,
          completedWorkflows: ['brand_strategy'],
        })

        return NextResponse.json({
          success: true,
          positioning: finalPositioning,
          message: 'Brand strategy finalized! Ready to proceed with Brand Voice development.',
          next_workflow: 'brand_voice',
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Brand strategy error:', error)
    return NextResponse.json(
      { error: 'Failed to process brand strategy request' },
      { status: 500 }
    )
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        brandingData: true,
      },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const brandingSession = business.brandingData
    const positioning = brandingSession?.positioning as BrandPositioning | null

    return NextResponse.json({
      success: true,
      archetypes: BRAND_ARCHETYPES,
      currentPositioning: positioning,
      isComplete: brandingSession?.completedWorkflows?.includes('brand_strategy') ?? false,
    })
  } catch (error) {
    console.error('Get brand strategy error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve brand strategy' },
      { status: 500 }
    )
  }
}

// Helper functions

async function updateBrandingSession(
  businessId: string,
  sessionId: string | undefined,
  data: {
    positioning?: BrandPositioning
    completedWorkflows?: string[]
  }
) {
  if (sessionId) {
    const existing = await prisma.brandingSession.findUnique({
      where: { id: sessionId },
    })

    const existingWorkflows = (existing?.completedWorkflows as string[]) || []
    const newWorkflows = data.completedWorkflows || []
    const mergedWorkflows = [...new Set([...existingWorkflows, ...newWorkflows])]

    await prisma.brandingSession.update({
      where: { id: sessionId },
      data: {
        positioning: data.positioning ? (data.positioning as object) : undefined,
        completedWorkflows: mergedWorkflows,
        updatedAt: new Date(),
      },
    })
  } else {
    await prisma.brandingSession.create({
      data: {
        businessId,
        positioning: data.positioning ? (data.positioning as object) : undefined,
        completedWorkflows: data.completedWorkflows || [],
      },
    })
  }
}

function generateBrandStrategyAnalysis(
  businessName: string,
  _context: Record<string, unknown>
) {
  // Mock Sage agent analysis - in production, this calls the Python agent
  return {
    recommendedArchetype: 'The Creator' as const,
    archetypeMatch: {
      'The Creator': 0.85,
      'The Sage': 0.72,
      'The Magician': 0.68,
      'The Explorer': 0.61,
    },
    rationale: `Based on ${businessName}'s innovative approach and focus on building new solutions, The Creator archetype aligns best with your brand essence. Creator brands are driven by imagination, self-expression, and the desire to create something of lasting value.`,
    suggestedValues: [
      'Innovation',
      'Authenticity',
      'Excellence',
      'Creativity',
      'Integrity',
    ],
    personalityTraits: [
      'Visionary',
      'Innovative',
      'Authentic',
      'Thoughtful',
      'Bold',
    ],
  }
}

function generatePositioningForArchetype(
  archetype: string,
  businessName: string,
  _context?: Record<string, unknown>
): BrandPositioning {

  const archetypePositioning: Record<string, Partial<BrandPositioning>> = {
    'The Creator': {
      coreValues: ['Innovation', 'Authenticity', 'Excellence', 'Creativity'],
      personalityTraits: ['Visionary', 'Innovative', 'Authentic', 'Bold'],
      brandPromise: 'To transform ideas into reality through innovative solutions',
      emotionalBenefits: ['Inspiration', 'Empowerment', 'Pride in creation'],
      functionalBenefits: ['Unique solutions', 'Quality craftsmanship', 'Innovation'],
    },
    'The Sage': {
      coreValues: ['Wisdom', 'Truth', 'Knowledge', 'Expertise'],
      personalityTraits: ['Wise', 'Thoughtful', 'Analytical', 'Trustworthy'],
      brandPromise: 'To provide expert guidance and trusted knowledge',
      emotionalBenefits: ['Confidence', 'Clarity', 'Understanding'],
      functionalBenefits: ['Expert insights', 'Reliable information', 'Sound advice'],
    },
    'The Hero': {
      coreValues: ['Courage', 'Achievement', 'Excellence', 'Determination'],
      personalityTraits: ['Bold', 'Confident', 'Inspiring', 'Determined'],
      brandPromise: 'To help you overcome challenges and achieve greatness',
      emotionalBenefits: ['Confidence', 'Pride', 'Accomplishment'],
      functionalBenefits: ['Results-driven', 'High performance', 'Reliability'],
    },
  }

  const defaults = archetypePositioning[archetype] || archetypePositioning['The Creator']

  return {
    archetype: archetype as BrandPositioning['archetype'],
    archetypeRationale: `${businessName} embodies ${archetype} through its commitment to ${defaults.coreValues?.[0]?.toLowerCase() || 'excellence'} and ${defaults.coreValues?.[1]?.toLowerCase() || 'innovation'}.`,
    coreValues: defaults.coreValues || ['Excellence', 'Innovation', 'Integrity'],
    personalityTraits: defaults.personalityTraits || ['Professional', 'Innovative', 'Trustworthy'],
    positioningStatement: `For forward-thinking businesses who need innovative solutions, ${businessName} is the partner that delivers transformative results through ${defaults.coreValues?.[0]?.toLowerCase() || 'excellence'} and expertise.`,
    taglineOptions: generateTaglineOptions(archetype, defaults.brandPromise || '', businessName),
    competitiveDifferentiators: [
      'Innovative approach to problem-solving',
      'Deep industry expertise',
      'Commitment to client success',
    ],
    targetAudienceProfile: 'Growth-minded businesses seeking innovative solutions and expert partnership',
    brandPromise: defaults.brandPromise || 'To deliver exceptional value through innovation',
    emotionalBenefits: defaults.emotionalBenefits || ['Confidence', 'Trust', 'Inspiration'],
    functionalBenefits: defaults.functionalBenefits || ['Quality', 'Reliability', 'Results'],
  }
}

function generateTaglineOptions(
  archetype: string,
  _brandPromise: string,
  businessName: string
): string[] {

  const taglinesByArchetype: Record<string, string[]> = {
    'The Creator': [
      `${businessName}: Where Ideas Take Shape`,
      'Imagine. Create. Transform.',
      'Building Tomorrow, Today',
      'Your Vision, Realized',
    ],
    'The Sage': [
      `${businessName}: Wisdom in Action`,
      'Knowledge That Drives Results',
      'Expert Guidance, Trusted Partner',
      'See Clearly. Act Wisely.',
    ],
    'The Hero': [
      `${businessName}: Rise to the Challenge`,
      'Achieve the Extraordinary',
      'Your Success, Our Mission',
      'Together, We Conquer',
    ],
    default: [
      `${businessName}: Excellence Delivered`,
      'Innovation Meets Expertise',
      'Your Partner in Success',
      'Transforming Possibilities',
    ],
  }

  return taglinesByArchetype[archetype] || taglinesByArchetype['default']
}
