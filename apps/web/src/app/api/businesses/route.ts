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

// Default pagination limits
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

/**
 * GET /api/businesses
 *
 * List all businesses for the current workspace.
 * Supports pagination with ?take=N&skip=N query params.
 * Includes related session data for status display (prevents N+1 queries).
 * Sorted by most recently updated.
 */
export async function GET(req: Request) {
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

    // Parse pagination params
    const url = new URL(req.url)
    const takeParam = url.searchParams.get('take')
    const skipParam = url.searchParams.get('skip')

    const take = Math.min(
      Math.max(1, parseInt(takeParam || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE
    )
    const skip = Math.max(0, parseInt(skipParam || '0', 10) || 0)

    // Query businesses with pagination and include related data (prevents N+1)
    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where: {
          workspaceId,
        },
        include: {
          validationData: {
            select: {
              validationScore: true,
              completedWorkflows: true,
            },
          },
          planningData: {
            select: {
              completedWorkflows: true,
            },
          },
          brandingData: {
            select: {
              completedWorkflows: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take,
        skip,
      }),
      prisma.business.count({
        where: {
          workspaceId,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: businesses,
      pagination: {
        total,
        take,
        skip,
        hasMore: skip + businesses.length < total,
      },
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

    // Create business with ValidationSession in a single transaction
    // This prevents race conditions where duplicate check passes but create fails
    // If unique constraint is violated, P2002 error is caught below
    try {
      const business = await prisma.$transaction(async (tx) => {
        // Check for duplicate within transaction for consistency
        const existingBusiness = await tx.business.findUnique({
          where: {
            workspaceId_name: {
              workspaceId,
              name,
            },
          },
        })

        if (existingBusiness) {
          throw new Error('DUPLICATE_NAME')
        }

        // Create business with nested ValidationSession (atomic)
        return tx.business.create({
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
      })

      return NextResponse.json(
        {
          success: true,
          data: business,
        },
        { status: 201 }
      )
    } catch (txError) {
      // Handle duplicate name (either from our check or race condition)
      if (
        txError instanceof Error &&
        (txError.message === 'DUPLICATE_NAME' ||
          (txError as { code?: string }).code === 'P2002')
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'DUPLICATE_NAME',
            message: 'A business with this name already exists in your workspace',
          },
          { status: 409 }
        )
      }
      throw txError
    }
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
