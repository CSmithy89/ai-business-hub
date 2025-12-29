/**
 * PM Notifications API Route
 *
 * Proxies notification requests to NestJS backend with fallback.
 *
 * @see Story PM-06.5: In-App Notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { NESTJS_API_URL } from '@/lib/api-config';

/**
 * GET /api/pm/notifications
 *
 * Fetches notifications with filtering and pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || !session?.session?.token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Forward to NestJS backend
    const searchParams = request.nextUrl.searchParams;
    const backendUrl = new URL(`${NESTJS_API_URL}/pm/notifications`);

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

      // Fall back to empty data
      console.warn(`[PM Notifications API] Backend returned ${response.status}`);
    } catch (backendError) {
      console.warn('[PM Notifications API] Backend unavailable:', backendError);
    }

    // Return empty notifications as fallback
    return NextResponse.json(
      {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 20,
          hasMore: false,
        },
      },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    );
  } catch (error) {
    console.error('[PM Notifications API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
