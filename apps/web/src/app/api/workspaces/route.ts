/**
 * Workspace API Routes
 * POST /api/workspaces - Create new workspace
 * GET /api/workspaces - List user's workspaces
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { getSession, updateSessionWorkspace } from '@/lib/auth-server'
import { generateUniqueSlug } from '@/lib/workspace'
import { checkRateLimit, generateRateLimitHeaders } from '@/lib/utils/rate-limit'
import { CreateWorkspaceSchema } from '@hyvve/shared'
import type { WorkspaceRole, WorkspaceWithRole } from '@hyvve/shared'

/**
 * POST /api/workspaces
 *
 * Create a new workspace with auto-generated slug.
 * User is automatically set as owner.
 *
 * Rate limit: 5 workspaces per hour per user
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'You must be signed in to create a workspace',
        },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Check rate limit (5 workspaces per hour) using unified rate limiter
    const rateLimitKey = `create-workspace:${userId}`
    const rateLimitLimit = 5
    const rateLimitWindowSeconds = 60 * 60
    const rateLimit = await checkRateLimit(rateLimitKey, rateLimitLimit, rateLimitWindowSeconds) // 5 attempts, 1 hour

    const withRateLimitHeaders = (response: NextResponse) => {
      const headers = generateRateLimitHeaders({
        limit: rateLimitLimit,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      })
      Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
      return response
    }

    if (rateLimit.isRateLimited) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMITED',
          message: 'Too many workspace creation attempts. Please try again later.',
          retryAfter: rateLimit.retryAfter,
        },
        { status: 429 }
      )
      const headers = generateRateLimitHeaders({
        limit: rateLimitLimit,
        remaining: 0,
        resetAt: rateLimit.resetAt,
      })
      Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
      if (rateLimit.retryAfter !== undefined) {
        response.headers.set('Retry-After', String(rateLimit.retryAfter))
      }
      return response
    }

    // Parse and validate request body
    const body = await request.json()
    const result = CreateWorkspaceSchema.safeParse(body)

    if (!result.success) {
      return withRateLimitHeaders(
        NextResponse.json(
          {
            success: false,
            error: 'INVALID_INPUT',
            message: result.error.issues[0].message,
          },
          { status: 400 }
        )
      )
    }

    const { name } = result.data

    // Generate unique slug with collision detection
    const slug = await generateUniqueSlug(name, async (slugToCheck) => {
      const existing = await prisma.workspace.findUnique({
        where: { slug: slugToCheck },
        select: { id: true },
      })
      return existing !== null
    })

    // Create workspace and owner membership in a transaction
    const workspace = await prisma.$transaction(async (tx) => {
      // Create workspace
      const newWorkspace = await tx.workspace.create({
        data: {
          name,
          slug,
          timezone: 'UTC',
        },
      })

      // Create owner membership
      await tx.workspaceMember.create({
        data: {
          userId,
          workspaceId: newWorkspace.id,
          role: 'owner',
          acceptedAt: new Date(), // Owner is automatically accepted
        },
      })

      return newWorkspace
    })

    // Update session with new workspace as active context
    await updateSessionWorkspace(session.session.id, workspace.id)

    // Emit event (console.log for now, will be replaced with event bus in Epic 05)
    console.log('workspace.created', {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
      ownerId: userId,
      createdAt: workspace.createdAt.toISOString(),
    })

    return withRateLimitHeaders(
      NextResponse.json(
        {
          success: true,
          data: {
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
            image: workspace.image,
            timezone: workspace.timezone,
            createdAt: workspace.createdAt,
            updatedAt: workspace.updatedAt,
            deletedAt: workspace.deletedAt,
          },
        },
        { status: 201 }
      )
    )
  } catch (error) {
    console.error('Error creating workspace:', error)

    // Handle slug generation failure
    if (error instanceof Error && error.message.includes('unique slug')) {
      return NextResponse.json(
        {
          success: false,
          error: 'SLUG_COLLISION',
          message: 'Failed to generate unique workspace URL. Please try a different name.',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while creating the workspace.',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/workspaces
 *
 * List all workspaces where the user is a member.
 * Excludes soft-deleted workspaces.
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
          message: 'You must be signed in to view workspaces',
        },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Query user's workspace memberships with workspace data
    const memberships = await prisma.workspaceMember.findMany({
      where: {
        userId,
        workspace: {
          deletedAt: null, // Exclude soft-deleted workspaces
        },
      },
      include: {
        workspace: true,
      },
      orderBy: {
        workspace: {
          updatedAt: 'desc',
        },
      },
    })

    // Transform to WorkspaceWithRole format
    const workspaces: WorkspaceWithRole[] = memberships.map((membership) => ({
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      image: membership.workspace.image,
      timezone: membership.workspace.timezone,
      createdAt: membership.workspace.createdAt,
      updatedAt: membership.workspace.updatedAt,
      deletedAt: membership.workspace.deletedAt,
      role: membership.role as WorkspaceRole,
    }))

    return NextResponse.json({
      success: true,
      data: workspaces,
    })
  } catch (error) {
    console.error('Error listing workspaces:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching workspaces.',
      },
      { status: 500 }
    )
  }
}
