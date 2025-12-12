/**
 * Agent Messages API Route
 *
 * Handles chat messages to/from AI agents.
 * Supports streaming responses via SSE.
 *
 * Story: 15.4 - Connect Chat Panel to Agno Backend
 * Updated: Added SSE streaming support
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';

interface MessageRequest {
  content: string;
  businessId?: string;
  stream?: boolean;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/agents/[id]/messages
 *
 * Send a message to an agent and receive a streaming or JSON response.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: agentId } = await params;
    const body = (await request.json()) as MessageRequest;
    const { content, businessId, stream } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const workspaceId = session.session?.activeWorkspaceId ?? 'default';

    // Validate agent ID
    const validAgents = ['hub', 'maya', 'atlas', 'nova', 'echo'];
    if (!validAgents.includes(agentId)) {
      return NextResponse.json({ error: 'Invalid agent ID' }, { status: 400 });
    }

    // Check if streaming is requested
    if (stream) {
      // Pass abort signal to allow cleanup when client disconnects
      return handleStreamingResponse(agentId, content, workspaceId, businessId, request.signal);
    }

    // Non-streaming response (fallback)
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
 * Handle streaming SSE response with abort signal support
 * Prevents memory leaks by checking for client disconnection
 */
function handleStreamingResponse(
  agentId: string,
  content: string,
  workspaceId: string,
  businessId?: string,
  abortSignal?: AbortSignal
): Response {
  const encoder = new TextEncoder();

  // Generate mock response for streaming
  const mockResponse = generateMockResponse(agentId, content);
  const words = mockResponse.split(' ');

  // Track if stream has been cancelled
  let cancelled = false;

  // Listen for abort signal if provided
  if (abortSignal) {
    abortSignal.addEventListener('abort', () => {
      cancelled = true;
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Simulate streaming by sending word by word
        for (let i = 0; i < words.length; i++) {
          // Check if client disconnected before sending each chunk
          if (cancelled) {
            controller.close();
            return;
          }

          const word = words[i];
          const chunk = i === 0 ? word : ' ' + word;

          // Send SSE data event
          const sseMessage = `data: ${JSON.stringify({ content: chunk })}\n\n`;
          controller.enqueue(encoder.encode(sseMessage));

          // Simulate typing delay (30-80ms per word)
          await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 50));
        }

        // Check one more time before sending done signal
        if (cancelled) {
          controller.close();
          return;
        }

        // Send done signal
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        // Only log error if not cancelled - cancelled streams are expected
        if (!cancelled) {
          console.error('Stream error:', error);
        }
        controller.error(error);
      }
    },
    cancel() {
      // Called when the stream is cancelled by the client
      cancelled = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Workspace-Id': workspaceId,
      ...(businessId && { 'X-Business-Id': businessId }),
    },
  });
}

/**
 * GET /api/agents/[id]/messages
 *
 * Fetch message history for an agent conversation.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: agentId } = await params;
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
