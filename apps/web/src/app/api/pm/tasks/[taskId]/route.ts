/**
 * PM Task by ID API Route
 *
 * Proxies individual task requests to NestJS backend.
 *
 * @see PM Module
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { NESTJS_API_URL } from '@/lib/api-config';

type RouteContext = { params: Promise<{ taskId: string }> };

/**
 * GET /api/pm/tasks/:taskId
 *
 * Fetches a task by its ID.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session?.user || !session?.session?.token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const backendUrl = new URL(`${NESTJS_API_URL}/pm/tasks/${encodeURIComponent(taskId)}`);

    // Forward workspaceId
    const workspaceId = searchParams.get('workspaceId') || session.session.activeWorkspaceId;
    if (workspaceId) {
      backendUrl.searchParams.set('workspaceId', workspaceId);
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
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (response.status === 404) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      console.warn(`[PM Tasks API] Backend returned ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch task' },
        { status: response.status }
      );
    } catch (backendError) {
      console.warn('[PM Tasks API] Backend unavailable:', backendError);
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
    }
  } catch (error) {
    console.error('[PM Tasks API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/pm/tasks/:taskId
 *
 * Updates a task.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session?.user || !session?.session?.token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await context.params;
    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    const backendUrl = new URL(`${NESTJS_API_URL}/pm/tasks/${encodeURIComponent(taskId)}`);

    // Forward workspaceId
    const workspaceId = searchParams.get('workspaceId') || session.session.activeWorkspaceId;
    if (workspaceId) {
      backendUrl.searchParams.set('workspaceId', workspaceId);
    }

    // Get correlation ID from request headers
    const correlationId = request.headers.get('x-correlation-id');

    try {
      const response = await fetch(backendUrl.toString(), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.token}`,
          ...(correlationId && { 'x-correlation-id': correlationId }),
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }

      if (response.status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const errorBody = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorBody.message || 'Failed to update task' },
        { status: response.status }
      );
    } catch (backendError) {
      console.warn('[PM Tasks API] Backend unavailable:', backendError);
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
    }
  } catch (error) {
    console.error('[PM Tasks API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pm/tasks/:taskId
 *
 * Deletes a task.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session?.user || !session?.session?.token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const backendUrl = new URL(`${NESTJS_API_URL}/pm/tasks/${encodeURIComponent(taskId)}`);

    // Forward workspaceId
    const workspaceId = searchParams.get('workspaceId') || session.session.activeWorkspaceId;
    if (workspaceId) {
      backendUrl.searchParams.set('workspaceId', workspaceId);
    }

    try {
      const response = await fetch(backendUrl.toString(), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }

      if (response.status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const errorBody = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorBody.message || 'Failed to delete task' },
        { status: response.status }
      );
    } catch (backendError) {
      console.warn('[PM Tasks API] Backend unavailable:', backendError);
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
    }
  } catch (error) {
    console.error('[PM Tasks API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
