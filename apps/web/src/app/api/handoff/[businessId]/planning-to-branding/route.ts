import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

interface HandoffSummary {
  businessModel: unknown
  financials: unknown
  businessPlanUrl: string | null
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
        planningData: true,
        brandingData: true,
      },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Check if planning is complete
    const planningSession = business.planningData
    if (!planningSession) {
      return NextResponse.json(
        { error: 'Planning session not found. Complete planning first.' },
        { status: 400 }
      )
    }

    const completedWorkflows = planningSession.completedWorkflows || []
    const requiredWorkflows = ['business_model_canvas', 'financial_projections']
    const missingWorkflows = requiredWorkflows.filter((w) => !completedWorkflows.includes(w))

    if (missingWorkflows.length > 0) {
      return NextResponse.json(
        {
          error: 'Planning incomplete',
          missingWorkflows,
          message: `Complete these workflows before handoff: ${missingWorkflows.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Extract handoff summary from planning session
    const handoffSummary: HandoffSummary = {
      businessModel: planningSession.canvas,
      financials: planningSession.financials,
      businessPlanUrl: planningSession.businessPlanUrl,
      handoffAt: new Date().toISOString(),
    }

    // Create branding session if it doesn't exist
    if (!business.brandingData) {
      await prisma.brandingSession.create({
        data: {
          businessId,
        },
      })
    }

    // Update business phase
    await prisma.business.update({
      where: { id: businessId },
      data: {
        planningStatus: 'COMPLETE',
        brandingStatus: 'IN_PROGRESS',
        onboardingProgress: Math.max(business.onboardingProgress || 0, 70),
      },
    })

    // Emit event (mock - in production would use Redis Streams)
    const event = {
      type: 'planning.completed',
      businessId,
      timestamp: new Date().toISOString(),
      data: {
        hasBusinessModel: !!planningSession.canvas,
        hasFinancials: !!planningSession.financials,
        nextPhase: 'branding',
      },
    }

    console.log('Event emitted:', event)

    return NextResponse.json({
      success: true,
      handoff: {
        from: 'planning',
        to: 'branding',
        summary: handoffSummary,
        event,
      },
      message: 'Successfully handed off to Branding module. Business phase updated to BRANDING.',
    })
  } catch (error) {
    console.error('Planning to Branding handoff error:', error)
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
        planningData: true,
        brandingData: true,
      },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const planningSession = business.planningData

    const completedWorkflows = planningSession?.completedWorkflows || []
    const requiredWorkflows = ['business_model_canvas', 'financial_projections']

    return NextResponse.json({
      success: true,
      status: {
        planningComplete: requiredWorkflows.every((w) => completedWorkflows.includes(w)),
        completedWorkflows,
        requiredWorkflows,
        handoffComplete: business.planningStatus === 'COMPLETE',
        currentPhase: business.planningStatus === 'COMPLETE' ? 'branding' : 'planning',
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
