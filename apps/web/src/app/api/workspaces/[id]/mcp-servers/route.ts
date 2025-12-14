/**
 * MCP Servers API Routes
 * Model Context Protocol Server Configuration for HYVVE Platform
 *
 * GET /api/workspaces/:id/mcp-servers - List all MCP servers
 * POST /api/workspaces/:id/mcp-servers - Add a new MCP server
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
import {
  VALID_TRANSPORTS,
  PERMISSION_LEVELS,
  TRANSPORT_TYPES,
  getPermissionName,
  MAX_MCP_SERVERS_PER_WORKSPACE,
} from '@/lib/constants/mcp'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Schema for creating an MCP server
 */
const CreateMCPServerSchema = z.object({
  serverId: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, {
    message: 'Server ID must be lowercase alphanumeric with hyphens',
  }),
  name: z.string().min(1).max(200),
  transport: z.enum(VALID_TRANSPORTS),
  command: z.string().optional(),
  url: z.string().url().optional(),
  apiKey: z.string().optional(),
  headers: safeStringMap('Headers').optional().default({}),
  envVars: safeStringMap('Environment variables').optional().default({}),
  includeTools: z.array(z.string()).optional().default([]),
  excludeTools: z.array(z.string()).optional().default([]),
  permissions: z.number().int().min(0).max(7).optional().default(1),
  timeoutSeconds: z.number().int().min(5).max(300).optional().default(30),
  enabled: z.boolean().optional().default(true),
}).refine(
  (data) => {
    // Stdio transport requires command
    if (data.transport === 'stdio' && !data.command) {
      return false
    }
    // SSE/HTTP transport requires URL
    if ((data.transport === 'sse' || data.transport === 'streamable-http') && !data.url) {
      return false
    }
    return true
  },
  {
    message: 'Stdio transport requires command, SSE/HTTP transport requires URL',
  }
)

/**
 * GET /api/workspaces/:id/mcp-servers
 *
 * List all MCP servers for the workspace
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Verify membership (any member can view servers)
    await requireWorkspaceMembership(workspaceId)

    // Get MCP servers for this workspace
    const servers = await prisma.mCPServerConfig.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        serverId: true,
        name: true,
        transport: true,
        command: true,
        url: true,
        // Don't expose encrypted API key
        includeTools: true,
        excludeTools: true,
        permissions: true,
        timeoutSeconds: true,
        enabled: true,
        lastHealthCheck: true,
        healthStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Map permission integers to names
    const serversWithPermissionNames = servers.map((server) => ({
      ...server,
      permissionLevel: getPermissionName(server.permissions),
    }))

    return NextResponse.json({
      success: true,
      data: {
        servers: serversWithPermissionNames,
        permissionLevels: PERMISSION_LEVELS,
        transports: TRANSPORT_TYPES,
      },
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      const { body, status } = handleWorkspaceAuthError(error)
      return NextResponse.json(body, { status })
    }
    console.error('Error fetching MCP servers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch MCP servers' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/workspaces/:id/mcp-servers
 *
 * Add a new MCP server
 * Requires admin role
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Require admin role to add servers
    const membership = await requireWorkspaceMembership(workspaceId)
    requireRole(membership.role, ['owner', 'admin'])

    const body = await request.json()
    const validation = CreateMCPServerSchema.safeParse(body)

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

    const {
      serverId,
      name,
      transport,
      command,
      url,
      apiKey,
      headers,
      envVars,
      includeTools,
      excludeTools,
      permissions,
      timeoutSeconds,
      enabled,
    } = validation.data

    // Check for duplicate server ID
    const existing = await prisma.mCPServerConfig.findUnique({
      where: {
        workspaceId_serverId: {
          workspaceId,
          serverId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Server with this ID already exists' },
        { status: 409 }
      )
    }

    // Check server limit
    const serverCount = await prisma.mCPServerConfig.count({
      where: { workspaceId },
    })

    if (serverCount >= MAX_MCP_SERVERS_PER_WORKSPACE) {
      return NextResponse.json(
        { success: false, error: `Maximum of ${MAX_MCP_SERVERS_PER_WORKSPACE} MCP servers per workspace` },
        { status: 400 }
      )
    }

    // Encrypt API key if provided using AES-256-GCM
    const apiKeyEncrypted = apiKey ? await encryptApiKey(apiKey) : null

    // Create the server
    const server = await prisma.mCPServerConfig.create({
      data: {
        workspaceId,
        serverId,
        name,
        transport,
        command,
        url,
        apiKeyEncrypted,
        headers: headers as Prisma.InputJsonValue,
        envVars: envVars as Prisma.InputJsonValue,
        includeTools,
        excludeTools,
        permissions,
        timeoutSeconds,
        enabled,
        healthStatus: 'unknown',
      },
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
        createdAt: true,
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
    console.error('Error creating MCP server:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create MCP server' },
      { status: 500 }
    )
  }
}
