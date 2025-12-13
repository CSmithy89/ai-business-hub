/**
 * Workspace Modules API Routes
 * Module Configuration for HYVVE Platform
 *
 * GET /api/workspaces/:id/modules - List all modules and their status
 * POST /api/workspaces/:id/modules - Enable a module
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

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Available modules in the HYVVE platform
 */
const AVAILABLE_MODULES = [
  {
    id: 'bm-validation',
    name: 'Business Validation',
    description: 'Validate business ideas with market research and competitor analysis',
    category: 'onboarding',
    isCore: true, // Core modules are always available
  },
  {
    id: 'bm-planning',
    name: 'Business Planning',
    description: 'Create business plans, financial projections, and pitch decks',
    category: 'onboarding',
    isCore: true,
  },
  {
    id: 'bm-branding',
    name: 'Brand Development',
    description: 'Develop brand strategy, visual identity, and marketing assets',
    category: 'onboarding',
    isCore: true,
  },
  {
    id: 'bm-crm',
    name: 'CRM',
    description: 'Customer relationship management with AI-powered lead scoring',
    category: 'operations',
    isCore: false,
  },
  {
    id: 'bm-inventory',
    name: 'Inventory Management',
    description: 'Track inventory, manage stock levels, and automate reordering',
    category: 'operations',
    isCore: false,
  },
  {
    id: 'bm-marketing',
    name: 'Marketing Automation',
    description: 'Automated content creation, scheduling, and campaign management',
    category: 'growth',
    isCore: false,
  },
  {
    id: 'bm-analytics',
    name: 'Business Analytics',
    description: 'AI-powered insights and reporting across all business data',
    category: 'intelligence',
    isCore: false,
  },
] as const

/**
 * Schema for enabling a module
 */
const EnableModuleSchema = z.object({
  moduleId: z.string().refine(
    (id) => AVAILABLE_MODULES.some((m) => m.id === id),
    { message: 'Invalid module ID' }
  ),
  config: z.record(z.string(), z.unknown()).optional().default({}),
})

/**
 * GET /api/workspaces/:id/modules
 *
 * List all available modules and their enabled status for the workspace
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Verify membership (any member can view modules)
    await requireWorkspaceMembership(workspaceId)

    // Get enabled modules for this workspace
    const enabledModules = await prisma.workspaceModule.findMany({
      where: { workspaceId },
    })

    // Build module map for quick lookup
    const enabledMap = new Map(
      enabledModules.map((m) => [m.moduleId, m])
    )

    // Merge available modules with enabled status
    const modules = AVAILABLE_MODULES.map((module) => {
      const enabled = enabledMap.get(module.id)
      return {
        ...module,
        enabled: module.isCore || (enabled?.enabled ?? false),
        config: enabled?.config ?? {},
        enabledAt: enabled?.enabledAt ?? null,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        modules,
        categories: [
          { id: 'onboarding', name: 'Business Onboarding' },
          { id: 'operations', name: 'Operations' },
          { id: 'growth', name: 'Growth' },
          { id: 'intelligence', name: 'Business Intelligence' },
        ],
      },
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      return handleWorkspaceAuthError(error)
    }
    console.error('Error fetching modules:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch modules' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/workspaces/:id/modules
 *
 * Enable a module for the workspace
 * Requires admin role
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Require admin role to enable modules
    const membership = await requireWorkspaceMembership(workspaceId)
    requireRole(membership.role, ['owner', 'admin'])

    const body = await request.json()
    const validation = EnableModuleSchema.safeParse(body)

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

    const { moduleId, config } = validation.data

    // Check if module is a core module (cannot be disabled)
    const moduleInfo = AVAILABLE_MODULES.find((m) => m.id === moduleId)
    if (moduleInfo?.isCore) {
      return NextResponse.json(
        { success: false, error: 'Core modules are always enabled' },
        { status: 400 }
      )
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
        enabled: true,
        config: config as Prisma.InputJsonValue,
        enabledAt: new Date(),
      },
      update: {
        enabled: true,
        config: config as Prisma.InputJsonValue,
        enabledAt: new Date(),
        disabledAt: null,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...moduleInfo,
        enabled: true,
        config: workspaceModule.config,
        enabledAt: workspaceModule.enabledAt,
      },
    })
  } catch (error) {
    if (error instanceof WorkspaceAuthError) {
      return handleWorkspaceAuthError(error)
    }
    console.error('Error enabling module:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to enable module' },
      { status: 500 }
    )
  }
}
