import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

interface HandoffSummary {
  marketData: {
    tam: unknown
    sam: unknown
    som: unknown
  }
  competitors: unknown
  customerProfiles: unknown
  validationScore: number | null
  handoffAt: string
}

export async function POST(
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
        validationData: true,
        planningData: true,
      },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Check if validation is complete
    const validationSession = business.validationData
    if (!validationSession) {
      return NextResponse.json(
        { error: 'Validation session not found. Complete validation first.' },
        { status: 400 }
      )
    }

    const completedWorkflows = validationSession.completedWorkflows || []
    const requiredWorkflows = ['idea_intake', 'market_sizing', 'competitor_mapping', 'customer_discovery']
    const missingWorkflows = requiredWorkflows.filter((w) => !completedWorkflows.includes(w))

    if (missingWorkflows.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation incomplete',
          missingWorkflows,
          message: `Complete these workflows before handoff: ${missingWorkflows.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Extract handoff summary from validation session (using actual schema fields)
    const handoffSummary: HandoffSummary = {
      marketData: {
        tam: validationSession.tam,
        sam: validationSession.sam,
        som: validationSession.som,
      },
      competitors: validationSession.competitors,
      customerProfiles: validationSession.icps,
      validationScore: validationSession.validationScore,
      handoffAt: new Date().toISOString(),
    }

    // Create planning session if it doesn't exist
    if (!business.planningData) {
      await prisma.planningSession.create({
        data: {
          businessId,
        },
      })
    }

    // Update business phase
    await prisma.business.update({
      where: { id: businessId },
      data: {
        validationStatus: 'COMPLETE',
        planningStatus: 'IN_PROGRESS',
        onboardingProgress: Math.max(business.onboardingProgress || 0, 40),
      },
    })

    // Emit event (mock - in production would use Redis Streams)
    const event = {
      type: 'validation.completed',
      businessId,
      timestamp: new Date().toISOString(),
      data: {
        validationScore: handoffSummary.validationScore,
        nextPhase: 'planning',
      },
    }

    console.log('Event emitted:', event)

    return NextResponse.json({
      success: true,
      handoff: {
        from: 'validation',
        to: 'planning',
        summary: handoffSummary,
        event,
      },
      message: 'Successfully handed off to Planning module. Business phase updated to PLANNING.',
    })
  } catch (error) {
    console.error('Validation to Planning handoff error:', error)
    return NextResponse.json(
      { error: 'Failed to process handoff' },
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
        validationData: true,
        planningData: true,
      },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const validationSession = business.validationData

    const completedWorkflows = validationSession?.completedWorkflows || []
    const requiredWorkflows = ['idea_intake', 'market_sizing', 'competitor_mapping', 'customer_discovery']

    return NextResponse.json({
      success: true,
      status: {
        validationComplete: requiredWorkflows.every((w) => completedWorkflows.includes(w)),
        completedWorkflows,
        requiredWorkflows,
        handoffComplete: business.validationStatus === 'COMPLETE',
        currentPhase: business.validationStatus === 'COMPLETE' ? 'planning' : 'validation',
      },
    })
  } catch (error) {
    console.error('Get handoff status error:', error)
    return NextResponse.json(
      { error: 'Failed to get handoff status' },
      { status: 500 }
    )
  }
}
