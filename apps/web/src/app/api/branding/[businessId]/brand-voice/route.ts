import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

// Tone spectrum dimensions
const TONE_DIMENSIONS = {
  formality: ['Very Formal', 'Formal', 'Neutral', 'Casual', 'Very Casual'],
  energy: ['Reserved', 'Calm', 'Balanced', 'Energetic', 'Very Energetic'],
  humor: ['Serious', 'Subtle Wit', 'Balanced', 'Playful', 'Comedic'],
  authority: ['Peer', 'Friendly Expert', 'Balanced', 'Authoritative', 'Commanding'],
} as const

interface VoiceGuidelines {
  toneOfVoice: {
    formality: string
    energy: string
    humor: string
    authority: string
    description: string
  }
  vocabulary: {
    preferred: string[]
    avoided: string[]
    industryTerms: string[]
    brandSpecificTerms: string[]
  }
  messagingTemplates: {
    headline: string
    subheadline: string
    callToAction: string
    valueProposition: string
    elevatorPitch: string
  }
  contentPillars: {
    name: string
    description: string
    topics: string[]
  }[]
  writingGuidelines: {
    sentenceLength: string
    paragraphStructure: string
    punctuationStyle: string
    capitalizationRules: string
  }
  examples: {
    good: { text: string; explanation: string }[]
    bad: { text: string; explanation: string }[]
  }
}

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
    const { action, data } = body

    switch (action) {
      case 'analyze_tone': {
        // Vox agent analyzes positioning to recommend tone
        const positioning = business.brandingData?.positioning as Record<string, unknown> | null
        const toneAnalysis = generateToneAnalysis(business.name, positioning, data)

        return NextResponse.json({
          success: true,
          analysis: toneAnalysis,
          dimensions: TONE_DIMENSIONS,
          message: 'Tone analysis complete. Adjust the sliders to fine-tune your brand voice.',
        })
      }

      case 'set_tone': {
        // User sets tone dimensions
        const { formality, energy, humor, authority } = data

        const toneDescription = generateToneDescription(formality, energy, humor, authority)

        return NextResponse.json({
          success: true,
          tone: {
            formality,
            energy,
            humor,
            authority,
            description: toneDescription,
          },
          message: 'Tone of voice defined. Now let\'s establish your vocabulary guidelines.',
        })
      }

      case 'generate_vocabulary': {
        // Generate vocabulary guidelines based on tone and positioning
        const positioning = business.brandingData?.positioning as Record<string, unknown> | null
        const vocabulary = generateVocabularyGuidelines(
          business.name,
          positioning,
          data.tone
        )

        return NextResponse.json({
          success: true,
          vocabulary,
          message: 'Vocabulary guidelines generated. Review and customize your word choices.',
        })
      }

      case 'generate_templates': {
        // Generate messaging templates
        const positioning = business.brandingData?.positioning as Record<string, unknown> | null
        const templates = generateMessagingTemplates(
          business.name,
          positioning,
          data.tone,
          data.vocabulary
        )

        return NextResponse.json({
          success: true,
          templates,
          message: 'Messaging templates created. These provide a foundation for your communications.',
        })
      }

      case 'generate_pillars': {
        // Generate content pillars
        const positioning = business.brandingData?.positioning as Record<string, unknown> | null
        const pillars = generateContentPillars(business.name, positioning)

        return NextResponse.json({
          success: true,
          pillars,
          message: 'Content pillars defined. These guide your content strategy.',
        })
      }

      case 'finalize': {
        // Finalize brand voice guidelines
        const voiceGuidelines: VoiceGuidelines = data.voiceGuidelines

        await updateBrandingSession(businessId, business.brandingData?.id, {
          voiceGuidelines,
          completedWorkflows: ['brand_voice'],
        })

        return NextResponse.json({
          success: true,
          voiceGuidelines,
          message: 'Brand voice guidelines finalized! Ready to proceed with Visual Identity.',
          next_workflow: 'visual_identity',
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Brand voice error:', error)
    return NextResponse.json(
      { error: 'Failed to process brand voice request' },
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
    const voiceGuidelines = brandingSession?.voiceGuidelines as VoiceGuidelines | null

    return NextResponse.json({
      success: true,
      toneDimensions: TONE_DIMENSIONS,
      currentVoiceGuidelines: voiceGuidelines,
      isComplete: brandingSession?.completedWorkflows?.includes('brand_voice') ?? false,
    })
  } catch (error) {
    console.error('Get brand voice error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve brand voice guidelines' },
      { status: 500 }
    )
  }
}

// Helper functions

async function updateBrandingSession(
  businessId: string,
  sessionId: string | undefined,
  data: {
    voiceGuidelines?: VoiceGuidelines
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
        voiceGuidelines: data.voiceGuidelines ? (data.voiceGuidelines as object) : undefined,
        completedWorkflows: mergedWorkflows,
        updatedAt: new Date(),
      },
    })
  } else {
    await prisma.brandingSession.create({
      data: {
        businessId,
        voiceGuidelines: data.voiceGuidelines ? (data.voiceGuidelines as object) : undefined,
        completedWorkflows: data.completedWorkflows || [],
      },
    })
  }
}

function generateToneAnalysis(
  businessName: string,
  positioning: Record<string, unknown> | null,
  _context: Record<string, unknown>
) {
  const archetype = (positioning?.archetype as string) || 'The Creator'

  // Recommend tone based on archetype
  const archetypeTones: Record<string, { formality: number; energy: number; humor: number; authority: number }> = {
    'The Creator': { formality: 2, energy: 3, humor: 2, authority: 2 },
    'The Sage': { formality: 3, energy: 2, humor: 1, authority: 3 },
    'The Hero': { formality: 2, energy: 4, humor: 1, authority: 3 },
    'The Innocent': { formality: 1, energy: 3, humor: 2, authority: 1 },
    'The Explorer': { formality: 1, energy: 4, humor: 2, authority: 1 },
    'The Outlaw': { formality: 0, energy: 4, humor: 2, authority: 2 },
    'The Magician': { formality: 2, energy: 3, humor: 2, authority: 3 },
    'The Lover': { formality: 2, energy: 3, humor: 2, authority: 1 },
    'The Jester': { formality: 0, energy: 4, humor: 4, authority: 0 },
    'The Everyman': { formality: 1, energy: 2, humor: 2, authority: 1 },
    'The Caregiver': { formality: 2, energy: 2, humor: 1, authority: 2 },
    'The Ruler': { formality: 4, energy: 2, humor: 0, authority: 4 },
  }

  const recommendedTone = archetypeTones[archetype] || archetypeTones['The Creator']

  return {
    recommendedTone,
    archetype,
    rationale: `Based on ${businessName}'s ${archetype} brand archetype, we recommend a voice that balances professionalism with approachability. This tone will resonate with your target audience while maintaining brand consistency.`,
    voiceCharacteristics: [
      'Clear and confident',
      'Approachable yet professional',
      'Forward-thinking',
      'Solution-oriented',
    ],
  }
}

function generateToneDescription(
  formality: number,
  energy: number,
  humor: number,
  authority: number
): string {
  const formalityTerms = ['very casual', 'casual', 'balanced', 'professional', 'highly formal']
  const energyTerms = ['reserved', 'calm', 'balanced', 'energetic', 'highly dynamic']
  const humorTerms = ['serious', 'subtle', 'balanced', 'playful', 'humorous']
  const authorityTerms = ['peer-like', 'friendly', 'balanced', 'authoritative', 'commanding']

  return `Our brand voice is ${formalityTerms[formality]}, ${energyTerms[energy]}, ${humorTerms[humor]}, and ${authorityTerms[authority]}. We communicate with clarity and purpose, ensuring our message resonates with our audience while staying true to our brand values.`
}

function generateVocabularyGuidelines(
  businessName: string,
  positioning: Record<string, unknown> | null,
  _tone: Record<string, number>
): VoiceGuidelines['vocabulary'] {
  const coreValues = (positioning?.coreValues as string[]) || ['Excellence', 'Innovation']

  return {
    preferred: [
      'Transform', 'Empower', 'Innovate', 'Collaborate',
      'Streamline', 'Elevate', 'Optimize', 'Partner',
      'Achieve', 'Discover', 'Build', 'Create',
    ],
    avoided: [
      'Cheap', 'Basic', 'Simple' , 'Just',
      'Try', 'Maybe', 'Hopefully', 'Kind of',
      'Revolutionary', 'Groundbreaking', 'Disrupt',
    ],
    industryTerms: [
      'Automation', 'Integration', 'Analytics',
      'Scalability', 'ROI', 'KPIs',
    ],
    brandSpecificTerms: [
      businessName,
      ...coreValues.map(v => v.toLowerCase()),
      'our approach',
      'your success',
    ],
  }
}

function generateMessagingTemplates(
  businessName: string,
  positioning: Record<string, unknown> | null,
  _tone: Record<string, number>,
  _vocabulary: VoiceGuidelines['vocabulary']
): VoiceGuidelines['messagingTemplates'] {
  const brandPromise = (positioning?.brandPromise as string) || 'delivering exceptional results'
  const taglines = (positioning?.taglineOptions as string[]) || [`${businessName}: Excellence Delivered`]

  return {
    headline: taglines[0] || `${businessName}: Your Partner in Success`,
    subheadline: `We help forward-thinking businesses achieve their goals through innovation and expertise.`,
    callToAction: 'Get Started Today',
    valueProposition: `${businessName} combines cutting-edge technology with deep expertise to ${brandPromise}.`,
    elevatorPitch: `${businessName} is a trusted partner for businesses seeking to transform their operations. We combine innovative solutions with personalized service to help our clients achieve measurable results and sustainable growth.`,
  }
}

function generateContentPillars(
  _businessName: string,
  positioning: Record<string, unknown> | null
): VoiceGuidelines['contentPillars'] {
  const coreValues = (positioning?.coreValues as string[]) || ['Excellence', 'Innovation', 'Partnership']

  return [
    {
      name: 'Thought Leadership',
      description: `Establish ${coreValues[0] || 'expertise'} through insights and industry analysis`,
      topics: [
        'Industry trends and predictions',
        'Best practices and frameworks',
        'Case studies and success stories',
        'Expert interviews and perspectives',
      ],
    },
    {
      name: 'Education & Empowerment',
      description: 'Help our audience learn and grow',
      topics: [
        'How-to guides and tutorials',
        'Tips and tricks',
        'Resource roundups',
        'Webinars and workshops',
      ],
    },
    {
      name: 'Community & Culture',
      description: 'Build connection and trust with our audience',
      topics: [
        'Team spotlights',
        'Behind-the-scenes content',
        'Client success stories',
        'Community initiatives',
      ],
    },
    {
      name: 'Innovation & Vision',
      description: `Showcase our commitment to ${coreValues[1] || 'innovation'}`,
      topics: [
        'Product updates and features',
        'Technology insights',
        'Future roadmap',
        'R&D highlights',
      ],
    },
  ]
}
