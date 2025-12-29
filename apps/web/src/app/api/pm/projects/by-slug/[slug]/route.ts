/**
 * PM Project by Slug API Route
 *
 * Proxies project by slug requests to NestJS backend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { NESTJS_API_URL } from '@/lib/api-config';

/**
 * GET /api/pm/projects/by-slug/:slug
 *
 * Fetches a project by its slug.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user || !session?.session?.token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const backendUrl = new URL(`${NESTJS_API_URL}/pm/projects/by-slug/${encodeURIComponent(slug)}`);

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
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      console.warn(`[PM Projects API] Backend returned ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch project' },
        { status: response.status }
      );
    } catch (backendError) {
      console.warn('[PM Projects API] Backend unavailable:', backendError);
      return NextResponse.json(
        { error: 'Backend unavailable' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('[PM Projects API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}
