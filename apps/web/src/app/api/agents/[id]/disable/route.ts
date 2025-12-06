import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import type { Agent } from '@hyvve/shared'

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

    // TODO: Replace with real database update when Prisma is connected
    // This should set agent.enabled to false
    // await prisma.agent.update({
    //   where: { id, workspaceId: session.workspaceId },
    //   data: { enabled: false },
    // })

    // Return disabled agent (mock data)
    const disabledAgent: Agent = {
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
      status: 'offline',
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
      enabled: false,
      createdAt: new Date('2024-01-01'),
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
