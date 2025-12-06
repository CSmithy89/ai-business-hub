import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import type { Agent } from '@hyvve/shared'

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Replace with real database query when Prisma is connected
    // This should fetch from the database: await prisma.agent.findUnique({ where: { id } })
    const mockAgent: Agent = {
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
      description:
        id === 'vera'
          ? 'Leads the validation team to assess market viability and identify potential risks'
          : id === 'sam'
            ? 'Conducts deep market research and competitive analysis for strategic planning'
            : 'Agent description',
      avatar: id === 'vera' ? '🔍' : id === 'sam' ? '📊' : '🤖',
      themeColor: id === 'vera' ? '#3b82f6' : id === 'sam' ? '#8b5cf6' : '#10b981',
      status: 'online',
      lastActive: new Date(),
      capabilities:
        id === 'vera'
          ? [
              'Market sizing analysis',
              'Competitor mapping',
              'Customer discovery',
              'Risk assessment',
              'Data validation',
            ]
          : id === 'sam'
            ? [
                'Market research',
                'Competitive analysis',
                'Strategic planning',
                'Trend analysis',
                'SWOT analysis',
              ]
            : ['General task execution'],
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
      workspaceId: 'workspace-1',
      enabled: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
    }

    return NextResponse.json(
      { data: mockAgent },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    )
  } catch (error) {
    console.error('Error fetching agent:', error)
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // TODO: Replace with real database update when Prisma is connected
    // This should update the database: await prisma.agent.update({ where: { id }, data: body })

    // Validate configuration fields
    if (body.temperature !== undefined && (body.temperature < 0 || body.temperature > 2)) {
      return NextResponse.json({ error: 'Temperature must be between 0 and 2' }, { status: 400 })
    }

    if (body.maxTokens !== undefined && (body.maxTokens < 100 || body.maxTokens > 100000)) {
      return NextResponse.json(
        { error: 'Max tokens must be between 100 and 100000' },
        { status: 400 }
      )
    }

    if (
      body.confidenceThreshold !== undefined &&
      (body.confidenceThreshold < 0 || body.confidenceThreshold > 100)
    ) {
      return NextResponse.json(
        { error: 'Confidence threshold must be between 0 and 100' },
        { status: 400 }
      )
    }

    if (body.tone !== undefined && (body.tone < 0 || body.tone > 100)) {
      return NextResponse.json({ error: 'Tone must be between 0 and 100' }, { status: 400 })
    }

    if (body.customInstructions !== undefined && body.customInstructions.length > 500) {
      return NextResponse.json(
        { error: 'Custom instructions must be 500 characters or less' },
        { status: 400 }
      )
    }

    // Return updated agent (in real implementation, this would be from DB)
    const updatedAgent: Agent = {
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
        providerId: body.providerId ?? null,
        model: body.model ?? null,
        temperature: body.temperature ?? 1.0,
        maxTokens: body.maxTokens ?? 4000,
        contextWindow: body.contextWindow ?? 8000,
        automationLevel: body.automationLevel ?? 'smart',
        confidenceThreshold: body.confidenceThreshold ?? 70,
        tone: body.tone ?? 50,
        customInstructions: body.customInstructions ?? '',
      },
      permissions: {
        dataAccess: ['crm', 'content', 'analytics'],
        canExecuteActions: true,
        requiresApproval: false,
      },
      workspaceId: 'workspace-1',
      enabled: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
    }

    return NextResponse.json(
      { data: updatedAgent },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    )
  } catch (error) {
    console.error('Error updating agent:', error)
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate confirmation name
    if (!body.confirmName) {
      return NextResponse.json(
        { error: 'Confirmation name is required' },
        { status: 400 }
      )
    }

    // TODO: Replace with real database query to get agent name
    const agentName = id === 'vera' ? 'Vera' : id === 'sam' ? 'Sam' : 'Agent'

    if (body.confirmName !== agentName) {
      return NextResponse.json(
        { error: 'Confirmation name does not match agent name' },
        { status: 400 }
      )
    }

    // TODO: Replace with real database delete when Prisma is connected
    // This should delete the agent config (soft delete or hard delete based on requirements)
    // await prisma.agentConfig.delete({
    //   where: { agentId: id, workspaceId: session.workspaceId },
    // })

    return NextResponse.json(
      { message: 'Agent configuration deleted successfully' },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    )
  } catch (error) {
    console.error('Error deleting agent:', error)
    return NextResponse.json(
      { error: 'Failed to delete agent configuration' },
      { status: 500 }
    )
  }
}
