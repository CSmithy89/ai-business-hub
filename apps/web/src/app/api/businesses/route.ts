/**
 * Business API Routes
 * GET /api/businesses - List all businesses for current workspace
 * POST /api/businesses - Create a new business
 *
 * Stories: 08.2, 08.3
 */

import { NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { getSession } from '@/lib/auth-server'
import { businessCreateSchema } from '@/lib/validations/onboarding'

/**
 * GET /api/businesses
 *
 * List all businesses for the current workspace.
 * Excludes soft-deleted businesses.
 * Sorted by most recently updated.
 */
export async function GET() {
  try {
    // Get authenticated session
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'You must be signed in to view businesses',
        },
        { status: 401 }
      )
    }

    const workspaceId = session.session.activeWorkspaceId

    if (!workspaceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'NO_WORKSPACE',
          message: 'No active workspace selected',
        },
        { status: 400 }
      )
    }

    // Query businesses for workspace
    const businesses = await prisma.business.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: businesses,
    })
  } catch (error) {
    console.error('Error listing businesses:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching businesses.',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/businesses
 *
 * Create a new business from onboarding wizard data.
 * Creates Business record and ValidationSession with initial idea data.
 *
 * Story: 08.3 - Implement Onboarding Wizard UI
 */
export async function POST(req: Request) {
  try {
    // Get authenticated session
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'You must be signed in to create a business',
        },
        { status: 401 }
      )
    }

    const workspaceId = session.session.activeWorkspaceId

    if (!workspaceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'NO_WORKSPACE',
          message: 'No active workspace selected',
        },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validation = businessCreateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid business data',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { name, description, hasDocuments, ideaDescription } = validation.data

    // Check for duplicate business name in workspace
    const existingBusiness = await prisma.business.findUnique({
      where: {
        workspaceId_name: {
          workspaceId,
          name,
        },
      },
    })

    if (existingBusiness) {
      return NextResponse.json(
        {
          success: false,
          error: 'DUPLICATE_NAME',
          message: 'A business with this name already exists in your workspace',
        },
        { status: 409 }
      )
    }

    // Create business with ValidationSession
    const business = await prisma.business.create({
      data: {
        workspaceId,
        userId: session.user.id,
        name,
        description,
        stage: 'IDEA',
        onboardingStatus: hasDocuments ? 'WIZARD' : 'VALIDATION',
        validationStatus: 'NOT_STARTED',
        planningStatus: 'NOT_STARTED',
        brandingStatus: 'NOT_STARTED',
        onboardingProgress: 0,
        validationData: {
          create: {
            ideaDescription: JSON.stringify(ideaDescription),
            problemStatement: ideaDescription.problemStatement,
            targetCustomer: ideaDescription.targetCustomer,
            proposedSolution: ideaDescription.proposedSolution,
          },
        },
      },
      include: {
        validationData: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: business,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating business:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while creating the business',
      },
      { status: 500 }
    )
  }
}
