/**
 * Test API: Create Workspace for User
 *
 * Only available in development/test environments.
 * Used by e2e test fixtures to create workspaces without full auth flow.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'

// Only allow in non-production environments
const isTestEnv = process.env.NODE_ENV !== 'production'

export async function POST(req: Request) {
  if (!isTestEnv) {
    return NextResponse.json(
      { error: 'Test endpoints are not available in production' },
      { status: 403 }
    )
  }

  try {
    const { userId, email, name } = await req.json()

    // Find user by userId or email
    let user
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } })
    } else if (email) {
      user = await prisma.user.findUnique({ where: { email } })
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user already has a workspace
    const existingMembership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      include: { workspace: true },
    })

    if (existingMembership) {
      return NextResponse.json({
        success: true,
        message: 'User already has a workspace',
        workspace: {
          id: existingMembership.workspace.id,
          name: existingMembership.workspace.name,
          slug: existingMembership.workspace.slug,
        },
      })
    }

    // Generate unique slug
    const slug = `test-workspace-${Date.now()}`
    const workspaceName = name || `Test Workspace for ${user.name || user.email}`

    // Create workspace and membership in transaction
    const workspace = await prisma.$transaction(async (tx) => {
      const newWorkspace = await tx.workspace.create({
        data: {
          name: workspaceName,
          slug,
          timezone: 'UTC',
        },
      })

      await tx.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: newWorkspace.id,
          role: 'owner',
          acceptedAt: new Date(),
        },
      })

      return newWorkspace
    })

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
    })
  } catch (error) {
    console.error('Error creating test workspace:', error)
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    )
  }
}
