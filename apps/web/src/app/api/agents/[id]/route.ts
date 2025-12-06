import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth-server'
import type { Agent } from '@hyvve/shared'
import { MOCK_AGENTS } from '../mock-data'

const AgentConfigSchema = z
  .object({
    providerId: z.string().min(1).nullable().optional(),
    model: z.string().min(1).nullable().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().min(100).max(100000).optional(),
    contextWindow: z.number().int().min(1000).max(200000).optional(),
    automationLevel: z.enum(['manual', 'smart', 'full_auto']).optional(),
    confidenceThreshold: z.number().int().min(0).max(100).optional(),
    tone: z.number().int().min(0).max(100).optional(),
    customInstructions: z.string().max(500).optional(),
  })
  .strict()

const DeleteSchema = z
  .object({
    confirmName: z.string().min(1),
  })
  .strict()

function getAgentForWorkspace(agentId: string, workspaceId: string): Agent | null {
  return (
    MOCK_AGENTS.find(agent => agent.id === agentId && agent.workspaceId === workspaceId) || null
  )
}

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

    const workspaceId = session.session?.activeWorkspaceId ?? 'default'
    const agent = getAgentForWorkspace(id, workspaceId)

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    return NextResponse.json(
      { data: agent },
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

    const workspaceId = session.session?.activeWorkspaceId ?? 'default'
    const agent = getAgentForWorkspace(id, workspaceId)

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    let jsonBody: unknown
    try {
      jsonBody = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsedBody = AgentConfigSchema.safeParse(jsonBody)

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: 'Invalid agent configuration',
          details: parsedBody.error.flatten(),
        },
        { status: 400 }
      )
    }

    const body = parsedBody.data

    // Return updated agent (in real implementation, this would be from DB)
    const updatedAgent: Agent = {
      ...agent,
      config: {
        ...agent.config,
        ...body,
      },
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

    const workspaceId = session.session?.activeWorkspaceId ?? 'default'
    const agent = getAgentForWorkspace(id, workspaceId)

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    let jsonBody: unknown
    try {
      jsonBody = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsedBody = DeleteSchema.safeParse(jsonBody)

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Confirmation name is required', details: parsedBody.error.flatten() },
        { status: 400 }
      )
    }

    if (parsedBody.data.confirmName.trim() !== agent.name) {
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
