import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import type { Agent } from '@hyvve/shared'
import { MOCK_AGENTS } from '../../mock-data'

/**
 * POST /api/agents/:id/reset
 *
 * Reset agent configuration to workspace defaults
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
    // This should reset the agent config to default values
    // await prisma.agentConfig.update({
    //   where: { agentId: id, workspaceId: session.workspaceId },
    //   data: {
    //     providerId: null,
    //     model: null,
    //     temperature: 1.0,
    //     maxTokens: 4000,
    //     contextWindow: 8000,
    //     automationLevel: 'smart',
    //     confidenceThreshold: 70,
    //     tone: 50,
    //     customInstructions: '',
    //   },
    // })

    // Return reset agent (mock data)
    const resetAgent: Agent = {
      ...agent,
      config: {
        providerId: null,
        model: null,
        temperature: 1.0,
        maxTokens: 4000,
        contextWindow: 8000,
        automationLevel: 'smart',
        confidenceThreshold: 70,
        tone: 50,
        customInstructions: '',
      },
      updatedAt: new Date(),
    }

    return NextResponse.json(
      {
        data: resetAgent,
        message: 'Agent configuration reset to defaults',
      },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    )
  } catch (error) {
    console.error('Error resetting agent:', error)
    return NextResponse.json(
      { error: 'Failed to reset agent configuration' },
      { status: 500 }
    )
  }
}
