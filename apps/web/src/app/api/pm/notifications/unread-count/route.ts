/**
 * PM Notifications Unread Count API Route
 *
 * Proxies unread count requests to NestJS backend with fallback.
 *
 * @see Story PM-06.5: In-App Notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { NESTJS_API_URL } from '@/lib/api-config';

/**
 * GET /api/pm/notifications/unread-count
 *
 * Gets the unread notification count.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || !session?.session?.token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Forward to NestJS backend
    const searchParams = request.nextUrl.searchParams;
    const backendUrl = new URL(`${NESTJS_API_URL}/pm/notifications/unread-count`);

    // Forward workspaceId if provided, or use session's activeWorkspaceId
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
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401, headers: { 'Cache-Control': 'no-store, max-age=0' } }
        );
      }

      console.warn(`[PM Notifications API] Backend returned ${response.status}`);
    } catch (backendError) {
      console.warn('[PM Notifications API] Backend unavailable:', backendError);
    }

    // Return zero count as fallback
    return NextResponse.json(
      {
        count: 0,
        byType: {},
      },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    );
  } catch (error) {
    console.error('[PM Notifications API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get unread count' },
      { status: 500 }
    );
  }
}
