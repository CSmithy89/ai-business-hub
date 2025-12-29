/**
 * PM Tasks API Route
 *
 * Proxies task requests to NestJS backend with proper authentication.
 *
 * @see PM Module
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { NESTJS_API_URL } from '@/lib/api-config';

/**
 * GET /api/pm/tasks
 *
 * Fetches tasks with filtering and pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || !session?.session?.token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const backendUrl = new URL(`${NESTJS_API_URL}/pm/tasks`);

    // Forward all query parameters
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.set(key, value);
    });

    // Add workspaceId if not provided
    if (!backendUrl.searchParams.has('workspaceId') && session.session.activeWorkspaceId) {
      backendUrl.searchParams.set('workspaceId', session.session.activeWorkspaceId);
    }

    try {
      const response = await fetch(backendUrl.toString(), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.token}`,
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data, {
          headers: { 'Cache-Control': 'no-store, max-age=0' },
        });
      }

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401, headers: { 'Cache-Control': 'no-store, max-age=0' } }
        );
      }

      console.warn(`[PM Tasks API] Backend returned ${response.status}`);
      const errorBody = await response.text();
      console.warn(`[PM Tasks API] Error body: ${errorBody}`);
      return NextResponse.json(
        { error: 'Failed to fetch tasks', details: errorBody },
        { status: response.status }
      );
    } catch (backendError) {
      console.warn('[PM Tasks API] Backend unavailable:', backendError);
    }

    // Return empty tasks as fallback
    return NextResponse.json(
      {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 0,
        },
      },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    );
  } catch (error) {
    console.error('[PM Tasks API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pm/tasks
 *
 * Creates a new task.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || !session?.session?.token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    const backendUrl = new URL(`${NESTJS_API_URL}/pm/tasks`);

    // Add workspaceId to query
    const workspaceId = searchParams.get('workspaceId') || session.session.activeWorkspaceId;
    if (workspaceId) {
      backendUrl.searchParams.set('workspaceId', workspaceId);
    }

    // Get correlation ID from request headers
    const correlationId = request.headers.get('x-correlation-id');

    try {
      const response = await fetch(backendUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.token}`,
          ...(correlationId && { 'x-correlation-id': correlationId }),
        },
        body: JSON.stringify({ ...body, workspaceId }),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data, { status: 201 });
      }

      if (response.status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const errorBody = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorBody.message || 'Failed to create task' },
        { status: response.status }
      );
    } catch (backendError) {
      console.warn('[PM Tasks API] Backend unavailable:', backendError);
      return NextResponse.json(
        { error: 'Backend unavailable' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('[PM Tasks API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
