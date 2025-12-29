import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock CopilotKit API Route
 *
 * This is a placeholder for local development when the Agno backend
 * is not available. It will be replaced by the actual Agno AG-UI
 * endpoint in production.
 *
 * In production, the NEXT_PUBLIC_AGNO_URL should point to the actual
 * Agno backend, and this route won't be used.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-01-tech-spec.md
 */
export async function POST(request: NextRequest) {
  // Log for debugging during development only
  if (process.env.NODE_ENV === 'development') {
    console.log('[CopilotKit Mock] Received POST request');
  }

  try {
    const body = await request.json();
    // Only log request body in development (may contain sensitive user content)
    if (process.env.NODE_ENV === 'development') {
      console.log('[CopilotKit Mock] Request body:', JSON.stringify(body, null, 2));
    }

    // Return a minimal valid response structure
    // This mock endpoint allows frontend development without the Agno backend
    return NextResponse.json({
      message: 'CopilotKit mock endpoint - Agno backend not connected',
      status: 'mock',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CopilotKit Mock] Error processing request:', error);
    return NextResponse.json(
      {
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for health checks
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'CopilotKit API endpoint ready (mock mode)',
    mode: process.env.NEXT_PUBLIC_AGNO_URL ? 'connected' : 'mock',
    timestamp: new Date().toISOString(),
  });
}
