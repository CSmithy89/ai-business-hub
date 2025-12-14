/**
 * Individual Workspace Module API Routes
 * Module Configuration for HYVVE Platform
 *
 * GET /api/workspaces/:id/modules/:moduleId - Get module status
 * PATCH /api/workspaces/:id/modules/:moduleId - Update module config
 * DELETE /api/workspaces/:id/modules/:moduleId - Disable a module
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, Prisma } from '@hyvve/db'
import {
  requireWorkspaceMembership,
  requireRole,
  handleWorkspaceAuthError,
  WorkspaceAuthError,
} from '@/middleware/workspace-auth'
import { getModuleById } from '@/lib/constants/modules'

interface RouteParams {
  params: Promise<{ id: string; moduleId: string }>
}

/**
 * Schema for updating module configuration
 */
const UpdateModuleSchema = z.object({
  config: z.record(z.string(), z.unknown()).optional(),
  enabled: z.boolean().optional(),
})

/**
 * GET /api/workspaces/:id/modules/:moduleId
 *
 * Get the status and configuration of a specific module
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId, moduleId } = await params

    // Verify membership
    const membership = await requireWorkspaceMembership(workspaceId)
    const canViewConfig = membership.role === 'owner' || membership.role === 'admin'

    // Validate module ID
    const moduleInfo = getModuleById(moduleId)
    if (!moduleInfo) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      )
    }

    // Get module configuration from database
    const workspaceModule = await prisma.workspaceModule.findUnique({
      where: {
        workspaceId_moduleId: {
          workspaceId,
          moduleId,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...moduleInfo,
        enabled: moduleInfo.isCore || (workspaceModule?.enabled ?? false),
        config: canViewConfig ? (workspaceModule?.config ?? {}) : {},
        enabledAt: workspaceModule?.enabledAt ?? null,
        disabledAt: workspaceModule?.disabledAt ?? null,
      },
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }
    console.error('Error fetching module:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch module' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/workspaces/:id/modules/:moduleId
 *
 * Update module configuration
 * Requires admin role
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId, moduleId } = await params

    // Require admin role
    const membership = await requireWorkspaceMembership(workspaceId)
    requireRole(membership.role, ['owner', 'admin'])

    // Validate module ID
    const moduleInfo = getModuleById(moduleId)
    if (!moduleInfo) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      )
    }

    // Core modules cannot be disabled
    if (moduleInfo.isCore) {
      return NextResponse.json(
        { success: false, error: 'Core modules cannot be modified' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validation = UpdateModuleSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.format(),
        },
        { status: 400 }
      )
    }

    const { config, enabled } = validation.data

    // Build update data
    const updateData: Prisma.WorkspaceModuleUpdateInput = {}

    if (config !== undefined) {
      updateData.config = config as Prisma.InputJsonValue
    }

    if (enabled !== undefined) {
      updateData.enabled = enabled
      if (enabled) {
        updateData.enabledAt = new Date()
        updateData.disabledAt = null
      } else {
        updateData.enabledAt = null
        updateData.disabledAt = new Date()
      }
    }

    // Upsert module configuration
    const workspaceModule = await prisma.workspaceModule.upsert({
      where: {
        workspaceId_moduleId: {
          workspaceId,
          moduleId,
        },
      },
      create: {
        workspaceId,
        moduleId,
        enabled: enabled ?? false,
        config: (config ?? {}) as Prisma.InputJsonValue,
        enabledAt: enabled ? new Date() : null,
        disabledAt: enabled === false ? new Date() : null,
      },
      update: updateData,
    })

    return NextResponse.json({
      success: true,
      data: {
        ...moduleInfo,
        enabled: workspaceModule.enabled,
        config: workspaceModule.config,
        enabledAt: workspaceModule.enabledAt,
        disabledAt: workspaceModule.disabledAt,
      },
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }
    console.error('Error updating module:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update module' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/workspaces/:id/modules/:moduleId
 *
 * Disable a module for the workspace
 * Requires admin role
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId, moduleId } = await params

    // Require admin role
    const membership = await requireWorkspaceMembership(workspaceId)
    requireRole(membership.role, ['owner', 'admin'])

    // Validate module ID
    const moduleInfo = getModuleById(moduleId)
    if (!moduleInfo) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      )
    }

    // Core modules cannot be disabled
    if (moduleInfo.isCore) {
      return NextResponse.json(
        { success: false, error: 'Core modules cannot be disabled' },
        { status: 400 }
      )
    }

    // Check if module exists
    const existingModule = await prisma.workspaceModule.findUnique({
      where: {
        workspaceId_moduleId: {
          workspaceId,
          moduleId,
        },
      },
    })

    if (!existingModule) {
      return NextResponse.json(
        { success: false, error: 'Module is not enabled' },
        { status: 400 }
      )
    }
    if (existingModule.enabled === false) {
      return NextResponse.json(
        { success: false, error: 'Module is already disabled' },
        { status: 400 }
      )
    }

    // Disable the module (keep config for potential re-enable)
    const workspaceModule = await prisma.workspaceModule.update({
      where: {
        workspaceId_moduleId: {
          workspaceId,
          moduleId,
        },
      },
      data: {
        enabled: false,
        disabledAt: new Date(),
        enabledAt: null,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...moduleInfo,
        enabled: false,
        config: workspaceModule.config,
        enabledAt: workspaceModule.enabledAt,
        disabledAt: workspaceModule.disabledAt,
      },
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }
    console.error('Error disabling module:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to disable module' },
      { status: 500 }
    )
  }
}
