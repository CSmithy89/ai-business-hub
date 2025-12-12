import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import type { AgentTeam, AgentStatus } from '@hyvve/shared'
import { MOCK_AGENTS } from './mock-data'
import { DEMO_AGENTS, isDemoMode } from '@/lib/demo-data'


/**
 * GET /api/agents
 *
 * Fetch all agents for the workspace with optional filtering
 * Story 16.8: Added demo mode support
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaceId = session.session?.activeWorkspaceId ?? 'default'

    // SECURITY: Tenant isolation required before production deployment
    // TODO: Replace mock data with database query filtered by workspaceId:
    // const agents = await prisma.agent.findMany({
    //   where: { workspaceId: session.session?.activeWorkspaceId },
    // })
    // Without this filter, users could access agents from other workspaces.

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const team = searchParams.get('team') as AgentTeam | null
    const status = searchParams.get('status') as AgentStatus | null
    const search = searchParams.get('search')

    // Story 16.8: Use demo data if demo mode is enabled
    const sourceAgents = isDemoMode() ? DEMO_AGENTS : MOCK_AGENTS

    // Filter agents based on query params and workspace
    let filteredAgents = sourceAgents.filter(
      agent => agent.workspaceId === workspaceId
    )

    if (team) {
      filteredAgents = filteredAgents.filter((agent) => agent.team === team)
    }

    if (status) {
      filteredAgents = filteredAgents.filter((agent) => agent.status === status)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredAgents = filteredAgents.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchLower) ||
          agent.role.toLowerCase().includes(searchLower) ||
          agent.description.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      data: filteredAgents,
    })
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}
