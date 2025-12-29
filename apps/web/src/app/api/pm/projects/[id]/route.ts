/**
 * PM Project Individual API Route
 *
 * Proxies individual project requests to NestJS backend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { NESTJS_API_URL } from '@/lib/api-config';

/**
 * GET /api/pm/projects/:id
 *
 * Fetches a project by ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user || !session?.session?.token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const backendUrl = new URL(`${NESTJS_API_URL}/pm/projects/${encodeURIComponent(id)}`);

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
        return NextResponse.json(data);
      }

      if (response.status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (response.status === 404) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      return NextResponse.json(
        { error: 'Failed to fetch project' },
        { status: response.status }
      );
    } catch (backendError) {
      console.warn('[PM Projects API] Backend unavailable:', backendError);
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
    }
  } catch (error) {
    console.error('[PM Projects API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

/**
 * PATCH /api/pm/projects/:id
 *
 * Updates a project.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user || !session?.session?.token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    const backendUrl = new URL(`${NESTJS_API_URL}/pm/projects/${encodeURIComponent(id)}`);

    const workspaceId = searchParams.get('workspaceId') || session.session.activeWorkspaceId;
    if (workspaceId) {
      backendUrl.searchParams.set('workspaceId', workspaceId);
    }

    try {
      const response = await fetch(backendUrl.toString(), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.token}`,
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
        { error: errorBody.message || 'Failed to update project' },
        { status: response.status }
      );
    } catch (backendError) {
      console.warn('[PM Projects API] Backend unavailable:', backendError);
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
    }
  } catch (error) {
    console.error('[PM Projects API] Error:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

/**
 * DELETE /api/pm/projects/:id
 *
 * Deletes a project.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user || !session?.session?.token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const backendUrl = new URL(`${NESTJS_API_URL}/pm/projects/${encodeURIComponent(id)}`);

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
        return NextResponse.json({ success: true });
      }

      if (response.status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      return NextResponse.json(
        { error: 'Failed to delete project' },
        { status: response.status }
      );
    } catch (backendError) {
      console.warn('[PM Projects API] Backend unavailable:', backendError);
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
    }
  } catch (error) {
    console.error('[PM Projects API] Error:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
