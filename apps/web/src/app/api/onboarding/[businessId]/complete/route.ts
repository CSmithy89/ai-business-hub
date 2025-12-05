import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

interface CompletionSummary {
  businessId: string
  businessName: string
  validationScore: number
  phases: {
    validation: PhaseStatus
    planning: PhaseStatus
    branding: PhaseStatus
  }
  documents: {
    businessPlan: DocumentStatus
    brandGuidelines: DocumentStatus
    assetPackage: DocumentStatus
  }
  metrics: {
    totalWorkflowsCompleted: number
    onboardingDuration: string | null
    validationScore: number
  }
  readyFor: string[]
  completedAt: string
}

interface PhaseStatus {
  status: 'completed' | 'in_progress' | 'not_started'
  completedWorkflows: string[]
  completedAt?: string
}

interface DocumentStatus {
  available: boolean
  url?: string
  generatedAt?: string
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
        brandingData: true,
      },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Check completion requirements
    const validationComplete = business.validationStatus === 'COMPLETE'
    const planningComplete = business.planningStatus === 'COMPLETE'
    const brandingComplete = business.brandingStatus === 'COMPLETE'

    // Allow completion if at least validation and planning are done
    // Branding can be optional for MVP
    if (!validationComplete || !planningComplete) {
      return NextResponse.json(
        {
          error: 'Onboarding incomplete',
          requirements: {
            validation: validationComplete ? 'Complete' : 'Required',
            planning: planningComplete ? 'Complete' : 'Required',
            branding: brandingComplete ? 'Complete' : 'Optional',
          },
          message: 'Complete validation and planning before finishing onboarding.',
        },
        { status: 400 }
      )
    }

    // Generate completion summary
    const validationSession = business.validationData
    const planningSession = business.planningData
    const brandingSession = business.brandingData

    const summary: CompletionSummary = {
      businessId,
      businessName: business.name,
      validationScore: (validationSession?.validationScore as number) || 0,
      phases: {
        validation: {
          status: validationComplete ? 'completed' : 'in_progress',
          completedWorkflows: (validationSession?.completedWorkflows as string[]) || [],
          completedAt: validationComplete ? new Date().toISOString() : undefined,
        },
        planning: {
          status: planningComplete ? 'completed' : 'in_progress',
          completedWorkflows: (planningSession?.completedWorkflows as string[]) || [],
          completedAt: planningComplete ? new Date().toISOString() : undefined,
        },
        branding: {
          status: brandingComplete ? 'completed' : brandingSession ? 'in_progress' : 'not_started',
          completedWorkflows: (brandingSession?.completedWorkflows as string[]) || [],
          completedAt: brandingComplete ? new Date().toISOString() : undefined,
        },
      },
      documents: {
        businessPlan: {
          available: !!planningSession?.businessPlanUrl,
          generatedAt: planningSession?.businessPlanUrl
            ? new Date().toISOString()
            : undefined,
        },
        brandGuidelines: {
          available: brandingComplete && !!brandingSession?.generatedAssets,
          generatedAt: brandingSession?.generatedAssets
            ? new Date().toISOString()
            : undefined,
        },
        assetPackage: {
          available: !!brandingSession?.generatedAssets,
          generatedAt: brandingSession?.generatedAssets
            ? new Date().toISOString()
            : undefined,
        },
      },
      metrics: {
        totalWorkflowsCompleted:
          ((validationSession?.completedWorkflows as string[]) || []).length +
          ((planningSession?.completedWorkflows as string[]) || []).length +
          ((brandingSession?.completedWorkflows as string[]) || []).length,
        onboardingDuration: calculateDuration(business.createdAt, new Date()),
        validationScore: (validationSession?.validationScore as number) || 0,
      },
      readyFor: ['product_creation', 'team_invites', 'dashboard_access'],
      completedAt: new Date().toISOString(),
    }

    // Update business to ACTIVE status
    await prisma.business.update({
      where: { id: businessId },
      data: {
        onboardingStatus: 'COMPLETE',
        onboardingProgress: 100,
        validationStatus: 'COMPLETE',
        planningStatus: 'COMPLETE',
        brandingStatus: brandingComplete ? 'COMPLETE' : business.brandingStatus,
      },
    })

    // Emit completion event (mock - in production would use Redis Streams)
    const event = {
      type: 'business.onboarding.complete',
      businessId,
      timestamp: new Date().toISOString(),
      data: {
        validationScore: summary.validationScore,
        phasesCompleted: Object.entries(summary.phases)
          .filter(([, phase]) => phase.status === 'completed')
          .map(([name]) => name),
        readyFor: summary.readyFor,
      },
    }

    console.log('Event emitted:', event)

    return NextResponse.json({
      success: true,
      summary,
      event,
      message: 'Onboarding complete! Your business is now active.',
      redirectTo: `/dashboard/${businessId}`,
    })
  } catch (error) {
    console.error('Onboarding completion error:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
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
        brandingData: true,
      },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const validationSession = business.validationData
    const planningSession = business.planningData
    const brandingSession = business.brandingData

    const progress = {
      validation: {
        status: business.validationStatus,
        completedWorkflows: (validationSession?.completedWorkflows as string[]) || [],
        isComplete: business.validationStatus === 'COMPLETE',
      },
      planning: {
        status: business.planningStatus,
        completedWorkflows: (planningSession?.completedWorkflows as string[]) || [],
        isComplete: business.planningStatus === 'COMPLETE',
      },
      branding: {
        status: business.brandingStatus,
        completedWorkflows: (brandingSession?.completedWorkflows as string[]) || [],
        isComplete: business.brandingStatus === 'COMPLETE',
      },
    }

    const canComplete =
      progress.validation.isComplete && progress.planning.isComplete

    return NextResponse.json({
      success: true,
      businessId,
      businessName: business.name,
      onboardingStatus: business.onboardingStatus,
      onboardingProgress: business.onboardingProgress,
      progress,
      canComplete,
      requirements: {
        validation: progress.validation.isComplete ? 'Complete' : 'Required',
        planning: progress.planning.isComplete ? 'Complete' : 'Required',
        branding: progress.branding.isComplete ? 'Complete' : 'Optional',
      },
    })
  } catch (error) {
    console.error('Get onboarding status error:', error)
    return NextResponse.json(
      { error: 'Failed to get onboarding status' },
      { status: 500 }
    )
  }
}

function calculateDuration(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours} hour${diffHours > 1 ? 's' : ''}`
  }
  return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`
}
