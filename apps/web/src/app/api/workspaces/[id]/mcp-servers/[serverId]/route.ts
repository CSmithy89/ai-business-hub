/**
 * Individual MCP Server API Routes
 * Model Context Protocol Server Configuration for HYVVE Platform
 *
 * GET /api/workspaces/:id/mcp-servers/:serverId - Get server details
 * PATCH /api/workspaces/:id/mcp-servers/:serverId - Update server
 * DELETE /api/workspaces/:id/mcp-servers/:serverId - Delete server
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
import { encryptApiKey } from '@/lib/utils/encryption'
import { safeStringMap } from '@/lib/validation/safe-string-map'
import { VALID_TRANSPORTS, getPermissionName } from '@/lib/constants/mcp'

interface RouteParams {
  params: Promise<{ id: string; serverId: string }>
}

/**
 * Schema for updating an MCP server
 */
const UpdateMCPServerSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  transport: z.enum(VALID_TRANSPORTS).optional(),
  command: z.string().optional().nullable(),
  url: z.string().url().optional().nullable(),
  apiKey: z.string().min(1).max(500).optional().nullable(),
  headers: safeStringMap('Headers').optional(),
  envVars: safeStringMap('Environment variables').optional(),
  includeTools: z.array(z.string()).optional(),
  excludeTools: z.array(z.string()).optional(),
  permissions: z.number().int().min(0).max(7).optional(),
  timeoutSeconds: z.number().int().min(5).max(300).optional(),
  enabled: z.boolean().optional(),
})
.refine(
  (data) => {
    const include = data.includeTools || []
    const exclude = data.excludeTools || []
    return !include.some((t) => exclude.includes(t))
  },
  {
    message: 'includeTools and excludeTools cannot contain the same tool',
  }
)

/**
 * GET /api/workspaces/:id/mcp-servers/:serverId
 *
 * Get details of a specific MCP server
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId, serverId } = await params

    // Verify membership
    const membership = await requireWorkspaceMembership(workspaceId)
    const canViewSecrets = membership.role === 'owner' || membership.role === 'admin'

    // Get the server (include apiKeyEncrypted to check if configured)
    const server = await prisma.mCPServerConfig.findUnique({
      where: {
        workspaceId_serverId: {
          workspaceId,
          serverId,
        },
      },
      select: {
        id: true,
        serverId: true,
        name: true,
        transport: true,
        command: true,
        url: true,
        headers: true,
        envVars: true,
        includeTools: true,
        excludeTools: true,
        permissions: true,
        timeoutSeconds: true,
        enabled: true,
        lastHealthCheck: true,
        healthStatus: true,
        createdAt: true,
        updatedAt: true,
        apiKeyEncrypted: true, // Include to check hasApiKey without extra query
      },
    })

    if (!server) {
      return NextResponse.json(
        { success: false, error: 'MCP server not found' },
        { status: 404 }
      )
    }

    // Extract hasApiKey and remove apiKeyEncrypted from response
    const { apiKeyEncrypted, ...serverData } = server

    return NextResponse.json({
      success: true,
      data: {
        ...serverData,
        // Non-admin members should not receive raw header/env values.
        ...(canViewSecrets
          ? {}
          : {
              headers: {},
              envVars: {},
              headerKeys: Object.keys((serverData.headers as Record<string, unknown>) || {}),
              envVarKeys: Object.keys((serverData.envVars as Record<string, unknown>) || {}),
            }),
        permissionLevel: getPermissionName(server.permissions),
        hasApiKey: !!apiKeyEncrypted,
      },
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }
    console.error('Error fetching MCP server:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch MCP server' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/workspaces/:id/mcp-servers/:serverId
 *
 * Update an MCP server
 * Requires admin role
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId, serverId } = await params

    // Require admin role
    const membership = await requireWorkspaceMembership(workspaceId)
    requireRole(membership.role, ['owner', 'admin'])

    // Check if server exists
    const existing = await prisma.mCPServerConfig.findUnique({
      where: {
        workspaceId_serverId: {
          workspaceId,
          serverId,
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'MCP server not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validation = UpdateMCPServerSchema.safeParse(body)

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

    const updates = validation.data

    // Build update data
    const updateData: Prisma.MCPServerConfigUpdateInput = {}

    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.transport !== undefined) updateData.transport = updates.transport
    if (updates.command !== undefined) updateData.command = updates.command
    if (updates.url !== undefined) updateData.url = updates.url
    if (updates.headers !== undefined) updateData.headers = updates.headers as Prisma.InputJsonValue
    if (updates.envVars !== undefined) updateData.envVars = updates.envVars as Prisma.InputJsonValue
    if (updates.includeTools !== undefined) updateData.includeTools = updates.includeTools
    if (updates.excludeTools !== undefined) updateData.excludeTools = updates.excludeTools
    if (updates.permissions !== undefined) updateData.permissions = updates.permissions
    if (updates.timeoutSeconds !== undefined) updateData.timeoutSeconds = updates.timeoutSeconds
    if (updates.enabled !== undefined) updateData.enabled = updates.enabled

    // Handle API key update with AES-256-GCM encryption
    if (updates.apiKey !== undefined) {
      if (updates.apiKey === null) {
        updateData.apiKeyEncrypted = null
      } else {
        updateData.apiKeyEncrypted = await encryptApiKey(updates.apiKey)
      }
    }

    // Reset health status on config change
    if (Object.keys(updateData).length > 0) {
      updateData.healthStatus = 'unknown'
      updateData.lastHealthCheck = null
    }

    // Update the server
    const server = await prisma.mCPServerConfig.update({
      where: {
        workspaceId_serverId: {
          workspaceId,
          serverId,
        },
      },
      data: updateData,
      select: {
        id: true,
        serverId: true,
        name: true,
        transport: true,
        command: true,
        url: true,
        includeTools: true,
        excludeTools: true,
        permissions: true,
        timeoutSeconds: true,
        enabled: true,
        healthStatus: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...server,
        permissionLevel: getPermissionName(server.permissions),
      },
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }
    console.error('Error updating MCP server:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update MCP server' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/workspaces/:id/mcp-servers/:serverId
 *
 * Delete an MCP server
 * Requires admin role
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId, serverId } = await params

    // Require admin role
    const membership = await requireWorkspaceMembership(workspaceId)
    requireRole(membership.role, ['owner', 'admin'])

    // Delete the server (handles race condition where it may already be deleted)
    try {
      await prisma.mCPServerConfig.delete({
        where: {
          workspaceId_serverId: {
            workspaceId,
            serverId,
          },
        },
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return NextResponse.json(
          { success: false, error: 'MCP server not found' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      data: {
        deleted: true,
        serverId,
      },
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }
    console.error('Error deleting MCP server:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete MCP server' },
      { status: 500 }
    )
  }
}
