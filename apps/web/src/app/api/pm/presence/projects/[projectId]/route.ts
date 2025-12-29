/**
 * PM Project Presence API Route
 *
 * Returns list of users currently active in a project.
 * Falls back gracefully if backend presence endpoint is not available.
 *
 * @see Story PM-06.2: Presence Indicators
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { NESTJS_API_URL } from '@/lib/api-config';

type RouteContext = { params: Promise<{ projectId: string }> };

/**
 * GET /api/pm/presence/projects/:projectId
 *
 * Fetches users currently active in a project.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session?.user || !session?.session?.token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await context.params;
    const backendUrl = new URL(
      `${NESTJS_API_URL}/pm/presence/projects/${encodeURIComponent(projectId)}`
    );

    // Add workspaceId from session
    if (session.session.activeWorkspaceId) {
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

      // If presence endpoint doesn't exist yet, return empty list
      if (response.status === 404) {
        console.log('[PM Presence API] Backend presence endpoint not available, returning empty list');
        return NextResponse.json(
          { users: [], total: 0 },
          { headers: { 'Cache-Control': 'no-store, max-age=0' } }
        );
      }

      if (response.status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      console.warn(`[PM Presence API] Backend returned ${response.status}`);
    } catch (backendError) {
      // Backend unavailable - return empty list gracefully
      console.warn('[PM Presence API] Backend unavailable:', backendError);
    }

    // Return empty presence as fallback
    return NextResponse.json(
      { users: [], total: 0 },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('[PM Presence API] Error:', error);
    // Still return empty list instead of error to avoid breaking UI
    return NextResponse.json(
      { users: [], total: 0 },
      { status: 200 }
    );
  }
}
