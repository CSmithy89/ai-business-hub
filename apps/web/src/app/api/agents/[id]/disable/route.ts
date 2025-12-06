import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import type { Agent } from '@hyvve/shared'
import { MOCK_AGENTS } from '../../mock-data'

/**
 * POST /api/agents/:id/disable
 *
 * Disable agent (soft delete - stops processing but preserves history)
 */
export async function POST(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaceId = session.session?.activeWorkspaceId ?? 'default'
    const agent = MOCK_AGENTS.find(
      mockAgent => mockAgent.id === id && mockAgent.workspaceId === workspaceId
    )

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // TODO: Replace with real database update when Prisma is connected
    // This should set agent.enabled to false
    // await prisma.agent.update({
    //   where: { id, workspaceId: session.workspaceId },
    //   data: { enabled: false },
    // })

    // Return disabled agent (mock data)
    const disabledAgent: Agent = {
      ...agent,
      status: 'offline',
      enabled: false,
      updatedAt: new Date(),
    }

    return NextResponse.json(
      {
        data: disabledAgent,
        message: 'Agent disabled successfully',
      },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    )
  } catch (error) {
    console.error('Error disabling agent:', error)
    return NextResponse.json({ error: 'Failed to disable agent' }, { status: 500 })
  }
}
