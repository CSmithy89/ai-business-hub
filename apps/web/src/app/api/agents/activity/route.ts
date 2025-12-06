import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth-server'
import { MOCK_AGENTS } from '../mock-data'

interface AgentActivity {
  id: string
  agentId: string
  agentName: string
  workspaceId: string
  type: 'task_started' | 'task_completed' | 'approval_requested' | 'approval_processed' | 'error' | 'config_changed'
  action: string
  module: string
  entityId?: string
  entityType?: string
  status: 'pending' | 'completed' | 'failed'
  confidenceScore?: number
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string
  startedAt: string
  completedAt?: string
  duration?: number
  createdAt: string
}

const ActivityQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    agent: z.string().min(1).optional(),
    type: z
      .enum([
        'task_started',
        'task_completed',
        'approval_requested',
        'approval_processed',
        'error',
        'config_changed',
      ])
      .optional(),
    status: z.enum(['pending', 'completed', 'failed']).optional(),
  })
  .strict()

/**
 * GET /api/agents/activity
 *
 * Fetch all agent activities across all agents with pagination and filtering.
 * This is the cross-agent activity feed endpoint.
 */
export async function GET(request: Request) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaceId = session.session?.activeWorkspaceId ?? 'default'
    const workspaceAgents = MOCK_AGENTS.filter(
      agent => agent.workspaceId === workspaceId
    )
    const allowedAgentIds = new Set(workspaceAgents.map(agent => agent.id))

    const { searchParams } = new URL(request.url)
    const parsedQuery = ActivityQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      agent: searchParams.get('agent') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    })

    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsedQuery.error.flatten() },
        { status: 400 }
      )
    }

    const { page, limit, agent: agentFilter, type: typeFilter, status: statusFilter } =
      parsedQuery.data

    if (agentFilter && !allowedAgentIds.has(agentFilter)) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    if (workspaceAgents.length === 0) {
      return NextResponse.json(
        {
          data: [],
          meta: { total: 0, page, limit, totalPages: 0 },
        },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      )
    }

    // TODO: Replace with real database query when Prisma is connected
    // This should fetch from the AgentActivity table with:
    // - workspaceId filter (from session)
    // - Optional agentId filter
    // - Optional type filter
    // - Optional status filter
    // - Pagination (page, limit)
    // - Order by createdAt DESC

    // Mock data generator for multiple agents
    const agentPool =
      workspaceAgents.map(agent => ({ id: agent.id, name: agent.name })) || []

    const types: AgentActivity['type'][] = [
      'task_started',
      'task_completed',
      'approval_requested',
      'approval_processed',
      'error',
      'config_changed',
    ]
    const statuses: AgentActivity['status'][] = ['pending', 'completed', 'failed']
    const modules = ['validation', 'planning', 'branding', 'crm']

    // Generate 100 mock activities across all agents
    const allActivities: AgentActivity[] = Array.from({ length: 100 }, (_, i) => {
      const agent = agentPool[i % agentPool.length]
      const activityType = types[i % types.length]
      const activityModule = modules[i % modules.length]
      const startedAt = new Date(Date.now() - i * 1800000).toISOString() // 30 minutes apart

      const activityStatus =
        activityType === 'task_completed'
          ? 'completed'
          : activityType === 'error'
            ? 'failed'
            : statuses[i % statuses.length]

      return {
        id: `act_${agent.id}_${i}`,
        agentId: agent.id,
        agentName: agent.name,
        workspaceId,
        type: activityType,
        action:
          activityType === 'task_completed'
            ? `Analyzed market size for ${activityModule} project`
            : activityType === 'task_started'
              ? `Started ${activityModule} validation task`
              : activityType === 'approval_requested'
                ? `Requested approval for ${activityModule} action`
                : activityType === 'approval_processed'
                  ? `Processed approval for ${activityModule} action`
                  : activityType === 'config_changed'
                    ? `Updated ${activityModule} configuration`
                    : `Error processing ${activityModule} task`,
        module: activityModule,
        status: activityStatus,
        confidenceScore: activityType === 'task_completed' ? 70 + (i % 30) : undefined,
        startedAt,
        completedAt:
          activityStatus === 'completed'
            ? new Date(Date.now() - i * 1800000 + 120000).toISOString()
            : undefined,
        duration: activityStatus === 'completed' ? 120000 + i * 1000 : undefined,
        createdAt: startedAt,
        input:
          i % 3 === 0
            ? {
                projectId: `proj_${i}`,
                taskType: activityType,
                params: { industry: 'tech', region: 'US' },
              }
            : undefined,
        output:
          activityStatus === 'completed' && i % 3 === 0
            ? {
                result: 'Analysis complete',
                findings: ['Market size: $5B', 'Growth rate: 15%'],
              }
            : undefined,
        error:
          activityStatus === 'failed' ? `Failed to process ${activityModule} task: Connection timeout` : undefined,
        entityId: i % 2 === 0 ? `entity_${i}` : undefined,
        entityType: i % 2 === 0 ? 'project' : undefined,
      }
    })

    // Apply filters
    let filteredActivities = allActivities

    if (agentFilter) {
      filteredActivities = filteredActivities.filter(activity => activity.agentId === agentFilter)
    }

    if (typeFilter) {
      filteredActivities = filteredActivities.filter(activity => activity.type === typeFilter)
    }

    if (statusFilter) {
      filteredActivities = filteredActivities.filter(activity => activity.status === statusFilter)
    }

    // Apply pagination
    const startIndex = (page - 1) * limit
    const paginatedActivities = filteredActivities.slice(startIndex, startIndex + limit)

    return NextResponse.json(
      {
        data: paginatedActivities,
        meta: {
          total: filteredActivities.length,
          page,
          limit,
          totalPages: Math.ceil(filteredActivities.length / limit),
        },
      },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    )
  } catch (error) {
    console.error('Error fetching agent activities:', error)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}
