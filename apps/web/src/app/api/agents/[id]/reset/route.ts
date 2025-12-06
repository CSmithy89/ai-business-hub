import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import type { Agent } from '@hyvve/shared'

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
      id,
      name: id === 'vera' ? 'Vera' : id === 'sam' ? 'Sam' : 'Agent',
      role:
        id === 'vera'
          ? 'Validation Orchestrator'
          : id === 'sam'
            ? 'Strategy & Research Lead'
            : 'Agent Role',
      team:
        id === 'vera'
          ? 'validation'
          : id === 'sam'
            ? 'planning'
            : 'orchestrator',
      description: 'Agent description',
      avatar: id === 'vera' ? '🔍' : id === 'sam' ? '📊' : '🤖',
      themeColor: id === 'vera' ? '#3b82f6' : id === 'sam' ? '#8b5cf6' : '#10b981',
      status: 'online',
      lastActive: new Date(),
      capabilities: ['Capability 1', 'Capability 2'],
      metrics: {
        tasksCompleted: 145,
        successRate: 87,
        avgResponseTime: 2400,
        confidenceAvg: 82,
      },
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
      permissions: {
        dataAccess: ['crm', 'content', 'analytics'],
        canExecuteActions: true,
        requiresApproval: false,
      },
      workspaceId: session.session?.activeWorkspaceId ?? 'workspace-1',
      enabled: true,
      createdAt: new Date('2024-01-01'),
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
