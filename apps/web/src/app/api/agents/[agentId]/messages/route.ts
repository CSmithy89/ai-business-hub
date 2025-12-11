/**
 * Agent Messages API Route
 *
 * Handles chat messages to/from AI agents.
 * Supports streaming responses via SSE.
 *
 * Story: 15.4 - Connect Chat Panel to Agno Backend
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';

interface MessageRequest {
  content: string;
  businessId?: string;
}

interface RouteParams {
  params: Promise<{ agentId: string }>;
}

/**
 * POST /api/agents/[agentId]/messages
 *
 * Send a message to an agent and receive a streaming response.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId } = await params;
    const body = (await request.json()) as MessageRequest;
    const { content, businessId } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const workspaceId = session.session?.activeWorkspaceId ?? 'default';

    // Validate agent ID
    const validAgents = ['hub', 'maya', 'atlas', 'nova', 'echo'];
    if (!validAgents.includes(agentId)) {
      return NextResponse.json({ error: 'Invalid agent ID' }, { status: 400 });
    }

    // TODO: In production, forward to AgentOS/Agno backend
    // const response = await agentOSService.sendMessage({
    //   agentId,
    //   content,
    //   workspaceId,
    //   businessId,
    //   userId: session.user.id,
    // });

    // For now, return a mock response
    // In production, this would be a streaming SSE response from AgentOS
    const mockResponse = generateMockResponse(agentId, content);

    return NextResponse.json({
      id: `msg-${Date.now()}`,
      agentId,
      content: mockResponse,
      timestamp: new Date().toISOString(),
      workspaceId,
      businessId,
    });
  } catch (error) {
    console.error('Error processing message:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}

/**
 * GET /api/agents/[agentId]/messages
 *
 * Fetch message history for an agent conversation.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // TODO: Fetch from database
    // const messages = await prisma.chatMessage.findMany({
    //   where: {
    //     agentId,
    //     workspaceId: session.session?.activeWorkspaceId,
    //     ...(businessId && { businessId }),
    //   },
    //   orderBy: { createdAt: 'desc' },
    //   take: limit,
    // });

    // Return empty array for now - will be populated from localStorage on client
    return NextResponse.json({
      data: [],
      agentId,
      businessId,
      limit,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

/**
 * Generate mock response based on agent personality
 */
function generateMockResponse(agentId: string, userMessage: string): string {
  const agentResponses: Record<string, (msg: string) => string> = {
    hub: (msg) =>
      `I understand you're asking about "${msg.slice(0, 50)}${msg.length > 50 ? '...' : ''}". As your orchestrator, I'll help coordinate the right resources. Let me know if you'd like me to involve a specific team member like Maya for CRM tasks, Atlas for project management, Nova for marketing, or Echo for analytics.`,
    maya: (msg) =>
      `Thanks for reaching out about "${msg.slice(0, 50)}${msg.length > 50 ? '...' : ''}". I'm Maya, your CRM specialist. I can help you manage customer relationships, track interactions, and nurture leads. What would you like me to help you with?`,
    atlas: (msg) =>
      `Got it! You mentioned "${msg.slice(0, 50)}${msg.length > 50 ? '...' : ''}". I'm Atlas, and I handle projects and tasks. I can help you organize work, set deadlines, and track progress. How can I assist you today?`,
    nova: (msg) =>
      `Creative challenge detected: "${msg.slice(0, 50)}${msg.length > 50 ? '...' : ''}". I'm Nova, your marketing and content specialist. I can help with content creation, campaign planning, and brand messaging. What shall we create together?`,
    echo: (msg) =>
      `Analyzing your request: "${msg.slice(0, 50)}${msg.length > 50 ? '...' : ''}". I'm Echo, focused on analytics and insights. I can help you understand data, generate reports, and surface actionable insights. What metrics would you like to explore?`,
  };

  return agentResponses[agentId]?.(userMessage) || 'I received your message. How can I help?';
}
