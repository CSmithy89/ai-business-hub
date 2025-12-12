/**
 * Business API Routes
 * GET /api/businesses - List all businesses for current workspace
 * POST /api/businesses - Create a new business
 *
 * Stories: 08.2, 08.3, 16.8
 */

import { NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { getSession } from '@/lib/auth-server'
import { businessCreateSchema } from '@/lib/validations/onboarding'
import { DEMO_BUSINESSES, isDemoMode } from '@/lib/demo-data'

// Default pagination limits
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

/**
 * GET /api/businesses
 *
 * List all businesses for the current workspace.
 *
 * Supports two pagination modes:
 * 1. Offset-based: ?take=N&skip=N (simple, good for small datasets)
 * 2. Cursor-based: ?take=N&cursor=<id> (efficient for large datasets, no page drift)
 *
 * Includes related session data for status display (prevents N+1 queries).
 * Sorted by most recently updated.
 *
 * @example
 * // Offset pagination
 * GET /api/businesses?take=20&skip=0
 * GET /api/businesses?take=20&skip=20
 *
 * @example
 * // Cursor pagination (more efficient for large datasets)
 * GET /api/businesses?take=20
 * GET /api/businesses?take=20&cursor=<lastItemId>
 */
export async function GET(req: Request) {
  try {
    // Story 16.8: Demo mode support
    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        data: DEMO_BUSINESSES,
        pagination: {
          total: DEMO_BUSINESSES.length,
          take: 20,
          skip: 0,
          hasMore: false,
          paginationType: 'offset',
        },
      })
    }

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
    const cursorParam = url.searchParams.get('cursor')

    const take = Math.min(
      Math.max(1, parseInt(takeParam || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE
    )

    // Determine pagination mode: cursor-based takes precedence
    const useCursor = cursorParam && !skipParam

    // Build include clause for related data (prevents N+1)
    const includeClause = {
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
    }

    if (useCursor) {
      // Cursor-based pagination
      // Request one extra to determine if there are more results
      const businesses = await prisma.business.findMany({
        where: { workspaceId },
        include: includeClause,
        orderBy: { updatedAt: 'desc' },
        take: take + 1,
        cursor: { id: cursorParam },
        skip: 1, // Skip the cursor item itself
      })

      const hasMore = businesses.length > take
      const results = hasMore ? businesses.slice(0, take) : businesses
      const nextCursor = hasMore ? results[results.length - 1]?.id : undefined

      return NextResponse.json({
        success: true,
        data: results,
        pagination: {
          take,
          hasMore,
          nextCursor,
          paginationType: 'cursor',
        },
      })
    } else {
      // Offset-based pagination (default)
      const skip = Math.max(0, parseInt(skipParam || '0', 10) || 0)

      const [businesses, total] = await Promise.all([
        prisma.business.findMany({
          where: { workspaceId },
          include: includeClause,
          orderBy: { updatedAt: 'desc' },
          take,
          skip,
        }),
        prisma.business.count({
          where: { workspaceId },
        }),
      ])

      // Also provide a cursor for transitioning to cursor-based
      const lastItem = businesses[businesses.length - 1]
      const nextCursor = lastItem?.id

      return NextResponse.json({
        success: true,
        data: businesses,
        pagination: {
          total,
          take,
          skip,
          hasMore: skip + businesses.length < total,
          nextCursor, // Allow switching to cursor-based pagination
          paginationType: 'offset',
        },
      })
    }
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
